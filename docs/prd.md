# Lush Analytics - Product Requirements Document

## 1. Application Overview

### 1.1 Application Name
Lush Analytics

### 1.2 Application Description
A lightweight, high-performance analytics API system designed for sellers. The system provides real-time anomaly detection (sales/click spikes, bot detection), short-term trend prediction (traffic/sales forecasting), and an efficient, scalable backend architecture leveraging DSP technologies (FIR, FFT, HFD) and probabilistic caching. Enhanced features include automated insight engine, predictive alerts, seller health scoring, behavioral fingerprinting capabilities, deterministic reproducibility, data sufficiency metrics, rate limit visibility, decision hooks, weekly health reports, alert-driven pricing tiers, dedicated anomaly/prediction endpoints, fixed tier defaults, insight summaries, one-click export functionality, embeddable components, confidence/sufficiency-aware messaging, auditable configuration management, formalized insight lifecycle, embeddable guardrails, codified system invariants, data minimization enforcement, aggregation-first analytics, tier-based retention policies, edge case detection as signal quality metrics, comprehensive encryption strategy, webhook registration and management, and funnel analysis.

The application now includes a redesigned modern frontend interface with navigation in the main area (replacing traditional sidebar), featuring hero section, feature showcase, pricing tiers, customer testimonials, and email signup functionality, fully responsive for desktop and mobile devices.

**New Features**: Team collaboration system with role-based access control (Admin/Member), project management, real-time task tracking, dashboard with task completion progress and assigned tasks, Stripe payment integration, and admin tier reconciliation system.

**Performance Enhancements**: Lazy loading implemented for all pages with smooth page transitions and subtle animations using motion library.

**Security Enhancements**: Admin-exclusive access to tier reconciliation data and all user plan details, password reset functionality on login dialog.

## 2. Core Features

### 2.1 Event Ingestion
- **Endpoint**: POST /events
- **Function**: Accept and process seller event data in real-time
- **Payload Structure**:
  - sellerId: Seller identifier (opaque/proxy key only)
  - timestamp: Event timestamp (milliseconds)
  - type: Event type (SALE / CLICK / VIEW / CHECKOUT_STARTED / PAYMENT_SUCCEEDED)
  - value: Event value (behavioral signals only, no PII)
- **Processing Logic**: Add events to pre-allocated fixed-size ring buffer (contiguous array), separate buffer per seller per metric. Circular access using index mod window size. No per-event reallocation or object churn.
- **Data Minimization**: Strip all PII (names, emails, addresses) from event payload, retain only behavioral signals.

### 2.2 Batch Ingestion
- **Endpoint**: POST /events/batch
- **Function**: Accept bulk event data for high-throughput sellers
- **Payload Structure**: Array of event objects (PII-stripped)
- **Processing Logic**: Efficiently process multiple events in a single request to reduce overhead, using same ring buffer mechanism

### 2.3 Ring Buffer Management
- Pre-allocated fixed-size contiguous arrays (window size defined in centralized config)
- Circular access using index mod window size
- Zero per-event reallocation
- No per-event object churn
- Supports real-time FIR, FFT, and HFD computation
- **Explicit Time Window Definition**: Expose time window parameters (start timestamp, end timestamp, window size) in API responses and UI

### 2.4 DSP Analysis Pipeline
- **FIR Smoothing**: Smooth time series data
- **FFT Analysis**: Detect periodic spikes in sales/clicks, identify repetitive bot patterns or hourly peaks
- **HFD (Higuchi Fractal Dimension)**: Measure time series complexity/irregularity, high HFD values indicate possible bot activity or anomalous behavior
- **Bayesian/Probabilistic Scoring**: Combine smoothed deviation, FFT peaks, and HFD to output anomaly score (0-1 range)
- **Deterministic Anomaly Reproducibility**: Ensure same input always produces same output through fixed random seeds, deterministic sorting, and consistent computation order
- **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events

### 2.5 Probabilistic Caching with Temporal Locality
- Cache hot metrics per seller
- **lastComputedAt** timestamp tracking for each cached metric
- Probabilistic refresh only on query (not per-event)
- Adaptive TTL strategy defined in centralized config:
  - Hot sellers: Recompute based on config TTL
  - Cold sellers: Recompute based on config TTL
- Short-term cache layer to reduce redundant function calls
- Ensures system scalability under high load

