# Lush Analytics Requirements Document

## 1. Application Overview

### 1.1 Application Name
Lush Analytics

### 1.2 Application Description
A lightweight, high-performance analytics API system designed for sellers. The system provides real-time anomaly detection (sales/click spikes, bot detection), short-term trend forecasting (traffic/sales predictions), and efficient scalable backend architecture utilizing DSP techniques (FIR, FFT, HFD) and probabilistic caching. Enhanced features include automated insight engine, predictive alerts, seller health scoring, behavioral fingerprinting capabilities, deterministic reproducibility, data sufficiency metrics, rate limit visibility, decision hooks, weekly health reports, alert-driven pricing tiers, dedicated anomaly/prediction endpoints, fixed tier defaults, insight summaries, one-click export functionality, embeddable components, confidence/sufficiency-aware messaging, auditable configuration management, formalized insight lifecycle, embeddable guardrails, codified system invariants, data minimization enforcement, aggregation-first analytics, tier-based retention policies, edge case detection as signal quality indicators, comprehensive encryption strategy, webhook registration and management, and funnel analysis.

The application now includes a redesigned modern frontend interface with navigation in the main area (replacing traditional sidebar), featuring hero section, feature showcase, pricing tiers, customer testimonials, and email signup functionality, fully responsive for desktop and mobile devices.

**New Feature**: Team collaboration system with role-based access control (Admin/Member), project management, real-time task tracking, dashboard with task completion progress and assigned tasks, Stripe payment integration, and admin tier reconciliation system.

**Performance Enhancement**: Lazy loading implemented across all pages with smooth page transitions and subtle animations using motion library.

**Security Enhancement**: Admin-exclusive access to tier reconciliation data and all user plan details, password reset functionality on login dialog.

**Latest Upgrade**: Introduction of Query Execution Model, upgrading the system from API service to analytics engine, supporting explicit query plan abstraction, multi-threaded scheduled execution, federated query architecture, API-driven query requests, cost-optimized queries, deterministic parallelism guarantees, and executable system invariants.

**New Metrics System**: Introduction of Signal-to-Noise Ratio (SNR), Effective Sample Size (ESS), Window Stability Score, Temporal Coverage, Entropy Drift, Query Plan Cost Accuracy, Node-Level Execution Skew, Parallelism Efficiency, Cache Contribution Ratio, Partial Result Yield Time, Reproducibility Drift Rate, Config Sensitivity Index, Invariant Violation Count, Insight Action Rate, Alert-to-Action Latency, False Positive Tolerance, Revenue-at-Risk Detection, Tier Saturation Index, Alert Cost Efficiency, Upgrade Trigger Correlation, Alert Storm Churn, Confidence Message Read Rate, Attribution Panel Usage, Query Console Abandonment Rate, Visualization Interaction Depth, and comprehensive metrics system.

**New Time Series Algorithms**: Introduction of Matrix Profile (STOMP/SCRIMP++), Bayesian Online Changepoint Detection (BOCPD), Seasonal Hybrid ESD (S-H-ESD), Copula-based Dependency Drift Detection, Dynamic Time Warping (DTW) Distance Baseline Comparison, and advanced time series algorithms.

**New Visualization Features**: Real-time DAG Heatmap, Insight Timeline, Attribution Waterfall, Frequency Domain Explorer, Signal Quality Overlays, and enhanced visualization components.

**Pricing Tier Restoration**: Basic Tier has been restored to production and is visible and selectable on the landing page and admin panel page.

**New Canonical Analytics Capability Registry**: Formalized analytics discoverability system with registry object containing id, category, input requirements, deterministic guarantee, cost class, explainability level, and default tier. Enables auto-UI generation, tier gating, cost-based query planning, and future extensibility.

**Visualization to Decision Mapping**: Each visualization component now includes primary question answered, decision enabled, API endpoint dependency, alert spawning capability, and insight state transition triggers. Ensures actionable insights and reduces UI noise.

**User Confirmation and Dismissal Signals**: Post-insight outcome tracking system with user confirmation/dismissal signals and insight precision scoring. Enables threshold tuning per seller, alert fatigue reduction, and algorithm effectiveness measurement.

**Authentication and Signup Flow Fixes**: Fixed login issue where existing users received \"Signup Failed user already registered\" message. Users can now log in directly without creating new profiles. Improved page transition speed from landing page to dashboard after signup.

**Pricing Tier Selection Enhancement**: Users can now select Free Tier or Basic Tier during signup on the \"Create Your Account\" modal instead of hardcoded tier assignment.

**Pricing Updates**: Basic Tier renamed to Free Tier, Free Tier renamed to Basic Tier. Basic Tier cost updated to €29 per month. Small gap added between pricing cards on landing page and admin panel for better visual separation.

**Sidebar Enhancement**: Sidebar component already includes proper toggle functionality with cookie persistence, keyboard shortcuts (Cmd/Ctrl+B), and mobile/desktop responsive behavior. No additional changes needed.

**Analytics Capability Registry**: Comprehensive registry of 40+ analytics types with metadata including category (DSP/Statistical/Dependency/Forecast/Fingerprint), input requirements, cost class (cheap/medium/heavy), deterministic guarantee, explainability level, and default tier. Enables auto-UI generation, tier gating, cost-based query planning, and future ML insertion. Registry serves as "pg_catalog" for analytics discoverability.

**Visualization Decision Mapping**: Each visualization component mapped to primary question answered, decision enabled, API endpoint dependency, alert spawning capability, and insight state transition triggers. Includes actionable buttons and related visualizations. Ensures insights are actionable and reduces UI noise. Examples:
- FFT Heatmap → identifies periodic manipulation → feeds fingerprint drift → escalates seller health risk
- Attribution Waterfall → identifies top contributors → enables resource allocation
- Predictive Alerts → forecasts issues → enables preventive action

**User Feedback System**: Post-insight outcome tracking with confirmation/dismissal signals and insight precision scoring. Tracks outcomes (confirmed, dismissed, false_positive, acted_upon, ignored, expired) per insight type and algorithm. Enables:
- Threshold tuning per seller (adaptive learning)
- Alert fatigue reduction (suppress low-precision insights)
- Algorithm effectiveness measurement (precision score, action rate, false positive rate)
- Time-to-action metrics
- Seller-specific confidence adjustments

## 2. Core Functionality

### 2.1 Event Ingestion
- **Endpoint**: POST /events
- **Functionality**: Real-time acceptance and processing of seller event data
- **Payload Structure**:
  - sellerId: Seller identifier (opaque/proxy key only)
  - timestamp: Event timestamp (milliseconds)
  - type: Event type (SALE / CLICK / VIEW / CHECKOUT_STARTED / PAYMENT_SUCCEEDED)
  - value: Event value (behavioral signals only, no PII)
- **Processing Logic**: Add events to pre-allocated fixed-size ring buffer (contiguous array), separate buffer per seller per metric. Circular access using index mod window size. No per-event reallocation or object churn.
- **Data Minimization**: Strip all PII (names, emails, addresses) from event payload, retain only behavioral signals.

### 2.2 Batch Ingestion
- **Endpoint**: POST /events/batch
- **Functionality**: Accept batch event data for high-throughput sellers
- **Payload Structure**: Array of event objects (PII stripped)
- **Processing Logic**: Efficiently process multiple events in single request to reduce overhead, using same ring buffer mechanism

### 2.3 Ring Buffer Management
- Pre-allocated fixed-size contiguous array (window size defined in centralized config)
- Circular access using index mod window size
- Zero per-event reallocation
- No per-event object churn
- Supports real-time FIR, FFT, and HFD computation
- **Explicit Time Window Definition**: Expose time window parameters (start timestamp, end timestamp, window size) in API responses and UI

### 2.4 DSP Analysis Pipeline
- **FIR Smoothing**: Smooth time series data
- **FFT Analysis**: Detect periodic spikes in sales/clicks, identify repetitive bot patterns or hourly spikes
- **HFD (Higuchi Fractal Dimension)**: Measure time series complexity/irregularity, high HFD values indicate possible bot activity or anomalous behavior
- **Bayesian/Probabilistic Scoring**: Combine smoothed deviation, FFT peaks, and HFD to output anomaly score (0-1 range)
- **Deterministic Anomaly Reproducibility**: Ensure same input always produces same output through fixed random seeds, deterministic ordering, and consistent computation order
- **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events

### 2.5 Probabilistic Caching with Temporal Locality
- Per-seller hot metric cache
- **lastComputedAt** timestamp tracking per cached metric
- Probabilistic refresh only on query (not per-event)
- Adaptive TTL strategy defined in centralized config:
  - Hot sellers: Recompute based on config TTL
  - Cold sellers: Recompute based on config TTL
- Short-term cache layer to reduce duplicate function calls
- Ensures system scalability under high load

### 2.6 Anomaly Detection API
- **Endpoint**: GET /metrics/:seller/anomalies
- **Functionality**: Return seller anomaly score and attribution breakdown
- **Response Format**:
  - anomalyScore: Overall anomaly score (0-1)
  - attribution: Root cause breakdown (FFT peak contribution, HFD complexity contribution, trend deviation)
  - timeWindow: Explicit time window definition (startTimestamp, endTimestamp, windowSize)
  - dataSufficiency: Data sufficiency metrics (sufficient/insufficient, required minimum data points, current available data points)
  - reproducibilityHash: Hash for deterministic verification
  - confidenceMessage: Confidence and sufficiency-aware message explaining result reliability
  - configVersion: Configuration version used for this computation
  - signalQuality: Signal quality assessment (degraded modes, edge case flags)

### 2.7 Prediction API
- **Endpoint**: GET /metrics/:seller/predictions
- **Functionality**: Return predicted sales/traffic time series data with confidence intervals
- **Response Format**:
  - predictions: Array of predicted values with timestamps
  - confidenceBands: ± confidence intervals around predictions
  - historicalCutoff: Timestamp marking where history ends and predictions begin
  - timeWindow: Explicit time window definition
  - dataSufficiency: Data sufficiency metrics
  - reproducibilityHash: Hash for deterministic verification
  - confidenceMessage: Confidence and sufficiency-aware message explaining prediction reliability
  - configVersion: Configuration version used for this computation
  - signalQuality: Signal quality assessment

### 2.8 Automated Insight Engine with Summaries and Lifecycle Management
- **Functionality**: Generate lightweight insights based on rule-based and probabilistic analysis
- **Input Signals**:
  - Anomaly scores
  - FFT periodicity
  - HFD complexity
  - Recent trend slope
- **Output**: Human-readable insight summaries explaining detected patterns and potential issues
- **Insight Summaries**: Concise, actionable summaries for quick understanding
- **Insight Lifecycle States**:
  - Generated: Newly created insight
  - Confirmed: Insight validated by subsequent data or user action
  - Expired: Insight no longer relevant due to time passage
  - Superseded: Insight replaced by newer, more accurate insight
- **State Transitions**: Automatic state management based on time, data updates, and user feedback
- **Endpoint**: GET /insights/:seller/lifecycle to query insight status

### 2.9 Anomaly Attribution (Root Cause Breakdown)
- **Functionality**: Explain anomaly score composition
- **Components**:
  - FFT peak contribution percentage
  - HFD complexity contribution percentage
  - Trend deviation contribution percentage
  - Smoothed deviation contribution percentage

### 2.10 Predictive Alerts with Single Primary Trigger
- **Functionality**: Proactive alert system based on primary trigger and contextual information
- **Primary Trigger**: Anomaly score threshold (defined in centralized config)
- **Contextual Information**: Trends, attribution, fingerprints, time windows provided as context, not additional triggers
- **Alert Levels**: Defined by configuration table (data-driven), not conditional statements
- **Alert Types**: Potential spike warnings, downtrend alerts, pattern shift notifications
- **System Invariant**: All alerts must reference data sufficiency status

### 2.11 Seller Health Score (Composite Index)
- **Endpoint**: GET /metrics/:seller/health
- **Functionality**: Calculate composite seller health score
- **Scoring Factors**:
  - Volatility level
  - Anomaly frequency
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
  - Real-time metric updates
  - Event log display with pagination/infinite scroll
  - **Time Window Display**: Show explicit time window definition in UI (start time, end time, window size)
  - **Data Sufficiency Metrics**: Display explicit data sufficiency status (sufficient/insufficient, show progress bar for current vs required data points)
  - **Rate Limit and Backpressure Visibility**: Display current rate limit status, remaining quota, backpressure metrics, and queue depth
  - **Confidence and Sufficiency-Aware Messages**: Display contextual messages explaining result reliability based on data quality
  - **Insight Lifecycle Display**: Show insight status (Generated, Confirmed, Expired, Superseded) with visual indicators
  - **Signal Quality Metrics**: Display edge case flags and degraded mode warnings
  - **Task Completion Progress**: Display overall completion percentage for current user's assigned tasks
  - **Assigned Tasks Overview**: Display list of tasks assigned to current user with status indicators
  - **Behavioral Fingerprinting Capability**: Implement behavioral fingerprinting functionality on dashboard, displaying seller behavior pattern analysis results

### 2.15 Event Log Management
- **Functionality**: Display and manage event logs on dashboard
- **Features**:
  - Pagination support
  - Infinite scroll capability
  - Efficient data loading for large event volumes
