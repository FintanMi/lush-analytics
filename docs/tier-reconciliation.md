# Tier Reconciliation System

## Overview

The tier reconciliation system implements a principled approach to pricing where **tier is a derived state, not an attribute**. This means tiers are computed deterministically based on usage metrics and pricing policies, never manually assigned.

## Core Philosophy

### Mental Model

```
usage metrics
+ pricing policy
+ grace rules
+ entitlements
----------------
= effective tier
```

### Key Principles

1. **Tier is Derived State**: Tiers are computed, not assigned
2. **Deterministic**: Same inputs always produce same tier
3. **Auditable**: Every tier change is logged with full context
4. **Reproducible**: Tier computation can be re-run at any time
5. **No Manual Assignment**: Admins trigger computation, not assignment
6. **Exceptions via Entitlements**: Special cases handled explicitly

## Database Schema

### tier_states

Stores the current tier state for each user:

```sql
- user_id: UUID (unique)
- effective_tier: TEXT ('free', 'basic', 'premium')
- pricing_version: TEXT (e.g., 'v1.0.0')
- computed_at: BIGINT (timestamp)
- source: TEXT ('scheduled', 'admin_reconcile', 'signup')
- usage_snapshot: JSONB (usage at computation time)
- applied_rules: JSONB (rules that determined the tier)
```

### entitlements

Handles exceptions and bonuses:

```sql
- user_id: UUID
- type: TEXT ('webhook_bonus', 'prediction_bonus', 'event_bonus', 'retention_bonus')
- amount: INTEGER (bonus amount)
- expires_at: TIMESTAMPTZ (optional expiration)
- reason: TEXT (explanation for the entitlement)
- granted_by: UUID (admin who granted it)
- granted_at: TIMESTAMPTZ
- revoked_at: TIMESTAMPTZ (optional)
```

### tier_reconciliation_log

Audit trail for all tier changes:

```sql
- user_id: UUID
- previous_tier: TEXT
- new_tier: TEXT
- pricing_version: TEXT
- source: TEXT
- triggered_by: UUID (admin who triggered it)
- usage_metrics: JSONB
- applied_rules: JSONB
- created_at: TIMESTAMPTZ
```

### pricing_policies

Version-controlled pricing configuration:

```sql
- version: TEXT (unique, e.g., 'v1.0.0')
- config: JSONB (tier limits and rules)
- effective_from: TIMESTAMPTZ
- effective_until: TIMESTAMPTZ
- is_active: BOOLEAN
```

## Tier Computation Logic

### 1. Gather Inputs

```typescript
// Usage metrics
const usage = {
  events_this_month: number,
  webhooks_this_month: number,
  seller_accounts: number
};

// Active entitlements
const entitlements = [
  { type: 'event_bonus', amount: 1000 },
  { type: 'webhook_bonus', amount: 500 }
];

// Pricing policy
const policy = {
  tiers: {
    free: { events_per_month: 1000, ... },
    basic: { events_per_month: 50000, ... },
    premium: { events_per_month: 500000, ... }
  },
  grace_period_days: 7,
  overage_threshold: 1.1
};
```

### 2. Apply Entitlements

```typescript
// Adjust usage based on entitlements
adjustedUsage.events_this_month -= eventBonuses;
adjustedUsage.webhooks_this_month -= webhookBonuses;
```

### 3. Evaluate Tiers

```typescript
// Check from highest to lowest tier
for (const tier of ['premium', 'basic', 'free']) {
  const limits = policy.tiers[tier];
  
  if (
    adjustedUsage.events_this_month <= limits.events_per_month * overage_threshold &&
    adjustedUsage.webhooks_this_month <= limits.webhooks_per_month * overage_threshold &&
    adjustedUsage.seller_accounts <= limits.seller_accounts
  ) {
    return tier;
  }
}
```

### 4. Store Result