### 2.6 Anomaly Detection API
- **Endpoint**: GET /metrics/:seller/anomalies
- **Function**: Return seller anomaly score and attribution breakdown
- **Response Format**:
  - anomalyScore: Overall anomaly score (0-1)
  - attribution: Root cause breakdown (FFT peak contribution, HFD complexity contribution, trend deviation)
  - timeWindow: Explicit time window definition (startTimestamp, endTimestamp, windowSize)
  - dataSufficiency: Data sufficiency metrics (sufficient/insufficient, minimum data points required, current available data points)
  - reproducibilityHash: Hash for deterministic verification
  - confidenceMessage: Confidence and sufficiency-aware message explaining result reliability
  - configVersion: Configuration version used for this computation
  - signalQuality: Signal quality assessment (degraded mode, edge case flags)

### 2.7 Prediction API
- **Endpoint**: GET /metrics/:seller/predictions
- **Function**: Return predicted sales/traffic time series data with confidence intervals
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
- **Function**: Generate lightweight insights based on rule-based and probabilistic analysis
- **Input Signals**:
  - Anomaly scores
  - FFT periodicity
  - HFD complexity
  - Recent trend slope
- **Output**: Human-readable insight summaries explaining detected patterns and potential issues
- **Insight Summaries**: Concise, actionable summaries for quick understanding
- **Insight Lifecycle States**:
  - Generated: Newly created insights
  - Confirmed: Insights validated by subsequent data or user actions
  - Expired: Insights no longer relevant due to time passage
  - Superseded: Insights replaced by newer, more accurate insights
- **State Transitions**: Automatic state management based on time, data updates, and user feedback
- **Endpoint**: GET /insights/:seller/lifecycle to query insight status

### 2.9 Anomaly Attribution (Root Cause Breakdown)
- **Function**: Explain anomaly score composition
- **Components**:
  - FFT peak contribution percentage
  - HFD complexity contribution percentage
  - Trend deviation contribution percentage
  - Smoothed deviation contribution percentage

### 2.10 Predictive Alerts with Single Primary Trigger
- **Function**: Proactive alert system based on primary trigger and contextual information
- **Primary Trigger**: Anomaly score threshold (defined in centralized config)
- **Contextual Information**: Trends, attribution, fingerprints, time windows provided as context, not additional triggers
- **Alert Levels**: Defined by configuration table (data-driven), not conditional statements
- **Alert Types**: Potential spike warnings, downtrend alerts, pattern shift notifications
- **System Invariant**: All alerts must reference data sufficiency state

### 2.11 Seller Health Score (Composite Index)
- **Endpoint**: GET /metrics/:seller/health
- **Function**: Calculate composite seller health score
- **Scoring Factors**:
  - Volatility level
  - Anomaly frequency
  - Predictive risk assessment
  - Data consistency metrics
- **Response Format**: { healthScore: 0-100, breakdown: {...}, timeWindow: {...}, dataSufficiency: {...}, confidenceMessage: "...", configVersion: "...", signalQuality: {...} }

### 2.12 Behavioral Fingerprinting
- **Function**: Identify and track seller behavior patterns
- **Analysis Methods**:
  - FFT + HFD + temporal entropy combination
- **Detection Capabilities**:
  - Bot cluster identification
  - Repetitive manipulation patterns
  - Sudden strategy changes
- **Output**: Behavioral fingerprint signature and pattern classification
- **Data Minimization**: Fingerprints based only on aggregated behavioral signals, no PII

### 2.13 Intelligent Sampling and Adaptive Resolution
- **Function**: Automatically adjust analysis computation cost based on seller activity
- **Adaptive Logic** (defined in centralized config):
  - High activity sellers: Full resolution analysis
  - Medium activity sellers: Medium sampling
  - Low activity sellers: Reduced sampling frequency
- **Advantage**: Optimize system resources while maintaining accuracy

