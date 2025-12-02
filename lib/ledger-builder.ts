/**
 * Ledger Event Builder for BlackRoad OS
 *
 * Spec for building ledger events from policy decisions.
 * This ensures all events have the required fields and
 * conform to the Amundson governance contract.
 *
 * @amundson 0.1.0
 * @governor alice.governor.v1
 * @operator alexa.operator.v1
 */

import type {
  PolicyEvaluateRequest,
  PolicyEvaluateResponse,
  LedgerEventCreate,
  LedgerLevel,
  Layer,
} from "./amundson-governance";

// ============================================
// CONSTANTS
// ============================================

/**
 * Current Amundson language version.
 * Must be included in all ledger events.
 */
export const LANGUAGE_VERSION = "0.1.0";

/**
 * Education policy pack metadata.
 * Update these when the pack version changes.
 */
export const EDU_POLICY_PACK = {
  name: "edu-policies",
  version: "1.0.0",
} as const;

// ============================================
// REQUIRED FIELDS SPEC
// ============================================

/**
 * REQUIRED FIELDS FOR STAGE 1 (Education Vertical)
 *
 * These fields MUST be present in every ledger event:
 *
 * IDENTITY:
 * - correlation_id: UUID linking this event to the request chain
 *
 * LOCATION:
 * - layer: "experience" for Education flows
 * - host: The domain (e.g., "edu.blackroad.io", "homework.blackroad.io")
 * - service: The service name (e.g., "edu-web")
 * - policy_scope: The policy namespace (e.g., "edu.*", "homework.*")
 *
 * ACTOR:
 * - actor.user_id: The user performing the action
 * - actor.role: Their role at time of action ("teacher" or "student")
 *
 * ACTION:
 * - action: The action attempted (e.g., "assignment:create")
 * - resource_type: The resource type (e.g., "assignment", "submission")
 * - resource_id: The specific resource ID (if applicable)
 *
 * DECISION:
 * - decision: The policy decision ("allow", "deny", "warn", "shadow_deny")
 * - policy_id: Which policy matched (null if default stance)
 * - policy_version: Version string from the policy
 *
 * METADATA:
 * - ledger_level: Must be >= required_ledger_level from policy response
 *
 * OPTIONAL BUT RECOMMENDED:
 * - asserted_facts: Facts the caller asserted
 * - fact_evidence: Evidence for those facts
 * - claims: Claims presented for evaluation
 * - metadata: Action-specific data (e.g., assignment title)
 *
 * CONDITIONAL (based on ledger_level):
 * - If ledger_level = "full":
 *   - request_context: Full request details
 *   - response_summary: Response details
 */

// ============================================
// BUILDER OPTIONS
// ============================================

export interface LedgerEventOptions {
  /** The original policy evaluation request */
  request: PolicyEvaluateRequest;

  /** The policy evaluation response */
  response: PolicyEvaluateResponse;

  /** The resource ID (if action was on a specific resource) */
  resourceId?: string | null;

  /** Additional metadata to include */
  metadata?: Record<string, unknown>;

  /** Override the ledger level (must be >= response.required_ledger_level) */
  ledgerLevelOverride?: LedgerLevel;

  /** Full request context (required if ledger_level = "full") */
  requestContext?: Record<string, unknown>;

  /** Response summary (required if ledger_level = "full") */
  responseSummary?: Record<string, unknown>;

  /** Intent ID if this is part of a multi-step flow */
  intentId?: string;

  /** Sequence number within the intent */
  sequenceNum?: number;
}

// ============================================
// LEDGER LEVEL PRECEDENCE
// ============================================

const LEDGER_LEVEL_RANK: Record<LedgerLevel, number> = {
  none: 0,
  decision: 1,
  action: 2,
  full: 3,
};

/**
 * Ensure the actual ledger level is >= required level.
 */
function resolveLevel(
  required: LedgerLevel,
  override?: LedgerLevel
): LedgerLevel {
  if (!override) return required;

  if (LEDGER_LEVEL_RANK[override] < LEDGER_LEVEL_RANK[required]) {
    console.warn(
      `Ledger level override "${override}" is below required "${required}". Using required.`
    );
    return required;
  }

  return override;
}

// ============================================
// LAYER RESOLUTION
// ============================================

/**
 * Resolve the layer from the host.
 */
function resolveLayer(host: string): Layer {
  if (host.includes("gov.") || host.includes(".systems")) {
    return "governance";
  }
  if (host.includes("mesh.") || host.includes("agents.")) {
    return "mesh";
  }
  if (host.includes("api.blackroad.io")) {
    return "gateway";
  }
  if (host.includes("db.") || host.includes("infra.") || host.includes("ops.")) {
    return "infra";
  }
  return "experience";
}

/**
 * Resolve the policy scope from the host.
 */
function resolvePolicyScope(host: string): string {
  if (host.startsWith("edu.")) return "edu.*";
  if (host.startsWith("homework.")) return "homework.*";
  if (host.startsWith("app.")) return "app.*";
  if (host.startsWith("gov.api.")) return "gov.api.*";
  if (host.startsWith("mesh.")) return "mesh.*";
  if (host.startsWith("agents.")) return "agents.*";
  if (host.startsWith("api.")) return "api.*";
  return "app.*";
}