- **Data Minimization**: Display only aggregated behavioral signals, no PII

### 2.16 Decision Hooks
- **Functionality**: Provide extensible decision hooks for custom business logic integration
- **Hook Points**:
  - Pre-anomaly detection hook: Execute custom logic before anomaly detection
  - Post-anomaly detection hook: Execute custom logic after anomaly detection
  - Pre-prediction hook: Execute custom logic before prediction generation
  - Post-prediction hook: Execute custom logic after prediction generation
  - Alert trigger hook: Execute custom logic when alert is triggered
- **Use Cases**: Custom notification routing, third-party integrations, business rule execution, audit logging

### 2.17 Weekly Seller Health Reports
- **Functionality**: Generate and deliver automated weekly health reports for sellers
- **Report Content**:
  - Weekly health score summary
  - Anomaly frequency and severity breakdown
  - Trend analysis and forecasts
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
  - Basic Tier: €29/month - Enhanced features, lower alert thresholds, detailed insights, faster response, reduced branding on embeddable components
  - Premium Tier: €300 - Advanced features, custom alert thresholds, comprehensive insights, priority support, minimal branding on embeddable components
- **Pricing Factors** (defined in centralized config):
  - Number of alerts triggered per month
  - Anomaly severity levels
  - Prediction accuracy requirements
  - Real-time processing demands
- **Endpoint**: GET /pricing/:seller/tier

### 2.19 Dedicated Anomaly Endpoint
- **Endpoint**: POST /sell/anomaly
- **Functionality**: Dedicated endpoint for selling/exposing anomaly detection results to external systems
- **Payload Structure**:
  - sellerId: Seller identifier (opaque/proxy key)
  - timeRange: Time range for anomaly detection
  - includeAttribution: Boolean flag to include root cause breakdown
- **Response Format**:
  - anomalyScore: Overall anomaly score
  - attribution: Root cause breakdown
  - timeWindow: Time window definition
  - dataSufficiency: Data sufficiency metrics
  - reproducibilityHash: Hash for verification
  - confidenceMessage: Confidence and sufficiency-aware message
  - configVersion: Configuration version used
  - signalQuality: Signal quality assessment

### 2.20 Dedicated Prediction Endpoint
- **Endpoint**: POST /sell/prediction
- **Functionality**: Dedicated endpoint for selling/exposing prediction results to external systems
- **Payload Structure**:
  - sellerId: Seller identifier (opaque/proxy key)
  - predictionHorizon: Number of time steps to predict
  - includeConfidenceBands: Boolean flag to include confidence intervals
- **Response Format**:
  - predictions: Array of predicted values with timestamps
  - confidenceBands: ± confidence intervals
  - historicalCutoff: Timestamp marking history/prediction boundary
  - timeWindow: Time window definition
  - dataSufficiency: Data sufficiency metrics
  - reproducibilityHash: Hash for verification
  - confidenceMessage: Confidence and sufficiency-aware message
  - configVersion: Configuration version used
  - signalQuality: Signal quality assessment

### 2.21 One-Click Export Functionality
- **Functionality**: One-click export of reports, insights, and analytics data
- **Export Formats**: PDF, Email
- **Export Content**:
  - Anomaly reports
  - Prediction reports
  - Health score reports
  - Weekly health reports
  - Insight summaries
  - Configuration snapshot used for report generation
- **Endpoints**:
  - POST /export/pdf: Generate and download PDF report
  - POST /export/email: Send report via email

### 2.22 Embeddable Components with Guardrails
- **Functionality**: Provide embeddable UI components for integration into external dashboards or applications
- **Components**:
  - Anomaly chart widget
  - Prediction chart widget
  - Health score widget
  - Alert notification widget
  - Event log widget
- **Integration**: JavaScript SDK or iframe-based embedding
- **Customization**: Support theme customization and configuration options
- **Soft Guardrails**:
  - Rate limits per embed key (defined in centralized config by tier)
  - Light branding watermark on Free/Basic tiers
  - Default read-only scope (no write access unless explicitly granted)
  - Require embed key authentication

### 2.23 Auditable Configuration Management
- **Functionality**: Track and audit all configuration changes
- **Features**:
  - Version control for configuration tables
  - Effective timestamp for each configuration change
  - Configuration snapshot storage with reports
  - Configuration change audit log
  - Ability to rollback to previous configuration versions
- **Endpoints**:
  - GET /config/versions: List all configuration versions
  - GET /config/version/:id: Retrieve specific configuration version
  - GET /config/audit: Retrieve configuration change audit log
  - POST /config/rollback/:id: Rollback to specific configuration version

### 2.24 Edge Case Detection as Signal Quality
- **Functionality**: Detect and flag edge cases as low-confidence signal mechanisms, not errors
- **Degraded Behavior Patterns**:
  - Constant zero values: Flag as low signal mechanism
  - Perfect periodicity: Flag as potential bot activity signal
  - Impossible regularity: Flag as anomalous signal pattern
- **Handling**: Edge cases are signals, not errors. They represent low-confidence mechanisms and should be presented as signal quality indicators
- **Output**: Signal quality score and edge case flags included in all analysis responses
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

### 2.26 Frontend Landing Page
- **Functionality**: Modern landing page showcasing Lush Analytics platform with redesigned navigation
- **Sections**:
  - **Hero Section**:
    - Headline: Primary value proposition
    - Subheadline: Supporting description
    - Call-to-action button: Opens user interaction dialog
  - **Features Section**:
    - Six feature cards with icons
    - Highlight key platform capabilities
    - **Anomaly Detection Card**: Reference advanced mathematical models (no mention of AI or machine learning)
    - **Predictive Insights Card**: Use leveraging business intelligence instead of leveraging advanced mathematical models
    - **Privacy by Design Card**: GDPR compliant, strict data minimization. No PII in analysis path—behavioral signals on aggregated data only.
    - **High Performance Card**: Ring buffer architecture, zero per-event allocation. Probabilistic caching ensures sub-millisecond response times.
  - **Pricing Section**:
    - Three pricing tiers with clear differentiation:
      - Free Tier: €0
      - Basic Tier: €29/month
      - Premium Tier: €300
    - Display pricing using Euro symbol (€)
    - **Pricing Tier Button Behavior**:
      - **Free Tier Start Button**: Clicking this button redirects user to signup dialog. After successful signup, Free Tier users are redirected to dashboard page.
      - **Paid Tier Subscribe Buttons**: Clicking these buttons redirects user to signup dialog. After successful signup, paid tier users are redirected to Stripe checkout. After completing Stripe setup, users are redirected to dashboard page.
  - **Customer Testimonials Section**:
    - Customer testimonials and success stories
  - **Email Signup Form**:
    - Newsletter subscription or early access registration
- **Navigation Design**:
  - Navigation styled in main area (no traditional sidebar)
  - Clean, modern navigation interface
- **Dialog Behavior**:
  - Dialogs can be closed by clicking cancel button
  - Dialogs can be closed by clicking anywhere outside the dialog
- **Responsive Design**: Fully responsive layout optimized for desktop and mobile devices, design aesthetic inspired by similar to nfinitepaper.com
- **Styling**: Consistent with existing application styling and design system
- **Performance Optimization**: Apply lazy loading to landing page sections and components
- **Basic Tier Visibility**: Ensure Basic Tier is clearly visible and selectable in landing page pricing section

### 2.27 User Authentication System
- **Functionality**: Secure user authentication and authorization
- **Features**:
  - User registration with email and password
  - User login with email and password
  - **Password reset functionality on login dialog with link**
  - Session management
  - JWT token-based authentication
  - **Post-Signup Redirect**: After successful signup, users are redirected based on selected pricing tier:
    - Free Tier users: Redirect to dashboard page
    - Paid Tier users: Redirect to Stripe checkout, then to dashboard page after payment completion
- **Login Dialog Password Reset Link**:
  - **Location**: Below the \"Don't have an account? Sign up\" link
  - **Text**: \"Forgot password? Reset password\"
  - **Behavior**: Clicking this link opens password reset dialog or redirects to password reset page
- **Endpoints**:
  - POST /auth/register: User registration
  - POST /auth/login: User login
  - POST /auth/logout: User logout
  - POST /auth/reset-password: Password reset request
  - POST /auth/confirm-reset: Confirm password reset

### 2.28 Team Management System
- **Functionality**: Team collaboration with role-based access control
- **Roles**:
  - **Admin**: Full team management permissions
    - Invite new members to team
    - Remove members from team
    - Manage team settings
    - Create and manage projects
    - Assign tasks to team members
    - Reconcile user pricing tiers
    - Access admin panel without errors
    - **View all user data and plan details in tier reconciliation section**
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
  - Team creation
  - Member invitation via email
  - Member removal by admin
  - Role assignment and management
  - Team settings management (admin only)
  - **Admin Panel Access Control**: When logged-in user with admin role clicks admin panel button, access should be granted without error messages. Proper role validation and access control must be implemented.
  - **Tier Reconciliation Data Visibility**: Only admin users can view all user data and plan details in tier reconciliation section. Regular users cannot access this information.
- **Endpoints**:
  - POST /teams: Create new team
  - GET /teams/:teamId: Get team details
  - POST /teams/:teamId/invite: Invite member (admin only)
  - DELETE /teams/:teamId/members/:userId: Remove member (admin only)
  - GET /teams/:teamId/members: List team members
  - PUT /teams/:teamId/settings: Update team settings (admin only)

### 2.29 Project Management System
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
  - GET /projects/:projectId: Get project details
  - PUT /projects/:projectId: Update project (admin only)
  - DELETE /projects/:projectId: Delete project (admin only)

### 2.30 Task Management System with Real-time Updates
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
  - Reassign tasks
  - Real-time task updates using Supabase Realtime
  - Filter tasks by status
  - Filter tasks by assigned user
- **Real-time Synchronization**:
  - Task status changes broadcast in real-time to all team members
  - Task assignments update instantly across all connected clients
  - Task updates (title, description) synchronize immediately
- **Endpoints**:
  - POST /projects/:projectId/tasks: Create new task
  - GET /projects/:projectId/tasks: List all tasks for project
  - GET /tasks/:taskId: Get task details
  - PUT /tasks/:taskId: Update task
  - DELETE /tasks/:taskId: Delete task
  - PUT /tasks/:taskId/status: Update task status
  - PUT /tasks/:taskId/assign: Assign task to user

### 2.31 Dashboard Task Analytics
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
  - Payment method management
  - Invoice generation and history
  - Webhook handling for payment events
  - Automatic tier access control based on subscription status
  - **Payment Notifications**: Display notifications indicating payment success or failure
  - **Notification Auto-dismiss**: Notifications automatically dismiss after 5 seconds
  - **Payment System Configuration Validation**: Validate Stripe API keys and configuration before processing payments
  - **Error Handling**: Display clear error messages when payment system is not properly configured
- **Payment Flow**:
  1. User selects pricing tier from landing page (Free Tier Start button or Paid Tier Subscribe buttons)
  2. User is redirected to signup dialog
  3. User completes signup
  4. **Free Tier Flow**: User is directly redirected to dashboard page
  5. **Paid Tier Flow**:
     - Validate payment system configuration (Stripe API keys exist and valid)
     - User is redirected to Stripe Checkout
     - User completes payment
     - Webhook confirms payment
     - Display success/failure notification (auto-dismiss after 5 seconds)
     - User tier is automatically updated
     - User is redirected to dashboard page
     - Access to tier-specific features is granted