### 2.14 Real-time Dashboard Integration
- **Technology**: Supabase Realtime integration
- **Function**: Real-time dashboard updates with AnomalyAlert component
- **Features**:
  - Real-time anomaly notifications
  - Real-time metrics updates
  - Event log display with pagination/infinite scroll
  - **Time Window Display**: Display explicit time window definition in UI (start time, end time, window size)
  - **Data Sufficiency Metrics**: Display explicit data sufficiency state (sufficient/insufficient, progress bar showing current vs required data points)
  - **Rate Limit and Backpressure Visibility**: Display current rate limit status, remaining quota, backpressure metrics, and queue depth
  - **Confidence and Sufficiency-Aware Messaging**: Display contextual messages explaining result reliability based on data quality
  - **Insight Lifecycle Display**: Display insight states (Generated, Confirmed, Expired, Superseded) with visual indicators
  - **Signal Quality Metrics**: Display edge case flags and degraded mode warnings
  - **Task Completion Progress**: Display overall completion percentage for tasks assigned to current user
  - **Assigned Tasks Overview**: Display list of tasks assigned to current user with status indicators
  - **Behavioral Fingerprinting Capabilities**: Implement behavioral fingerprinting functionality on dashboard, displaying seller behavior pattern analysis results

### 2.15 Event Log Management
- **Function**: Display and manage event logs on dashboard
- **Features**:
  - Pagination support
  - Infinite scroll capability
  - Efficient data loading for large volumes of events
- **Data Minimization**: Display only aggregated behavioral signals, no PII

### 2.16 Decision Hooks
- **Function**: Provide extensible decision hooks for custom business logic integration
- **Hook Points**:
  - Pre-anomaly detection hook: Execute custom logic before anomaly detection
  - Post-anomaly detection hook: Execute custom logic after anomaly detection
  - Pre-prediction hook: Execute custom logic before prediction generation
  - Post-prediction hook: Execute custom logic after prediction generation
  - Alert trigger hook: Execute custom logic when alert is triggered
- **Use Cases**: Custom notification routing, third-party integrations, business rule execution, audit logging

### 2.17 Weekly Seller Health Reports
- **Function**: Generate and deliver automated weekly health reports for sellers
- **Report Content**:
  - Weekly health score summary
  - Anomaly frequency and severity breakdown
  - Trend analysis and predictions
  - Behavioral pattern insights
  - Actionable recommendations
  - Insight summaries for quick understanding
  - Insight lifecycle state summary
  - Signal quality assessment summary
- **Delivery Methods**: Email, dashboard notifications, API endpoint for retrieval
- **Endpoint**: GET /reports/:seller/weekly
- **Configuration Snapshot**: Each report includes configuration version snapshot used for generation

### 2.18 Alert-Driven Pricing Tiers with Fixed Defaults
- **Function**: Dynamic pricing tier system based on alert frequency and severity
- **Tier Structure**: Data-driven tier definitions (not logic-based)
- **Fixed Defaults Per Tier**:
  - Free Tier: €0 - Standard features, default alert thresholds, basic insights, light branding watermark on embeddable components
  - Basic Tier: €50 - Enhanced features, lower alert thresholds, detailed insights, faster response, reduced branding on embeddable components
  - Pro Tier: €300 - Premium features, custom alert thresholds, comprehensive insights, priority support, minimal branding on embeddable components
- **Pricing Factors** (defined in centralized config):
  - Number of alerts triggered per month
  - Anomaly severity levels
  - Prediction accuracy requirements
  - Real-time processing demands
- **Endpoint**: GET /pricing/:seller/tier

### 2.19 Dedicated Anomaly Endpoint
- **Endpoint**: POST /sell/anomaly
- **Function**: Dedicated endpoint for selling/exposing anomaly detection results to external systems
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
- **Function**: Dedicated endpoint for selling/exposing prediction results to external systems
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
- **Function**: One-click export of reports, insights, and analytics data
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
- **Function**: Provide embeddable UI components for integration into external dashboards or applications
- **Components**:
  - Anomaly chart widget
  - Prediction chart widget
  - Health score widget
  - Alert notification widget
  - Event log widget
- **Integration**: JavaScript SDK or iframe-based embedding
- **Customization**: Support theme customization and configuration options
- **Soft Guardrails**:
  - Rate limiting per embed key (defined by tier in centralized config)
  - Light branding watermark for Free/Basic tiers
  - Default read-only scope (no write access unless explicitly granted)
  - Embed key authentication required

### 2.23 Auditable Configuration Management
- **Function**: Track and audit all configuration changes
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
- **Function**: Detect and flag edge cases as low confidence signal mechanisms, not errors
- **Degraded Behavior Patterns**:
  - Constant zero values: Flagged as low signal mechanism
  - Perfect periodicity: Flagged as potential bot activity signal
  - Impossible regularity: Flagged as anomalous signal pattern
