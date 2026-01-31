/**
 * Visualization → Decision Mapping
 * 
 * This module maps each visualization component to:
 * - Primary question it answers
 * - Decision it enables
 * - API endpoint it depends on
 * - Alert it can spawn
 * - Insight state transitions it triggers
 * 
 * Purpose: Make visualizations actionable and reduce UI noise
 */

export interface VisualizationDecisionMap {
  componentName: string;
  primaryQuestion: string;
  decisionEnabled: string;
  apiEndpoint: string;
  alertSpawning: boolean;
  insightStateTransitions: string[];
  actionButtons?: ActionButton[];
  relatedVisualizations?: string[];
}

export interface ActionButton {
  label: string;
  action: string;
  condition?: string;
}

export const VISUALIZATION_DECISION_REGISTRY: Record<string, VisualizationDecisionMap> = {
  // ============ Real-Time Components ============
  'LiveDAGHeatmap': {
    componentName: 'LiveDAGHeatmap',
    primaryQuestion: 'Which query nodes are bottlenecks in real-time execution?',
    decisionEnabled: 'Optimize query plans by identifying slow nodes',
    apiEndpoint: '/api/query-execution/dag-status',
    alertSpawning: true,
    insightStateTransitions: [
      'query_submitted',
      'dag_compiled',
      'nodes_executing',
      'bottleneck_detected',
      'optimization_suggested'
    ],
    actionButtons: [
      { label: 'Optimize Query', action: 'optimize_query_plan', condition: 'bottleneck_detected' },
      { label: 'View Details', action: 'show_node_details' }
    ],
    relatedVisualizations: ['QueryExecutionMonitor', 'RateLimitIndicator'],
  },
  
  'FrequencyDomainExplorer': {
    componentName: 'FrequencyDomainExplorer',
    primaryQuestion: 'What periodic patterns indicate manipulation?',
    decisionEnabled: 'Identify seller health risk through periodic behavior',
    apiEndpoint: '/api/analytics/fft',
    alertSpawning: true,
    insightStateTransitions: [
      'time_domain_data',
      'fft_computed',
      'periodic_pattern_detected',
      'manipulation_flagged',
      'seller_health_risk_escalated'
    ],
    actionButtons: [
      { label: 'Flag Seller', action: 'flag_seller_risk', condition: 'manipulation_detected' },
      { label: 'View Time Series', action: 'switch_to_time_domain' },
      { label: 'Export FFT Data', action: 'export_fft_results' }
    ],
    relatedVisualizations: ['BehaviorFingerprintCard', 'HealthScoreCard'],
  },
  
  'AttributionWaterfall': {
    componentName: 'AttributionWaterfall',
    primaryQuestion: 'Which factors contributed most to the outcome?',
    decisionEnabled: 'Allocate resources to high-impact factors',
    apiEndpoint: '/api/analytics/attribution',
    alertSpawning: false,
    insightStateTransitions: [
      'multi_touch_data',
      'attribution_calculated',
      'waterfall_rendered',
      'top_contributors_identified'
    ],
    actionButtons: [
      { label: 'Drill Down', action: 'drill_down_factor' },
      { label: 'Compare Periods', action: 'compare_attribution' },
      { label: 'Export Report', action: 'export_attribution' }
    ],
    relatedVisualizations: ['InsightsPanel', 'MetricsCard'],
  },
  
  'TimeToInsightTimeline': {
    componentName: 'TimeToInsightTimeline',
    primaryQuestion: 'How long does it take to generate insights?',
    decisionEnabled: 'Optimize insight generation pipeline',
    apiEndpoint: '/api/analytics/insight-timeline',
    alertSpawning: true,
    insightStateTransitions: [
      'data_ingested',
      'processing_started',
      'insight_generated',
      'insight_delivered',
      'latency_measured'
    ],
    actionButtons: [
      { label: 'Optimize Pipeline', action: 'optimize_pipeline', condition: 'high_latency' },
      { label: 'View Breakdown', action: 'show_stage_breakdown' }
    ],
    relatedVisualizations: ['QueryExecutionMonitor', 'RateLimitIndicator'],
  },
  
  'SignalQualityOverlay': {
    componentName: 'SignalQualityOverlay',
    primaryQuestion: 'Is the data quality sufficient for reliable insights?',
    decisionEnabled: 'Gate analytics on data quality thresholds',
    apiEndpoint: '/api/analytics/signal-quality',
    alertSpawning: true,
    insightStateTransitions: [
      'raw_data',
      'quality_assessed',
      'snr_calculated',
      'quality_gate_applied',
      'low_quality_warning'
    ],
    actionButtons: [
      { label: 'Improve Data Collection', action: 'suggest_improvements', condition: 'low_quality' },
      { label: 'View Quality Metrics', action: 'show_quality_details' }
    ],
    relatedVisualizations: ['DataSufficiencyBadge', 'EventChart'],
  },
  
  // ============ Analytics Components ============
  'AnomalyAlert': {
    componentName: 'AnomalyAlert',
    primaryQuestion: 'What anomalies require immediate attention?',
    decisionEnabled: 'Prioritize anomaly investigation and response',
    apiEndpoint: '/api/analytics/anomalies',
    alertSpawning: true,
    insightStateTransitions: [
      'normal_operation',
      'anomaly_detected',
      'alert_triggered',
      'user_notified',
      'investigation_started'
    ],
    actionButtons: [
      { label: 'Investigate', action: 'investigate_anomaly' },
      { label: 'Dismiss', action: 'dismiss_anomaly' },
      { label: 'Create Rule', action: 'create_suppression_rule', condition: 'false_positive' }
    ],
    relatedVisualizations: ['HealthScoreCard', 'InsightsPanel'],
  },
  
  'PredictionChart': {
    componentName: 'PredictionChart',
    primaryQuestion: 'What will the metric be in the future?',
    decisionEnabled: 'Plan resources and set expectations based on forecast',
    apiEndpoint: '/api/analytics/forecast',
    alertSpawning: true,
    insightStateTransitions: [
      'historical_data',
      'model_trained',
      'forecast_generated',
      'confidence_calculated',
      'prediction_alert_spawned'
    ],
    actionButtons: [
      { label: 'Adjust Forecast', action: 'adjust_forecast_params' },
      { label: 'Set Alert', action: 'create_prediction_alert' },
      { label: 'Export Forecast', action: 'export_forecast' }
    ],
    relatedVisualizations: ['PredictiveAlerts', 'EventChart'],
  },
  
  'BehaviorFingerprintCard': {
    componentName: 'BehaviorFingerprintCard',
    primaryQuestion: 'What is the unique behavioral signature of this seller?',
    decisionEnabled: 'Detect drift and identify seller health risks',
    apiEndpoint: '/api/analytics/fingerprint',
    alertSpawning: true,
    insightStateTransitions: [
      'behavior_data',
      'fingerprint_generated',
      'baseline_established',
      'drift_monitored',
      'drift_alert_triggered'
    ],
    actionButtons: [
      { label: 'View Drift History', action: 'show_drift_history' },
      { label: 'Update Baseline', action: 'update_fingerprint_baseline' },
      { label: 'Flag Risk', action: 'flag_seller_risk', condition: 'high_drift' }
    ],
    relatedVisualizations: ['HealthScoreCard', 'FrequencyDomainExplorer'],
  },
  
  'HealthScoreCard': {
    componentName: 'HealthScoreCard',
    primaryQuestion: 'How healthy is this seller overall?',
    decisionEnabled: 'Prioritize seller interventions and support',
    apiEndpoint: '/api/analytics/health-score',
    alertSpawning: true,
    insightStateTransitions: [
      'multi_signal_collected',
      'health_calculated',
      'risk_assessed',
      'intervention_suggested',
      'health_alert_triggered'
    ],
    actionButtons: [
      { label: 'View Breakdown', action: 'show_health_breakdown' },
      { label: 'Contact Seller', action: 'initiate_seller_contact', condition: 'low_health' },
      { label: 'Generate Report', action: 'generate_health_report' }
    ],
    relatedVisualizations: ['BehaviorFingerprintCard', 'AnomalyAlert'],
  },
  
  'InsightsPanel': {
    componentName: 'InsightsPanel',
    primaryQuestion: 'What are the key insights from the data?',
    decisionEnabled: 'Take action on prioritized insights',
    apiEndpoint: '/api/analytics/insights',
    alertSpawning: false,
    insightStateTransitions: [
      'data_analyzed',
      'insights_generated',
      'insights_prioritized',
      'insights_displayed',
      'user_action_tracked'
    ],
    actionButtons: [
      { label: 'Act on Insight', action: 'act_on_insight' },
      { label: 'Dismiss', action: 'dismiss_insight' },
      { label: 'Share', action: 'share_insight' }
    ],
    relatedVisualizations: ['InsightSummaryCard', 'MetricsCard'],
  },
  
  'InsightSummaryCard': {
    componentName: 'InsightSummaryCard',
    primaryQuestion: 'What is the summary of this insight?',
    decisionEnabled: 'Quickly understand and act on insights',
    apiEndpoint: '/api/analytics/insight-summary',
    alertSpawning: false,
    insightStateTransitions: [
      'insight_generated',
      'summary_created',
      'confidence_assessed',
      'action_suggested'
    ],
    actionButtons: [
      { label: 'View Details', action: 'show_insight_details' },
      { label: 'Confirm', action: 'confirm_insight' },
      { label: 'Dismiss', action: 'dismiss_insight' }
    ],
    relatedVisualizations: ['InsightsPanel', 'PredictiveAlerts'],
  },
  
  'PredictiveAlerts': {
    componentName: 'PredictiveAlerts',
    primaryQuestion: 'What future issues should I prepare for?',
    decisionEnabled: 'Proactively address predicted problems',
    apiEndpoint: '/api/analytics/predictive-alerts',
    alertSpawning: true,
    insightStateTransitions: [
      'forecast_generated',
      'threshold_checked',
      'alert_triggered',
      'user_notified',
      'preventive_action_suggested'
    ],
    actionButtons: [
      { label: 'Take Action', action: 'execute_preventive_action' },
      { label: 'Snooze', action: 'snooze_alert' },
      { label: 'Adjust Threshold', action: 'adjust_alert_threshold' }
    ],
    relatedVisualizations: ['PredictionChart', 'AnomalyAlert'],
  },
  
  'QueryExecutionMonitor': {
    componentName: 'QueryExecutionMonitor',
    primaryQuestion: 'How is my query executing?',
    decisionEnabled: 'Monitor and optimize query performance',
    apiEndpoint: '/api/query-execution/monitor',
    alertSpawning: true,
    insightStateTransitions: [
      'query_submitted',
      'execution_started',
      'progress_tracked',
      'bottleneck_detected',
      'execution_completed'
    ],
    actionButtons: [
      { label: 'Cancel Query', action: 'cancel_query' },
      { label: 'Optimize', action: 'optimize_query' },
      { label: 'View Logs', action: 'show_execution_logs' }
    ],
    relatedVisualizations: ['LiveDAGHeatmap', 'RateLimitIndicator'],
  },
  
  'RateLimitIndicator': {
    componentName: 'RateLimitIndicator',
    primaryQuestion: 'Am I approaching my rate limits?',
    decisionEnabled: 'Manage API usage and upgrade timing',
    apiEndpoint: '/api/analytics/rate-limits',
    alertSpawning: true,
    insightStateTransitions: [
      'usage_tracked',
      'limit_checked',
      'threshold_warning',
      'upgrade_suggested',
      'limit_reached'
    ],
    actionButtons: [
      { label: 'Upgrade Tier', action: 'upgrade_tier', condition: 'approaching_limit' },
      { label: 'View Usage', action: 'show_usage_details' },
      { label: 'Optimize Queries', action: 'suggest_query_optimization' }
    ],
    relatedVisualizations: ['TierStatusWidget', 'QueryExecutionMonitor'],
  },
  
  'TierStatusWidget': {
    componentName: 'TierStatusWidget',
    primaryQuestion: 'What is my current tier and usage?',
    decisionEnabled: 'Decide when to upgrade or downgrade',
    apiEndpoint: '/api/user/tier-status',
    alertSpawning: false,
    insightStateTransitions: [
      'tier_checked',
      'usage_calculated',
      'saturation_assessed',
      'upgrade_recommendation'
    ],
    actionButtons: [
      { label: 'Upgrade', action: 'upgrade_tier' },
      { label: 'View Plans', action: 'show_pricing_plans' },
      { label: 'Usage History', action: 'show_usage_history' }
    ],
    relatedVisualizations: ['RateLimitIndicator', 'MetricsCard'],
  },
  
  'EventChart': {
    componentName: 'EventChart',
    primaryQuestion: 'What is the trend in my events over time?',
    decisionEnabled: 'Identify patterns and anomalies in event data',
    apiEndpoint: '/api/analytics/events',
    alertSpawning: false,
    insightStateTransitions: [
      'events_loaded',
      'chart_rendered',
      'pattern_identified',
      'anomaly_highlighted'
    ],
    actionButtons: [
      { label: 'Filter Events', action: 'filter_events' },
      { label: 'Export Data', action: 'export_event_data' },
      { label: 'Set Alert', action: 'create_event_alert' }
    ],
    relatedVisualizations: ['AnomalyAlert', 'PredictionChart'],
  },
  
  'MetricsCard': {
    componentName: 'MetricsCard',
    primaryQuestion: 'What is the current value of this metric?',
    decisionEnabled: 'Monitor key performance indicators',
    apiEndpoint: '/api/analytics/metrics',
    alertSpawning: false,
    insightStateTransitions: [
      'metric_fetched',
      'value_displayed',
      'trend_calculated',
      'comparison_shown'
    ],
    actionButtons: [
      { label: 'View History', action: 'show_metric_history' },
      { label: 'Set Goal', action: 'set_metric_goal' },
      { label: 'Compare', action: 'compare_metric' }
    ],
    relatedVisualizations: ['EventChart', 'InsightsPanel'],
  },
  
  'DataSufficiencyBadge': {
    componentName: 'DataSufficiencyBadge',
    primaryQuestion: 'Is there enough data for reliable analysis?',
    decisionEnabled: 'Gate analytics and show confidence warnings',
    apiEndpoint: '/api/analytics/data-sufficiency',
    alertSpawning: false,
    insightStateTransitions: [
      'data_checked',
      'sufficiency_assessed',
      'confidence_calculated',
      'warning_displayed'
    ],
    actionButtons: [
      { label: 'Learn More', action: 'show_sufficiency_info' },
      { label: 'Collect More Data', action: 'suggest_data_collection' }
    ],
    relatedVisualizations: ['SignalQualityOverlay', 'EventChart'],
  },
  
  'EmbeddableWidget': {
    componentName: 'EmbeddableWidget',
    primaryQuestion: 'How can I share this visualization externally?',
    decisionEnabled: 'Embed analytics in external dashboards',
    apiEndpoint: '/api/analytics/embeddable',
    alertSpawning: false,
    insightStateTransitions: [
      'widget_configured',
      'embed_code_generated',
      'widget_embedded',
      'usage_tracked'
    ],
    actionButtons: [
      { label: 'Get Embed Code', action: 'generate_embed_code' },
      { label: 'Configure', action: 'configure_widget' },
      { label: 'Preview', action: 'preview_widget' }
    ],
    relatedVisualizations: ['MetricsCard', 'EventChart'],
  },
  
  'QueryBuilder': {
    componentName: 'QueryBuilder',
    primaryQuestion: 'How do I construct a custom analytics query?',
    decisionEnabled: 'Build and execute custom analytics queries',
    apiEndpoint: '/api/query-execution/build',
    alertSpawning: false,
    insightStateTransitions: [
      'query_started',
      'nodes_added',
      'query_validated',
      'query_submitted',
      'results_returned'
    ],
    actionButtons: [
      { label: 'Execute Query', action: 'execute_query' },
      { label: 'Save Query', action: 'save_query' },
      { label: 'Validate', action: 'validate_query' }
    ],
    relatedVisualizations: ['QueryExecutionMonitor', 'LiveDAGHeatmap'],
  },
};

