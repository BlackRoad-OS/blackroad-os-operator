/**
 * Amundson Governance Client for BlackRoad OS
 *
 * TypeScript types and client for calling governance endpoints.
 * These types are the source of truth — generated to match
 * br_operator/models/policy.py and br_operator/models/ledger.py
 *
 * @amundson 0.1.0
 * @governor alice.governor.v1
 * @operator alexa.operator.v1
 */

// ============================================
// ENUMS
// ============================================

export type PolicyEffect = "allow" | "deny" | "warn" | "shadow_deny";

export type LedgerLevel = "none" | "decision" | "action" | "full";

export type Layer = "experience" | "gateway" | "governance" | "mesh" | "infra";

// ============================================
// POLICY EVALUATION TYPES
// ============================================

/**
 * The actor attempting an action.
 */
export interface Subject {
  /** Unique user identifier (null for anonymous/system) */
  user_id?: string | null;
  /** Role name (e.g., "teacher", "student", "operator") */
  role: string;
  /** Additional subject attributes for policy matching */
  attributes?: Record<string, unknown>;
}

/**
 * The target resource of an action.
 */
export interface Resource {
  /** Resource type (e.g., "assignment", "submission") */
  type: string;
  /** Specific resource ID (null for collection-level actions) */
  id?: string | null;
  /** Additional resource attributes for policy matching */
  attributes?: Record<string, unknown>;
}

/**
 * Metadata about the originating request.
 */
export interface RequestMetadata {
  /** Host where request originated (e.g., "edu.blackroad.io") */
  host?: string;
  /** Service name (e.g., "edu-web") */
  service?: string;
  /** Correlation ID for request tracing */
  correlation_id?: string;
}

/**
 * Context provided with policy evaluation requests.
 */
export interface PolicyContext {
  /**
   * Claims the subject holds (verified by caller).
   * Example: [{ type: "assignment:assignee", resource_id: "a123", subject_id: "u456" }]
   */
  claims: Array<Record<string, unknown>>;

  /**
   * Facts the caller asserts are true (logged for audit).
   * Example: ["is_assignment_assignee", "is_first_assignment_for_teacher"]
   */
  asserted_facts: string[];

  /**
   * Evidence supporting asserted facts.
   * Example: { "is_assignment_assignee": { checked_at: "2025-...", method: "db_lookup" } }
   */
  fact_evidence: Record<string, unknown>;

  /** Request origin information */
  request_metadata: RequestMetadata;
}

/**
 * Request body for POST /policy/evaluate
 */
export interface PolicyEvaluateRequest {
  subject: Subject;
  action: string;
  resource: Resource;
  context: PolicyContext;
}

/**
 * Response from POST /policy/evaluate
 */
export interface PolicyEvaluateResponse {
  /** The policy decision */
  decision: PolicyEffect;
  /** ID of the policy that matched (null if default) */
  policy_id?: string | null;
  /** Version of the policy pack */
  policy_version?: string | null;
  /** Human-readable explanation (required for deny on compliance scopes) */
  reason?: string | null;
  /** Minimum ledger level caller must emit */
  required_ledger_level: LedgerLevel;
}

// ============================================
// LEDGER EVENT TYPES
// ============================================

/**
 * Actor information for ledger events.
 */
export interface LedgerActor {
  user_id?: string | null;
  role?: string | null;
  agent_id?: string | null;
  delegation_id?: string | null;
}

/**
 * Request body for POST /ledger/event
 */
export interface LedgerEventCreate {
  // Identity
  correlation_id: string;
  intent_id?: string | null;
  sequence_num?: number;

  // Location
  layer: Layer;
  host: string;
  service: string;
  policy_scope: string;

  // Actor
  actor: LedgerActor;

  // Action
  action: string;
  resource_type: string;
  resource_id?: string | null;

  // Decision
  decision: PolicyEffect;
  policy_id?: string | null;
  policy_version?: string | null;

  // Evidence
  asserted_facts?: string[];
  fact_evidence?: Record<string, unknown>;
  claims?: Array<Record<string, unknown>>;

  // Metadata
  ledger_level: LedgerLevel;
  metadata?: Record<string, unknown>;
  request_context?: Record<string, unknown> | null;
  response_summary?: Record<string, unknown> | null;

  // Timestamps (optional - server will set if not provided)
  occurred_at?: string | null;
}

/**
 * Full ledger event as returned from the API.
 */