- **Handling**: Edge cases are signals, not errors. They represent low confidence mechanisms and should be presented as signal quality metrics
- **Output**: Signal quality score and edge case flags included in all analysis responses
- **Integration**: Signal quality metrics displayed in dashboard and included in API responses

### 2.25 Systemic Anomaly Detection
- **Function**: Detect and flag systemic issues separate from seller analytics
- **Systemic Anomaly Types**:
  - Sudden pattern changes: Detect unexpected data structure changes
  - Timestamp drift: Identify clock synchronization issues
  - Ingestion bursts: Detect abnormal data ingestion patterns
- **Handling**: Flag system health issues without polluting seller analytics
- **Output**: Separate system health metrics and alerts
- **Endpoint**: GET /system/health to query systemic anomaly status
- **Dashboard Integration**: System health panel separate from seller analytics

### 2.26 Frontend Landing Page
- **Function**: Modern landing page showcasing Lush Analytics platform with redesigned navigation
- **Sections**:
  - **Hero Section**:
    - Headline: Primary value proposition
    - Subheadline: Supporting description
    - Call-to-action button: Opens user interaction dialog
  - **Features Section**:
    - Six feature cards with icons
    - Highlight key platform capabilities
    - **Anomaly Detection Card**: Reference advanced mathematical models (no mention of AI or machine learning)
    - **Predictive Insights Card**: Use "leveraging business intelligence" instead of "leveraging advanced mathematical models"
    - **Privacy by Design Card**: GDPR-compliant with strict data minimization. No PII in analysis path—behavioral signals on aggregated data only.
    - **High Performance Card**: Ring buffer architecture with zero per-event allocation. Probabilistic caching ensures sub-millisecond response times.
  - **Pricing Section**:
    - Three pricing tiers with clear differentiation:
      - Free Tier: €0
      - Basic Tier: €50
      - Pro Tier: €300
    - Display pricing using Euro symbol (€)
    - **Pricing Tier Button Behavior**:
      - **Free Tier Get Started Button**: Clicking this button redirects user to signup dialog. After successful signup, Free tier users are redirected to Dashboard page.
      - **Paid Tier Subscribe Buttons**: Clicking these buttons redirects user to signup dialog. After successful signup, paid tier users are redirected to Stripe checkout. After completing Stripe setup, users are redirected to Dashboard page.
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
- **Responsive Design**: Fully responsive layout optimized for desktop and mobile devices, design aesthetics inspired by nfinitepaper.com
- **Styling**: Consistent with existing application styles and design system
- **Performance Optimization**: Apply lazy loading to landing page sections and components

### 2.27 User Authentication System
- **Function**: Secure user authentication and authorization
- **Features**:
  - User registration with email and password
  - User login with email and password
  - **Password reset functionality on login dialog with link**
  - Session management
  - JWT token-based authentication
  - **Post-Signup Redirect**: After successful signup, users are redirected based on selected pricing tier:
    - Free tier users: Redirected to Dashboard page
    - Paid tier users: Redirected to Stripe checkout, then to Dashboard page after payment completion
- **Login Dialog Password Reset Link**:
  - **Location**: Below "Don't have an account? Sign up" link
  - **Text**: "Forgot password? Reset password"
  - **Behavior**: Clicking this link opens password reset dialog or redirects to password reset page
- **Endpoints**:
  - POST /auth/register: User registration
  - POST /auth/login: User login
  - POST /auth/logout: User logout
  - POST /auth/reset-password: Password reset request
  - POST /auth/confirm-reset: Confirm password reset

### 2.28 Team Management System
- **Function**: Team collaboration with role-based access control
- **Roles**:
  - **Admin**: Full team management permissions
    - Invite new members to team
    - Remove members from team
    - Manage team settings
    - Create and manage projects
    - Assign tasks to team members
    - Reconcile user pricing tiers
    - Access Admin Panel without errors
    - **View all user data and plan details in Tier Reconciliation section**
  - **Member**: Limited permissions
    - View team settings (read-only)
    - View projects and tasks
    - Update assigned tasks
    - Cannot invite/remove members
    - Cannot modify team settings
    - Cannot reconcile pricing tiers
    - Cannot access Admin Panel
    - **Cannot view other users' data or plan details**