- **Configuration Error Handling**:
  - If Stripe API keys are missing or invalid, display error: \"Payment system not configured. Please contact support.\"
  - Prevent payment flow from initiating when configuration is invalid
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
- **Core Principle**: Webhooks are side effects of insight state changes, never as input
- **Design Goals (Non-negotiable)**:
  - Purely derived (never raw)
  - Deterministic (same input → same payload)
  - Self-verifying (hash + config)
  - Window-scoped
  - Side-effect safe
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
    \"flags\": []
  },
  \"configVersion\": \"cfg_2024_11_03_0012\",
  \"reproducibilityHash\": \"sha256:9d3a7c1e8f…\",
  \"signature\": \"hmac-sha256:ab91e5...\"
}
```
- **Why This Maintains Determinism**:
  - sequence is monotonically increasing per seller
  - emittedAt is derived from window end
  - payload contains only computed outputs
  - reproducibilityHash lets receiver verify recomputation
  - signature is computed over canonical JSON serialization
- **Safe Event Types**:
  - anomaly_detected: Anomaly detected
  - alert_triggered: Alert triggered
  - prediction_updated: Prediction updated
  - insight_state_changed: Insight state changed
  - weekly_report_ready: Weekly report ready
  - pricing_tier_changed: Pricing tier changed
- **Event-Specific Payloads**:
  - **alert_triggered**:
```json
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
  \"healthImpact\": -12
}
```
  - **prediction_updated**:
```json
{
  \"horizon\": 24,
  \"unit\": \"hour\",
  \"predictions\": [120, 118, 121, 130],
  \"confidenceBands\": {
    \"lower\": [100, 99, 102, 110],
    \"upper\": [140, 137, 142, 150]
  }
}
```
  - **insight_state_changed**:
```json
{
  \"insightId\": \"ins_01HZV7R8\",
  \"previousState\": \"generated\",
  \"newState\": \"confirmed\",
  \"reason\": \"subsequent_data_confirmed\"
}
```
- **Webhook Payload Requirements**:
  All webhook payloads must include:
  - reproducibilityHash: Reproducibility hash
  - configVersion: Configuration version
  - timeWindow: Time window
  - dataSufficiency: Data sufficiency
  - signalQuality: Signal quality
- **Guardrails**:
  - **Async + Best-Effort Delivery**: Webhook delivery is asynchronous with best-effort strategy
  - **Retry with Backoff**: Retry with backoff strategy on delivery failure
  - **Dead Letter Queue**: Persistently failed webhooks enter dead letter queue
  - **Delivery Failure Does Not Affect Analytics**: Webhook delivery failure never affects analysis computation
  - **No Recomputation Trigger**: Webhooks cannot trigger recomputation, only observe state transitions
  - **Never Emit from DSP Loop**: Webhooks never emit from inside DSP loop
  - **Deterministic Ordering**: If two insights occur in same window, ordering must be defined (timestamp + type priority)
- **Hard Webhook Invariants**:
  - No raw timestamps below window granularity
  - No per-event identifiers
  - No recomputation triggers
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

### 2.34 Funnel Analysis
- **Functionality**: Funnels are aggregations of event types
- **Core Principles**:
  - Funnels are deterministic
  - Funnels are reproducible
  - Funnels are explainable
- **Design Decisions**:
  - **Declarative**: Funnels must be declarative
  - **Config-Backed**: Funnel definitions stored in centralized config
  - **Window-Bound**: Funnels must be bound to time windows
- **Funnel DSL (Config-Native)**:
```yaml
funnels:
  checkout_conversion_v1:
    version: 1
    description: View → Checkout → Payment
    window:
      sizeMs: 86400000
      slideMs: 3600000
    steps:
      - id: view
        eventType: VIEW
        minCount: 100
      - id: checkout
        eventType: CHECKOUT_STARTED
        minRatioFrom: view
        minRatio: 0.05
      - id: payment
        eventType: PAYMENT_SUCCEEDED
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
  - **Seller-Selectable but Constrained Step Sets**: Sellers can select steps but constrained
  - **Centralized Config**:
    - Minimum data requirements
    - Step ordering rules
    - Timeouts between steps
- **Constraints**:
  - **Steps Must Be Temporally Monotonic**: Steps must be in chronological order
  - **Funnel Window Must Align with Ring Buffer Window**: Funnel window must align with ring buffer window
  - **Funnel Output Always Includes**:
    - Dropoff Attribution: Dropoff reason analysis per step
    - Per-Step Sufficiency: Data sufficiency metrics per step
    - Confidence Message: Confidence message based on data quality
- **Endpoints**:
  - GET /funnels/templates: List predefined funnel templates
  - POST /funnels: Create custom funnel (constrained)
  - GET /funnels/:id: Get funnel details
  - GET /funnels/:id/analysis: Execute funnel analysis
  - GET /metrics/:seller/funnels: Get funnel analysis results for seller
- **Response Format**:
  - steps: Array of funnel steps
  - conversionRates: Conversion rates per step
  - dropOffAttribution: Dropoff attribution analysis
  - dataSufficiency: Data sufficiency per step
  - confidenceMessage: Confidence message
  - timeWindow: Time window definition
  - reproducibilityHash: Reproducibility hash
  - configVersion: Configuration version
  - signalQuality: Signal quality assessment

### 2.35 Webhook Volume Mapping to Pricing Tiers
- **Conceptual Model**: Webhook usage viewed as downstream compute amplification
- **Tracked Metrics** (per seller, per month):
  - totalDeliveries: Total webhook deliveries
  - successfulDeliveries: Successful webhook deliveries
  - failedDeliveries: Failed webhook deliveries
  - uniqueEventTypes: Unique event types count
  - peakHourlyRate: Peak hourly delivery rate
- **Tier Mapping** (data-driven, stored in centralized config):
  - Free Tier: 0 monthly webhook deliveries, no webhooks
  - Basic Tier: ≤ 5,000 monthly webhook deliveries, alert_triggered only
  - Premium Tier: ≤ 50,000 monthly webhook deliveries, alerts + predictions
- **Enforcement Model**:
  - Webhooks exceeding tier limits are deterministically dropped
  - Drop reason is logged and visible in dashboard
  - Drops never affect analytics
  - Drops visible as usage signal
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

### 2.36 Admin Tier Reconciliation System
- **Functionality**: Admin-triggered tier recalculation based on current usage metrics and pricing policy
- **Core Principle**: Tier is derived state, not manual attribute
- **Mental Model**:
```
Usage Metrics
+ Pricing Policy
+ Grace Rules
----------------
= Effective Tier
```
- **Admin Action**:
  - **Button Label**: Recalculate Tier or Apply Pricing Policy
  - **Confirmation Text**: This will recalculate user's tier based on current usage and pricing rules. No data will be modified.
  - **Behavior**: Immediately force tier computation instead of waiting for scheduled job
- **Tier State Model**:
```typescript
interface TierState {
  effectiveTier: \"free\" | \"basic\" | \"premium\" | \"business\"
  pricingVersion: string
  computedAt: number
  source: \"scheduled\" | \"admin_reconcile\"
}
```
- **Computation Process**:
  1. Load current usage metrics (webhooks, API calls, alerts, etc.)
  2. Load current pricing configuration
  3. Compute effective tier based on usage and policy
  4. Persist:
     - effectiveTier
     - tierComputedAt
     - pricingVersion
     - source (admin_reconcile)
  5. Emit event: tier.reconciled
- **Admin Panel Visibility**:
  - **Admin-Only Access**: Only users with admin role can view tier reconciliation section
  - **All User Data Display**: Admin users can view all user data and plan details in tier reconciliation section
  - **Regular User Restriction**: Regular users (non-admins) cannot access or view any user data or plan details in tier reconciliation section
  - Current tier
  - Usage vs limits
  - Applied pricing rules
  - Last reconciliation source
  - Next scheduled reconciliation
- **Entitlement System** (separate from tier reconciliation):
```typescript
interface Entitlement {
  type: \"webhook_bonus\" | \"prediction_bonus\"
  amount: number
  expiresAt?: number
  reason: string
}
```
  - Admin panel allows:
    - Grant entitlements
    - Set expiration
    - Attach reason
  - Entitlements are explicit exceptions, never directly change tier
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
  - **Subscription Cancellation**: Cancel subscription button allowing users to cancel their active subscription
  - **Plan Change Confirmation**: Confirmation dialog before processing plan changes
  - **Immediate Plan Changes**: Plan changes take effect immediately after successful payment processing
  - **Basic Tier Visibility**: Ensure Basic Tier is clearly visible and selectable in admin panel pricing plan management interface
- **User Interface Components**:
  - Pricing tier cards with feature lists and pricing information
  - Current plan badge or indicator
  - Upgrade/downgrade action buttons
  - Cancel subscription button (visible only for active paid subscriptions)
  - Confirmation dialogs for plan changes and cancellations
- **Business Logic**:
  - Free Tier users can upgrade to Basic or Premium
  - Basic Tier users can upgrade to Premium or downgrade to Free
  - Premium Tier users can downgrade to Basic or Free
  - Cancellation returns user to Free Tier at end of current billing cycle
  - Immediate access to new tier features after successful upgrade
  - Graceful feature access removal on downgrade
- **Endpoints**:
  - GET /admin/pricing/plans: Get all available pricing plans
  - POST /admin/subscription/change: Change subscription plan (upgrade/downgrade)
  - POST /admin/subscription/cancel: Cancel active subscription
  - GET /admin/subscription/current: Get current subscription details

### 2.38 Seller Page Data Management
- **Functionality**: Display and manage seller data on seller page
- **Data Source**: Display only real seller data from database, no placeholder or mock data
- **Features**:
  - List all sellers with real data
  - Display seller metrics and analytics
  - Filter and search sellers
  - Seller detail view
- **Data Requirements**:
  - Remove all placeholder stores and mock data
  - Display empty state when no sellers exist
  - Dynamically load seller data from database
  - Handle loading and error states appropriately
- **Empty State Handling**:
  - Display informative empty state message when no sellers exist
  - Provide call-to-action to add first seller
  - Clear visual indication that page is ready but contains no data

### 2.39 Query Execution Model
- **Functionality**: Introduce explicit query plan abstraction, upgrading system from API service to analytics engine
- **Core Concepts**:
  - **QueryPlan**: Deterministic DAG (Directed Acyclic Graph) structure
    - SourceNode: Ring buffer / aggregated storage
    - TransformNode: FIR, FFT, HFD transformations
    - AggregateNode: Aggregation nodes
    - ScoreNode: Scoring nodes
    - OutputNode: Output nodes
- **Execution Model**:
  - Each request compiles to deterministic DAG
  - Execution through controlled execution engine
  - Support for multi-threaded and scheduled execution
- **Benefits**:
  - Upgrade from API service to analytics engine
  - Direct alignment with distributed query and federated engines
  - No need for full SQL, typed analytics plan DSL suffices
- **Endpoint**: POST /query
- **Payload Structure**:
```json
{
  \"sellerId\": \"...\",
  \"queryType\": \"ANOMALY\",
  \"window\": {...},
  \"operators\": [\"FIR\", \"FFT\", \"HFD\"],
  \"output\": [\"score\", \"attribution\"],
  \"constraints\": {
    \"maxLatencyMs\": 50,
    \"minConfidence\": 0.8
  }
}
```

### 2.40 Multi-threaded Scheduled Execution
- **Functionality**: Explicit multi-threading and scheduled execution ensuring execution isolation
- **Core Components**:
  - **Per-Seller Execution Budget**: Allocate execution resource budget per seller
  - **Bounded Work Pools by Tier**: Allocate work thread pools based on analytics tier
  - **Explicit Execution Queues**:
    - Anomaly queue
    - Prediction queue
    - Insight generation queue
- **Scheduler Structure**:
  - Tier-aware queues
  - Backpressure signals
  - Deadline-aware execution
- **Guarantees**:
  - Fairness
  - Latency bounds
  - Predictable degradation
- **Mapping**: Direct mapping to performance and reliability at scale

### 2.41 Federated Query Architecture
- **Functionality**: Support federated queries across systems without Elasticsearch
- **Core Concepts**:
  - **Pluggable Data Sources**:
    - RingBufferSource: Ring buffer data source
    - AggregatedSnapshotSource: Aggregated snapshot data source
    - HistoricalColdStoreSource: Historical cold storage data source
    - ExternalWebhookSource: External webhook data source
- **Execution Model**:
  - Partial query execution per data source
  - Merge results at aggregation layer
- **Architectural Benefits**:
  - Architecture design matters even if all data sources initially in same database
  - Lays foundation for future scaling and distributed queries

### 2.42 Cost-Optimized Queries
- **Functionality**: Lightweight cost-optimized query planning
- **Existing Foundation**:
  - Data sufficiency metrics
  - Adaptive sampling
- **Upgrade**:
  - **Query Cost Estimator**:
    - Expected compute cost
    - Expected confidence gain
  - **Selection Strategy**:
    - Full FFT vs reduced FFT
    - Full HFD vs proxy metrics
- **Benefits**: Classic query planning, not ML hype

### 2.43 Deterministic Parallelism Guarantees
- **Functionality**: Ensure deterministic parallel execution across threads
- **Existing Strengths**: Emphasis on reproducibility
- **Upgrade**:
  - **Document and Enforce**:
    - Stable execution order across threads
    - Deterministic reduction operators
    - Explicit merge semantics
- **Benefits**: Rare and impressive in distributed analytics

### 2.44 Executable System Invariants
- **Functionality**: Transform system invariants into executable runtime contracts
- **Existing Foundation**:
  - Codified system invariants
  - Guardrails
- **Upgrade**:
  - **Invariant Checks as First-Class Objects**:
    - Invariant checks become core system components
    - Violations become systemic anomalies
- **Bridging**:
  - Algorithms, data structures, and system optimization
  - Formal reasoning

### 2.45 Admin Panel Page Modifications
- **Functionality**: User interface optimizations for admin panel page
- **Modifications**:
  - **Free Tier Card Current Plan Button Color**:
    - Location: Free Tier card at bottom of admin panel page
    - Modification: Change Current Plan button color to purple/white combination
    - Requirement: Ensure button color is consistent with application's purple theme color, providing good visual contrast and accessibility
  - **Remove Basic Predictions Feature from Free Tier Card**:
    - Location: Free Tier card on admin panel page
    - Modification: Remove \"Basic predictions\" item from Free Tier card feature list
    - Requirement: Ensure feature list layout remains clean after removal, other feature items display normally
  - **Current Tier Display Text Modification**:
    - Location: Admin panel page
    - Modification: Change \"Current Tier\" display text to \"Free Tier\"
    - Requirement: Ensure text change takes effect in all relevant locations, maintaining language consistency

