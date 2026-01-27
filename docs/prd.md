# Lush Analytics Requirements Document

## 1. Application Overview

### 1.1 Application Name
Lush Analytics
\n### 1.2 Application Description
A lightweight, high-performance analytics API system designed for sellers. The system provides real-time anomaly detection (sales/click spikes, bot detection), short-term trend prediction (traffic/sales forecasting), and efficient scalable backend architecture utilizing DSP techniques (FIR, FFT, HFD) and probabilistic caching. Enhanced features include automated insight engine, predictive alerts, seller health scoring, behavioral fingerprinting capabilities, deterministic reproducibility, data sufficiency metrics, rate limit visibility, decision hooks, weekly health reports, alert-driven pricing tiers, dedicated anomaly/prediction endpoints, fixed tier defaults, insight summaries, one-click export functionality, embeddable components, confidence/sufficiency-aware messaging, auditable configuration management, formalized insight lifecycle, embeddable guardrails, codified system invariants, data minimization enforcement, aggregation-first analytics, tier-based retention policies, edge case detection as signal quality indicators, comprehensive encryption strategy, webhook registration and management, and funnel analysis.\n
The application now includes a redesigned modern frontend interface with navigation in the main section (replacing the traditional sidebar), featuring hero section, feature showcase, pricing tiers, testimonials, and email signup functionality, fully responsive for desktop and mobile devices.

**New Features**: Team collaboration system with role-based access control (Admin/Member), project management, real-time task tracking, dashboard with task completion progress and assigned tasks, Stripe payment integration, and admin tier reconciliation system.

**Performance Enhancements**: Lazy loading implementation for all pages, smooth page transitions with subtle animations using motion library.\n
**Security Enhancements**: Admin-only access to tier reconciliation data and all user plan details, password reset functionality on login dialog.\n
## 2. Core Functionality

### 2.1 Event Ingestion
- **Endpoint**: POST /events
- **Functionality**: Accept and process seller event data in real-time
- **Payload Structure**:
  - sellerId: Seller identifier (opaque/proxy key only)
  - timestamp: Event timestamp (milliseconds)
  - type: Event type (SALE / CLICK / VIEW / CHECKOUT_STARTED / PAYMENT_SUCCEEDED)\n  - value: Event value (behavioral signals only, no PII)
- **Processing Logic**: Add events to pre-allocated fixed-size ring buffers (contiguous arrays), separate buffer per seller per metric. Circular access using index mod window size. No per-event reallocation or object churn.
- **Data Minimization**: Strip all PII (names, emails, addresses) from event payloads, retain only behavioral signals.\n
### 2.2 Batch Ingestion
- **Endpoint**: POST /events/batch
- **Functionality**: Accept bulk event data for high-throughput sellers
- **Payload Structure**: Array of event objects (PII-stripped)
- **Processing Logic**: Efficiently process multiple events in a single request to reduce overhead, using same ring buffer mechanism\n\n### 2.3 Ring Buffer Management
- Pre-allocated fixed-size contiguous arrays (window size defined in centralized config)
- Circular access using index mod window size
- Zero per-event reallocation\n- No per-event object churn
- Supports real-time FIR, FFT, and HFD computation
- **Clear Time Window Definition**: Expose time window parameters (start timestamp, end timestamp, window size) in API responses and UI

### 2.4 DSP Analytics Pipeline
- **FIR Smoothing**: Smooth time series data\n- **FFT Analysis**: Detect periodic spikes in sales/clicks, identify repetitive bot patterns or hourly spikes
- **HFD (Higuchi Fractal Dimension)**: Measure time series complexity/irregularity, high HFD values indicate possible bot activity or anomalous behavior
- **Bayesian/Probabilistic Scoring**: Combine smoothed deviation, FFT peaks, and HFD to output anomaly score (0-1 range)
- **Deterministic Anomaly Reproducibility**: Ensure same inputs always produce same outputs through fixed random seeds, deterministic ordering, and consistent computation order
- **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events
\n### 2.5 Probabilistic Caching with Temporal Locality
- Per-seller hot metrics cache\n- **lastComputedAt** timestamp tracking for each cached metric
- Probabilistic refresh only on query (not per-event)
- Adaptive TTL policies defined in centralized config:\n  - Hot sellers: Recompute based on config TTL
  - Cold sellers: Recompute based on config TTL
- Short-term cache layer to reduce duplicate function calls
- Ensures system scalability under high load

### 2.6 Anomaly Detection API
- **Endpoint**: GET /metrics/:seller/anomalies
- **Functionality**: Return seller anomaly score and attribution breakdown
- **Response Format**:
  - anomalyScore: Overall anomaly score (0-1)\n  - attribution: Root cause breakdown (FFT peak contribution, HFD complexity contribution, trend deviation)\n  - timeWindow: Clear time window definition (startTimestamp, endTimestamp, windowSize)
  - dataSufficiency: Data sufficiency metrics (sufficient/insufficient, required minimum data points, current available data points)
  - reproducibilityHash: Hash for deterministic verification
  - confidenceMessage: Confidence and sufficiency-aware messaging explaining result reliability
  - configVersion: Configuration version used for this computation
  - signalQuality: Signal quality assessment (degraded patterns, edge case flags)\n
### 2.7 Prediction API
- **Endpoint**: GET /metrics/:seller/predictions
- **Functionality**: Return predicted sales/traffic time series data with confidence bands
- **Response Format**:
  - predictions: Array of timestamped predicted values
  - confidenceBands: ± confidence intervals around predictions
  - historicalCutoff: Timestamp marking where history ends and predictions begin
  - timeWindow: Clear time window definition
  - dataSufficiency: Data sufficiency metrics
  - reproducibilityHash: Hash for deterministic verification
  - confidenceMessage: Confidence and sufficiency-aware messaging explaining prediction reliability
  - configVersion: Configuration version used for this computation
  - signalQuality: Signal quality assessment

### 2.8 Automated Insight Engine with Summaries and Lifecycle Management
- **Functionality**: Generate lightweight insights based on rule-based and probabilistic analysis
- **Input Signals**:
  - Anomaly scores\n  - FFT periodicity
  - HFD complexity
  - Recent trend slope
- **Output**: Human-readable insight summaries explaining detected patterns and potential issues
- **Insight Summaries**: Concise, actionable summaries for quick understanding
- **Insight Lifecycle States**:
  - Generated: Newly created insight
  - Confirmed: Insight validated by subsequent data or user action
  - Expired: Insight no longer relevant due to time passage
  - Superseded: Insight replaced by newer, more accurate insight
- **State Transitions**: Automatic state management based on time, data updates, and user feedback\n- **Endpoint**: GET /insights/:seller/lifecycle to query insight status
\n### 2.9 Anomaly Attribution (Root Cause Breakdown)
- **Functionality**: Explain anomaly score composition\n- **Components**:
  - FFT peak contribution percentage
  - HFD complexity contribution percentage
  - Trend deviation contribution percentage
  - Smoothed deviation contribution percentage
\n### 2.10 Predictive Alerts with Single Primary Trigger
- **Functionality**: Proactive alert system based on primary trigger and contextual information
- **Primary Trigger**: Anomaly score threshold (defined in centralized config)
- **Contextual Information**: Trends, attribution, fingerprints, time windows provided as context, not additional triggers
- **Alert Levels**: Defined by configuration table (data-driven), not conditional statements
- **Alert Types**: Potential spike warnings, downtrend alerts, pattern shift notifications
- **System Invariant**: All alerts must reference data sufficiency status

### 2.11 Seller Health Score (Composite Index)
- **Endpoint**: GET /metrics/:seller/health
- **Functionality**: Calculate composite seller health score\n- **Scoring Factors**:
  - Volatility level\n  - Anomaly frequency
  - Predictive risk assessment
  - Data consistency metrics
