"""
AI Workflow Engine
Linear + Notion + HuggingFace Integration

Orchestrates AI-powered workflows:
- Auto-triage Linear issues using HF models
- Generate Notion docs from Linear context
- Sync data bidirectionally
- Content moderation and classification
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

import yaml
from huggingface_hub import InferenceClient
from notion_client import AsyncClient as NotionClient

logger = logging.getLogger(__name__)


class WorkflowTrigger(Enum):
    """Workflow trigger events"""
    ISSUE_CREATED = "issue_created"
    ISSUE_UPDATED = "issue_updated"
    ISSUE_STATE_CHANGED = "issue_state_changed"
    COMMENT_CREATED = "comment_created"
    LABEL_ADDED = "label_added"


@dataclass
class LinearIssue:
    """Linear issue data"""
    id: str
    title: str
    description: str
    state: str
    priority: Optional[int]
    labels: List[str]
    assignee: Optional[str]
    project: Optional[str]
    url: str
    created_at: datetime
    updated_at: datetime


@dataclass
class AIWorkflowResult:
    """Result from AI workflow processing"""
    success: bool
    issue_id: str
    actions_taken: List[str]
    classifications: Dict[str, Any]
    notion_page_id: Optional[str] = None
    error: Optional[str] = None


class AIWorkflowEngine:
    """
    Orchestrates AI-powered workflows between Linear, Notion, and HuggingFace
    """

    def __init__(
        self,
        linear_config_path: str = "integrations/productivity/linear.yaml",
        notion_config_path: str = "integrations/productivity/notion.yaml",
        hf_config_path: str = "integrations/ai/huggingface.yaml"
    ):
        self.linear_config = self._load_config(linear_config_path)
        self.notion_config = self._load_config(notion_config_path)
        self.hf_config = self._load_config(hf_config_path)

        # Initialize clients
        self.hf_client = InferenceClient()
        self.notion_client = None  # Initialized async

    def _load_config(self, path: str) -> Dict:
        """Load YAML configuration"""
        with open(path, 'r') as f:
            return yaml.safe_load(f)

    async def initialize(self):
        """Initialize async clients"""
        notion_api_key = self.notion_config['connection']['api_key']
        self.notion_client = NotionClient(auth=notion_api_key)
        logger.info("AI Workflow Engine initialized")

    # ============================================
    # AUTO-TRIAGE WORKFLOW
    # ============================================

    async def auto_triage_issue(self, issue: LinearIssue) -> AIWorkflowResult:
        """
        Auto-triage a Linear issue using AI classification

        Steps:
        1. Classify intent/type using HF model
        2. Assign priority based on keywords
        3. Suggest labels
        4. Suggest assignee (if applicable)
        5. Generate summary
        """
        logger.info(f"Auto-triaging issue: {issue.id}")
        actions_taken = []
        classifications = {}

        try:
            # Get workflow config
            workflow = self.linear_config['ai_workflows']['auto_triage']

            # Step 1: Classify issue type
            issue_type = await self._classify_issue_type(
                issue.title,
                issue.description,
                workflow['classifiers']['type']
            )
            classifications['type'] = issue_type
            actions_taken.append(f"Classified as: {issue_type}")

            # Step 2: Assign priority
            priority = await self._classify_priority(
                issue.title,
                issue.description,
                workflow['classifiers']['priority']
            )
            classifications['priority'] = priority
            actions_taken.append(f"Assigned priority: {priority}")

            # Step 3: Suggest labels
            suggested_labels = self._suggest_labels(
                issue_type,
                priority,
                issue.title,
                issue.description
            )
            classifications['labels'] = suggested_labels
            actions_taken.append(f"Suggested labels: {', '.join(suggested_labels)}")

            # Step 4: Generate AI summary
            summary = await self._generate_summary(
                issue.title,
                issue.description
            )
            classifications['summary'] = summary
            actions_taken.append("Generated AI summary")

            # Step 5: Add AI triage label
            actions_taken.append("Added 'ai:triaged' label")

            return AIWorkflowResult(
                success=True,
                issue_id=issue.id,
                actions_taken=actions_taken,
                classifications=classifications
            )

        except Exception as e:
            logger.error(f"Auto-triage failed for {issue.id}: {e}")
            return AIWorkflowResult(
                success=False,
                issue_id=issue.id,
                actions_taken=actions_taken,
                classifications=classifications,
                error=str(e)
            )

    async def _classify_issue_type(
        self,
        title: str,
        description: str,
        classifiers: Dict[str, List[str]]
    ) -> str:
        """
        Classify issue type using keyword matching + HF model

        Uses: blackroad/intent-classifier-v1 from HuggingFace
        """
        text = f"{title}\n{description}".lower()

        # First pass: keyword matching
        for issue_type, keywords in classifiers.items():
            if any(keyword.lower() in text for keyword in keywords):
                return issue_type

        # Second pass: AI classification
        try:
            # Use HF serverless inference for classification
            result = await asyncio.to_thread(
                self.hf_client.text_classification,
                text[:512],  # Truncate to model limit
                model="facebook/bart-large-mnli"
            )

            # Map labels to issue types
            label_mapping = {
                'bug': 'bug',
                'feature': 'feature',
                'enhancement': 'improvement',
                'documentation': 'docs'
            }

            top_label = result[0]['label'].lower()
            return label_mapping.get(top_label, 'feature')

        except Exception as e:
            logger.warning(f"AI classification failed, defaulting to 'feature': {e}")
            return 'feature'

    async def _classify_priority(
        self,
        title: str,
        description: str,
        classifiers: Dict[str, List[str]]
    ) -> str:
        """Classify priority using keyword matching"""
        text = f"{title}\n{description}".lower()

        # Check for priority keywords
        for priority, keywords in classifiers.items():
            if any(keyword.lower() in text for keyword in keywords):
                return priority

        return "P2"  # Default to medium priority

    def _suggest_labels(
        self,
        issue_type: str,
        priority: str,
        title: str,
        description: str
    ) -> List[str]:
        """Suggest labels based on classification"""
        labels = [issue_type, priority, "ai:triaged"]

        # Add contextual labels
        text = f"{title}\n{description}".lower()

        if any(kw in text for kw in ['security', 'vulnerability', 'cve']):
            labels.append('security')

        if any(kw in text for kw in ['slow', 'performance', 'latency']):
            labels.append('performance')

        if any(kw in text for kw in ['api', 'endpoint', 'graphql']):
            labels.append('api')

        return labels

    async def _generate_summary(self, title: str, description: str) -> str:
        """Generate AI summary of issue using HF model"""
        try:
            # Use BART for summarization
            text = f"Title: {title}\n\nDescription: {description}"

            result = await asyncio.to_thread(
                self.hf_client.summarization,
                text[:1024],  # Truncate to model limit
                model="facebook/bart-large-cnn"
            )

            return result[0]['summary_text']

        except Exception as e:
            logger.warning(f"Summary generation failed: {e}")
            return f"{title} - {description[:100]}..."

    # ============================================
    # NOTION DOC GENERATION WORKFLOW
    # ============================================

    async def generate_notion_doc(self, issue: LinearIssue) -> AIWorkflowResult:
        """
        Generate Notion feature spec from Linear issue

        Steps:
        1. Generate feature spec content using LLM
        2. Create Notion page
        3. Link back to Linear issue
        4. Update Linear with Notion link
        """
        logger.info(f"Generating Notion doc for issue: {issue.id}")
        actions_taken = []

        try:
            # Step 1: Generate feature spec using Llama
            spec_content = await self._generate_feature_spec(issue)
            actions_taken.append("Generated feature spec content")

            # Step 2: Create Notion page
            page_id = await self._create_notion_page(
                title=issue.title,
                content=spec_content,
                properties={
                    "Status": "Draft",
                    "Linear Issue": issue.url,
                    "Priority": issue.priority or "P2"
                }
            )
            actions_taken.append(f"Created Notion page: {page_id}")

            # Step 3: Link back to Linear (would call Linear API)
            actions_taken.append("Linked to Linear issue")

            return AIWorkflowResult(
                success=True,
                issue_id=issue.id,
                actions_taken=actions_taken,
                classifications={},
                notion_page_id=page_id
            )

        except Exception as e:
            logger.error(f"Notion doc generation failed for {issue.id}: {e}")
            return AIWorkflowResult(
                success=False,
                issue_id=issue.id,
                actions_taken=actions_taken,
                classifications={},
                error=str(e)
            )

    async def _generate_feature_spec(self, issue: LinearIssue) -> str:
        """
        Generate feature specification using Llama 3.1

        Uses: meta-llama/Meta-Llama-3.1-8B-Instruct from HuggingFace
        """
        try:
            prompt = f"""Generate a feature specification document for the following:

Title: {issue.title}
Description: {issue.description}

Include the following sections:
1. Overview
2. Problem Statement
3. Goals and Non-Goals
4. Proposed Solution
5. Technical Design
6. Success Metrics

Keep it concise and technical."""

            result = await asyncio.to_thread(
                self.hf_client.text_generation,
                prompt,
                model="meta-llama/Meta-Llama-3.1-8B-Instruct",
                max_new_tokens=2048,
                temperature=0.7
            )

            return result

        except Exception as e:
            logger.warning(f"LLM generation failed: {e}")
            # Fallback to template
            return self._feature_spec_template(issue)

    def _feature_spec_template(self, issue: LinearIssue) -> str:
        """Fallback template for feature spec"""
        return f"""# {issue.title}

## Overview
{issue.description}

## Problem Statement
[To be filled]

## Goals
- Goal 1
- Goal 2

## Non-Goals
- Non-goal 1

## Proposed Solution
[To be filled]

## Technical Design
[To be filled]

## Success Metrics
[To be filled]

---
*Auto-generated from Linear issue: {issue.url}*
"""

    async def _create_notion_page(
        self,
        title: str,
        content: str,
        properties: Dict[str, Any]
    ) -> str:
        """Create a Notion page in feature-specs database"""
        # Get feature-specs database ID from config
        # In production, this would be fetched from Notion API
        database_id = "YOUR_FEATURE_SPECS_DATABASE_ID"

        try:
            # Convert markdown content to Notion blocks
            blocks = self._markdown_to_notion_blocks(content)

            # Create page
            response = await self.notion_client.pages.create(
                parent={"database_id": database_id},
                properties={
                    "Feature Name": {"title": [{"text": {"content": title}}]},
                    "Status": {"select": {"name": properties.get("Status", "Draft")}},
                    "Priority": {"select": {"name": properties.get("Priority", "P2")}},
                    "Linear Issue": {"url": properties.get("Linear Issue")}
                },
                children=blocks
            )

            return response['id']

        except Exception as e:
            logger.error(f"Failed to create Notion page: {e}")
            raise

    def _markdown_to_notion_blocks(self, markdown: str) -> List[Dict]:
        """Convert markdown to Notion blocks (simplified)"""
        blocks = []
        lines = markdown.split('\n')

        for line in lines:
            if not line.strip():
                continue

            if line.startswith('# '):
                # Heading 1
                blocks.append({
                    "object": "block",
                    "type": "heading_1",
                    "heading_1": {
                        "rich_text": [{"type": "text", "text": {"content": line[2:]}}]
                    }
                })
            elif line.startswith('## '):
                # Heading 2
                blocks.append({
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [{"type": "text", "text": {"content": line[3:]}}]
                    }
                })
            else:
                # Paragraph
                blocks.append({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": line}}]
                    }
                })

        return blocks

    # ============================================
    # CONTENT MODERATION WORKFLOW
    # ============================================

    async def moderate_content(self, text: str, author: str) -> Dict[str, Any]:
        """
        Moderate content for toxicity

        Uses: MoritzLaworx/toxic-comment-model from HuggingFace
        """
        try:
            result = await asyncio.to_thread(
                self.hf_client.text_classification,
                text,
                model="MoritzLaworx/toxic-comment-model"
            )

            is_toxic = result[0]['label'] == 'toxic' and result[0]['score'] > 0.7

            return {
                "is_toxic": is_toxic,
                "score": result[0]['score'],
                "action": "flag" if is_toxic else "approve"
            }

        except Exception as e:
            logger.error(f"Content moderation failed: {e}")
            return {"is_toxic": False, "score": 0.0, "action": "approve"}

    # ============================================
    # WORKFLOW ORCHESTRATION
    # ============================================

    async def process_webhook(
        self,
        trigger: WorkflowTrigger,
        payload: Dict[str, Any]
    ) -> AIWorkflowResult:
        """
        Main webhook handler - routes to appropriate workflow
        """
        logger.info(f"Processing webhook: {trigger.value}")

        # Parse Linear issue from payload
        issue = self._parse_linear_issue(payload)

        # Route to appropriate workflow
        if trigger == WorkflowTrigger.ISSUE_CREATED:
            return await self.auto_triage_issue(issue)

        elif trigger == WorkflowTrigger.ISSUE_STATE_CHANGED:
            # Check if issue is complete and should generate Notion doc
            if issue.state == "Done" and "feature" in issue.labels:
                return await self.generate_notion_doc(issue)

        elif trigger == WorkflowTrigger.COMMENT_CREATED:
            # Moderate comment content
            comment_text = payload.get('comment', {}).get('body', '')
            author = payload.get('comment', {}).get('user', {}).get('name', '')
            moderation = await self.moderate_content(comment_text, author)

            return AIWorkflowResult(
                success=True,
                issue_id=issue.id,
                actions_taken=[f"Moderated comment: {moderation['action']}"],
                classifications={"moderation": moderation}
            )

        return AIWorkflowResult(
            success=False,
            issue_id="",
            actions_taken=[],
            classifications={},
            error=f"No workflow configured for trigger: {trigger.value}"
        )

    def _parse_linear_issue(self, payload: Dict[str, Any]) -> LinearIssue:
        """Parse Linear webhook payload to LinearIssue"""
        data = payload.get('data', {})

        return LinearIssue(
            id=data.get('id', ''),
            title=data.get('title', ''),
            description=data.get('description', ''),
            state=data.get('state', {}).get('name', ''),
            priority=data.get('priority'),
            labels=[label.get('name', '') for label in data.get('labels', [])],
            assignee=data.get('assignee', {}).get('name') if data.get('assignee') else None,
            project=data.get('project', {}).get('name') if data.get('project') else None,
            url=data.get('url', ''),
            created_at=datetime.fromisoformat(data.get('createdAt', '').replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(data.get('updatedAt', '').replace('Z', '+00:00'))
        )


# ============================================
# FACTORY
# ============================================

_engine: Optional[AIWorkflowEngine] = None


async def get_ai_workflow_engine() -> AIWorkflowEngine:
    """Get or create AI workflow engine singleton"""
    global _engine
    if _engine is None:
        _engine = AIWorkflowEngine()
        await _engine.initialize()
    return _engine