/**
 * Helper functions for visualization decision mapping
 */

export function getVisualizationDecisionMap(componentName: string): VisualizationDecisionMap | undefined {
  return VISUALIZATION_DECISION_REGISTRY[componentName];
}

export function getVisualizationsByEndpoint(endpoint: string): VisualizationDecisionMap[] {
  return Object.values(VISUALIZATION_DECISION_REGISTRY).filter(
    viz => viz.apiEndpoint === endpoint
  );
}

export function getVisualizationsWithAlerts(): VisualizationDecisionMap[] {
  return Object.values(VISUALIZATION_DECISION_REGISTRY).filter(
    viz => viz.alertSpawning
  );
}

export function getRelatedVisualizations(componentName: string): VisualizationDecisionMap[] {
  const viz = getVisualizationDecisionMap(componentName);
  if (!viz || !viz.relatedVisualizations) return [];
  
  return viz.relatedVisualizations
    .map(name => getVisualizationDecisionMap(name))
    .filter((v): v is VisualizationDecisionMap => v !== undefined);
}

/**
 * Get available actions for a visualization based on current state
 */
export function getAvailableActions(
  componentName: string,
  currentState: Record<string, any>
): ActionButton[] {
  const viz = getVisualizationDecisionMap(componentName);
  if (!viz || !viz.actionButtons) return [];
  
  return viz.actionButtons.filter(button => {
    if (!button.condition) return true;
    return currentState[button.condition] === true;
  });
}