### 2.46 Dashboard Page Feature Enhancements
- **Functionality**: Enhance behavioral fingerprinting and rate limit visibility on dashboard page
- **Enhancements**:
  - **Behavioral Fingerprinting Capability Implementation**:
    - Location: Dashboard page
    - Functionality: Implement behavioral fingerprinting capability, displaying seller behavior pattern analysis results
    - Requirements:
      - Add behavioral fingerprinting component or panel on dashboard
      - Display behavioral fingerprint signature and pattern classification
      - Show bot cluster identification, repetitive manipulation patterns, sudden strategy changes detection results
      - Use FFT + HFD + temporal entropy combination for analysis
      - Ensure all data based on aggregated behavioral signals, no PII
      - Provide clear visualization and user-friendly interface
  - **Rate Limit and Backpressure Visibility**:
    - Location: Dashboard page
    - Functionality: Display current rate limit status, remaining quota, backpressure metrics, and queue depth
    - Requirements:
      - Add rate limit and backpressure visibility panel or component
      - Display current rate limit status (normal/approaching limit/limit reached)
      - Display remaining quota (numerical and percentage)
      - Display backpressure metrics (queue depth, processing latency, etc.)
      - Use progress bars, gauges, or other visualization elements for clear display
      - Provide real-time updates ensuring data accuracy
      - Provide visual warnings or prompts when approaching or reaching limits

### 2.47 New Metrics System
- **Functionality**: Introduce comprehensive metrics system enhancing system observability, performance optimization, and user trust
- **Signal Quality Metrics** (per metric, per seller, per window):
  - **Signal-to-Noise Ratio (SNR)**:
    - Definition: Measure ratio of signal strength to noise level
    - Use: Explain why confidence may be low even with high data volume
    - Integration: Included in confidenceMessage and signalQuality
  - **Effective Sample Size (ESS)**:
    - Definition: Adjust raw event count based on autocorrelation
    - Use: Provide more accurate data sufficiency assessment
    - Integration: Included in dataSufficiency metrics
  - **Window Stability Score**:
    - Definition: Measure how much rolling window content changes per update
    - Use: Assess data stream stability and predictability
    - Integration: Included in signalQuality
  - **Temporal Coverage**:
    - Definition: Percentage of expected time buckets filled
    - Use: Identify data gaps and incompleteness
    - Integration: Included in dataSufficiency
  - **Entropy Drift**:
    - Definition: Change in temporal/value entropy relative to baseline
    - Use: Detect unexpected changes in data patterns
    - Integration: Included in signalQuality and systemic anomaly detection
- **Query Execution Performance Metrics**:
  - **Query Plan Cost Accuracy**:
    - Definition: Difference between estimated cost and actual cost
    - Use: Optimize query planner and cost estimation models
    - Endpoint: GET /metrics/query/cost-accuracy
  - **Node-Level Execution Skew**:
    - Definition: Slowest node ÷ median node execution time
    - Use: Identify query execution bottlenecks
    - Endpoint: GET /metrics/query/execution-skew
  - **Parallelism Efficiency**:
    - Definition: Actual CPU utilization vs planned utilization
    - Use: Optimize multi-threaded execution strategy
    - Endpoint: GET /metrics/query/parallelism-efficiency
  - **Cache Contribution Ratio**:
    - Definition: Percentage of results derived from cache vs computed
    - Use: Assess cache strategy effectiveness
    - Endpoint: GET /metrics/cache/contribution-ratio
  - **Partial Result Yield Time**:
    - Definition: Time to first available output
    - Use: Optimize streaming queries and real-time response
    - Endpoint: GET /metrics/query/partial-yield-time
- **Reproducibility and Configuration Metrics**:
  - **Reproducibility Drift Rate**:
    - Definition: Percentage of recomputations differing across versions/configs
    - Use: Monitor integrity of determinism guarantees
    - Endpoint: GET /metrics/reproducibility/drift-rate
  - **Config Sensitivity Index**:
    - Definition: How much output changes per config change
    - Use: Assess impact of configuration changes
    - Endpoint: GET /metrics/config/sensitivity-index
  - **Invariant Violation Count**:
    - Definition: Number of invariant violations per query, per seller, per tier
    - Use: Monitor system invariant enforcement
    - Endpoint: GET /metrics/invariants/violation-count
- **User Behavior and Trust Metrics**:
  - **Insight Action Rate**:
    - Definition: Percentage of insights leading to user action
    - Use: Assess insight effectiveness and relevance
    - Endpoint: GET /metrics/insights/action-rate
  - **Alert-to-Action Latency**:
    - Definition: Time between alert and seller response
    - Use: Optimize alert timing and relevance
    - Endpoint: GET /metrics/alerts/action-latency
  - **False Positive Tolerance**:
    - Definition: Alerts ignored by seller ÷ total alerts
    - Use: Identify alert fatigue and optimize alert thresholds
    - Endpoint: GET /metrics/alerts/false-positive-tolerance
  - **Revenue-at-Risk Detection**:
    - Definition: Estimated amount exposed before intervention
    - Use: Quantify business value of system
    - Endpoint: GET /metrics/revenue/at-risk-detected
- **Pricing and Monetization Metrics**:
  - **Tier Saturation Index**:
    - Definition: How close seller is running to limits
    - Use: Identify upgrade opportunities and pricing optimization
    - Endpoint: GET /metrics/pricing/tier-saturation
  - **Alert Cost Efficiency**:
    - Definition: Alerts delivered ÷ tier cost
    - Use: Assess pricing model effectiveness
    - Endpoint: GET /metrics/pricing/alert-cost-efficiency
  - **Upgrade Trigger Correlation**:
    - Definition: Which features actually drive upgrades
    - Use: Optimize feature development and marketing strategy
    - Endpoint: GET /metrics/pricing/upgrade-trigger-correlation
  - **Alert Storm Churn**:
    - Definition: Detect churn caused by alert fatigue
    - Use: Optimize alert frequency and relevance
    - Endpoint: GET /metrics/churn/alert-storm-correlation
- **User Interface Interaction Metrics**:
  - **Confidence Message Read Rate**:
    - Definition: How often users read confidence messages
    - Use: Assess message effectiveness and visibility
    - Endpoint: GET /metrics/ui/confidence-message-read-rate
  - **Attribution Panel Usage**:
    - Definition: How often users interact with attribution panel
    - Use: Assess attribution feature value
    - Endpoint: GET /metrics/ui/attribution-panel-usage
  - **Query Console Abandonment**:
    - Definition: How often users abandon queries before completion
    - Use: Identify user experience issues
    - Endpoint: GET /metrics/ui/query-console-abandonment
  - **Visualization Interaction Depth**:
    - Definition: User interaction depth with visualization components
    - Use: Assess visualization effectiveness and user engagement
    - Endpoint: GET /metrics/ui/visualization-interaction-depth
- **Metrics Integration**:
  - All new metrics integrated into existing API responses (anomalies, predictions, health, etc.)
  - Display key metrics in dashboard
  - Include metrics summary in weekly health reports
  - Provide dedicated metrics endpoints for advanced users and enterprise customers

### 2.48 New Time Series Algorithms
- **Functionality**: Introduce advanced time series algorithms enhancing anomaly detection, pattern recognition, and prediction capabilities
- **Matrix Profile (STOMP / SCRIMP++)**:
  - **Functionality**:
    - Detect novel patterns
    - Identify repetitive patterns (motifs)
    - Detect inconsistencies (discords, true anomalies)
  - **Benefits**:
    - Perfect fit with ring buffer
    - Deterministic
    - FFT-accelerated
    - Complements existing FFT + HFD analysis
    - Provides explainable anomalies
  - **Integration**:
    - Part of DSP analysis pipeline
    - Included in anomaly detection API responses
    - Visualize Matrix Profile results in dashboard
  - **Endpoint**: GET /metrics/:seller/matrix-profile
- **Bayesian Online Changepoint Detection (BOCPD)**:
  - **Functionality**:
    - Detect regime shifts, not just spikes
    - Output change probability
    - Naturally confidence-aware
  - **Use**:
    - Pricing change detection
    - Traffic source shifts
    - Bot activity start/stop
  - **Integration**:
    - Part of systemic anomaly detection
    - Included in insight engine
    - Display changepoint detection results in dashboard
  - **Endpoint**: GET /metrics/:seller/changepoints
- **Seasonal Hybrid ESD (S-H-ESD)**:
  - **Functionality**:
    - Robust to seasonality
    - Low computational cost
    - Deterministic
  - **Use**:
    - Excellent fallback when data sufficiency is borderline
    - Fast anomaly detection
  - **Integration**:
    - Part of adaptive sampling strategy
    - Used when data is insufficient
  - **Endpoint**: GET /metrics/:seller/seasonal-anomalies
- **Copula-based Dependency Drift Detection**:
  - **Functionality**:
    - Detect relationship breakage between metrics
    - Example: clicks ↔ conversions, views ↔ sales
    - Bots harder to fake multivariate relationships
  - **Benefits**:
    - Multivariate anomaly detection
    - Stronger bot detection capability
  - **Integration**:
    - Part of behavioral fingerprinting
    - Included in anomaly attribution
  - **Endpoint**: GET /metrics/:seller/dependency-drift
- **Dynamic Time Warping (DTW) Distance Baseline Comparison**:
  - **Functionality**:
    - Compare current window to normal signature
    - Low cost at aggregated resolution
    - Suitable for behavioral fingerprinting
  - **Benefits**:
    - Flexible pattern matching
    - Robust to temporal warping
  - **Integration**:
    - Part of behavioral fingerprinting
    - Visualize DTW distance in dashboard
  - **Endpoint**: GET /metrics/:seller/dtw-baseline
- **Algorithm Integration Requirements**:
  - All algorithms must be deterministic
  - All algorithms must support reproducibility hash
  - All algorithms must include confidence and sufficiency metrics
  - All algorithms must define parameters in centralized config
  - All algorithms must support aggregation-first principle

### 2.49 New Visualization Features
- **Functionality**: Introduce enhanced visualization components improving user understanding and system transparency
- **Real-time DAG Heatmap**:
  - **Functionality**:
    - Node color represents latency/cost/cache usage
    - Hover displays:
      - Invariant status
      - Reproducibility hash
      - Data sufficiency
    - Real-time query execution status updates
  - **Integration**:
    - Display in dashboard
    - Display in query console
  - **Technology**: Use D3.js or similar library for interactive visualization
- **Insight Timeline (Time-to-Insight Timeline)**:
  - **Functionality**:
    - Display complete flow from event ingestion to action
    - Event ingestion → anomaly → insight → alert → action
    - Display value delivery, not raw data
  - **Integration**:
    - Display in dashboard
    - Include in weekly health reports
  - **Technology**: Use timeline visualization library
- **Attribution Waterfall**:
  - **Functionality**:
    - Visual breakdown of anomaly score composition
    - Display before/after smoothing comparison
    - Highlight primary contributing factors
  - **Integration**:
    - Display in anomaly detection results
    - Display in dashboard
  - **Technology**: Use waterfall chart visualization library
- **Frequency Domain Explorer**:
  - **Functionality**:
    - FFT magnitude vs time
    - Click highlights periodicity source
    - Overlay bot fingerprint signatures
  - **Integration**:
    - Display in anomaly detection results
    - Display in behavioral fingerprinting panel
  - **Technology**: Use spectrum visualization library
- **Signal Quality Overlays**:
  - **Functionality**:
    - Confidence intervals
    - Sufficiency shading
    - Degraded mode markers
  - **Integration**:
    - Overlay on all time series charts
    - Display in dashboard
  - **Technology**: Use chart library overlay functionality
- **Visualization Requirements**:
  - All visualizations must be responsive design
  - All visualizations must support interaction (hover, click, zoom)
  - All visualizations must include confidence and sufficiency metrics
  - All visualizations must support export (PNG, SVG, PDF)
  - All visualizations must support lazy loading and performance optimization

### 2.50 Basic Tier Restoration to Production
- **Functionality**: Restore Basic Tier to production environment, ensuring visibility and selectability on landing page and admin panel
- **Landing Page Integration**:
  - Display Basic Tier card in pricing section
  - Basic Tier pricing: €29/month
  - Basic Tier feature list:
    - Enhanced features
    - Lower alert thresholds
    - Detailed insights
    - Faster response
    - Reduced branding on embeddable components
  - Basic Tier subscribe button: Click redirects to signup dialog, then to Stripe checkout
- **Admin Panel Integration**:
  - Display Basic Tier in pricing plan management interface
  - Allow users to upgrade to Basic Tier or downgrade from Basic Tier
  - Display current plan indicator for Basic Tier
  - Basic Tier feature access control
- **System Configuration**:
  - Define Basic Tier parameters in centralized config
  - Basic Tier limits:
    - Webhook deliveries: ≤ 5,000 monthly
    - Alert frequency: Medium
    - Prediction requests: Medium
    - Storage retention: 60 days
  - Basic Tier entitlements:
    - Enhanced feature access
    - Detailed insights
    - Faster response time
- **Payment Flow**:
  - User selects Basic Tier
  - Redirect to signup dialog
  - Complete signup
  - Redirect to Stripe Checkout
  - Complete payment
  - Automatically update to Basic Tier
  - Redirect to dashboard
- **Tier Reconciliation**:
  - Basic Tier included in tier reconciliation system
  - Admin can view Basic Tier users' usage and plan details
  - Basic Tier users can upgrade to Premium or downgrade to Free