// ============================================
// BUILDER FUNCTION
// ============================================

/**
 * Build a ledger event from a policy evaluation request/response pair.
 *
 * This is the canonical way to create ledger events. It ensures:
 * 1. All required fields are present
 * 2. Ledger level is >= required_ledger_level
 * 3. Location fields are consistent with the host
 * 4. Evidence from the request is preserved
 *
 * @example
 * // After evaluating policy:
 * const response = await evaluatePolicy(request);
 *
 * // Build and record the event:
 * const event = buildLedgerEvent({
 *   request,
 *   response,
 *   resourceId: "a123",
 *   metadata: { title: "Week 1 Homework" },
 * });
 *
 * await recordEvent(event);
 */
export function buildLedgerEvent(
  options: LedgerEventOptions
): LedgerEventCreate {
  const { request, response, resourceId, metadata, intentId, sequenceNum } =
    options;

  const host = request.context.request_metadata.host ?? "app.blackroad.io";
  const service = request.context.request_metadata.service ?? "unknown";
  const correlationId =
    request.context.request_metadata.correlation_id ?? crypto.randomUUID();

  const ledgerLevel = resolveLevel(
    response.required_ledger_level,
    options.ledgerLevelOverride
  );

  const event: LedgerEventCreate = {
    // Identity
    correlation_id: correlationId,
    intent_id: intentId ?? null,
    sequence_num: sequenceNum ?? 0,

    // Location
    layer: resolveLayer(host),
    host,
    service,
    policy_scope: resolvePolicyScope(host),

    // Actor
    actor: {
      user_id: request.subject.user_id ?? null,
      role: request.subject.role,
      agent_id: null,
      delegation_id: null,
    },

    // Action
    action: request.action,
    resource_type: request.resource.type,
    resource_id: resourceId ?? request.resource.id ?? null,

    // Decision
    decision: response.decision,
    policy_id: response.policy_id ?? null,
    policy_version: response.policy_version ?? null,

    // Evidence
    asserted_facts: request.context.asserted_facts,
    fact_evidence: request.context.fact_evidence,
    claims: request.context.claims,

    // Metadata
    ledger_level: ledgerLevel,
    metadata: {
      ...metadata,
      language_version: LANGUAGE_VERSION,
      policy_pack: EDU_POLICY_PACK.name,
      policy_pack_version: EDU_POLICY_PACK.version,
    },

    // Full fidelity fields (only if ledger_level = "full")
    request_context: ledgerLevel === "full" ? options.requestContext : null,
    response_summary: ledgerLevel === "full" ? options.responseSummary : null,
  };

  return event;
}

// ============================================
// CONVENIENCE: EDUCATION VERTICAL HELPERS
// ============================================

/**
 * Build a ledger event for teacher assignment creation.
 */
export function buildAssignmentCreateEvent(
  request: PolicyEvaluateRequest,
  response: PolicyEvaluateResponse,
  assignmentId: string,
  assignmentTitle: string
): LedgerEventCreate {
  return buildLedgerEvent({
    request,
    response,
    resourceId: assignmentId,
    metadata: {
      title: assignmentTitle,
      event_type: "assignment:created",
    },
  });
}

/**
 * Build a ledger event for student submission.
 */
export function buildSubmissionEvent(
  request: PolicyEvaluateRequest,
  response: PolicyEvaluateResponse,
  submissionId: string,
  assignmentId: string
): LedgerEventCreate {
  return buildLedgerEvent({
    request,
    response,
    resourceId: submissionId,
    metadata: {
      assignment_id: assignmentId,
      event_type: "submission:submitted",
    },
  });
}

/**
 * Build a ledger event for teacher review.
 */
export function buildReviewEvent(
  request: PolicyEvaluateRequest,
  response: PolicyEvaluateResponse,
  submissionId: string,
  reviewResult: "approved" | "returned" | "flagged"
): LedgerEventCreate {
  return buildLedgerEvent({
    request,
    response,
    resourceId: submissionId,
    metadata: {
      review_result: reviewResult,
      event_type: "submission:reviewed",
    },
  });
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate a ledger event has all required fields for Stage 1.
 * Throws if validation fails.
 */
export function validateLedgerEvent(event: LedgerEventCreate): void {
  const required: (keyof LedgerEventCreate)[] = [
    "correlation_id",
    "layer",
    "host",
    "service",
    "policy_scope",
    "actor",
    "action",
    "resource_type",
    "decision",
    "ledger_level",
  ];

  for (const field of required) {
    if (event[field] === undefined || event[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!event.actor.user_id && !event.actor.agent_id) {
    throw new Error("Actor must have either user_id or agent_id");
  }

  if (!event.actor.role) {
    throw new Error("Actor must have a role");
  }

  // Validate full fidelity requirements
  if (event.ledger_level === "full") {
    if (!event.request_context) {
      console.warn(
        "ledger_level=full but request_context is missing. Consider adding it."
      );
    }
  }
}