- **Features**:
  - Team creation
  - Member invitation via email
  - Member removal by admin
  - Role assignment and management
  - Team settings management (admin only)
  - **Admin Panel Access Control**: When logged-in user with admin role clicks Admin Panel button, access should be granted without error messages. Proper role validation and access control must be implemented.
  - **Tier Reconciliation Data Visibility**: Only admin users can view all user data and plan details in Tier Reconciliation section. Regular users cannot access this information.
- **Endpoints**:
  - POST /teams: Create new team
  - GET /teams/:teamId: Get team details
  - POST /teams/:teamId/invite: Invite member (admin only)
  - DELETE /teams/:teamId/members/:userId: Remove member (admin only)
  - GET /teams/:teamId/members: List team members
  - PUT /teams/:teamId/settings: Update team settings (admin only)

### 2.29 Project Management System
- **Function**: Create and manage projects within team context
- **Features**:
  - Create projects within team context
  - Project details (name, description, creation date)
  - Project ownership and access control
  - List all projects for a team
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
- **Function**: Task creation, assignment, and tracking with real-time synchronization
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
- **Function**: Display task completion progress and assigned tasks on dashboard
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
- **Function**: Payment processing for pricing tier subscriptions
- **Features**:
  - Stripe Checkout integration for subscription payments
  - Support for all pricing tiers (Free, Basic, Pro)
  - Subscription management (upgrade, downgrade, cancel)
  - Payment method management
  - Invoice generation and history
  - Webhook handling for payment events
  - Automatic tier access control based on subscription status
  - **Payment Notifications**: Display notifications indicating payment success or failure
  - **Notification Auto-dismiss**: Notifications automatically disappear after 5 seconds
  - **Payment System Configuration Validation**: Validate Stripe API keys and configuration before processing payments
  - **Error Handling**: Display clear error messages when payment system is not properly configured
- **Payment Flow**:
  1. User selects pricing tier from landing page (Free tier Get Started button or paid tier Subscribe buttons)
  2. User is redirected to signup dialog
  3. User completes signup
  4. **Free Tier Flow**: User is directly redirected to Dashboard page
  5. **Paid Tier Flow**:
     - Validate payment system configuration (Stripe API keys exist and valid)
     - User is redirected to Stripe Checkout
     - User completes payment
     - Webhook confirms payment
     - Display success/failure notification (auto-dismiss after 5 seconds)
     - User tier is automatically updated
     - User is redirected to Dashboard page
     - Access to tier-specific features is granted
- **Configuration Error Handling**:
  - If Stripe API keys are missing or invalid, display error: "Payment system not configured. Please contact support."
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
- **Function**: Webhooks as delivery mechanism for computed facts, not triggers
- **Core Principle**: Webhooks are side effects of insight state changes, never as inputs
- **Design Goals (Non-negotiable)**:
  - Purely derived (never raw)
  - Deterministic (same input → same payload)
  - Self-validating (hash + config)
  - Window-scoped
  - Side-effect safe
- **Canonical Webhook Envelope**:
```json
{
  "id": "whk_01HZX8F7W9M3Y7T4Q2A6B9",
  "type": "alert_triggered",
  "sellerId": "sel_8f92d0c3",
  "emittedAt": 1737225600000,
  "sequence": 412,
  "timeWindow": {
    "start": 1737222000000,
    "end": 1737225600000,
    "size": 3600000
  },
  "payload": {
    "anomalyScore": 0.87,
    "attribution": {...},
    "dataSufficiency": "sufficient",
    "reproducibilityHash": "sha256:abc123..."
  },
  "configVersion": "v2.3.1",
  "signature": "hmac-sha256:xyz789..."
}
```
- **Features**:
  - Register webhook endpoints for specific event types
  - Manage webhook subscriptions (create, update, delete)
  - Webhook delivery retry logic with exponential backoff
  - Webhook event history and logs
  - Webhook signature verification for security
  - Support for multiple webhook endpoints per seller
- **Event Types**:
  - alert_triggered: When anomaly alert is triggered
  - prediction_generated: When new prediction is generated
  - health_score_updated: When seller health score is updated
  - insight_generated: When new insight is generated
  - weekly_report_ready: When weekly report is generated
- **Endpoints**:
  - POST /webhooks: Register new webhook endpoint
  - GET /webhooks: List all webhook subscriptions
  - GET /webhooks/:id: Get webhook details
  - PUT /webhooks/:id: Update webhook configuration
  - DELETE /webhooks/:id: Delete webhook subscription
  - GET /webhooks/:id/logs: Get webhook delivery logs