/**
 * Track insight state transitions for analytics
 */
export interface InsightStateTransition {
  componentName: string;
  fromState: string;
  toState: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export function createStateTransition(
  componentName: string,
  fromState: string,
  toState: string,
  metadata?: Record<string, any>
): InsightStateTransition {
  return {
    componentName,
    fromState,
    toState,
    timestamp: Date.now(),
    metadata,
  };
}

/**
 * Generate decision flow documentation
 */
export function generateDecisionFlow(componentName: string): string {
  const viz = getVisualizationDecisionMap(componentName);
  if (!viz) return '';
  
  return `
# ${viz.componentName} Decision Flow

## Primary Question
${viz.primaryQuestion}

## Decision Enabled
${viz.decisionEnabled}

## API Endpoint
${viz.apiEndpoint}

## Alert Spawning
${viz.alertSpawning ? 'Yes' : 'No'}

## Insight State Transitions
${viz.insightStateTransitions.map((state, i) => `${i + 1}. ${state}`).join('\n')}

## Available Actions
${viz.actionButtons?.map(btn => `- ${btn.label} (${btn.action})${btn.condition ? ` [Condition: ${btn.condition}]` : ''}`).join('\n') || 'No actions defined'}

## Related Visualizations
${viz.relatedVisualizations?.join(', ') || 'None'}
  `.trim();
}