### 2.51 Canonical Analytics Capability Registry
- **Functionality**: Formalized analytics discoverability system with registry object
- **Registry Object Structure**:
  - **id**: Unique identifier for analytics capability
  - **category**: Analytics category (DSP / Statistical / Dependency / Forecast / Fingerprint)
  - **inputRequirements**: Input requirements (min window, seasonality, multivariate)
  - **deterministicGuarantee**: Deterministic guarantee (true / partial)
  - **costClass**: Cost class (cheap / medium / heavy)
  - **explainabilityLevel**: Explainability level (high / medium / low)
  - **defaultTier**: Default tier for this capability (free / basic / premium)
- **Benefits**:
  - Auto-UI generation: Automatically generate UI components based on registry
  - Tier gating: Control feature access based on tier
  - Cost-based query planning: Optimize query execution based on cost class
  - Future extensibility: Enable ML insertion without chaos
- **Conceptual Model**: Think of it as pg_catalog for analytics
- **Integration**:
  - Registry stored in centralized configuration
  - Used by query execution engine for capability discovery
  - Used by UI for dynamic component generation
  - Used by tier reconciliation system for feature gating
- **Example Registry Entry**:
```json
{
  \"id\": \"fft_periodicity_detection\",
  \"category\": \"DSP\",
  \"inputRequirements\": {
    \"minWindow\": 100,
    \"seasonality\": false,
    \"multivariate\": false
  },
  \"deterministicGuarantee\": true,
  \"costClass\": \"medium\",
  \"explainabilityLevel\": \"high\",
  \"defaultTier\": \"basic\"
}
```

### 2.52 Visualization to Decision Mapping
- **Functionality**: Map each visualization component to actionable decisions and system behavior
- **Mapping Structure**:
  For each visualization, define:
  - **Primary Question**: Primary question it answers
  - **Decision Enabled**: Decision it enables
  - **API Endpoint**: API endpoint it depends on
  - **Alert Spawning**: Alert it can spawn
  - **Insight State Transitions**: Insight state transitions it triggers
- **Example Mapping**:
  \"FFT Heatmap → identifies periodic manipulation → feeds fingerprint drift → escalates seller health risk\"
- **Benefits**:
  - Stops UI from becoming \"cool but noisy\"
  - Ensures actionable insights
  - Reduces alert fatigue
  - Improves user decision-making
- **Integration**:
  - Mapping stored in centralized configuration
  - Used by UI to display contextual information
  - Used by insight engine to trigger state transitions
  - Used by alert system to spawn relevant alerts
- **Example Visualization Mapping**:
```json
{
  \"visualizationId\": \"fft_heatmap\",
  \"primaryQuestion\": \"Are there periodic manipulation patterns?\",
  \"decisionEnabled\": \"Investigate seller behavior for bot activity\",
  \"apiEndpoint\": \"GET /metrics/:seller/anomalies\",
  \"alertSpawning\": \"periodic_manipulation_detected\",
  \"insightStateTransitions\": [\"generated\", \"confirmed\"]
}
```

### 2.53 User Confirmation and Dismissal Signals
- **Functionality**: Post-insight outcome tracking system with user confirmation/dismissal signals
- **Core Components**:
  - **User Confirmation Signals**: Track when users confirm insights as accurate
  - **User Dismissal Signals**: Track when users dismiss insights as inaccurate
  - **Insight Precision Score**: Internal metric measuring insight accuracy over time
- **Benefits**:
  - Tune thresholds per seller based on feedback
  - Reduce alert fatigue by learning from dismissals
  - Surface which algorithms actually help users
  - Improve system accuracy through continuous learning
- **Integration**:
  - User feedback buttons on insight cards (Confirm / Dismiss)
  - Track feedback in database with timestamps
  - Calculate insight precision score per seller, per algorithm
  - Use feedback to adjust alert thresholds in centralized config
  - Display precision scores in admin analytics dashboard
- **Feedback Loop**:
  1. User receives insight
  2. User confirms or dismisses insight
  3. System records feedback with timestamp
  4. System calculates insight precision score
  5. System adjusts thresholds based on precision score
  6. System improves future insights
- **Endpoints**:
  - POST /insights/:id/confirm: Confirm insight as accurate
  - POST /insights/:id/dismiss: Dismiss insight as inaccurate
  - GET /insights/precision: Get insight precision scores
  - GET /admin/insights/analytics: Get insight analytics (admin only)

### 2.54 Authentication and Signup Flow Fixes
- **Functionality**: Fix login issue and improve page transition speed
- **Login Issue Fix**:
  - Problem: Existing users receiving \"Signup Failed user already registered\" message when trying to log in
  - Solution: Properly distinguish between login and signup flows, allow existing users to log in directly without creating new profiles
  - Implementation: Validate user existence before showing signup error, redirect to login flow if user already exists
- **Page Transition Speed Improvement**:
  - Problem: Too much delay between page transition from landing page to dashboard after signup
  - Solution: Optimize page loading, reduce unnecessary API calls, implement efficient state management
  - Implementation: Use lazy loading, optimize bundle size, implement efficient routing, reduce render blocking

### 2.55 Pricing Tier Selection Enhancement
- **Functionality**: Allow users to select Free Tier or Basic Tier during signup
- **Implementation**:
  - Add tier selection dropdown or radio buttons on \"Create Your Account\" modal
  - Options: Free Tier (€0) and Basic Tier (€29/month)
  - Default selection: Free Tier
  - Display tier features and pricing information
  - Store selected tier in signup form state
  - Pass selected tier to backend during signup
  - Redirect to appropriate flow based on selected tier:
    - Free Tier: Direct to dashboard
    - Basic Tier: Direct to Stripe checkout, then dashboard

### 2.56 Pricing Updates and Visual Improvements
- **Functionality**: Update pricing tier names, costs, and visual layout
- **Pricing Tier Renaming**:
  - Old \"Basic\" → New \"Free\"
  - Old \"Free\" → New \"Basic\"
  - Apply renaming across landing page and admin panel
- **Basic Tier Cost Update**:
  - Update Basic Tier cost from €50 to €29 per month
  - Update pricing display on landing page and admin panel
- **Visual Gap Between Pricing Cards**:
  - Add small gap (e.g., 1rem or 16px) between pricing cards
  - Apply on both landing page and admin panel
  - Improve visual separation and readability

## 3. Technical Architecture

### 3.1 Data Processing
- Pre-allocated fixed-size contiguous ring buffer for real-time data storage
- Circular access using index mod window size
- Zero per-event reallocation, no per-event object churn
- Streaming analytics processing
- DSP algorithm integration (FIR, FFT, HFD)
- Batch processing support for high-throughput scenarios
- Deterministic computation pipeline with fixed random seeds and consistent ordering
- **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events
- **New Algorithm Integration**: Matrix Profile, BOCPD, S-H-ESD, Copula dependency drift, DTW baseline comparison

### 3.2 Caching Strategy with Temporal Locality
- Probabilistic caching mechanism
- **lastComputedAt** timestamp tracking
- Probabilistic refresh only on query
- Dynamic TTL adjustment (defined in centralized config)
- Hot/cold data differentiation
- Short-term cache layer for frequently accessed computations
- **Cache Contribution Ratio Monitoring**: Track percentage of results derived from cache

### 3.3 API Design
- RESTful API architecture
- Real-time event ingestion
- Batch ingestion endpoints
- On-demand metrics querying
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
- **Query execution endpoint**: POST /query for API-driven query requests
- **New metrics endpoints**: For querying SNR, ESS, window stability, temporal coverage, entropy drift, query performance, reproducibility, user behavior, pricing, and UI interaction metrics
- **New algorithm endpoints**: Matrix Profile, changepoint detection, seasonal anomalies, dependency drift, DTW baseline

### 3.4 Dashboard Components
- Mode switching functionality (light/dark theme)
- Time series charts with proper timestamp handling:
  - Internal numeric timestamps
  - Formatted display in tooltips and axis ticks
  - Clear visual separation between historical and predicted data
  - Non-overlapping labels for multi-day data spans
- Confidence interval visualization (± intervals around predictions)
- Real-time alert notifications
- Event log with pagination/infinite scroll
- **Time Window Display Panel**: Display start time, end time, window size for current analysis
- **Data Sufficiency Metrics**: Visual indicators for data completeness (progress bars, status badges)
- **Rate Limit and Backpressure Dashboard**: Display current rate limit status, remaining quota, backpressure metrics, queue depth visualization
- **Confidence and Sufficiency-Aware Messages**: Contextual messages explaining result reliability
- **Embeddable Component Support**: Integration for embeddable widgets
- **Insight Lifecycle Visualization**: Display insight status with visual indicators and state transition history
- **Configuration Version Display**: Display current configuration version in use
- **Signal Quality Metrics**: Display edge case flags and degraded mode warnings
- **System Health Panel**: Separate panel for systemic anomaly monitoring
- **Task Completion Progress Widget**: Display overall task completion percentage for current user
- **Assigned Tasks Widget**: Display list of tasks assigned to current user with status indicators and quick update functionality
- **Main Area Navigation**: Navigation styled in main area (no traditional sidebar)
- **Admin Tier Reconciliation Panel**: Display tier state, usage metrics, reconciliation controls (admin only, display all user data)
- **Admin Pricing Plan Management Panel**: Display pricing plans, current plan, upgrade/downgrade options, cancel subscription button (admin panel)
- **Lazy Loading**: All dashboard components implement lazy loading for performance
- **Behavioral Fingerprinting Capability**: Implement behavioral fingerprinting functionality on dashboard, displaying seller behavior pattern analysis results
- **New Visualization Components**:
  - Real-time DAG Heatmap
  - Insight Timeline
  - Attribution Waterfall
  - Frequency Domain Explorer
  - Signal Quality Overlays
- **New Metrics Display**:
  - Signal-to-Noise Ratio (SNR)
  - Effective Sample Size (ESS)
  - Window Stability Score
  - Temporal Coverage
  - Entropy Drift
  - Query performance metrics
  - User behavior metrics
  - Pricing metrics

### 3.5 Real-time Integration
- Supabase Realtime for real-time data streaming
- WebSocket connections for dashboard updates
- AnomalyAlert component integration
- Real-time task updates and synchronization
- Real-time team collaboration features
- **Real-time Metrics Updates**: Real-time updates for new metrics

### 3.6 Reporting and Pricing System
- Automated weekly report generation engine
- Alert-driven pricing tier calculation logic (data-driven, not logic-based)
- Report delivery system (email, notifications, API)
- Pricing tier API endpoints
- One-click export functionality integration
- Configuration snapshot storage per report
- **Tier Reconciliation System**: Admin-triggered tier recalculation based on usage and policy
- **Pricing Plan Management**: User-facing interface for plan upgrades, downgrades, and cancellations
- **Basic Tier Integration**: Basic Tier included in pricing system
- **New Metrics Integration**: Include new metrics summary in weekly reports

### 3.7 Deterministic Reproducibility System
- Fixed random seed management
- Deterministic ordering and computation order
- Reproducibility hash generation for verification
- Input/output logging for audit trail
- **System Invariant**: Determinism guarantee - same input always produces same output
- **Reproducibility Drift Rate Monitoring**: Track reproducibility across versions/configs

### 3.8 Centralized Configuration System
- **Centralized Configuration Storage**: Single source of truth for all system parameters
- **Configuration Parameters**:
  - Window sizes (ring buffer size, analysis window size)
  - Thresholds (anomaly score threshold, confidence cutoffs, signal quality thresholds)
  - TTLs (hot seller TTL, cold seller TTL, cache TTL)
  - Tier limits (alert frequency limits per tier, feature access per tier)
  - Confidence cutoffs (minimum confidence for predictions, minimum data sufficiency)
  - Alert levels (defined by configuration table, not conditional statements)
  - Sampling rates (high/medium/low activity sampling rates)
  - Embed rate limits per tier
  - Retention policies per tier
  - Edge case detection thresholds
  - Funnel template definitions
  - Webhook retry policies
  - Pricing policy rules for tier determination
  - **New algorithm parameters**: Matrix Profile, BOCPD, S-H-ESD, Copula, DTW parameters
  - **New metrics thresholds**: SNR, ESS, window stability, temporal coverage, entropy drift thresholds
- **Dynamic Expressions**: Use dynamic expressions where applicable, avoid magic numbers
- **Data-Driven Design**: Alert levels, tiers, thresholds all defined by configuration data, not hardcoded logic
- **Version Control**: All configuration changes versioned with timestamps
- **Audit Trail**: Full audit log of configuration changes
- **Config Sensitivity Monitoring**: Track impact of configuration changes on outputs

### 3.9 Modular and Composable Architecture
- **Composability Focus**: Design for composability, not reuse
- **Modular Components**: Separate modules for DSP, caching, alerts, reports, export, embed, config management, insight lifecycle, edge case detection, systemic anomaly detection, authentication, team management, project management, task management, billing, webhook management, funnel analysis, tier reconciliation, pricing plan management, query execution model, multi-threaded scheduling, federated query, new algorithm modules, new metrics modules, new visualization modules
- **Clean Refactoring**: Eliminate redundancy, centralize common logic
- **Zero Magic Numbers**: All constants defined in centralized config