### 2.34 Funnel Analysis
- **Function**: Track and analyze user conversion funnels
- **Features**:
  - Define custom conversion funnels with multiple steps
  - Track funnel progression in real-time
  - Calculate conversion rates between funnel steps
  - Identify drop-off points in conversion process
  - Visualize funnel performance with charts
  - Compare funnel performance across time periods
  - Segment funnel analysis by user attributes
- **Funnel Steps**: VIEW → CLICK → CHECKOUT_STARTED → PAYMENT_SUCCEEDED → SALE
- **Metrics**:
  - Step completion rate
  - Overall funnel conversion rate
  - Average time between steps
  - Drop-off rate at each step
- **Endpoints**:
  - POST /funnels: Create new funnel definition
  - GET /funnels: List all funnels
  - GET /funnels/:id: Get funnel details
  - GET /funnels/:id/analytics: Get funnel analytics data
  - PUT /funnels/:id: Update funnel definition
  - DELETE /funnels/:id: Delete funnel

## 3. Technical Stack

### 3.1 Frontend
- **Framework**: React 18+ with TypeScript
- **UI Library**: shadcn/ui components + Tailwind CSS
- **Charts**: Recharts for data visualization
- **State Management**: React Context API + Hooks
- **Routing**: React Router v6
- **Animation**: Framer Motion for smooth transitions
- **Form Handling**: React Hook Form with Zod validation

### 3.2 Backend
- **Runtime**: Supabase Edge Functions (Deno runtime)
- **Database**: PostgreSQL (Supabase)
- **Real-time**: Supabase Realtime subscriptions
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for file uploads
- **Caching**: In-memory cache + Redis (optional)

### 3.3 DSP Implementation
- **Language**: TypeScript/JavaScript
- **Libraries**:
  - Custom FIR filter implementation
  - FFT.js for frequency domain analysis
  - Custom HFD algorithm implementation
  - Math.js for mathematical operations

### 3.4 Payment Processing
- **Provider**: Stripe
- **Integration**: Stripe Checkout + Customer Portal
- **Webhooks**: Stripe webhook events for subscription management

### 3.5 Deployment
- **Frontend Hosting**: Vercel or Netlify
- **Backend**: Supabase Edge Functions
- **Database**: Supabase PostgreSQL
- **CDN**: Cloudflare or similar

## 4. Data Model

### 4.1 Core Tables

#### sellers
```sql
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  api_key TEXT UNIQUE NOT NULL,
  pricing_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### events
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('SALE', 'CLICK', 'VIEW', 'CHECKOUT_STARTED', 'PAYMENT_SUCCEEDED')),
  value NUMERIC DEFAULT 0,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_seller_timestamp ON events(seller_id, timestamp DESC);
CREATE INDEX idx_events_type ON events(type);
```

#### anomalies
```sql
CREATE TABLE anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  anomaly_score NUMERIC NOT NULL CHECK (anomaly_score >= 0 AND anomaly_score <= 1),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  attribution JSONB,
  time_window JSONB,
  data_sufficiency TEXT,
  reproducibility_hash TEXT,
  config_version TEXT,
  signal_quality JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomalies_seller ON anomalies(seller_id, detected_at DESC);
```

#### predictions
```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  predictions JSONB NOT NULL,
  confidence_bands JSONB,
  historical_cutoff TIMESTAMPTZ,
  time_window JSONB,
  data_sufficiency TEXT,
  reproducibility_hash TEXT,
  config_version TEXT,
  signal_quality JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_seller ON predictions(seller_id, generated_at DESC);
```

#### insights
```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  lifecycle_state TEXT DEFAULT 'generated' CHECK (lifecycle_state IN ('generated', 'confirmed', 'expired', 'superseded')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_seller_state ON insights(seller_id, lifecycle_state, created_at DESC);
```

#### health_scores
```sql
CREATE TABLE health_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  overall_score NUMERIC NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  volatility NUMERIC,
  anomaly_frequency NUMERIC,
  predictive_risk NUMERIC,
  data_consistency NUMERIC,
  breakdown JSONB,
  time_window JSONB,
  data_sufficiency TEXT,
  config_version TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_scores_seller ON health_scores(seller_id, calculated_at DESC);
```