```typescript
// Upsert tier state
await supabase.from('tier_states').upsert({
  user_id,
  effective_tier,
  pricing_version,
  computed_at: Date.now(),
  source: 'admin_reconcile',
  usage_snapshot: usage,
  applied_rules: { ... }
});

// Log reconciliation
await supabase.from('tier_reconciliation_log').insert({
  user_id,
  previous_tier,
  new_tier: effective_tier,
  pricing_version,
  source: 'admin_reconcile',
  triggered_by: admin_id,
  usage_metrics: usage,
  applied_rules: { ... }
});
```

## Admin Panel

### Recalculate Tier Button

The admin panel provides a "Recalculate Tier" button that:

1. **Does NOT** allow manual tier selection
2. **Does** trigger tier computation based on current usage
3. **Shows** confirmation dialog with current state
4. **Logs** who triggered the reconciliation
5. **Displays** the result (previous tier → new tier)

### Button Labels

✅ **Correct**:
- "Recalculate Tier"
- "Apply Pricing Policy"

❌ **Incorrect**:
- "Upgrade User"
- "Downgrade User"
- "Set Tier"

### Confirmation Dialog

```
Title: Recalculate User Tier

Message: This will recompute the user's tier based on current 
usage and pricing rules. No data will be modified.

User: user@example.com
Current Tier: basic
Events: 45,000 / 50,000
Webhooks: 3,200 / 5,000

[Cancel] [Apply Pricing Policy]
```

## API Endpoints

### POST /reconcile-tier/:userId

Triggers tier reconciliation for a specific user.

**Request**: No body required

**Response**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "previous_tier": "basic",
    "new_tier": "premium",
    "pricing_version": "v1.0.0",
    "usage_metrics": {
      "events_this_month": 75000,
      "webhooks_this_month": 8000,
      "seller_accounts": 3
    },
    "applied_rules": { ... },
    "computed_at": 1737225600000
  }
}
```

## Tier Status Widget

The dashboard displays a tier status widget showing:

1. **Current Tier**: Badge with tier name
2. **Usage Progress**: Progress bars for each metric
3. **Limits**: Current usage vs tier limits
4. **Warnings**: Alert when approaching limits (>75%)
5. **Metadata**: Pricing version, last computed date, source

## Entitlements System

### Granting Entitlements

Entitlements are explicit exceptions to normal tier limits:

```typescript
// Example: Grant 10,000 bonus events for 30 days
await supabase.from('entitlements').insert({
  user_id: 'uuid',
  type: 'event_bonus',
  amount: 10000,
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  reason: 'Promotional campaign participation',
  granted_by: admin_id
});
```

### Entitlement Types

- `event_bonus`: Reduces event count for tier calculation
- `webhook_bonus`: Reduces webhook count for tier calculation
- `prediction_bonus`: Grants additional prediction API calls
- `retention_bonus`: Special retention offer

### Expiration

Entitlements can have optional expiration dates. Expired entitlements are automatically excluded from tier computation.

## Scheduled Reconciliation

In production, tier reconciliation should run on a schedule:

1. **Daily**: Check all users for tier changes
2. **Monthly**: Reconcile at billing cycle start
3. **On-demand**: Via admin panel button

## Why This Approach?

### Benefits

1. **Transparency**: Users and admins can see exactly why a tier was assigned
2. **Auditability**: Complete history of tier changes
3. **Reproducibility**: Can re-run computation to verify results
4. **Fairness**: Same rules apply to everyone
5. **Flexibility**: Entitlements handle exceptions without breaking the model

### Alignment with System Philosophy

This approach mirrors:

- **Deterministic Analytics**: Same inputs → same outputs
- **Config-Driven Behavior**: Pricing rules in database, not code
- **Reproducibility**: Can verify tier computation
- **Auditability**: Complete audit trail
- **No Hidden Magic**: All rules are explicit and visible

## Future Enhancements

1. **Grace Periods**: Allow temporary overage before downgrade
2. **Tier Predictions**: Predict future tier based on usage trends
3. **Usage Alerts**: Notify users when approaching limits
4. **Tier Recommendations**: Suggest optimal tier based on usage patterns
5. **Bulk Reconciliation**: Reconcile multiple users at once