### 3.10 Data Minimization and Privacy Architecture
- **Hard Invariants**: No names, emails, addresses in analysis path
- **Seller IDs**: Always opaque/proxy keys, never direct identifiers
- **Event Payloads**: Stripped to behavioral signals only, no PII
- **Aggregation-First**: All analytics operate on aggregated data
- **Data Minimization Enforcement**: Automated checks to prevent PII leakage

### 3.11 Retention Policy System
- **Tier-Based Retention**: Retention periods defined by pricing tier in centralized config
- **Explicit Expiration Windows**: Explicit expiration timestamps for all data
- **Automatic Decay**: Automatic data deletion based on retention policy
- **Retention Tiers**:
  - Free Tier: 30 days retention
  - Basic Tier: 60 days retention
  - Premium Tier: 90 days retention
- **Policy Enforcement**: Retention as policy, not configuration - enforced at system level

### 3.12 System Invariants (Codified)
- **Determinism Guarantee**: Same input always produces same output
- **No Silent Recomputation**: All recomputations logged and audited
- **No Hidden Thresholds**: All thresholds defined in centralized config
- **All Alerts Reference Data Sufficiency**: Every alert must include data sufficiency status
- **Data Minimization**: No PII in analysis path, seller IDs always opaque, event payloads stripped to behavioral signals only
- **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events
- **Edge Cases as Signals**: Edge cases treated as low-confidence signal mechanisms, not errors
- **Systemic Anomaly Separation**: System health issues flagged separately from seller analytics
- **Webhooks as Side Effects**: Webhooks are side effects of insight state changes, never as input
- **Funnel Determinism**: Funnel analysis must be deterministic and reproducible
- **Tier as Derived State**: Tier always derived from usage and policy, never manually assigned
- **Admin-Only Tier Data Access**: Tier reconciliation data and all user plan details accessible only to admin users
- **Query Plan Determinism**: All query plans must compile to deterministic DAG
- **Execution Isolation**: Multi-threaded execution must guarantee determinism and isolation
- **Algorithm Determinism**: All new algorithms must be deterministic
- **Metrics Consistency**: All new metrics must be consistently calculated and reported

### 3.13 Encryption Strategy
- **At Rest**:
  - Event storage: Encrypted
  - Configuration tables: Encrypted
  - Reports: Encrypted
  - Usage logs: Encrypted
  - User credentials: Encrypted
  - Team data: Encrypted
  - Project data: Encrypted
  - Task data: Encrypted
  - Webhook configurations: Encrypted
  - Tier state and entitlements: Encrypted
- **In Transit**:
  - API traffic: TLS everywhere, no exceptions
  - Widget embeds: TLS required
  - Webhooks: TLS required
  - Real-time connections: TLS required
- **Secrets and Keys**:
  - API keys: Encrypted, rotatable, scoped, revocable
  - Webhook secrets: Encrypted, rotatable, scoped, revocable
  - Embed tokens: Encrypted, rotatable, scoped, revocable
  - Stripe API keys: Encrypted, rotatable
- **Not Encrypted**:
  - Derived analytics: Not encrypted (aggregated, non-sensitive)
  - Aggregated metrics: Not encrypted (aggregated, non-sensitive)
  - Scores: Not encrypted (aggregated, non-sensitive)
- **Key Rotation**: Automatic key rotation policies defined in centralized config
- **Access Control**: Role-based access control for encrypted data

### 3.14 Frontend Architecture
- **Technology Stack**: React + Tailwind CSS + Shadcn
- **Component Structure**: Modular, reusable components
- **Responsive Design**: Mobile-first approach with desktop breakpoints
- **Dialog Components**: HTML dialog elements for call-to-action interactions
  - **Dialog Close Behavior**: Dialogs can be closed by clicking cancel button or clicking anywhere outside dialog
- **Navigation Design**: Navigation styled in main area (no traditional sidebar)
- **Styling Consistency**: Maintain existing application design system and styling patterns
- **Accessibility**: WCAG compliant, keyboard navigation support
- **Performance**: Optimized loading, lazy loading for images and components
- **Design Inspiration**: Modern, clean aesthetic inspired by design patterns similar to nfinitepaper.com
- **Lazy Loading Implementation**: Apply lazy loading to all pages and major components
- **Page Transitions**: Use motion library for smooth page transitions and subtle animations
- **Animation Library**: Use motion library (Framer Motion) for page transitions and component animations
- **Animation Features**:
  - Subtle, smooth transitions
  - Non-intrusive animations enhancing user experience
  - Consistent animation timing and easing across all pages
  - Fade-in and slide-in effects for page transitions
  - Optimized animation performance to avoid jank
- **New Visualization Libraries**: D3.js, timeline libraries, waterfall chart libraries, spectrum visualization libraries

### 3.15 Authentication and Authorization Architecture
- **Authentication Method**: JWT token-based authentication
- **Session Management**: Secure session handling with token refresh
- **Role-Based Access Control (RBAC)**:
  - Admin role: Full permissions including tier reconciliation, pricing plan management, admin panel access, and viewing all user tier data
  - Member role: Limited permissions
- **Permission Enforcement**: Server-side permission checks for all protected endpoints
- **Token Security**: HTTP-only cookies for token storage, CSRF protection
- **Post-Signup Flow**:
  - Free Tier users: Redirect to dashboard page after successful signup
  - Paid Tier users: Redirect to Stripe checkout after successful signup, then to dashboard page after payment completion
- **Admin Panel Access Control**: Proper role validation ensuring admin users can access admin panel without error messages
- **Password Reset Flow**:
  - User clicks \"Forgot password? Reset password\" link on login dialog
  - User is redirected to password reset page or dialog
  - User enters email address
  - System sends password reset email with secure token
  - User clicks link in email and sets new password
  - User is redirected to login page

### 3.16 Team Collaboration Architecture
- **Multi-tenancy**: Team-based data isolation
- **Real-time Collaboration**: Supabase Realtime for real-time team updates
- **Access Control**: Team-level and project-level access control
- **Invitation System**: Email-based member invitation with secure tokens
- **Data Visibility Control**: Admin users can view all user data and plan details; regular users cannot

### 3.17 Payment Processing Architecture
- **Payment Gateway**: Stripe integration
- **Subscription Management**: Stripe Subscriptions API
- **Webhook Handling**: Secure webhook handling with signature verification
- **Tier Access Control**: Automatic feature access based on subscription tier
- **Payment Security**: PCI DSS compliant payment processing (handled by Stripe)
- **Payment Notifications**: Display success/failure notifications, auto-dismiss after 5 seconds
- **Configuration Validation**: Validate Stripe API keys before processing payments
- **Error Handling**: Display clear error messages when payment system not configured
- **Plan Change Handling**: Handle subscription upgrades, downgrades, and cancellations through Stripe API
- **Landing Page Payment Flow Integration**:
  - Free Tier Start button redirects to signup dialog, then to dashboard
  - Paid Tier Subscribe buttons redirect to signup dialog, then to Stripe checkout, then to dashboard after payment completion
- **Basic Tier Payment Integration**: Basic Tier included in payment flow

### 3.18 Webhook Architecture
- **Async Delivery**: Webhook delivery is asynchronous, not blocking main analytics flow
- **Retry Mechanism**: Retry strategy with exponential backoff
- **Dead Letter Queue**: Persistently failed webhooks enter dead letter queue for manual review
- **Delivery Logging**: Full webhook delivery history and status tracking
- **Signature Verification**: All webhook payloads verified using HMAC signatures
- **Rate Limiting**: Rate limits per webhook endpoint to prevent abuse

### 3.19 Funnel Analysis Architecture
- **Declarative Definition**: Funnels declaratively defined in centralized config
- **Template System**: Predefined funnel templates per tier
- **Step Constraints**: Steps must be temporally monotonic, windows must align
- **Sufficiency Checks**: Data sufficiency validation per step
- **Dropoff Attribution**: Detailed dropoff reason analysis per step
- **Deterministic Computation**: Funnel analysis must be deterministic and reproducible

### 3.20 Tier Reconciliation Architecture
- **Derived State Model**: Tier always computed from usage metrics and pricing policy
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
  - Load current pricing configuration
  - Apply grace rules
  - Compute effective tier
- **State Persistence**:
  - effectiveTier
  - pricingVersion
  - computedAt
  - source (scheduled or admin_reconcile)
- **Entitlement System**:
  - Separate from tier computation
  - Explicit exceptions with expiration and reason
  - Admin-granted and auditable
- **Audit Trail**: Full logging of all tier changes and reconciliations
- **Access Control**: Tier reconciliation data and all user plan details accessible only to admin users
- **Basic Tier Integration**: Basic Tier included in tier reconciliation system

### 3.21 Performance Optimization Architecture
- **Lazy Loading Strategy**:
  - Code splitting for all major pages and components
  - Dynamic imports for route-based code splitting
  - Lazy loading for images and media assets
  - Deferred loading for non-critical components
- **Page Transition System**:
  - Motion library (Framer Motion) integration for smooth transitions
  - Consistent animation timing across all pages
  - Fade-in and slide-in effects for page transitions
  - Optimized animation performance to prevent layout shift
- **Animation Performance**:
  - GPU-accelerated animations using transform and opacity
  - RequestAnimationFrame for smooth 60fps animations
  - Avoid animating properties that trigger layout
  - Preload critical animation assets
- **Loading States**:
  - Skeleton screens for lazy-loaded content
  - Progressive loading indicators
  - Smooth transitions between loading and loaded states

### 3.22 Seller Page Architecture
- **Data Loading**: Dynamic data loading from database, no static or placeholder data
- **Empty State Handling**: Graceful empty state display when no sellers exist
- **Real-time Updates**: Real-time seller data updates using Supabase Realtime
- **Performance**: Optimized queries and pagination for large seller datasets
- **Error Handling**: Comprehensive error handling for data loading failures

### 3.23 Query Execution Architecture
- **Query Plan Abstraction**: Explicit QueryPlan structure with SourceNode, TransformNode, AggregateNode, ScoreNode, OutputNode
- **Deterministic DAG Compilation**: Each request compiles to deterministic Directed Acyclic Graph
- **Controlled Execution Engine**: Execute query plans through controlled execution engine
- **Multi-threading Support**: Support multi-threaded parallel execution
- **Scheduling System**: Tier-aware queues, backpressure signals, deadline-aware execution
- **Performance Monitoring**: Query plan cost accuracy, node-level execution skew, parallelism efficiency monitoring

### 3.24 Database Architecture Enhancements
- **Query Execution Table**:
  - Table name: query_execution
  - Fields: id, seller_id, query_type, operator_chain, input_window, status, result_reference, started_at, completed_at, error
  - Purpose: Track analytics computation DAG, support distributed queries
- **Event Aggregation Table**:
  - Table name: events_agg_daily
  - Fields: seller_id, metric_type, day, total_value, count, anomaly_score_avg
  - Purpose: Reduce computation overhead for large sellers, support time window queries
- **Cached Metrics Table**:
  - Table name: cached_metrics
  - Fields: id, seller_id, metric_type, cached_value, last_computed, ttl_seconds, version
  - Purpose: Database-level probabilistic caching, support cross-service cache sharing
- **Ring Buffer History Table**:
  - Table name: ring_buffer_history
  - Fields: id, seller_id, metric_type, timestamp, value, created_at
  - Purpose: Debugging, reproducibility, cross-service analytics
- **Pipeline Version Table**:
  - Table name: pipeline_versions
  - Fields: id, version, description, operators, effective_at, created_by, created_at
  - Purpose: Pipeline version control, support reproducibility and auditability
- **Ingestion Batch Table**:
  - Table name: ingestion_batches
  - Fields: id, batch_uuid, seller_id, event_count, ingested_at, status
  - Purpose: Avoid duplicate event processing during multi-node ingestion
- **New Metrics Table**:
  - Table name: metrics_extended
  - Fields: id, seller_id, metric_type, snr, ess, window_stability, temporal_coverage, entropy_drift, timestamp, created_at
  - Purpose: Store new metrics data
- **New Algorithm Results Table**:
  - Table name: algorithm_results
  - Fields: id, seller_id, algorithm_type, result_data, timestamp, created_at
  - Purpose: Store Matrix Profile, BOCPD, S-H-ESD, Copula, DTW algorithm results

### 3.25 Analytics Capability Registry Architecture
- **Registry Storage**: Stored in centralized configuration system
- **Registry Schema**: JSON schema defining analytics capabilities
- **Auto-UI Generation**: Automatically generate UI components based on registry
- **Tier Gating**: Control feature access based on tier and registry
- **Cost-Based Planning**: Use cost class for query optimization
- **Extensibility**: Enable future ML insertion without chaos

### 3.26 Visualization Decision Mapping Architecture
- **Mapping Storage**: Stored in centralized configuration system
- **Mapping Schema**: JSON schema defining visualization to decision mappings
- **Contextual Information**: Display contextual information in UI based on mappings
- **State Transition Triggers**: Use mappings to trigger insight state transitions
- **Alert Spawning**: Use mappings to spawn relevant alerts

### 3.27 User Feedback Architecture
- **Feedback Collection**: User feedback buttons on insight cards
- **Feedback Storage**: Store feedback in database with timestamps
- **Precision Scoring**: Calculate insight precision score per seller, per algorithm
- **Threshold Adjustment**: Use feedback to adjust alert thresholds
- **Analytics Dashboard**: Display precision scores in admin analytics dashboard