#### behavioral_fingerprints
```sql
CREATE TABLE behavioral_fingerprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  fft_signature JSONB,
  hfd_pattern NUMERIC,
  timing_entropy NUMERIC,
  pattern_type TEXT CHECK (pattern_type IN ('normal', 'bot', 'manipulation', 'irregular')),
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fingerprints_seller ON behavioral_fingerprints(seller_id, created_at DESC);
```

### 4.2 Team & Project Tables

#### teams
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### team_members
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
```

#### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_team ON projects(team_id);
```

#### tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### 4.3 Configuration & Audit Tables

#### config_versions
```sql
CREATE TABLE config_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT UNIQUE NOT NULL,
  config_data JSONB NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_config_versions_effective ON config_versions(effective_at DESC);
```

#### config_audit_log
```sql
CREATE TABLE config_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_version_id UUID REFERENCES config_versions(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'rolled_back')),
  changed_by UUID REFERENCES auth.users(id),
  changes JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_config_audit_timestamp ON config_audit_log(timestamp DESC);
```

#### webhooks
```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_seller ON webhooks(seller_id);
```

#### webhook_logs
```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_webhook ON webhook_logs(webhook_id, created_at DESC);
```

## 5. Security & Privacy

### 5.1 Data Minimization
- Strip all PII from event payloads
- Store only behavioral signals and aggregated data
- No raw individual user data in analysis pipeline
- Fingerprints based on aggregated patterns only

### 5.2 Encryption
- All data encrypted at rest (database level)
- All data encrypted in transit (TLS/SSL)
- API keys hashed and salted
- Webhook secrets encrypted

### 5.3 Access Control
- Role-based access control (RBAC) for team members
- API key authentication for external integrations
- JWT token-based authentication for web interface
- Row-level security (RLS) policies in database

### 5.4 Compliance
- GDPR-compliant data handling
- Data retention policies per pricing tier
- Right to deletion support
- Data export functionality

## 6. Performance Requirements

### 6.1 Response Times
- P95 latency < 100ms for API endpoints
- P99 latency < 200ms for API endpoints
- Real-time updates < 500ms latency
- Dashboard load time < 2 seconds

### 6.2 Throughput
- Support 10,000+ events/second ingestion
- Support 1,000+ concurrent users
- Cache hit rate > 85%
- Database query optimization for sub-50ms queries

### 6.3 Scalability
- Horizontal scaling capability for edge functions
- Database connection pooling
- Efficient ring buffer management
- Probabilistic caching to reduce computation

## 7. Monitoring & Observability

### 7.1 Metrics
- API response times
- Error rates
- Cache hit rates
- Database query performance
- Webhook delivery success rates
- System health metrics

### 7.2 Logging
- Structured logging for all API requests
- Error tracking and alerting
- Audit logs for configuration changes
- Webhook delivery logs

### 7.3 Alerting
- System health alerts
- Performance degradation alerts
- Error rate threshold alerts
- Configuration change notifications

## 8. Testing Strategy

### 8.1 Unit Tests
- DSP algorithm correctness
- Business logic validation
- Utility function testing
- Component testing

### 8.2 Integration Tests
- API endpoint testing
- Database operations
- Authentication flows
- Payment processing

### 8.3 End-to-End Tests
- User registration and login flows
- Event ingestion and analysis pipeline
- Dashboard functionality
- Payment and subscription flows

### 8.4 Performance Tests
- Load testing for API endpoints
- Stress testing for event ingestion
- Cache performance validation
- Database query optimization

## 9. Deployment Strategy

### 9.1 Environments
- Development: Local development environment
- Staging: Pre-production testing environment
- Production: Live production environment

### 9.2 CI/CD Pipeline
- Automated testing on pull requests
- Automated deployment to staging
- Manual approval for production deployment
- Rollback capability

### 9.3 Database Migrations
- Version-controlled migration scripts
- Automated migration execution
- Rollback scripts for each migration
- Data integrity validation

## 10. Documentation

### 10.1 API Documentation
- OpenAPI/Swagger specification
- Endpoint descriptions and examples
- Authentication guide
- Error code reference

### 10.2 User Documentation
- Getting started guide
- Feature documentation
- Integration guides
- FAQ and troubleshooting

### 10.3 Developer Documentation
- Architecture overview
- DSP algorithm documentation
- Database schema documentation
- Deployment guide
