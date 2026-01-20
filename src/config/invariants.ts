/**
 * System Invariants - Core guarantees that must never be violated
 * 
 * These invariants are enforced at the application and database level.
 * Any violation should be treated as a critical system error.
 */

export const SYSTEM_INVARIANTS = {
  /**
   * DETERMINISM GUARANTEES
   * Same input data must always produce identical outputs
   */
  DETERMINISM: {
    SAME_INPUT_SAME_OUTPUT: 'Same input data must always produce identical output scores',
    NO_RANDOM_SEEDS: 'No random number generation in analytics algorithms',
    FIXED_ALGORITHMS: 'Algorithm implementations must be versioned and immutable',
  },

  /**
   * COMPUTATION TRANSPARENCY
   * All computations must be traceable and auditable
   */
  COMPUTATION: {
    NO_SILENT_RECOMPUTATION: 'All recomputations must be logged with timestamps',
    EXPLICIT_CACHE_INVALIDATION: 'Cache invalidation must be explicit and traceable',
    TEMPORAL_LOCALITY: 'lastComputedAt timestamps required for all cached metrics',
    LAZY_EVALUATION: 'Metrics computed only when queried, never on event ingestion',
  },

  /**
   * ALERT REQUIREMENTS
   * All alerts must meet these criteria
   */
  ALERTS: {
    REFERENCE_DATA_SUFFICIENCY: 'All alerts must include data sufficiency level',
    SINGLE_PRIMARY_TRIGGER: 'Each alert type has exactly one primary trigger condition',
    NO_HIDDEN_THRESHOLDS: 'All thresholds must be in threshold_config table',
    CONTEXT_NOT_TRIGGERS: 'Additional metrics are context, not multi-dimensional triggers',
  },

  /**
   * DATA MINIMIZATION
   * Strict privacy and data protection requirements
   */
  DATA_MINIMIZATION: {
    NO_PII_IN_ANALYTICS: 'No names, emails, or addresses in analytics data paths',
    OPAQUE_SELLER_IDS: 'Seller IDs must be UUIDs, never sequential integers',
    BEHAVIORAL_SIGNALS_ONLY: 'Event payloads contain only behavioral signals (type, value, timestamp)',
    AGGREGATION_FIRST: 'Analytics computed on aggregates, never individual events',
    NO_RAW_EVENT_EXPORT: 'Exports contain only aggregated metrics, never raw events',
  },

  /**
   * RETENTION POLICIES
   * Data lifecycle management requirements
   */
  RETENTION: {
    TIER_BASED_RETENTION: 'Data retention periods determined by pricing tier',
    EXPLICIT_EXPIRY: 'All data has explicit expiry timestamp (expires_at column)',
    AUTOMATIC_DECAY: 'Old data automatically removed, no manual cleanup required',
    NO_INDEFINITE_STORAGE: 'No data stored indefinitely, even for enterprise tier',
  },
} as const;

/**
 * Validation functions to enforce invariants
 */
export const validateInvariants = {
  /**
   * Validate that response includes determinism flag
   */
  isDeterministic(response: { deterministic?: boolean }): boolean {
    return response.deterministic === true;
  },

  /**
   * Validate that alert includes data sufficiency
   */
  hasDataSufficiency(alert: { dataSufficiency?: string }): boolean {
    return ['insufficient', 'minimal', 'adequate', 'optimal'].includes(alert.dataSufficiency || '');
  },

  /**
   * Validate that data contains no PII
   */
  containsNoPII(data: Record<string, unknown>): boolean {
    const piiFields = ['name', 'email', 'address', 'phone', 'ssn', 'credit_card'];
    const keys = Object.keys(data).map(k => k.toLowerCase());
    return !piiFields.some(field => keys.includes(field));
  },

  /**
   * Validate that seller ID is a valid UUID
   */
  isOpaqueSellerId(sellerId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(sellerId);
  },

  /**
   * Validate that event payload contains only behavioral signals
   */
  isBehavioralSignal(event: { type?: string; value?: number; timestamp?: number }): boolean {
    const allowedKeys = ['type', 'value', 'timestamp', 'sellerId', 'seller_id'];
    const eventKeys = Object.keys(event);
    return eventKeys.every(key => allowedKeys.includes(key));
  },

  /**
   * Validate that data has expiry timestamp
   */
  hasExpiryTimestamp(data: { expires_at?: string | number }): boolean {
    return data.expires_at !== undefined && data.expires_at !== null;
  },
};

/**
 * Embed widget guardrails
 * 
 * IMPORTANT: Rate limits and branding rules are stored in tier_config table.
 * These constants are for type reference only.
 */
export const EMBED_GUARDRAILS = {

  /**
   * Default scopes for embed keys
   */
  DEFAULT_SCOPES: ['read'] as const,

  /**
   * Available scopes
   */
  AVAILABLE_SCOPES: ['read', 'write', 'admin'] as const,

  /**
   * Widget types
   */
  WIDGET_TYPES: ['anomaly', 'health', 'prediction', 'all'] as const,
};

/**
 * Configuration audit requirements
 */
export const CONFIG_AUDIT = {
  /**
   * Changes that require audit trail
   */
  AUDITABLE_CHANGES: [
    'tier_config',
    'alert_config',
    'threshold_config',
    'retention_policies',
  ] as const,

  /**
   * Snapshot triggers
   */
  SNAPSHOT_TRIGGERS: [
    'weekly_report',
    'export',
    'audit',
    'tier_change',
  ] as const,

  /**
   * Required audit fields
   */
  REQUIRED_FIELDS: [
    'effective_since',
    'config_data',
    'table_name',
    'record_id',
  ] as const,
};

/**
 * Insight lifecycle states
 */
export const INSIGHT_LIFECYCLE = {
  STATES: {
    GENERATED: 'generated',
    CONFIRMED: 'confirmed',
    EXPIRED: 'expired',
    SUPERSEDED: 'superseded',
  } as const,

  /**
   * State transitions
   */
  TRANSITIONS: {
    generated: ['confirmed', 'expired', 'superseded'],
    confirmed: ['expired', 'superseded'],
    expired: [],
    superseded: [],
  } as const,

  /**
   * Auto-expiry rules
   */
  EXPIRY_RULES: {
    insufficient_data: 3600000, // 1 hour
    minimal_data: 86400000, // 24 hours
    adequate_data: 604800000, // 7 days
    optimal_data: 2592000000, // 30 days
  } as const,
};

/**
 * Data retention policies
 * 
 * IMPORTANT: Retention periods are stored in retention_policies table.
 * This constant is for type reference only.
 */
export const RETENTION_POLICY_TYPES = {
  DATA_TYPES: ['events', 'metrics_cache', 'insights', 'exports', 'api_usage'] as const,
  DECAY_STRATEGIES: ['hard_delete', 'soft_delete', 'archive'] as const,
} as const;