## 4. System Features
- Lightweight and elegant design
- High performance and scalability
- Real-time processing capabilities
- Intelligent caching optimization with temporal locality
- Adaptive resource management
- Comprehensive analytics and insights
- Type-safe implementation
- Enhanced user experience with real-time updates
- Deterministic and reproducible anomaly detection
- Explicit time window definitions and data sufficiency metrics
- Rate limit and backpressure visibility
- Extensible decision hooks for custom business logic
- Automated weekly health reports with insight summaries
- Dynamic alert-driven pricing tiers with fixed defaults
- Dedicated endpoints for selling anomaly and prediction results
- One-click export functionality (PDF/Email)
- Embeddable components for external integrations with soft guardrails
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
- Webhook registration and management as side effects of insight state changes
- Declarative, deterministic, reproducible funnel analysis
- Navigation design in main area (no traditional sidebar)
- Landing page design inspired by modern aesthetic similar to nfinitepaper.com
- Webhook volume directly mapped to pricing tiers for transparent monetization
- Admin tier reconciliation system with derived state model and entitlements
- User-facing pricing plan management with upgrade/downgrade/cancel capabilities
- Clean seller page with real data, no placeholder content
- Lazy loading implementation across all pages and components
- Smooth page transitions and subtle animations using motion library
- Optimized animation performance for 60fps user experience
- Seamless landing page to signup to payment flow integration
- Proper admin panel access control with no error messages for admin users
- **Admin-only access to tier reconciliation data and all user plan details**
- **Password reset functionality on login dialog with link**
- **Query Execution Model**: Explicit query plan abstraction, upgrading system from API service to analytics engine
- **Multi-threaded Scheduled Execution**: Explicit multi-threading and scheduled execution ensuring execution isolation and predictable performance
- **Federated Query Architecture**: Support federated queries across systems with pluggable data sources
- **Cost-Optimized Queries**: Lightweight cost-optimized query planning with classic query planning approach
- **Deterministic Parallelism Guarantees**: Deterministic parallel execution across threads with stable execution order
- **Executable System Invariants**: Transform system invariants into executable runtime contracts
- **Admin Panel Page Optimizations**: Free Tier card button color adjustment, feature list optimization, text modifications
- **Dashboard Feature Enhancements**: Behavioral fingerprinting capability implementation, rate limit and backpressure visibility
- **Database Architecture Enhancements**: Query execution table, event aggregation table, cached metrics table, ring buffer history table, pipeline version table, ingestion batch table, new metrics table, new algorithm results table
- **New Metrics System**: Signal-to-Noise Ratio, Effective Sample Size, Window Stability, Temporal Coverage, Entropy Drift, query performance, reproducibility, user behavior, pricing, and UI interaction metrics
- **New Time Series Algorithms**: Matrix Profile, BOCPD, S-H-ESD, Copula dependency drift, DTW baseline comparison
- **New Visualization Features**: Real-time DAG Heatmap, Insight Timeline, Attribution Waterfall, Frequency Domain Explorer, Signal Quality Overlays
- **Basic Tier Restoration**: Basic Tier visible and selectable on landing page and admin panel
- **Canonical Analytics Capability Registry**: Formalized analytics discoverability with registry object for auto-UI generation, tier gating, and cost-based query planning
- **Visualization to Decision Mapping**: Each visualization mapped to actionable decisions, API endpoints, alert spawning, and insight state transitions
- **User Confirmation and Dismissal Signals**: Post-insight outcome tracking with user feedback and insight precision scoring for continuous improvement
- **Authentication and Signup Flow Fixes**: Fixed login issue for existing users, improved page transition speed from landing page to dashboard
- **Pricing Tier Selection Enhancement**: Users can select Free Tier or Basic Tier during signup on \"Create Your Account\" modal
- **Pricing Updates**: Basic Tier renamed to Free Tier, Free Tier renamed to Basic Tier, Basic Tier cost updated to €29/month, small gap added between pricing cards

## 5. System Charter

### 5.1 Purpose and Scope
This System Charter defines fundamental principles, invariants, and governance rules governing Lush Analytics platform. It serves as authoritative reference for all system design, implementation, and operational decisions. All system components, modules, and behaviors must conform to principles and invariants articulated herein.

### 5.2 Core Principles

#### 5.2.1 Determinism and Reproducibility
System guarantees deterministic behavior: same input must always produce same output. This principle ensures auditability, debuggability, and trust. All computations use fixed random seeds, deterministic ordering, and consistent ordering. Reproducibility hashes generated for all analysis outputs to enable verification.

#### 5.2.2 Data Minimization and Privacy by Design
System enforces strict data minimization as hard invariant. No personally identifiable information (PII) such as names, emails, or addresses may enter analysis path. Seller identifiers always opaque proxy keys. Event payloads stripped to behavioral signals only. All analytics operate on aggregated data, never on raw individual events. This principle is non-negotiable and enforced at architectural level.

#### 5.2.3 Transparency and Explainability
System provides full transparency for its decision-making processes. All analysis outputs include explicit time window definitions, data sufficiency metrics, confidence messages, signal quality assessments, and configuration version references. Users must understand what system knows, doesn't know, and confidence in its outputs.

#### 5.2.4 Configuration as Single Source of Truth
All system parameters, thresholds, and behaviors defined in centralized configuration system. No magic numbers or hardcoded logic allowed. Configuration changes versioned, timestamped, and auditable. This principle ensures consistency, maintainability, and governance.

#### 5.2.5 Composability Over Reusability
System prioritizes composability in its architecture. Modules designed to be composable and extensible, not just reusable. This principle enables flexibility, adaptability, and long-term maintainability.

#### 5.2.6 Edge Cases as Signals, Not Errors
System treats edge cases (constant zero values, perfect periodicity, impossible regularity) as low-confidence signal mechanisms, not errors or bugs. Edge cases presented as signal quality indicators, providing valuable information about data quality and behavioral patterns.

#### 5.2.7 Separation of Concerns: Seller Analytics vs System Health
Seller analytics and systemic anomalies strictly separated. System health issues (pattern changes, timestamp drift, ingestion bursts) flagged independently, not polluting seller-level analytics. This separation ensures clarity and prevents false positives in seller-facing outputs.

#### 5.2.8 Webhooks as Side Effects
Webhooks are side effects of insight state changes, never as input. Webhooks only observe computed facts, never trigger recomputation. This principle maintains determinism and auditability.

#### 5.2.9 Funnel Determinism
Funnel analysis must be deterministic and reproducible. Funnels declaratively defined in centralized config, steps must be temporally monotonic, windows must align. This principle ensures reliability and auditability of funnel analysis.

#### 5.2.10 Tier as Derived State
Pricing tiers are derived state, not manual attributes. Tiers always computed from usage metrics, pricing policy, and grace rules. Admins trigger computation, not assignment. This principle ensures pricing honesty, explicit exceptions, and clean audits.

#### 5.2.11 Admin-Only Access to Sensitive Data
Tier reconciliation data and all user plan details accessible only to admin users. Regular users cannot view or access this information. This principle ensures data privacy and proper access control.

#### 5.2.12 Query Execution Model First
System adopts explicit query plan abstraction, upgrading system from API service to analytics engine. Query plans compile to deterministic DAG, executed through controlled execution engine. This principle enables distributed queries, federated queries, and advanced query optimization.

#### 5.2.13 Algorithm Determinism and Reproducibility
All new time series algorithms must be deterministic, support reproducibility hash, and include confidence and sufficiency metrics. This principle ensures reliability and auditability of algorithm outputs.

#### 5.2.14 Metrics Consistency and Observability
All new metrics must be consistently calculated and reported, integrated into existing API responses and dashboard. This principle ensures system observability and user trust.

### 5.3 System Invariants

Following invariants codified and enforced at system level. Violation of these invariants constitutes system failure and must be prevented by design:

1. **Determinism Guarantee**: Same input always produces same output.
2. **No Silent Recomputation**: All recomputations logged and audited.
3. **No Hidden Thresholds**: All thresholds defined in centralized config.
4. **All Alerts Reference Data Sufficiency**: Every alert must include data sufficiency status.
5. **Data Minimization**: No PII in analysis path; seller IDs always opaque; event payloads stripped to behavioral signals only.
6. **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events.
7. **Edge Cases as Signals**: Edge cases treated as low-confidence signal mechanisms, not errors.
8. **Systemic Anomaly Separation**: System health issues flagged separately from seller analytics.
9. **Webhooks as Side Effects**: Webhooks are side effects of insight state changes, never as input.
10. **Funnel Determinism**: Funnel analysis must be deterministic and reproducible.
11. **Tier as Derived State**: Tier always derived from usage and policy, never manually assigned.
12. **Admin-Only Tier Data Access**: Tier reconciliation data and all user plan details accessible only to admin users.
13. **Query Plan Determinism**: All query plans must compile to deterministic DAG.
14. **Execution Isolation**: Multi-threaded execution must guarantee determinism and isolation.
15. **Algorithm Determinism**: All new algorithms must be deterministic.
16. **Metrics Consistency**: All new metrics must be consistently calculated and reported.

### 5.4 Governance and Change Management

All changes to System Charter require formal review and approval. Configuration changes versioned and auditable. System invariants must not be violated under any circumstances. This governance framework ensures stability, trust, and long-term system integrity.

## 6. Public Trust and Safety Statement

### 6.1 Our Commitment to Trust and Safety

Lush Analytics built on foundation of trust, transparency, and safety. We recognize our users entrust us with sensitive behavioral data, and we take this responsibility seriously. This Public Trust and Safety Statement articulates our commitments and measures we implement to protect user data and maintain system integrity.

### 6.2 Data Privacy and Minimization

We enforce strict data minimization as core architectural principle. No personally identifiable information (PII) such as names, emails, or addresses collected, stored, or processed in analysis path. Seller identifiers always opaque proxy keys ensuring anonymity. Event payloads stripped to behavioral signals only, all analytics operate on aggregated data. This approach minimizes privacy risks and ensures compliance with data protection regulations.

### 6.3 Encryption and Data Protection

We employ comprehensive encryption strategy to protect data at rest and in transit:

- **At Rest**: Event storage, configuration tables, reports, usage logs, user credentials, team data, project data, task data, webhook configurations, and tier state encrypted using industry-standard encryption algorithms.
- **In Transit**: All API traffic, widget embeds, webhooks, and real-time connections encrypted using TLS, no exceptions.
- **Secrets and Keys**: API keys, webhook secrets, embed tokens, and Stripe API keys encrypted, rotatable, scoped, and revocable. Automatic key rotation policies enforced.

Derived analytics, aggregated metrics, and scores not encrypted by design as they are aggregated and non-sensitive.

### 6.4 Determinism and Auditability

We guarantee deterministic behavior: same input always produces same output. This ensures auditability, debuggability, and trust. All computations logged, reproducibility hashes generated for verification. Configuration changes versioned and auditable, providing full audit trail.

### 6.5 Transparency and Explainability

We provide full transparency for our decision-making processes. All analysis outputs include explicit time window definitions, data sufficiency metrics, confidence messages, signal quality assessments, and configuration version references. Users always know what system knows, doesn't know, and confidence in its outputs.

### 6.6 Retention and Data Lifecycle

We enforce tier-based retention policies with explicit expiration windows. Data automatically deleted based on retention policy, ensuring compliance with data protection regulations and minimizing long-term storage risks. Retention periods clearly communicated and enforced at system level.

### 6.7 Security Incident Response

We maintain formal security incident response plan. In event of security incident, we will promptly investigate, mitigate, and communicate with affected users. We committed to continuous improvement and learning from security incidents.

### 6.8 Compliance and Certifications

We committed to complying with relevant data protection regulations including GDPR and CCPA. We continuously monitor regulatory developments and adjust our practices accordingly.

### 6.9 Contact and Accountability

For security concerns, questions, or incident reporting, users can contact our security team at security@lushanalytics.com. We accountable to our users and committed to maintaining their trust.

## 7. Signal Semantics Glossary

This glossary defines precise meaning of key terms used throughout system. These definitions are authoritative and must be consistently applied across all system components, documentation, and user-facing interfaces.

### 7.1 Anomaly

**Definition**: Anomaly is statistically significant deviation from expected behavior pattern, quantified as probability score in [0, 1] range. Anomaly score of 0 indicates no deviation; score of 1 indicates maximum deviation.

**Composition**: Anomaly score calculated using Bayesian/probabilistic combination of:
- **FFT Peak Contribution**: Periodic spikes detected through Fast Fourier Transform analysis.
- **HFD Complexity Contribution**: Time series complexity measured by Higuchi Fractal Dimension.
- **Trend Deviation Contribution**: Deviation from smoothed trend line.
- **Smoothed Deviation Contribution**: Deviation from FIR smoothed baseline.

**Interpretation**: Anomalies represent potential issues such as bot activity, sales spikes, or unusual behavior patterns. They are signals for investigation, not definitive diagnoses.

**Attribution**: All anomaly outputs include root cause breakdown showing percentage contribution of each component to overall anomaly score.

### 7.2 Confidence

