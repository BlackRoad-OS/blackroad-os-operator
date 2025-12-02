/**
 * BlackRoad OS TypeScript SDK - Types
 *
 * @blackroad_name SDK Types
 * @operator alexa.operator.v1
 */

// ============================================
// ENUMS
// ============================================

export enum AgentStatus {
  Initializing = 'initializing',
  Ready = 'ready',
  Busy = 'busy',
  Paused = 'paused',
  Error = 'error',
  Terminated = 'terminated',
}

export enum AgentType {
  Lucidia = 'lucidia',
  Beacon = 'beacon',
  Custom = 'custom',
  Pack = 'pack',
}

export enum PolicyEffect {
  Allow = 'allow',
  Deny = 'deny',
  Escalate = 'escalate',
}

export enum TrinaryValue {
  Deny = -1,
  Neutral = 0,
  Allow = 1,
}

export enum SessionStatus {
  Active = 'active',
  Paused = 'paused',
  Closing = 'closing',
  Closed = 'closed',
}

export enum ParticipantRole {
  Owner = 'owner',
  Editor = 'editor',
  Viewer = 'viewer',
  Observer = 'observer',
}

// ============================================
// AGENT TYPES
// ============================================

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  config?: Record<string, unknown>;
  capabilities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentList {
  data: Agent[];
  hasMore: boolean;
  cursor?: string;
}

export interface AgentInvocation {
  input: string | Record<string, unknown>;
  context?: Record<string, unknown>;
  tools?: string[];
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AgentResponse {
  output: string | Record<string, unknown>;
  toolCalls?: ToolCall[];
  usage?: Usage;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments?: Record<string, unknown>;
  result?: unknown;
}

export interface Usage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
}

// ============================================
// CHAT TYPES
// ============================================

export interface ChatRequest {
  message: string;
  userId?: string;
  model?: string;
  useRag?: boolean;
}

export interface ChatResponse {
  response: string;
  model: string;
  tokensUsed?: number;
  ragContextUsed?: boolean;
  sources?: Source[];
}

export interface Source {
  title?: string;
  url?: string;
  content?: string;
}

// ============================================
// GOVERNANCE TYPES
// ============================================

export interface Subject {
  userId?: string;
  agentId?: string;
  role?: string;
  attributes?: Record<string, unknown>;
}

export interface Resource {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
}

export interface PolicyContext {
  claims?: Claim[];
  assertedFacts?: string[];
  factEvidence?: Record<string, unknown>;
}

export interface Claim {
  type: string;
  [key: string]: unknown;
}

export interface PolicyEvaluationRequest {
  action: string;
  subject: Subject;
  resource: Resource;
  context?: PolicyContext;
}

export interface PolicyResult {
  decision: PolicyEffect;
  trinaryValue: TrinaryValue;
  policyId: string;
  policyVersion: string;
  reason?: string;
  matchedPolicies?: string[];
  auditId?: string;
}

export interface Policy {
  id: string;
  name: string;
  scope: string;
  rules: PolicyRule[];
  priority?: number;
  version: number;
  active: boolean;
}

export interface PolicyRule {
  id?: string;
  condition: Condition;
  decision: TrinaryValue;
  reason?: string;
}

export interface Condition {
  type: string;
  field?: string;
  operator?: string;
  value?: unknown;
  and?: Condition[];
  or?: Condition[];
  not?: Condition;
}

export interface Constraint {
  id: string;
  type: string;
  expression: string;
  priority?: number;
  active?: boolean;
}

// ============================================
// LEDGER TYPES
// ============================================

export interface LedgerEvent {
  id: string;
  type: string;
  entityId: string;
  action: string;
  decision: TrinaryValue;
  context?: Record<string, unknown>;
  psSha: string;
  parentPsSha?: string;
  timestamp: string;
}

export interface LedgerEventList {
  data: LedgerEvent[];
  hasMore: boolean;
  cursor?: string;
  totalCount?: number;
}

export interface LedgerQuery {
  correlationId?: string;
  intentId?: string;
  entityId?: string;
  action?: string;
  decision?: TrinaryValue;
  limit?: number;
  offset?: number;
}

export interface LedgerLineage {
  rootHash: string;
  entries: LineageEntry[];
  contradictions?: Contradiction[];
  totalDepth: number;
}

export interface LineageEntry {
  hash: string;
  parentHash?: string;
  depth: number;
  timestamp: string;
}

export interface Contradiction {
  hashA: string;
  hashB: string;
  type: string;
  trinaryValue: TrinaryValue;
}

export interface VerificationResult {
  valid: boolean;
  entriesVerified: number;
  anomalies?: Anomaly[];
}

export interface Anomaly {
  entryId: string;
  type: string;
  description: string;
}

// ============================================
// COLLABORATION TYPES
// ============================================

export interface VectorClock {
  clock: Record<string, number>;
}

export interface Participant {
  id: string;
  sessionId: string;
  entityId: string;
  entityType: string;
  role: ParticipantRole;
  shardId?: string;
  cursor?: CursorPosition;
  lastOperationAt?: string;
  joinedAt: string;
}

export interface CursorPosition {
  path?: string;
  offset?: number;
  selectionStart?: number;
  selectionEnd?: number;
}

export interface CollaborationSession {
  id: string;
  name: string;
  status: SessionStatus;
  crdtType: string;
  participantCount: number;
  maxParticipants: number;
  vectorClock: VectorClock;
  assignedShards: string[];
  primaryShard?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionCreateRequest {
  name: string;
  crdtType?: string;
  maxParticipants?: number;
}

export interface JoinRequest {
  entityId: string;
  entityType?: string;
  role?: ParticipantRole;
}

export interface JoinResponse {
  participant: Participant;
  shardId: string;
  state: unknown;
  vectorClock: VectorClock;
  websocketUrl: string;
}

export interface CRDTOperation {
  type: string;
  path?: string;
  payload?: Record<string, unknown>;
  vectorClock: VectorClock;
  participantId: string;
}

export interface OperationResult {
  success: boolean;
  vectorClock: VectorClock;
  operationId: string;
  conflicts?: Conflict[];
}

export interface Conflict {
  id: string;
  type: string;
  path: string;
  operations: CRDTOperation[];
  resolutionStatus: string;
}

export interface Shard {
  id: string;
  capacity: number;
  participantCount: number;
  loadPercentage: number;
  status: string;
  peerShards?: string[];
}

export interface ShardList {
  shards: Shard[];
  totalParticipants: number;
  totalCapacity: number;
  healthyCount: number;
}

// ============================================
// PAGINATION
// ============================================

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  cursor?: string;
}

// ============================================
// ERRORS
// ============================================

export interface APIError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

export class BlackRoadError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'BlackRoadError';
  }
}