export interface LedgerEvent extends LedgerEventCreate {
  id: string;
  recorded_at: string;
}

// ============================================
// CLIENT
// ============================================

export interface GovernanceClientConfig {
  /** Base URL for governance API (default: process.env.NEXT_PUBLIC_GOV_API_URL) */
  baseUrl?: string;
  /** Additional headers to include */
  headers?: Record<string, string>;
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
}

/**
 * Governance client for calling policy and ledger endpoints.
 */
export class GovernanceClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(config: GovernanceClientConfig = {}) {
    this.baseUrl =
      config.baseUrl ??
      process.env.NEXT_PUBLIC_GOV_API_URL ??
      process.env.GOV_API_URL ??
      "http://localhost:8000";
    this.headers = {
      "Content-Type": "application/json",
      ...config.headers,
    };
    this.timeout = config.timeout ?? 5000;
  }

  /**
   * Evaluate a policy request.
   *
   * @example
   * const response = await client.evaluatePolicy({
   *   subject: { user_id: "u123", role: "teacher" },
   *   action: "assignment:create",
   *   resource: { type: "assignment" },
   *   context: {
   *     claims: [],
   *     asserted_facts: [],
   *     fact_evidence: {},
   *     request_metadata: {
   *       host: "edu.blackroad.io",
   *       service: "edu-web",
   *       correlation_id: crypto.randomUUID(),
   *     },
   *   },
   * });
   *
   * if (response.decision === "deny") {
   *   throw new Error(response.reason ?? "Access denied");
   * }
   */
  async evaluatePolicy(
    request: PolicyEvaluateRequest
  ): Promise<PolicyEvaluateResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/policy/evaluate`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Policy evaluation failed: ${res.status} ${error}`);
      }

      return (await res.json()) as PolicyEvaluateResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Record a ledger event.
   *
   * @example
   * await client.recordEvent({
   *   correlation_id: crypto.randomUUID(),
   *   layer: "experience",
   *   host: "edu.blackroad.io",
   *   service: "edu-web",
   *   policy_scope: "edu.*",
   *   actor: { user_id: "u123", role: "teacher" },
   *   action: "assignment:create",
   *   resource_type: "assignment",
   *   resource_id: "a456",
   *   decision: "allow",
   *   policy_id: "edu.create-assignment.teacher-only",
   *   policy_version: "edu-v1",
   *   ledger_level: "action",
   *   metadata: { title: "Week 1 Homework" },
   * });
   */
  async recordEvent(event: LedgerEventCreate): Promise<LedgerEvent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/ledger/event`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(event),
        signal: controller.signal,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to record event: ${res.status} ${error}`);
      }

      return (await res.json()) as LedgerEvent;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Query ledger events.
   */
  async queryEvents(
    params: Partial<{
      correlation_id: string;
      intent_id: string;
      actor_user_id: string;
      actor_agent_id: string;
      action: string;
      policy_scope: string;
      decision: PolicyEffect;
      host: string;
      service: string;
      limit: number;
      offset: number;
    }> = {}
  ): Promise<{ events: LedgerEvent[]; total: number }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });

    const res = await fetch(
      `${this.baseUrl}/ledger/events?${searchParams.toString()}`,
      {
        headers: this.headers,
      }
    );

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to query events: ${res.status} ${error}`);
    }

    return (await res.json()) as { events: LedgerEvent[]; total: number };
  }

  /**
   * Check governance health.
   */
  async healthCheck(): Promise<{
    policy_engine: string;
    ledger_service: string;
    policy_packs_loaded: number;
    services_registered: number;
    ledger_event_count: number;
  }> {
    const res = await fetch(`${this.baseUrl}/governance/health`, {
      headers: this.headers,
    });

    if (!res.ok) {
      throw new Error(`Health check failed: ${res.status}`);
    }

    return res.json();
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let _client: GovernanceClient | null = null;

/**
 * Get the default governance client instance.
 */
export function getGovernanceClient(): GovernanceClient {
  if (!_client) {
    _client = new GovernanceClient();
  }
  return _client;
}

// ============================================
// CONVENIENCE EXPORTS
// ============================================

export const evaluatePolicy = (
  request: PolicyEvaluateRequest
): Promise<PolicyEvaluateResponse> => getGovernanceClient().evaluatePolicy(request);

export const recordEvent = (
  event: LedgerEventCreate
): Promise<LedgerEvent> => getGovernanceClient().recordEvent(event);