**Definition**: Confidence is measure of system's certainty in its outputs, expressed as qualitative or quantitative metric. Confidence depends on data sufficiency, signal quality, and computational stability.

**Factors Affecting Confidence**:
- **Data Sufficiency**: Sufficient data points required for reliable analysis. Insufficient data reduces confidence.
- **Signal Quality**: High signal quality (low noise, no degraded modes) increases confidence. Low signal quality (edge cases, degraded modes) reduces confidence.
- **Computational Stability**: Deterministic, reproducible computations increase confidence. Non-deterministic or unstable computations reduce confidence.

**Confidence Messages**: All analysis outputs include confidence-aware messages explaining result reliability based on data quality and sufficiency.

**Confidence Intervals**: Predictions include confidence intervals (± intervals) around predicted values, visualizing uncertainty.

### 7.3 Sufficiency

**Definition**: Sufficiency is binary or graded metric indicating whether system has enough data to produce reliable analysis. Sufficiency determined by comparing available data points to minimum data points required for given analysis.

**Sufficiency Metrics**:
- **Sufficient**: System has enough data to produce reliable analysis.
- **Insufficient**: System does not have enough data. Analysis may be unreliable or unavailable.

**Sufficiency Thresholds**: Minimum data point requirements defined in centralized config, vary by analysis type (anomaly detection, prediction, health score, etc.).

**Sufficiency Messages**: All analysis outputs include data sufficiency metrics and messages explaining whether enough data available and how many data points needed vs available.

**System Invariant**: All alerts must reference data sufficiency status. Alerts based on insufficient data must be explicitly flagged.

### 7.4 Signal Quality

**Definition**: Signal quality is assessment of input data reliability and interpretability. High signal quality indicates clean, consistent, interpretable data. Low signal quality indicates noisy, inconsistent, or degraded data patterns.

**Signal Quality Metrics**:
- **Degraded Modes**: Constant zero values, perfect periodicity, impossible regularity. These patterns flagged as low-confidence signal mechanisms.
- **Edge Case Flags**: Indicators of unusual or boundary case data patterns.
- **Noise Level**: Assessment of data noise and variability.

**Handling**: Signal quality metrics presented in all analysis outputs. Low signal quality reduces confidence, communicated to users through confidence-aware messages.

**Philosophy**: Edge cases and degraded modes treated as signals, not errors. They provide valuable information about data quality and behavioral patterns.

### 7.5 Time Window

**Definition**: Time window is temporal range over which analysis computed. Time window defined by start timestamp, end timestamp, and window size (duration).

**Clarity Requirement**: All analysis outputs must include explicit time window definition, ensuring users understand temporal scope of analysis.

**Ring Buffer Alignment**: Time windows aligned with ring buffer structure, ensuring efficient and consistent data access.

### 7.6 Reproducibility Hash

**Definition**: Reproducibility hash is cryptographic hash value generated from inputs and configuration used to produce analysis output. It enables deterministic verification: same inputs and configuration will always produce same hash.

**Purpose**: Reproducibility hash ensures auditability and trust. Users can verify analysis outputs are deterministic and not tampered with.

**Inclusion**: All analysis outputs include reproducibility hash.

### 7.7 Configuration Version

**Definition**: Configuration version is unique identifier for specific version of centralized configuration system. Configuration versions timestamped and auditable.

**Purpose**: Configuration versions ensure analysis outputs can be traced back to exact configuration used to produce them. This enables reproducibility, auditability, and debugging.

**Inclusion**: All analysis outputs include configuration version used for computation.

### 7.8 Insight Lifecycle State

**Definition**: Insight lifecycle state is current state of automatically generated insight. Insights transition between states based on time, data updates, and user feedback.

**States**:
- **Generated**: Newly created insight.
- **Confirmed**: Insight validated by subsequent data or user action.
- **Expired**: Insight no longer relevant due to time passage.
- **Superseded**: Insight replaced by newer, more accurate insight.

**Purpose**: Insight lifecycle states provide context and relevance, helping users understand current validity and applicability of insights.

### 7.9 Systemic Anomaly

**Definition**: Systemic anomaly is issue affecting system itself, not seller-level behavior. Systemic anomalies include pattern changes, timestamp drift, and ingestion bursts.

**Separation**: Systemic anomalies flagged separately from seller analytics, ensuring clarity and preventing false positives in seller-facing outputs.

**Monitoring**: Systemic anomalies monitored through dedicated system health endpoints and dashboard panels.

### 7.10 Webhook

**Definition**: Webhook is side effect of insight state change, never as input. Webhooks only observe computed facts, never trigger recomputation.

**Event Types**:
- anomaly_detected: Anomaly detected
- alert_triggered: Alert triggered
- prediction_updated: Prediction updated
- insight_state_changed: Insight state changed
- weekly_report_ready: Weekly report ready
- pricing_tier_changed: Pricing tier changed

**Payload Requirements**: All webhook payloads must include reproducibilityHash, configVersion, timeWindow, dataSufficiency, and signalQuality.

**Delivery Guarantees**: Webhook delivery is asynchronous and best-effort. Delivery failures never affect analysis computation.

### 7.11 Funnel

**Definition**: Funnel is aggregation of event types used to analyze user conversion and dropoff through series of steps. Funnels must be deterministic, reproducible, and explainable.

**Step Constraints**:
- Steps must be temporally monotonic (chronological order)
- Funnel windows must align with ring buffer windows

**Output Requirements**: Funnel outputs always include dropoff attribution, per-step sufficiency, and confidence messages.

**Templates**: Predefined funnel templates per tier, seller-selectable but constrained step sets.

### 7.12 Tier

**Definition**: Tier is derived state representing user's current pricing level, computed from usage metrics, pricing policy, and grace rules. Tier never manually assigned.

**Computation Model**:
```
Usage Metrics
+ Pricing Policy
+ Grace Rules
----------------
= Effective Tier
```

**Tier Values**: free, basic, premium, business

**Computation Triggers**:
- Scheduled jobs (periodic automatic reconciliation)
- Admin-triggered reconciliation (on-demand)

**State Persistence**: effectiveTier, pricingVersion, computedAt, source

**Philosophy**: Tier always derived, never manually assigned. Admins trigger computation, not assignment. This ensures pricing honesty, explicit exceptions, and clean audits.

**Access Control**: Tier reconciliation data and all user plan details accessible only to admin users.

### 7.13 Entitlement

**Definition**: Entitlement is explicit exception granting additional resources or capabilities beyond user's tier limits. Entitlements separate from tier computation.

**Entitlement Types**:
- webhook_bonus: Additional webhook delivery quota
- prediction_bonus: Additional prediction request quota

**Attributes**:
- type: Entitlement type
- amount: Bonus amount
- expiresAt: Optional expiration timestamp
- reason: Explanation for granting entitlement

**Purpose**: Entitlements allow admins to grant explicit exceptions while keeping tier computation honest and auditable. Entitlements never directly change tier.

### 7.14 Query Plan

**Definition**: Query plan is explicit, deterministic representation of analytics request, compiled to Directed Acyclic Graph (DAG). Query plan contains data source nodes, transform nodes, aggregate nodes, score nodes, and output nodes.

**Composition**:
- **SourceNode**: Ring buffer / aggregated storage data sources
- **TransformNode**: FIR, FFT, HFD transformation operations
- **AggregateNode**: Aggregation operations
- **ScoreNode**: Scoring operations
- **OutputNode**: Output formatting

**Execution**: Query plans executed through controlled execution engine, supporting multi-threading and scheduling.

**Determinism**: Query plans must be deterministic, same input always produces same DAG and output.

### 7.15 Execution Budget

**Definition**: Execution budget is computational resource limit allocated per seller or query. Execution budgets ensure fairness and predictable system performance.

**Composition**:
- CPU time limit
- Memory limit
- Query complexity limit

**Enforcement**: Execution budgets enforced in query execution engine, queries exceeding budget terminated or degraded.

### 7.16 Federated Data Source

**Definition**: Federated data source is pluggable data source abstraction supporting query execution across multiple systems or storage.

**Data Source Types**:
- **RingBufferSource**: Ring buffer data source
- **AggregatedSnapshotSource**: Aggregated snapshot data source
- **HistoricalColdStoreSource**: Historical cold storage data source
- **ExternalWebhookSource**: External webhook data source

**Execution**: Query plans can execute across multiple data sources, results merged at aggregation layer.

### 7.17 Signal-to-Noise Ratio (SNR)

**Definition**: Signal-to-Noise Ratio measures ratio of signal strength to noise level, used to assess data quality.

**Use**: Explain why confidence may be low even with high data volume. High SNR indicates high-quality data, low SNR indicates noisy data.

**Integration**: Included in confidenceMessage and signalQuality.

### 7.18 Effective Sample Size (ESS)

**Definition**: Effective Sample Size is raw event count adjusted based on autocorrelation, providing more accurate data sufficiency assessment.

**Use**: When data has high autocorrelation, raw sample size may overestimate data effectiveness. ESS provides more accurate assessment.

**Integration**: Included in dataSufficiency metrics.

### 7.19 Window Stability Score

**Definition**: Window Stability Score measures how much rolling window content changes per update, assessing data stream stability and predictability.

**Use**: High stability score indicates stable data stream, low stability score indicates unstable or fluctuating data stream.

**Integration**: Included in signalQuality.

### 7.20 Temporal Coverage

**Definition**: Temporal Coverage is percentage of expected time buckets filled, used to identify data gaps and incompleteness.

**Use**: High temporal coverage indicates complete data, low temporal coverage indicates data gaps.

**Integration**: Included in dataSufficiency.

### 7.21 Entropy Drift

**Definition**: Entropy Drift is change in temporal/value entropy relative to baseline, used to detect unexpected changes in data patterns.

**Use**: High entropy drift indicates significant change in data patterns, potentially indicating systemic issues or behavioral changes.

**Integration**: Included in signalQuality and systemic anomaly detection.

### 7.22 Matrix Profile

**Definition**: Matrix Profile is time series analysis technique used to detect novel patterns, repetitive patterns (motifs), and inconsistencies (discords).

**Use**: Complements existing FFT + HFD analysis, provides explainable anomaly detection.

**Integration**: Part of DSP analysis pipeline, included in anomaly detection API responses.

### 7.23 Bayesian Online Changepoint Detection (BOCPD)

**Definition**: BOCPD is algorithm detecting regime shifts, outputting change probability, naturally confidence-aware.

**Use**: Detect pricing changes, traffic source shifts, bot activity start/stop.

**Integration**: Part of systemic anomaly detection, included in insight engine.

### 7.24 Seasonal Hybrid ESD (S-H-ESD)

**Definition**: S-H-ESD is anomaly detection algorithm robust to seasonality, low computational cost, deterministic.

**Use**: Excellent fallback when data sufficiency is borderline, fast anomaly detection.

**Integration**: Part of adaptive sampling strategy, used when data is insufficient.

### 7.25 Copula-based Dependency Drift

**Definition**: Copula-based Dependency Drift detects relationship breakage between metrics, such as clicks ↔ conversions, views ↔ sales.

**Use**: Multivariate anomaly detection, stronger bot detection capability.

**Integration**: Part of behavioral fingerprinting, included in anomaly attribution.

### 7.26 Dynamic Time Warping (DTW)

**Definition**: DTW is technique comparing current window to normal signature, low cost at aggregated resolution, suitable for behavioral fingerprinting.

**Use**: Flexible pattern matching, robust to temporal warping.

**Integration**: Part of behavioral fingerprinting, visualize DTW distance in dashboard.

### 7.27 Analytics Capability

**Definition**: Analytics Capability is registered analytics function or algorithm with defined properties including category, input requirements, deterministic guarantee, cost class, explainability level, and default tier.

**Purpose**: Enable auto-UI generation, tier gating, cost-based query planning, and future extensibility.

**Registry**: Stored in centralized configuration as canonical analytics capability registry.

### 7.28 Visualization Decision Mapping

**Definition**: Visualization Decision Mapping defines relationship between visualization component and actionable decisions, including primary question answered, decision enabled, API endpoint dependency, alert spawning capability, and insight state transition triggers.

**Purpose**: Ensure actionable insights, reduce UI noise, improve user decision-making.

**Storage**: Stored in centralized configuration.

### 7.29 User Confirmation Signal

**Definition**: User Confirmation Signal is user feedback indicating insight is accurate and helpful.

**Purpose**: Track insight accuracy, tune thresholds per seller, improve system through continuous learning.

**Integration**: User feedback buttons on insight cards, stored in database with timestamps.

### 7.30 User Dismissal Signal

**Definition**: User Dismissal Signal is user feedback indicating insight is inaccurate or not helpful.

**Purpose**: Track false positives, reduce alert fatigue, improve system through continuous learning.

**Integration**: User feedback buttons on insight cards, stored in database with timestamps.

### 7.31 Insight Precision Score

**Definition**: Insight Precision Score is internal metric measuring insight accuracy over time, calculated per seller, per algorithm.

**Purpose**: Assess algorithm effectiveness, tune thresholds, improve future insights.

**Calculation**: Based on ratio of confirmed insights to total insights (confirmed + dismissed).

**Integration**: Displayed in admin analytics dashboard, used for threshold adjustment.