- **Response Format**: { healthScore: 0-100, breakdown: {...}, timeWindow: {...}, dataSufficiency: {...}, confidenceMessage: \"...\", configVersion: \"...\", signalQuality: {...} }

### 2.12 Behavioral Fingerprinting
- **Functionality**: Identify and track seller behavior patterns
- **Analysis Methods**:
  - FFT + HFD + temporal entropy combination
- **Detection Capabilities**:
  - Bot cluster identification
  - Repetitive manipulation patterns
  - Sudden strategy changes
- **Output**: Behavioral fingerprint signature and pattern classification
- **Data Minimization**: Fingerprints based only on aggregated behavioral signals, no PII

### 2.13 Intelligent Sampling and Adaptive Resolution
- **Functionality**: Automatically adjust analysis computation cost based on seller activity
- **Adaptive Logic** (defined in centralized config):
  - High activity sellers: Full resolution analysis
  - Medium activity sellers: Medium sampling
  - Low activity sellers: Reduced sampling frequency
- **Benefits**: Optimize system resources while maintaining accuracy

### 2.14 Real-time Dashboard Integration
- **Technology**: Supabase Realtime integration
- **Functionality**: Real-time dashboard updates with AnomalyAlert component
- **Features**:
  - Real-time anomaly notifications
  - Real-time metrics updates
  - Event log display with pagination/infinite scroll
  - **Time Window Display**: Display clear time window definition in UI (start time, end time, window size)
  - **Data Sufficiency Metrics**: Display explicit data sufficiency status (sufficient/insufficient, show progress bar with current vs required data points)
  - **Rate Limit and Backpressure Visibility**: Display current rate limit status, remaining quota, backpressure metrics, and queue depth
  - **Confidence and Sufficiency-Aware Messaging**: Display contextual messages explaining result reliability based on data quality
  - **Insight Lifecycle Display**: Display insight status (Generated, Confirmed, Expired, Superseded) with visual indicators
  - **Signal Quality Indicators**: Display edge case flags and degraded pattern warnings
  - **Task Completion Progress**: Display overall completion percentage for current user's assigned tasks
  - **Assigned Tasks Overview**: Display list of tasks assigned to current user with status indicators
\n### 2.15 Event Log Management
- **Functionality**: Display and manage event logs on dashboard
- **Features**:
  - Pagination support\n  - Infinite scroll capability
  - Efficient data loading for large volumes of events
- **Data Minimization**: Display only aggregated behavioral signals, no PII
\n### 2.16 Decision Hooks
- **Functionality**: Provide extensible decision hooks for custom business logic integration
- **Hook Points**:
  - Pre-anomaly detection hook: Execute custom logic before anomaly detection
  - Post-anomaly detection hook: Execute custom logic after anomaly detection\n  - Pre-prediction hook: Execute custom logic before prediction generation
  - Post-prediction hook: Execute custom logic after prediction generation\n  - Alert trigger hook: Execute custom logic when alert is triggered
- **Use Cases**: Custom notification routing, third-party integrations, business rule execution, audit logging

### 2.17 Weekly Seller Health Reports
- **Functionality**: Generate and deliver automated weekly health reports for sellers
- **Report Content**:
  - Weekly health score summary
  - Anomaly frequency and severity breakdown
  - Trend analysis and predictions
  - Behavioral pattern insights
  - Actionable recommendations
  - Insight summaries for quick understanding
  - Insight lifecycle status summary
  - Signal quality assessment summary
- **Delivery Methods**: Email, dashboard notifications, API endpoint for retrieval
- **Endpoint**: GET /reports/:seller/weekly
- **Configuration Snapshot**: Each report includes configuration version snapshot used for generation

### 2.18 Alert-Driven Pricing Tiers with Fixed Defaults
- **Functionality**: Dynamic pricing tier system based on alert frequency and severity
- **Tier Structure**: Data-driven tier definitions (not logic-based)
- **Fixed Defaults Per Tier**:
  - Free Tier: €0 - Standard features, default alert thresholds, basic insights, light branding watermark on embeddable components
  - Basic Tier: €50 - Enhanced features, lower alert thresholds, detailed insights, faster response, reduced branding on embeddable components
  - Premium Tier: €300 - Advanced features, custom alert thresholds, comprehensive insights, priority support, minimal branding on embeddable components\n- **Pricing Factors** (defined in centralized config):\n  - Number of alerts triggered per month
  - Anomaly severity levels
  - Prediction accuracy requirements
  - Real-time processing demands
- **Endpoint**: GET /pricing/:seller/tier

### 2.19 Dedicated Anomaly Endpoint
- **Endpoint**: POST /sell/anomaly
- **Functionality**: Dedicated endpoint for selling/exposing anomaly detection results to external systems
- **Payload Structure**:
  - sellerId: Seller identifier (opaque/proxy key)\n  - timeRange: Time range for anomaly detection\n  - includeAttribution: Boolean flag to include root cause breakdown
- **Response Format**:
  - anomalyScore: Overall anomaly score\n  - attribution: Root cause breakdown
  - timeWindow: Time window definition
  - dataSufficiency: Data sufficiency metrics
  - reproducibilityHash: Hash for verification
  - confidenceMessage: Confidence and sufficiency-aware messaging
  - configVersion: Configuration version used
  - signalQuality: Signal quality assessment

### 2.20 Dedicated Prediction Endpoint
- **Endpoint**: POST /sell/prediction
- **Functionality**: Dedicated endpoint for selling/exposing prediction results to external systems
- **Payload Structure**:
  - sellerId: Seller identifier (opaque/proxy key)
  - predictionHorizon: Number of time steps to predict
  - includeConfidenceBands: Boolean flag to include confidence intervals
- **Response Format**:\n  - predictions: Array of timestamped predicted values
  - confidenceBands: ± confidence intervals\n  - historicalCutoff: Timestamp marking history/prediction boundary
  - timeWindow: Time window definition
  - dataSufficiency: Data sufficiency metrics\n  - reproducibilityHash: Hash for verification
  - confidenceMessage: Confidence and sufficiency-aware messaging
  - configVersion: Configuration version used
  - signalQuality: Signal quality assessment

### 2.21 One-Click Export Functionality
- **Functionality**: One-click export of reports, insights, and analytics data
- **Export Formats**: PDF, Email\n- **Export Content**:
  - Anomaly reports
  - Prediction reports
  - Health score reports
  - Weekly health reports
  - Insight summaries
  - Configuration snapshot used for report generation
- **Endpoints**:
  - POST /export/pdf: Generate and download PDF report
  - POST /export/email: Send report via email
\n### 2.22 Embeddable Components with Guardrails
- **Functionality**: Provide embeddable UI components for integration into external dashboards or applications
- **Components**:\n  - Anomaly chart widget
  - Prediction chart widget
  - Health score widget\n  - Alert notification widget
  - Event log widget
- **Integration**: JavaScript SDK or iframe-based embedding
- **Customization**: Support theme customization and configuration options
- **Soft Guardrails**:
  - Rate limits per embed key (defined in centralized config by tier)
  - Light branding watermark for Free/Basic tiers
  - Default read-only scope (no write access unless explicitly granted)
  - Require embed key authentication\n
### 2.23 Auditable Configuration Management
- **Functionality**: Track and audit all configuration changes\n- **Features**:
  - Version control for configuration tables
  - Effective-from timestamp for each configuration change
  - Configuration snapshot storage with reports
  - Configuration change audit log
  - Ability to rollback to previous configuration versions
- **Endpoints**:
  - GET /config/versions: List all configuration versions
  - GET /config/version/:id: Retrieve specific configuration version
  - GET /config/audit: Retrieve configuration change audit log
  - POST /config/rollback/:id: Rollback to specific configuration version

### 2.24 Edge Case Detection as Signal Quality\n- **Functionality**: Detect and flag edge cases as low-confidence signal mechanisms, not errors
- **Degraded Behavior Patterns**:
  - Constant zero values: Flagged as low signal mechanism
  - Perfect periodicity: Flagged as potential bot activity signal
  - Impossible regularity: Flagged as anomalous signal pattern
- **Handling**: Edge cases are signals, not errors. They represent low-confidence mechanisms and should be presented as signal quality indicators\n- **Output**: Signal quality score and edge case flags included in all analysis responses
- **Integration**: Signal quality metrics displayed in dashboard and included in API responses

### 2.25 Systemic Anomaly Detection
- **Functionality**: Detect and flag systemic issues separate from seller analytics
- **Systemic Anomaly Types**:
  - Sudden pattern changes: Detect unexpected data structure changes
  - Timestamp drift: Identify clock synchronization issues
  - Ingestion bursts: Detect abnormal data ingestion patterns
- **Handling**: Flag system health issues without polluting seller analytics
- **Output**: Separate system health metrics and alerts
- **Endpoint**: GET /system/health to query systemic anomaly status
- **Dashboard Integration**: System health panel separate from seller analytics

### 2.26 Frontend Landing Page\n- **Functionality**: Modern landing page showcasing Lush Analytics platform with redesigned navigation
- **Sections**:
  - **Hero Section**:
    - Headline: Primary value proposition
    - Subheadline: Supporting description
    - Call-to-action button: Opens user interaction dialog
  - **Features Section**:
    - Six feature cards with icons
    - Highlight key platform capabilities
    - **Anomaly Detection Card**: Reference advanced mathematical models (no mention of AI or machine learning)
    - **Predictive Insights Card**: Use Leverage business intelligence instead of Leverage advanced mathematical models
    - **Privacy by Design Card**: GDPR compliant with strict data minimization. No PII in analytics paths—only behavioral signals on aggregated data.\n    - **High Performance Card**: Ring buffer architecture with zero per-event allocation. Probabilistic caching ensures sub-millisecond response times.
  - **Pricing Section**:
    - Three pricing tiers with clear differentiation:\n      - Free Tier: €0\n      - Basic Tier: €50
      - Premium Tier: €300
    - Display pricing with Euro symbol (€)
    - **Pricing Tier Button Behavior**:
      - **Free Tier Get Started Button**: Clicking this button redirects user to sign up dialog. After successful registration, free tier users are redirected to dashboard page.
      - **Paid Tier Subscribe Now Buttons**: Clicking these buttons redirects user to sign up dialog. After successful registration, paid tier users are redirected to Stripe checkout. After completing Stripe setup, users are redirected to dashboard page.
  - **Testimonials Section**:
    - Customer testimonials and success stories
  - **Email Signup Form**:
    - Newsletter subscription or early access registration
- **Navigation Design**:
  - Navigation styled in the main section (no traditional sidebar)
  - Clean, modern navigation interface
- **Dialog Behavior**:
  - Dialog can be closed by clicking cancel button
  - Dialog can be closed by clicking anywhere outside the dialog
- **Responsive Design**: Fully responsive layout optimized for desktop and mobile devices, inspired by design aesthetics similar to nfinitepaper.com
- **Styling**: Consistent with existing application styles and design system
- **Performance Optimization**: Lazy loading applied to landing page sections and components
\n### 2.27 User Authentication System
- **Functionality**: Secure user authentication and authorization\n- **Features**:
  - User registration with email and password
  - User login with email and password
  - **Password reset functionality with link on login dialog**
  - Session management\n  - JWT token-based authentication
  - **Post-Registration Redirect**: After successful registration, users are redirected based on selected pricing tier:\n    - Free tier users: Redirected to dashboard page
    - Paid tier users: Redirected to Stripe checkout, then to dashboard page after completing payment
- **Login Dialog Password Reset Link**:
  - **Location**: Positioned under the Don't have an account? Sign up link
  - **Text**: Forgot your password? Reset it
  - **Behavior**: Clicking this link opens password reset dialog or redirects to password reset page
- **Endpoints**:
  - POST /auth/register: User registration
  - POST /auth/login: User login\n  - POST /auth/logout: User logout
  - POST /auth/reset-password: Password reset request
  - POST /auth/confirm-reset: Confirm password reset
\n### 2.28 Team Management System
- **Functionality**: Team collaboration with role-based access control
- **Roles**:
  - **Admin**: Full team management permissions
    - Invite new members to team
    - Remove members from team
    - Manage team settings
    - Create and manage projects
    - Assign tasks to team members
    - Reconcile user pricing tiers\n    - Access admin panel without errors
    - **View all user data and plan details in Tier Reconciliation section**
  - **Member**: Limited permissions
    - View team settings (read-only)
    - View projects and tasks
    - Update assigned tasks
    - Cannot invite/remove members
    - Cannot modify team settings
    - Cannot reconcile pricing tiers
    - Cannot access admin panel
    - **Cannot view other users' data or plan details**
- **Features**:
  - Team creation\n  - Member invitation via email
  - Member removal by admin
  - Role assignment and management
  - Team settings management (admin only)
  - **Admin Panel Access Control**: When logged-in users with Admin role click the Admin Panel button, they should be granted access without error messages. Proper role verification and access control must be implemented.
  - **Tier Reconciliation Data Visibility**: Only Admin users can view all user data and plan details in the Tier Reconciliation section. Regular users cannot access this information.
- **Endpoints**:
  - POST /teams: Create new team
  - GET /teams/:teamId: Get team details
  - POST /teams/:teamId/invite: Invite member (admin only)
  - DELETE /teams/:teamId/members/:userId: Remove member (admin only)
  - GET /teams/:teamId/members: List team members
  - PUT /teams/:teamId/settings: Update team settings (admin only)\n\n### 2.29 Project Management System
- **Functionality**: Create and manage projects within team context
- **Features**:
  - Create projects within team context
  - Project details (name, description, creation date)
  - Project ownership and access control
  - List all projects for team
- **Permissions**:
  - All team members can view projects
  - Admins can create and manage projects
- **Endpoints**:
  - POST /teams/:teamId/projects: Create new project
  - GET /teams/:teamId/projects: List all projects
  - GET /projects/:projectId: Get project details\n  - PUT /projects/:projectId: Update project (admin only)
  - DELETE /projects/:projectId: Delete project (admin only)
\n### 2.30 Task Management System with Real-time Updates
- **Functionality**: Task creation, assignment, and tracking with real-time synchronization
- **Task Attributes**:
  - **title**: Task title (required)
  - **description**: Task description (optional)
  - **status**: Task status (required)
    - todo: Task not started
    - in progress: Task in progress
    - completed: Task completed
  - **assigned user**: User assigned to task (optional)
  - **created date**: Task creation timestamp
  - **updated date**: Task last update timestamp
- **Features**:
  - Create tasks within projects
  - Assign tasks to team members
  - Update task status
  - Update task details (title, description)
  - Reassign tasks\n  - Real-time task updates using Supabase Realtime
  - Filter tasks by status
  - Filter tasks by assigned user
- **Real-time Synchronization**:
  - Task status changes broadcast in real-time to all team members
  - Task assignments instantly updated across all connected clients
  - Task updates (title, description) immediately synchronized
- **Endpoints**:
  - POST /projects/:projectId/tasks: Create new task
  - GET /projects/:projectId/tasks: List all tasks for project
  - GET /tasks/:taskId: Get task details\n  - PUT /tasks/:taskId: Update task\n  - DELETE /tasks/:taskId: Delete task
  - PUT /tasks/:taskId/status: Update task status
  - PUT /tasks/:taskId/assign: Assign task to user
\n### 2.31 Dashboard Task Analytics
- **Functionality**: Display task completion progress and assigned tasks on dashboard
- **Features**:
  - **Task Completion Progress**:
    - Overall completion percentage for all tasks assigned to current user
    - Visual progress bar showing completion rate
    - Breakdown by status (todo, in progress, completed)
  - **Assigned Tasks Overview**:
    - List of all tasks assigned to current user
    - Task status indicators (colored badges)
    - Quick task status update functionality
    - Filter tasks by status
    - Sort tasks by creation date or due date
- **Real-time Updates**: Task analytics update in real-time as tasks are modified
- **Endpoint**: GET /dashboard/tasks/analytics

### 2.32 Stripe Payment Integration
- **Functionality**: Payment processing for pricing tier subscriptions
- **Features**:
  - Stripe Checkout integration for subscription payments
  - Support for all pricing tiers (Free, Basic, Premium)
  - Subscription management (upgrade, downgrade, cancel)
  - Payment method management\n  - Invoice generation and history
  - Webhook handling for payment events
  - Automatic tier access control based on subscription status
  - **Payment Notifications**: Display notifications indicating payment success or failure
  - **Notification Auto-dismiss**: Notifications automatically disappear after 5 seconds
  - **Payment System Configuration Validation**: Validate Stripe API keys and configuration before processing payments
  - **Error Handling**: Display clear error messages when payment system is not properly configured
- **Payment Flow**:
  1. User selects pricing tier from landing page (Free tier Get Started button or Paid tier Subscribe Now buttons)
  2. User is redirected to sign up dialog
  3. User completes registration\n  4. **Free Tier Flow**: User is redirected directly to dashboard page
  5. **Paid Tier Flow**: \n     - Validate payment system configuration (Stripe API keys present and valid)
     - User is redirected to Stripe Checkout
     - User completes payment
     - Webhook confirms payment\n     - Display success/failure notification (auto-dismiss after 5 seconds)
     - User tier automatically updated\n     - User is redirected to dashboard page
     - Grant access to tier-specific features
- **Configuration Error Handling**:
  - If Stripe API keys are missing or invalid, display error: Payment system not configured. Please contact support.
  - Prevent payment flow initiation when configuration is invalid
  - Log configuration errors for admin review
- **Endpoints**:
  - POST /billing/checkout: Create Stripe Checkout session
  - POST /billing/portal: Create Stripe customer portal session
  - POST /billing/webhook: Handle Stripe webhook events
  - GET /billing/subscription: Get current subscription details
  - POST /billing/cancel: Cancel subscription
  - GET /billing/config/status: Check payment system configuration status

### 2.33 Webhook Registration and Management
- **Functionality**: Webhooks as delivery mechanism for computed facts, not triggers
- **Core Principle**: Webhooks are side-effects of insight state changes, never as inputs
- **Design Goals (Non-Negotiable)**:
  - Purely derived (never raw)\n  - Deterministic (same input → same payload)
  - Self-verifying (hash + config)
  - Window-scoped\n  - Side-effect safe
- **Canonical Webhook Envelope**:
```json
{
  \"id\": \"whk_01HZX8F7W9M3Y7T4Q2A6B9\",
  \"type\": \"alert_triggered\",
  \"sellerId\": \"sel_8f92d0c3\",
  \"emittedAt\": 1737225600000,
  \"sequence\": 412,
  \"timeWindow\": {
    \"start\": 1737222000000,
    \"end\": 1737225600000,
    \"windowSizeMs\": 3600000
  },
  \"payload\": {},
  \"dataSufficiency\": {
    \"status\": \"sufficient\",
    \"requiredPoints\": 120,
    \"actualPoints\": 147
  },
  \"signalQuality\": {
    \"score\": 0.91,
    \"flags\": []\n  },
  \"configVersion\": \"cfg_2024_11_03_0012\",
  \"reproducibilityHash\": \"sha256:9d3a7c1e8f…\",
  \"signature\": \"hmac-sha256:ab91e5...\"
}
```
- **Why This Preserves Determinism**:
  - sequence is monotonic per seller
  - emittedAt is derived from window end\n  - payload contains only computed outputs
  - reproducibilityHash lets receivers verify recomputation
  - signature is computed over a canonical JSON serialization
- **Safe Event Types**:
  - anomaly_detected: Anomaly detected
  - alert_triggered: Alert triggered
  - prediction_updated: Prediction updated
  - insight_state_changed: Insight state changed\n  - weekly_report_ready: Weekly report ready
  - pricing_tier_changed: Pricing tier changed
- **Event-Specific Payloads**:
  - **alert_triggered**: \n```json
{
  \"alertLevel\": \"warning\",
  \"alertType\": \"spike_detected\",
  \"anomalyScore\": 0.87,
  \"threshold\": 0.75,
  \"attribution\": {
    \"fft\": 0.41,
    \"hfd\": 0.29,
    \"trend\": 0.17,
    \"smoothedDeviation\": 0.13
  },
  \"healthImpact\": -12\n}
```
  - **prediction_updated**: 
```json
{
  \"horizon\": 24,
  \"unit\": \"hour\",
  \"predictions\": [120, 118, 121, 130],
  \"confidenceBands\": {\n    \"lower\": [100, 99, 102, 110],
    \"upper\": [140, 137, 142, 150]
  }
}
```\n  - **insight_state_changed**: 
```json
{
  \"insightId\": \"ins_01HZV7R8\",
  \"previousState\": \"generated\",
  \"newState\": \"confirmed\",
  \"reason\": \"subsequent_data_confirmed\"\n}
```
- **Webhook Payload Requirements**:
  All webhook payloads must include:
  - reproducibilityHash: Reproducibility hash\n  - configVersion: Configuration version
  - timeWindow: Time window
  - dataSufficiency: Data sufficiency\n  - signalQuality: Signal quality
- **Guardrails**:
  - **Async + Best-Effort Delivery**: Webhook delivery is asynchronous with best-effort strategy
  - **Retry with Backoff**: Retry with backoff strategy on delivery failure
  - **Dead Letter Queue**: Persistently failed webhooks enter dead letter queue
  - **Delivery Failure Does Not Affect Analytics**: Webhook delivery failure never affects analytics computation
  - **No Triggering Recomputation**: Webhooks cannot trigger recomputation, only observe state transitions
  - **No Emission from DSP Loop**: Webhooks never emitted from inside DSP loop
  - **Deterministic Ordering**: If two insights occur in same window, ordering must be defined (timestamp + type priority)
- **Hard Webhook Invariants**:
  - No raw timestamps below window granularity
  - No per-event identifiers
  - No triggering recomputation
  - Always reproducible
  - Always auditable
- **Endpoints**:
  - POST /webhooks: Register new webhook
  - GET /webhooks: List all registered webhooks
  - GET /webhooks/:id: Get webhook details
  - PUT /webhooks/:id: Update webhook configuration
  - DELETE /webhooks/:id: Delete webhook
  - GET /webhooks/:id/deliveries: View webhook delivery history
  - POST /webhooks/:id/test: Test webhook delivery

### 2.34 Funnel Analysis\n- **Functionality**: Funnels are aggregations of event types\n- **Core Principles**:
  - Funnels are deterministic
  - Funnels are reproducible
  - Funnels are explainable
- **Design Decisions**:
  - **Declarative**: Funnels must be declarative\n  - **Config-Backed**: Funnel definitions stored in centralized config
  - **Window-Bound**: Funnels must be bound to time windows
- **Funnel DSL (Config-Native)**:
```yaml
funnels:
  checkout_conversion_v1:
    version: 1
    description: View → Checkout → Payment
    window:\n      sizeMs: 86400000
      slideMs: 3600000
    steps:
      - id: view
        eventType: VIEW
        minCount: 100
      - id: checkout
        eventType: CHECKOUT_STARTED
        minRatioFrom: view
        minRatio: 0.05
      - id: payment\n        eventType: PAYMENT_SUCCEEDED
        minRatioFrom: checkout
        minRatio: 0.6
    dropoffAttribution:
      enabled: true
    sufficiency:
      minTotalEvents: 300
    output:
      includeConfidence: true
      includeAttribution: true
```
- **Funnel Evaluation Rules (Deterministic)**:
  - Steps evaluated strictly in order
  - Ratios computed from same time window
  - No cross-window joins
  - No user-level stitching
  - No inferred paths
- **API Shape**:
  - **Predefined Funnel Templates**: Predefined funnel templates per tier
  - **Seller-Selectable but Constrained Step Set**: Sellers can select steps but are constrained\n  - **Centralized Config**:\n    - Minimum data requirements
    - Step ordering rules
    - Timeouts between steps
- **Constraints**:
  - **Steps Must Be Temporally Monotonic**: Steps must be in chronological order
  - **Funnel Window Must Align with Ring Buffer Window**: Funnel window must align with ring buffer window
  - **Funnel Output Always Includes**:
    - Dropoff attribution: Dropoff reason analysis per step
    - Per-step sufficiency: Data sufficiency metrics per step
    - Confidence messaging: Confidence messages based on data quality
- **Endpoints**:
  - GET /funnels/templates: List predefined funnel templates
  - POST /funnels: Create custom funnel (constrained)\n  - GET /funnels/:id: Get funnel details\n  - GET /funnels/:id/analysis: Execute funnel analysis
  - GET /metrics/:seller/funnels: Get funnel analysis results for seller
- **Response Format**:
  - steps: Array of funnel steps
  - conversionRates: Conversion rate per step
  - dropOffAttribution: Dropoff attribution analysis
  - dataSufficiency: Data sufficiency per step
  - confidenceMessage: Confidence message\n  - timeWindow: Time window definition
  - reproducibilityHash: Reproducibility hash
  - configVersion: Configuration version
  - signalQuality: Signal quality assessment

### 2.35 Webhook Volume Mapping to Pricing Tiers
- **Conceptual Model**: Webhook usage treated as downstream compute amplification
- **Metrics Tracked** (per seller, per month):
  - totalDeliveries: Total webhook deliveries
  - successfulDeliveries: Successful webhook deliveries
  - failedDeliveries: Failed webhook deliveries
  - uniqueEventTypes: Number of unique event types
  - peakHourlyRate: Peak hourly delivery rate
- **Tier Mapping** (data-driven, stored in centralized config):
  - Free Tier: 0 monthly webhook deliveries, no webhooks
  - Basic Tier: ≤ 5,000 monthly webhook deliveries, alert_triggered only
  - Premium Tier: ≤ 50,000 monthly webhook deliveries, alerts + predictions
- **Enforcement Model**:
  - Webhooks beyond tier limit are dropped deterministically
  - Drop reason logged and surfaced in dashboard
  - Drops never affect analytics\n  - Drops visible as usage signals
- **Pricing Endpoint Exposure**:
```json
{
  \"tier\": \"premium\",
  \"webhookUsage\": {
    \"used\": 38112,
    \"limit\": 50000,
    \"remaining\": 11888
  }
}
```
\n### 2.36 Admin Tier Reconciliation System
- **Functionality**: Admin-triggered tier recalculation based on current usage metrics and pricing policy
- **Core Principle**: Tier is a derived state, not a manual attribute
- **Mental Model**:
```\nusage metrics\n+ pricing policy
+ grace rules
----------------
= effective tier
```
- **Admin Action**:
  - **Button Label**: Recalculate Tier or Apply Pricing Policy
  - **Confirmation Text**: This will recompute the user's tier based on current usage and pricing rules. No data will be modified.
  - **Behavior**: Forces tier computation immediately instead of waiting for scheduled job
- **Tier State Model**:
```typescript
interface TierState {
  effectiveTier: \"free\" | \"basic\" | \"premium\" | \"business\"
  pricingVersion: string
  computedAt: number
  source: \"scheduled\" | \"admin_reconcile\"
}\n```
- **Computation Process**:
  1. Load current usage metrics (webhooks, API calls, alerts, etc.)
  2. Load current pricing config
  3. Compute effective tier based on usage and policy
  4. Persist:\n     - effectiveTier
     - tierComputedAt
     - pricingVersion
     - source (admin_reconcile)
  5. Emit event: tier.reconciled
- **Admin Panel Visibility**:
  - **Admin-Only Access**: Only users with Admin role can view the Tier Reconciliation section
  - **All User Data Display**: Admin users can view all user data and plan details in the Tier Reconciliation section
  - **Regular User Restriction**: Regular users (non-admin) cannot access or view any user data or plan details in the Tier Reconciliation section\n  - Current tier\n  - Usage vs limits
  - Pricing rule that applied
  - Last reconciliation source
  - Next scheduled reconciliation\n- **Entitlements System** (Separate from Tier Reconciliation):\n```typescript
interface Entitlement {
  type: \"webhook_bonus\" | \"prediction_bonus\"
  amount: number
  expiresAt?: number
  reason: string
}\n```
  - Admin panel allows:\n    - Grant entitlement\n    - Set expiration\n    - Attach reason
  - Entitlements are explicit exceptions, never change tier directly
- **Endpoints**:
  - POST /admin/users/:id/reconcile-tier: Trigger tier reconciliation (admin only)
  - GET /admin/users/:id/tier-state: Get current tier state and computation details (admin only)
  - POST /admin/users/:id/entitlements: Grant entitlement (admin only)
  - GET /admin/users/:id/entitlements: List user entitlements (admin only)
  - DELETE /admin/entitlements/:id: Revoke entitlement (admin only)
  - **GET /admin/users/all-tier-data: Get all user data and plan details (admin only)**
- **Audit Trail**:
  - All tier reconciliations logged with timestamp, source, and resulting tier
  - All entitlement grants/revocations logged with reason and admin user
- **System Invariants**:
  - Tier is always derived, never manually assigned
  - Admins trigger computation, not assignment
  - Entitlements are explicit and auditable
  - Pricing policy is single source of truth for tier determination
  - **Tier reconciliation data is admin-only, never exposed to regular users**

### 2.37 Admin Panel Pricing Plan Management
- **Functionality**: Admin panel interface for users to manage their subscription plans
- **Features**:
  - **Pricing Plan Display**: Display all available pricing tiers (Free, Basic, Premium) with detailed feature comparison
  - **Current Plan Indicator**: Clearly indicate user's current active pricing tier
  - **Upgrade/Downgrade Options**: Allow users to upgrade or downgrade their subscription plan
  - **Plan Selection Interface**: Interactive interface for selecting desired pricing tier
  - **Subscription Cancellation**: Cancel subscription button to allow users to cancel their active subscription
  - **Plan Change Confirmation**: Confirmation dialog before processing plan changes
  - **Immediate Plan Changes**: Plan changes take effect immediately upon successful payment processing
- **User Interface Components**:
  - Pricing tier cards with feature lists and pricing information
  - Current plan badge or indicator
  - Upgrade/Downgrade action buttons
  - Cancel subscription button (visible only for active paid subscriptions)
  - Confirmation dialogs for plan changes and cancellations
- **Business Logic**:
  - Free tier users can upgrade to Basic or Premium\n  - Basic tier users can upgrade to Premium or downgrade to Free
  - Premium tier users can downgrade to Basic or Free
  - Cancellation returns user to Free tier at end of current billing period
  - Immediate access to new tier features upon successful upgrade
  - Graceful feature access removal upon downgrade
- **Endpoints**:
  - GET /admin/pricing/plans: Get all available pricing plans
  - POST /admin/subscription/change: Change subscription plan (upgrade/downgrade)
  - POST /admin/subscription/cancel: Cancel active subscription
  - GET /admin/subscription/current: Get current subscription details
\n### 2.38 Sellers Page Data Management
- **Functionality**: Display and manage seller data on sellers page
- **Data Source**: Display only real seller data from database, no placeholder or mock data
- **Features**:
  - List all sellers with real data
  - Display seller metrics and analytics
  - Filter and search sellers
  - Seller detail view\n- **Data Requirements**:
  - Remove all placeholder stores and mock data
  - Display empty state when no sellers exist
  - Load seller data dynamically from database
  - Handle loading and error states appropriately
- **Empty State Handling**:
  - Display informative empty state message when no sellers exist
  - Provide call-to-action to add first seller
  - Clear visual indication that page is ready but contains no data
\n## 3. Technical Architecture

### 3.1 Data Processing\n- Pre-allocated fixed-size contiguous ring buffers for real-time data storage
- Circular access using index mod window size\n- Zero per-event reallocation, no per-event object churn
- Streaming analytics processing\n- DSP algorithm integration (FIR, FFT, HFD)\n- Batch processing support for high-throughput scenarios
- Deterministic computation pipeline with fixed random seeds and consistent ordering
- **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events
\n### 3.2 Caching Strategy with Temporal Locality
- Probabilistic caching mechanism\n- **lastComputedAt** timestamp tracking
- Probabilistic refresh only on query\n- Dynamic TTL adjustment (defined in centralized config)
- Hot/cold data differentiation
- Short-term cache layer for frequently accessed computations
\n### 3.3 API Design
- RESTful API architecture
- Real-time event ingestion
- Batch ingestion endpoints
- On-demand metrics queries
- Type-safe implementation (no any casts)
- Dedicated sell endpoints for anomaly and prediction results
- Decision hook integration points
- One-click export endpoints
- Auditable configuration endpoints
- System health endpoints
- User authentication endpoints
- Team management endpoints
- Project management endpoints
- Task management endpoints
- Billing and payment endpoints
- Webhook management endpoints
- Funnel analysis endpoints
- Admin tier reconciliation endpoints
- Admin pricing plan management endpoints
- **Admin-only endpoints for viewing all user tier data**

### 3.4 Dashboard Components
- Mode toggle functionality (light/dark theme)
- Time series charts with proper timestamp handling:\n  - Internal numeric timestamps
  - Formatted display in tooltips and axis ticks
  - Clear visual separation between historical and predicted data
  - Non-overlapping labels for multi-day data spans
- Confidence band visualization (± bands around predictions)
- Real-time alert notifications
- Event log with pagination/infinite scroll
- **Time Window Display Panel**: Display start time, end time, window size for current analysis
- **Data Sufficiency Metrics**: Visual indicators (progress bars, status badges) showing data completeness
- **Rate Limit and Backpressure Dashboard**: Display current rate limit status, remaining quota, backpressure metrics, queue depth visualization
- **Confidence and Sufficiency-Aware Messaging**: Contextual messages explaining result reliability
- **Embeddable Component Support**: Integration for embeddable widgets\n- **Insight Lifecycle Visualization**: Display insight status with visual indicators and state transition history
- **Configuration Version Display**: Display current configuration version in use
- **Signal Quality Indicators**: Display edge case flags and degraded pattern warnings
- **System Health Panel**: Separate panel for systemic anomaly monitoring
- **Task Completion Progress Widget**: Display overall task completion percentage for current user
- **Assigned Tasks Widget**: Display list of tasks assigned to current user with status indicators and quick update functionality
- **Navigation in Main Section**: Navigation styled in the main section (no traditional sidebar)
- **Admin Tier Reconciliation Panel**: Display tier state, usage metrics, reconciliation controls (admin only, shows all user data)
- **Admin Pricing Plan Management Panel**: Display pricing plans, current plan, upgrade/downgrade options, cancel subscription button (admin panel)
- **Lazy Loading**: All dashboard components implement lazy loading for improved performance

### 3.5 Real-time Integration
- Supabase Realtime for real-time data streaming
- WebSocket connections for dashboard updates
- AnomalyAlert component integration
- Real-time task updates and synchronization
- Real-time team collaboration features
\n### 3.6 Reporting and Pricing System
- Automated weekly report generation engine
- Alert-driven pricing tier calculation logic (data-driven, not logic-based)
- Report delivery system (email, notifications, API)
- Pricing tier API endpoints
- One-click export functionality integration
- Configuration snapshot storage per report
- **Tier Reconciliation System**: Admin-triggered tier recalculation based on usage and policy
- **Pricing Plan Management**: User-facing interface for plan upgrades, downgrades, and cancellations
\n### 3.7 Deterministic Reproducibility System
- Fixed random seed management
- Deterministic ordering and computation order
- Reproducibility hash generation for verification
- Input/output logging for audit trail
- **System Invariant**: Deterministic guarantee - same inputs always produce same outputs
\n### 3.8 Centralized Configuration System
- **Centralized Config Storage**: Single source of truth for all system parameters
- **Configuration Parameters**:
  - Window sizes (ring buffer size, analysis window size)
  - Thresholds (anomaly score threshold, confidence cutoffs, signal quality thresholds)
  - TTLs (hot seller TTL, cold seller TTL, cache TTL)
  - Tier limits (alert frequency limits per tier, feature access per tier)
  - Confidence cutoffs (minimum confidence for predictions, minimum data sufficiency)
  - Alert levels (defined by config table, not conditional statements)
  - Sampling rates (high/medium/low activity sampling rates)
  - Embed rate limits per tier
  - Retention policies per tier
  - Edge case detection thresholds
  - Funnel template definitions
  - Webhook retry policies
  - Pricing policy rules for tier determination
- **Dynamic Expressions**: Use dynamic expressions where applicable, avoid magic numbers
- **Data-Driven Design**: Alert levels, tiers, thresholds all defined by config data, not hardcoded logic
- **Version Control**: All configuration changes versioned with timestamps
- **Audit Trail**: Full audit log of configuration changes\n\n### 3.9 Modular and Composable Architecture
- **Composability Focus**: Design for composability, not reuse
- **Modular Components**: Separate modules for DSP, caching, alerts, reports, export, embed, config management, insight lifecycle, edge case detection, systemic anomaly detection, authentication, team management, project management, task management, billing, webhook management, funnel analysis, tier reconciliation, pricing plan management
- **Clean Refactoring**: Eliminate redundancy, centralize common logic
- **Zero Magic Numbers**: All constants defined in centralized config
\n### 3.10 Data Minimization and Privacy Architecture
- **Hard Invariant**: No names, emails, addresses in analytics path
- **Seller IDs**: Always opaque/proxy keys, never direct identifiers
- **Event Payloads**: Stripped to behavioral signals only, no PII
- **Aggregation-First**: All analytics operate on aggregated data\n- **Data Minimization Enforcement**: Automated checks to prevent PII leakage
\n### 3.11 Retention Policy System
- **Tier-Based Retention**: Retention periods defined per pricing tier in centralized config
- **Explicit Expiry Windows**: Clear expiration timestamps for all data
- **Automatic Decay**: Automatic data deletion based on retention policies
- **Retention Tiers**:
  - Free Tier: 30 days retention
  - Basic Tier: 60 days retention
  - Premium Tier: 90 days retention
- **Policy Enforcement**: Retention as policy, not config - enforced at system level
\n### 3.12 System Invariants (Codified)
- **Deterministic Guarantee**: Same inputs always produce same outputs\n- **No Silent Recomputation**: All recomputation logged and audited
- **No Hidden Thresholds**: All thresholds defined in centralized config
- **All Alerts Reference Data Sufficiency**: Every alert must include data sufficiency status
- **Data Minimization**: No PII in analytics path, seller IDs always opaque, event payloads stripped to behavioral signals only
- **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events
- **Edge Cases as Signals**: Edge cases treated as low-confidence signal mechanisms, not errors
- **Systemic Anomaly Separation**: System health issues flagged separately from seller analytics
- **Webhooks as Side-Effects**: Webhooks are side-effects of insight state changes, never as inputs
- **Funnel Determinism**: Funnel analysis must be deterministic and reproducible
- **Tier as Derived State**: Tier is always derived from usage and policy, never manually assigned
- **Admin-Only Tier Data Access**: Tier reconciliation data and all user plan details are accessible only to Admin users

### 3.13 Encryption Strategy
- **At Rest Encryption**:
  - Event storage: Encrypted\n  - Configuration tables: Encrypted
  - Reports: Encrypted
  - Usage logs: Encrypted
  - User credentials: Encrypted
  - Team data: Encrypted
  - Project data: Encrypted
  - Task data: Encrypted
  - Webhook configurations: Encrypted
  - Tier state and entitlements: Encrypted
- **In Transit Encryption**:
  - API traffic: TLS everywhere, no exceptions
  - Widget embeds: TLS required\n  - Webhooks: TLS required
  - Real-time connections: TLS required
- **Secrets and Key Management**:
  - API keys: Encrypted, rotatable, scoped, revocable
  - Webhook secrets: Encrypted, rotatable, scoped, revocable
  - Embed tokens: Encrypted, rotatable, scoped, revocable
  - Stripe API keys: Encrypted, rotatable\n- **Not Encrypted**:
  - Derived analytics: Not encrypted (aggregated, non-sensitive)
  - Aggregated metrics: Not encrypted (aggregated, non-sensitive)
  - Scores: Not encrypted (aggregated, non-sensitive)
- **Key Rotation**: Automatic key rotation policies defined in centralized config
- **Access Control**: Role-based access control for encrypted data

### 3.14 Frontend Architecture
- **Tech Stack**: React + Tailwind CSS + Shadcn\n- **Component Structure**: Modular, reusable components
- **Responsive Design**: Mobile-first approach with desktop breakpoints
- **Dialog Component**: HTML dialog element for call-to-action interactions
  - **Dialog Close Behavior**: Dialog can be closed by clicking cancel button or clicking outside dialog
- **Navigation Design**: Navigation styled in the main section (no traditional sidebar)
- **Style Consistency**: Maintain existing application design system and style patterns
- **Accessibility**: WCAG compliant, keyboard navigation support
- **Performance**: Optimized loading, lazy loading for images and components
- **Design Inspiration**: Modern, clean aesthetics inspired by design patterns similar to nfinitepaper.com
- **Lazy Loading Implementation**: Apply lazy loading to all pages and major components
- **Page Transitions**: Smooth page transitions with subtle animations using motion library
- **Animation Library**: Use motion library (Framer Motion) for page transitions and component animations
- **Animation Characteristics**:
  - Subtle and smooth transitions
  - Non-intrusive animations that enhance user experience
  - Consistent animation timing and easing across all pages
  - Fade-in and slide-in effects for page transitions
  - Optimized animation performance to avoid jank
\n### 3.15 Authentication and Authorization Architecture
- **Authentication Method**: JWT token-based authentication
- **Session Management**: Secure session handling with token refresh
- **Role-Based Access Control (RBAC)**:
  - Admin role: Full permissions including tier reconciliation, pricing plan management, admin panel access, and viewing all user tier data
  - Member role: Limited permissions\n- **Permission Enforcement**: Server-side permission checks for all protected endpoints
- **Token Security**: HTTP-only cookies for token storage, CSRF protection
- **Post-Registration Flow**: \n  - Free tier users: Redirect to dashboard page after successful registration
  - Paid tier users: Redirect to Stripe checkout after successful registration, then redirect to dashboard page after completing payment
- **Admin Panel Access Control**: Proper role verification to ensure Admin users can access admin panel without errors
- **Password Reset Flow**:
  - User clicks Forgot your password? Reset it link on login dialog
  - User is redirected to password reset page or dialog
  - User enters email address\n  - System sends password reset email with secure token
  - User clicks link in email and sets new password
  - User is redirected to login page\n\n### 3.16 Team Collaboration Architecture
- **Multi-Tenancy**: Team-based data isolation
- **Real-time Collaboration**: Supabase Realtime for real-time team updates
- **Access Control**: Team-level and project-level access control
- **Invitation System**: Email-based member invitation with secure tokens
- **Data Visibility Control**: Admin users can view all user data and plan details; regular users cannot
\n### 3.17 Payment Processing Architecture
- **Payment Gateway**: Stripe integration\n- **Subscription Management**: Stripe Subscriptions API
- **Webhook Handling**: Secure webhook handling with signature verification
- **Tier Access Control**: Automatic feature access based on subscription tier
- **Payment Security**: PCI DSS compliant payment processing (handled by Stripe)
- **Payment Notifications**: Display success/failure notifications with 5-second auto-dismiss
- **Configuration Validation**: Validate Stripe API keys before processing payments
- **Error Handling**: Clear error messages when payment system is not configured
- **Plan Change Processing**: Handle subscription upgrades, downgrades, and cancellations through Stripe API
- **Landing Page Payment Flow Integration**: \n  - Free tier Get Started button redirects to sign up dialog, then to dashboard
  - Paid tier Subscribe Now buttons redirect to sign up dialog, then to Stripe checkout, then to dashboard after payment completion
\n### 3.18 Webhook Architecture
- **Asynchronous Delivery**: Webhook delivery is asynchronous, does not block main analytics flow
- **Retry Mechanism**: Retry strategy with exponential backoff
- **Dead Letter Queue**: Persistently failed webhooks enter dead letter queue for manual review
- **Delivery Logging**: Full webhook delivery history and status tracking
- **Signature Verification**: All webhook payloads verified with HMAC signatures
- **Rate Limiting**: Rate limits per webhook endpoint to prevent abuse
\n### 3.19 Funnel Analysis Architecture
- **Declarative Definition**: Funnels declaratively defined in centralized config
- **Template System**: Predefined funnel templates per tier
- **Step Constraints**: Steps must be temporally monotonic, windows must align
- **Sufficiency Checks**: Data sufficiency validation per step
- **Dropoff Attribution**: Detailed dropoff reason analysis per step
- **Deterministic Computation**: Funnel analysis must be deterministic and reproducible
\n### 3.20 Tier Reconciliation Architecture
- **Derived State Model**: Tier is always computed from usage metrics and pricing policy
- **Computation Triggers**:
  - Scheduled jobs (periodic automatic reconciliation)
  - Admin-triggered reconciliation (on-demand)
- **Usage Metrics Collection**:
  - Webhook deliveries
  - API calls
  - Alert frequency
  - Prediction requests
  - Storage usage
- **Pricing Policy Engine**:
  - Load current pricing config
  - Apply grace rules\n  - Compute effective tier\n- **State Persistence**:
  - effectiveTier\n  - pricingVersion
  - computedAt
  - source (scheduled or admin_reconcile)
- **Entitlements System**:
  - Separate from tier computation
  - Explicit exceptions with expiration and reason
  - Admin-granted and auditable
- **Audit Trail**: Full logging of all tier changes and reconciliations
- **Access Control**: Tier reconciliation data and all user plan details accessible only to Admin users

### 3.21 Performance Optimization Architecture
- **Lazy Loading Strategy**:
  - Code splitting for all major pages and components
  - Dynamic imports for route-based code splitting
  - Lazy loading of images and media assets
  - Deferred loading of non-critical components
- **Page Transition System**:
  - Motion library (Framer Motion) integration for smooth transitions
  - Consistent animation timing across all pages
  - Fade-in and slide-in effects for page transitions
  - Optimized animation performance to prevent layout shifts
- **Animation Performance**:
  - GPU-accelerated animations using transform and opacity
  - RequestAnimationFrame for smooth 60fps animations
  - Avoid animating layout-triggering properties
  - Preload critical animation assets
- **Loading States**:
  - Skeleton screens for lazy-loaded content
  - Progressive loading indicators
  - Smooth transitions between loading and loaded states
\n### 3.22 Sellers Page Architecture
- **Data Loading**: Dynamic data loading from database, no static or placeholder data
- **Empty State Handling**: Graceful empty state display when no sellers exist
- **Real-time Updates**: Real-time seller data updates using Supabase Realtime
- **Performance**: Optimized queries and pagination for large seller datasets
- **Error Handling**: Comprehensive error handling for data loading failures
\n## 4. System Characteristics
- Lightweight and elegant design
- High performance and scalability
- Real-time processing capabilities
- Intelligent caching optimization with temporal locality
- Adaptive resource management
- Comprehensive analytics and insights
- Type-safe implementation
- Enhanced user experience with real-time updates
- Deterministic and reproducible anomaly detection
- Clear time window definitions and data sufficiency metrics
- Rate limit and backpressure visibility
- Extensible decision hooks for custom business logic
- Automated weekly health reports with insight summaries
- Dynamic alert-driven pricing tiers with fixed defaults
- Dedicated endpoints for selling anomaly and prediction results
- One-click export functionality (PDF/Email)\n- Embeddable components for external integration with soft guardrails
- Comprehensive confidence and sufficiency-aware messaging
- Data-driven configuration system (no magic numbers, no hardcoded logic)
- Modular and composable architecture
- Efficient data movement with pre-allocated ring buffers and zero per-event churn
- Single primary trigger for alerts with contextual information
- Auditable configuration management with version control and snapshots
- Formalized insight lifecycle with state management
- Data minimization and privacy as hard invariants
- Aggregation-first analytics approach
- Tier-based retention policies with automatic decay
- Codified system invariants for consistency and reliability
- Edge case detection as signal quality indicators
- Systemic anomaly detection separate from seller analytics
- Comprehensive encryption strategy (at rest, in transit, secrets and keys)
- Modern responsive frontend with clean design and intuitive user experience
- Secure user authentication and authorization
- Role-based team collaboration with Admin/Member roles
- Real-time task management and synchronization
- Dashboard task analytics with completion progress and assigned tasks overview
- Integrated Stripe payment processing with configuration validation and error handling
- Webhook registration and management as side-effects of insight state changes
- Declarative, deterministic, reproducible funnel analysis
- Navigation design in main section (no traditional sidebar)
- Landing page design inspired by modern aesthetics similar to nfinitepaper.com
- Webhook volume mapping directly into pricing tiers for transparent monetization
- Admin tier reconciliation system with derived state model and entitlements
- User-facing pricing plan management with upgrade/downgrade/cancel capabilities
- Clean sellers page with real data only, no placeholder content
- Lazy loading implementation for all pages and components
- Smooth page transitions with subtle animations using motion library
- Optimized animation performance for 60fps user experience
- Seamless landing page to registration to payment flow integration
- Proper admin panel access control without error messages for Admin users
- **Admin-only access to tier reconciliation data and all user plan details**
- **Password reset functionality with link on login dialog**
\n## 5. System Charter

### 5.1 Purpose and Scope
This System Charter defines the fundamental principles, invariants, and governance rules that govern the Lush Analytics platform. It serves as the authoritative reference for all system design, implementation, and operational decisions. All system components, modules, and behaviors must conform to the principles and invariants articulated herein.

### 5.2 Core Principles

#### 5.2.1 Determinism and Reproducibility
The system guarantees deterministic behavior: same inputs must always produce same outputs. This principle ensures auditability, debuggability, and trust. All computations use fixed random seeds, deterministic ordering, and consistent ordering. Reproducibility hashes are generated for all analysis outputs to enable verification.

#### 5.2.2 Data Minimization and Privacy by Design
The system enforces strict data minimization as a hard invariant. No personally identifiable information (PII) such as names, emails, or addresses may enter the analytics path. Seller identifiers are always opaque proxy keys. Event payloads are stripped to behavioral signals only. All analytics operate on aggregated data, never on raw individual events. This principle is non-negotiable and enforced at the architectural level.

#### 5.2.3 Transparency and Explainability
The system provides full transparency into its decision-making processes. All analysis outputs include clear time window definitions, data sufficiency metrics, confidence messaging, signal quality assessments, and configuration version references. Users must understand what the system knows, what it does not know, and how confident it is in its outputs.\n
#### 5.2.4 Configuration as Single Source of Truth
All system parameters, thresholds, and behaviors are defined in the centralized configuration system. No magic numbers or hardcoded logic are permitted. Configuration changes are versioned, timestamped, and auditable. This principle ensures consistency, maintainability, and governance.\n
#### 5.2.5 Composability Over Reusability
The system prioritizes composability in its architecture. Modules are designed to be composed and extended, not merely reused. This principle enables flexibility, adaptability, and long-term maintainability.

#### 5.2.6 Edge Cases as Signals, Not Errors
The system treats edge cases (constant zero values, perfect periodicity, impossible regularity) as low-confidence signal mechanisms, not errors or bugs. Edge cases are presented as signal quality indicators, providing valuable information about data quality and behavioral patterns.

#### 5.2.7 Separation of Concerns: Seller Analytics vs System Health
Seller analytics and systemic anomalies are strictly separated. System health issues (pattern changes, timestamp drift, ingestion bursts) are flagged independently and do not pollute seller-level analytics. This separation ensures clarity and prevents false positives in seller-facing outputs.

#### 5.2.8 Webhooks as Side-Effects\nWebhooks are side-effects of insight state changes, never as inputs. Webhooks only observe computed facts, never trigger recomputation. This principle maintains determinism and auditability.\n
#### 5.2.9 Funnel Determinism
Funnel analysis must be deterministic and reproducible. Funnels are declaratively defined in centralized config, steps must be temporally monotonic, and windows must align. This principle ensures reliability and auditability of funnel analysis.

#### 5.2.10 Tier as Derived State
Pricing tier is a derived state, not a manual attribute. Tier is always computed from usage metrics, pricing policy, and grace rules. Admins trigger computation, not assignment. This principle ensures pricing honesty, explicit exceptions, and clean audits.

#### 5.2.11 Admin-Only Access to Sensitive Data
Tier reconciliation data and all user plan details are accessible only to Admin users. Regular users cannot view or access this information. This principle ensures data privacy and proper access control.

### 5.3 System Invariants

The following invariants are codified and enforced at the system level. Violations of these invariants constitute system failures and must be prevented by design:\n
1. **Deterministic Guarantee**: Same inputs always produce same outputs.\n2. **No Silent Recomputation**: All recomputation is logged and audited.
3. **No Hidden Thresholds**: All thresholds are defined in centralized config.
4. **All Alerts Reference Data Sufficiency**: Every alert must include data sufficiency status.
5. **Data Minimization**: No PII in analytics path; seller IDs always opaque; event payloads stripped to behavioral signals only.
6. **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events.
7. **Edge Cases as Signals**: Edge cases are treated as low-confidence signal mechanisms, not errors.
8. **Systemic Anomaly Separation**: System health issues are flagged separately from seller analytics.
9. **Webhooks as Side-Effects**: Webhooks are side-effects of insight state changes, never as inputs.
10. **Funnel Determinism**: Funnel analysis must be deterministic and reproducible.
11. **Tier as Derived State**: Tier is always derived from usage and policy, never manually assigned.
12. **Admin-Only Tier Data Access**: Tier reconciliation data and all user plan details are accessible only to Admin users.

### 5.4 Governance and Change Management

All changes to the System Charter require formal review and approval. Configuration changes are versioned and auditable. System invariants must not be violated under any circumstances. This governance framework ensures stability, trust, and long-term system integrity.

## 6. Public Trust and Safety Statement

### 6.1 Our Commitment to Trust and Safety

Lush Analytics is built on a foundation of trust, transparency, and security. We recognize that our users entrust us with sensitive behavioral data, and we take this responsibility seriously. This Public Trust and Safety Statement articulates our commitments and the measures we have implemented to protect user data and maintain system integrity.

### 6.2 Data Privacy and Minimization

We enforce strict data minimization as a core architectural principle. No personally identifiable information (PII) such as names, emails, or addresses is collected, stored, or processed in the analytics path. Seller identifiers are always opaque proxy keys, ensuring anonymity. Event payloads are stripped to behavioral signals only, and all analytics operate on aggregated data. This approach minimizes privacy risks and ensures compliance with data protection regulations.

### 6.3 Encryption and Data Protection

We employ a comprehensive encryption strategy to protect data at rest and in transit:\n\n- **At Rest**: Event storage, configuration tables, reports, usage logs, user credentials, team data, project data, task data, webhook configurations, and tier state are encrypted using industry-standard encryption algorithms.
- **In Transit**: All API traffic, widget embeds, webhooks, and real-time connections are encrypted using TLS without exception.
- **Secrets and Keys**: API keys, webhook secrets, embed tokens, and Stripe API keys are encrypted, rotatable, scoped, and revocable. Automatic key rotation policies are enforced.

Derived analytics, aggregated metrics, and scores are not encrypted as they are aggregated and non-sensitive by design.

### 6.4 Determinism and Auditability

We guarantee deterministic behavior: same inputs always produce same outputs. This ensures auditability, debuggability, and trust. All computations are logged, and reproducibility hashes are generated for verification. Configuration changes are versioned and auditable, providing a full audit trail.

### 6.5 Transparency and Explainability

We provide full transparency into our decision-making processes. All analysis outputs include clear time window definitions, data sufficiency metrics, confidence messaging, signal quality assessments, and configuration version references. Users always know what the system knows, what it does not know, and how confident it is in its outputs.

### 6.6 Retention and Data Lifecycle

We enforce tier-based retention policies with explicit expiry windows. Data is automatically deleted based on retention policies, ensuring compliance with data protection regulations and minimizing long-term storage risks. Retention periods are clearly communicated and enforced at the system level.

### 6.7 Security Incident Response

We maintain a formal security incident response plan. In the event of a security incident, we will promptly investigate, mitigate, and communicate with affected users. We are committed to continuous improvement and learning from security incidents.\n
### 6.8 Compliance and Certifications

We are committed to compliance with relevant data protection regulations, including GDPR and CCPA. We continuously monitor regulatory developments and adapt our practices accordingly.\n
### 6.9 Contact and Accountability

For security concerns, questions, or incident reports, users can contact our security team at security@lushanalytics.com. We are accountable to our users and committed to maintaining their trust.\n
## 7. Signal Semantics Glossary

This glossary defines the precise meaning of key terms used throughout the system. These definitions are authoritative and must be applied consistently across all system components, documentation, and user-facing interfaces.

### 7.1 Anomaly\n
**Definition**: An anomaly is a statistically significant deviation from expected behavioral patterns, quantified as a probabilistic score in the range [0, 1]. An anomaly score of 0 indicates no deviation; a score of 1 indicates maximum deviation.

**Composition**: Anomaly scores are calculated using a Bayesian/probabilistic combination of:\n- **FFT Peak Contribution**: Periodic spikes detected through Fast Fourier Transform analysis.\n- **HFD Complexity Contribution**: Time series complexity measured via Higuchi Fractal Dimension.
- **Trend Deviation Contribution**: Deviation from smoothed trend line.\n- **Smoothed Deviation Contribution**: Deviation from FIR smoothed baseline.

**Interpretation**: Anomalies represent potential issues such as bot activity, sales spikes, or unusual behavioral patterns. They are signals for investigation, not definitive diagnoses.

**Attribution**: All anomaly outputs include root cause breakdown showing percentage contribution of each component to overall anomaly score.

### 7.2 Confidence

**Definition**: Confidence is a measure of the system's certainty in its outputs, expressed as a qualitative or quantitative metric. Confidence depends on data sufficiency, signal quality, and computational stability.

**Factors Affecting Confidence**:
- **Data Sufficiency**: Sufficient data points are required for reliable analysis. Insufficient data reduces confidence.
- **Signal Quality**: High signal quality (low noise, no degraded patterns) increases confidence. Low signal quality (edge cases, degraded patterns) reduces confidence.
- **Computational Stability**: Deterministic, reproducible computations increase confidence. Non-deterministic or unstable computations reduce confidence.

**Confidence Messaging**: All analysis outputs include confidence-aware messaging explaining result reliability based on data quality and sufficiency.

**Confidence Bands**: Predictions include confidence bands (± intervals) around predicted values, visualizing uncertainty.\n
### 7.3 Sufficiency

**Definition**: Sufficiency is a binary or graded metric indicating whether the system has enough data to produce reliable analysis. Sufficiency is determined by comparing the number of available data points to the minimum data points required for a given analysis.

**Sufficiency Metrics**:
- **Sufficient**: System has enough data to produce reliable analysis.\n- **Insufficient**: System does not have enough data. Analysis may be unreliable or unavailable.
\n**Sufficiency Thresholds**: Minimum data point requirements are defined in centralized config and vary by analysis type (anomaly detection, prediction, health score, etc.).

**Sufficiency Messaging**: All analysis outputs include data sufficiency metrics and messaging explaining whether there is enough data and how many data points are needed vs available.

**System Invariant**: All alerts must reference data sufficiency status. Alerts based on insufficient data must be clearly flagged.\n
### 7.4 Signal Quality

**Definition**: Signal quality is an assessment of the reliability and interpretability of input data. High signal quality indicates clean, consistent, and interpretable data. Low signal quality indicates noisy, inconsistent, or degraded data patterns.

**Signal Quality Indicators**:
- **Degraded Patterns**: Constant zero values, perfect periodicity, impossible regularity. These patterns are flagged as low-confidence signal mechanisms.
- **Edge Case Flags**: Indicators of unusual or boundary case data patterns.\n- **Noise Level**: Assessment of data noise and variability.
\n**Handling**: Signal quality metrics are presented in all analysis outputs. Low signal quality reduces confidence and is communicated to users through confidence-aware messaging.

**Philosophy**: Edge cases and degraded patterns are treated as signals, not errors. They provide valuable information about data quality and behavioral patterns.

### 7.5 Time Window

**Definition**: A time window is the temporal range over which an analysis is computed. Time windows are defined by start timestamp, end timestamp, and window size (duration).

**Clarity Requirement**: All analysis outputs must include clear time window definitions, ensuring users understand the temporal scope of the analysis.

**Ring Buffer Alignment**: Time windows align with ring buffer structures, ensuring efficient and consistent data access.\n
### 7.6 Reproducibility Hash

**Definition**: A reproducibility hash is a cryptographic hash value generated from the inputs and configuration used to produce an analysis output. It enables deterministic verification: same inputs and configuration will always produce the same hash.

**Purpose**: Reproducibility hashes ensure auditability and trust. Users can verify that analysis outputs are deterministic and have not been tampered with.
\n**Inclusion**: All analysis outputs include reproducibility hash.\n
### 7.7 Configuration Version

**Definition**: A configuration version is a unique identifier for a specific version of the centralized configuration system. Configuration versions are timestamped and auditable.
\n**Purpose**: Configuration versions ensure that analysis outputs can be traced back to the exact configuration used to produce them. This enables reproducibility, auditability, and debugging.

**Inclusion**: All analysis outputs include the configuration version used for computation.

### 7.8 Insight Lifecycle State

**Definition**: An insight lifecycle state is the current state of an automatically generated insight. Insights transition between states based on time, data updates, and user feedback.

**States**:
- **Generated**: Newly created insight.\n- **Confirmed**: Insight validated by subsequent data or user action.
- **Expired**: Insight no longer relevant due to time passage.
- **Superseded**: Insight replaced by newer, more accurate insight.

**Purpose**: Insight lifecycle states provide context and relevance, helping users understand the current validity and applicability of insights.

### 7.9 Systemic Anomaly\n
**Definition**: A systemic anomaly is an issue affecting the system itself, not seller-level behavior. Systemic anomalies include pattern changes, timestamp drift, and ingestion bursts.

**Separation**: Systemic anomalies are flagged separately from seller analytics, ensuring clarity and preventing false positives in seller-facing outputs.

**Monitoring**: Systemic anomalies are monitored through dedicated system health endpoints and dashboard panels.

### 7.10 Webhook\n
**Definition**: A webhook is a side-effect of insight state changes, never as input. Webhooks only observe computed facts, never trigger recomputation.

**Event Types**:
- anomaly_detected: Anomaly detected\n- alert_triggered: Alert triggered
- prediction_updated: Prediction updated
- insight_state_changed: Insight state changed\n- weekly_report_ready: Weekly report ready
- pricing_tier_changed: Pricing tier changed\n\n**Payload Requirements**: All webhook payloads must include reproducibilityHash, configVersion, timeWindow, dataSufficiency, and signalQuality.

**Delivery Guarantees**: Webhook delivery is asynchronous and best-effort. Delivery failures never affect analytics computation.

### 7.11 Funnel
\n**Definition**: A funnel is an aggregation of event types used to analyze user conversion and dropoff across a series of steps. Funnels must be deterministic, reproducible, and explainable.

**Step Constraints**:
- Steps must be temporally monotonic (chronological order)\n- Funnel windows must align with ring buffer windows
\n**Output Requirements**: Funnel outputs always include dropoff attribution, per-step sufficiency, and confidence messaging.

**Templates**: Predefined funnel templates per tier, seller-selectable but constrained step set.

### 7.12 Tier

**Definition**: Tier is a derived state representing the user's current pricing level, computed from usage metrics, pricing policy, and grace rules. Tier is never manually assigned.

**Computation Model**:
```\nusage metrics
+ pricing policy
+ grace rules
----------------
= effective tier
```

**Tier Values**: free, basic, premium, business\n
**Computation Triggers**:
- Scheduled jobs (periodic automatic reconciliation)
- Admin-triggered reconciliation (on-demand)
\n**State Persistence**: effectiveTier, pricingVersion, computedAt, source

**Philosophy**: Tier is always derived, never manually assigned. Admins trigger computation, not assignment. This ensures pricing honesty, explicit exceptions, and clean audits.\n
**Access Control**: Tier reconciliation data and all user plan details are accessible only to Admin users.

### 7.13 Entitlement

**Definition**: An entitlement is an explicit exception granting additional resources or capabilities beyond the user's tier limits. Entitlements are separate from tier computation.\n
**Entitlement Types**:
- webhook_bonus: Additional webhook delivery quota
- prediction_bonus: Additional prediction request quota
\n**Attributes**:
- type: Entitlement type\n- amount: Bonus amount
- expiresAt: Optional expiration timestamp
- reason: Explanation for granting entitlement

**Purpose**: Entitlements allow admins to grant explicit exceptions while keeping tier computation honest and auditable. Entitlements never change tier directly.