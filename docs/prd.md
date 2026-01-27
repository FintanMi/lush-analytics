# Lush Analytics - Product Requirements Document

## 1. Application Overview

### 1.1 Application Name
Lush Analytics

### 1.2 Application Description
A lightweight, high-performance analytics API system designed for sellers. The system provides real-time anomaly detection (sales/click spikes, bot detection), short-term trend prediction (traffic/sales forecasting), and an efficient, scalable backend architecture leveraging DSP techniques (FIR, FFT, HFD) and probabilistic caching.

Enhanced features include:
- Automated insights engine
- Predictive alerts
- Seller health scores
- Behavioral fingerprinting capabilities
- Deterministic reproducibility
- Data sufficiency metrics
- Rate limit visibility
- Decision hooks
- Weekly health reports
- Alert-driven pricing tiers
- Dedicated anomaly/prediction endpoints
- Fixed tier defaults
- Insight summaries
- One-click export functionality
- Embeddable components
- Confidence/sufficiency-aware messaging
- Auditable configuration management
- Formalized insight lifecycle
- Embeddable guardrails
- Codified system invariants
- Data minimization enforcement
- Aggregation-first analytics
- Tier-based retention policies
- Edge case detection as signal quality metrics
- Comprehensive encryption strategy
- Webhook registration and management
- Funnel analysis

The application now includes a redesigned modern frontend interface with navigation in the main area (replacing traditional sidebar), featuring hero sections, feature showcases, pricing tiers, customer testimonials, and email signup functionality, fully responsive for desktop and mobile devices.

**New Features**: Team collaboration system with role-based access control (Admin/Member), project management, real-time task tracking, dashboard with task completion progress and assigned tasks, Stripe payment integration, and admin tier reconciliation system.

**Performance Enhancements**: Lazy loading implemented for all pages, smooth page transitions and subtle animations using motion library.

**Security Enhancements**: Admin-exclusive access to tier reconciliation data and all user plan details, password reset functionality on login dialog.

**Latest Upgrade**: Introduction of Query Execution Model, upgrading the system from API service to analytics engine, supporting explicit query plan abstraction, multi-threaded scheduled execution, federated query architecture, API-driven query requests, cost-optimized queries, deterministic parallelism guarantees, and executable system invariants.

## 2. Core Features

### 2.1 Event Ingestion
- **Endpoint**: POST /events
- **Functionality**: Real-time acceptance and processing of seller event data
- **Payload Structure**:
  - sellerId: Seller identifier (opaque/proxy key only)
  - timestamp: Event timestamp (milliseconds)
  - type: Event type (SALE / CLICK / VIEW / CHECKOUT_STARTED / PAYMENT_SUCCEEDED)
  - value: Event value (behavioral signals only, no PII)
- **Processing Logic**: Add events to pre-allocated fixed-size ring buffer (contiguous array), separate buffer per seller per metric. Use index modulo window size for circular access. No per-event reallocation or object churn.
- **Data Minimization**: Strip all PII (names, emails, addresses) from event payload, retain only behavioral signals.

### 2.2 Batch Ingestion
- **Endpoint**: POST /events/batch
- **Functionality**: Accept batch event data for high-throughput sellers
- **Payload Structure**: Array of event objects (PII stripped)
- **Processing Logic**: Efficiently process multiple events in a single request to reduce overhead, using the same ring buffer mechanism

### 2.3 Ring Buffer Management
- Pre-allocated fixed-size contiguous array (window size defined in centralized config)
- Circular access using index modulo window size
- Zero per-event reallocation
- No per-event object churn
- Supports real-time FIR, FFT, and HFD computation
- **Explicit Time Window Definition**: Expose time window parameters (start timestamp, end timestamp, window size) in API responses and UI

### 2.4 DSP Analytics Pipeline
- **FIR Smoothing**: Smooth time series data
- **FFT Analysis**: Detect periodic spikes in sales/clicks, identify repetitive bot patterns or hourly spikes
- **HFD (Higuchi Fractal Dimension)**: Measure time series complexity/irregularity, high HFD values indicate possible bot activity or anomalous behavior
- **Bayesian/Probabilistic Scoring**: Combine smoothing deviation, FFT peaks, and HFD to output anomaly score (0-1 range)
- **Deterministic Anomaly Reproducibility**: Ensure same input always produces same output through fixed random seeds, deterministic sorting, and consistent computation order
- **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events

### 2.5 Probabilistic Caching with Temporal Locality
- Cache hot metrics per seller
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
  - dataSufficiency: Data sufficiency metrics (sufficient/insufficient, minimum required data points, currently available data points)
  - reproducibilityHash: Hash for deterministic verification
  - confidenceMessage: Confidence and sufficiency-aware message explaining result reliability
  - configVersion: Configuration version used for this computation
  - signalQuality: Signal quality assessment (degraded mode, edge case flags)

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

### 2.8 Automated Insights Engine with Summaries and Lifecycle Management
- **Functionality**: Generate lightweight insights based on rule-based and probabilistic analysis
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
- **Functionality**: Explain anomaly score composition
- **Components**:
  - FFT peak contribution percentage
  - HFD complexity contribution percentage
  - Trend deviation contribution percentage
  - Smoothing deviation contribution percentage

### 2.10 Predictive Alerts with Single Primary Trigger
- **Functionality**: Proactive alert system based on primary trigger and contextual information
- **Primary Trigger**: Anomaly score threshold (defined in centralized config)
- **Contextual Information**: Trends, attribution, fingerprints, time windows provided as context, not additional triggers
- **Alert Levels**: Defined by configuration table (data-driven), not conditional statements
- **Alert Types**: Potential spike warnings, downtrend alerts, pattern shift notifications
- **System Invariants**: All alerts must reference data sufficiency status

### 2.11 Seller Health Score (Composite Index)
- **Endpoint**: GET /metrics/:seller/health
- **Functionality**: Return comprehensive seller health score
- **Components**:
  - Overall health score (0-100)
  - Volatility index
  - Anomaly frequency
  - Predictive risk score
  - Data consistency score
  - Trend direction (improving/stable/declining)

### 2.12 Behavioral Fingerprinting
- **Functionality**: Identify unique behavioral patterns per seller
- **Techniques**:
  - FFT signature analysis
  - HFD pattern recognition
  - Timing entropy calculation
- **Use Cases**:
  - Bot detection
  - Manipulation detection
  - Normal behavior baseline establishment

### 2.13 Query Execution Model (Latest Upgrade)
- **Functionality**: Transform system from "API service" → "analytics engine"
- **Core Components**:
  - **Query Plan DSL**: Explicit query planning with typed nodes (Source, Transform, Aggregate, Score, Output)
  - **DAG Execution**: Deterministic directed acyclic graph compilation and execution
  - **Multi-threaded Scheduler**: Worker pools with execution budgets and backpressure management
  - **Federated Data Sources**: Pluggable data source abstraction (Ring Buffer, Aggregate Store, Cached Metrics, Historical Store, External Webhooks)
  - **Cost-based Optimization**: Query cost estimation and optimization hints
  - **Execution Monitoring**: Real-time DAG visualization and execution tracking
- **Endpoints**:
  - POST /query: Execute analytics queries with explicit query planning
  - GET /query/:id: Get query execution status and results
- **Features**:
  - Reproducibility hashing for audit trails
  - Execution invariants as runtime contracts
  - Deadline-aware scheduling
  - Partial results support for federated queries
  - Query caching with adaptive TTL

## 3. Technical Architecture

### 3.1 Backend Stack
- **Runtime**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for exports and attachments)
- **Payment Processing**: Stripe

### 3.2 Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Routing**: React Router
- **Animations**: Framer Motion
- **Charts**: Recharts

### 3.3 Data Flow
1. Events ingested via POST /events or POST /events/batch
2. Events stored in ring buffer (in-memory) and persisted to database
3. DSP pipeline processes data on-demand (with caching)
4. Results cached with adaptive TTL
5. API endpoints serve cached or freshly computed results
6. Frontend displays real-time analytics and insights

### 3.4 Query Execution Architecture
1. Query requests submitted via POST /query
2. Query plan compiled into DAG
3. Execution budget validated
4. Query queued in appropriate worker pool
5. Nodes executed in topological order
6. Results cached and returned
7. Execution metrics recorded for monitoring

## 4. Security & Privacy

### 4.1 Data Minimization
- Strip all PII from event payloads
- Store only behavioral signals (timestamps, types, values)
- Use opaque seller IDs (no direct user identification)

### 4.2 Encryption
- **At Rest**: Database encryption enabled
- **In Transit**: HTTPS/TLS for all API communications
- **Key Material**: Secure key rotation policies

### 4.3 Access Control
- **Role-based Access**: Admin and Member roles
- **Row Level Security**: Sellers can only access their own data
- **API Key Authentication**: Secure API key management
- **Admin Privileges**: Exclusive access to tier reconciliation and user management

### 4.4 Audit Trail
- Configuration version tracking
- Reproducibility hashing for all computations
- Query execution history
- User action logging

## 5. Performance & Scalability

### 5.1 Performance Targets
- Event ingestion: < 100ms p99
- Anomaly detection: < 500ms p99
- Prediction generation: < 1000ms p99
- Query execution: < 5000ms p99 (tier-dependent)

### 5.2 Scalability Measures
- Ring buffer architecture (zero allocation)
- Probabilistic caching with adaptive TTL
- Aggregation-first analytics
- Lazy loading for frontend
- Worker pool-based execution scheduling
- Federated query support for distributed data

### 5.3 Resource Management
- Execution budgets per seller tier
- Backpressure management in worker pools
- Query cost estimation and limits
- Automatic cache cleanup

## 6. Pricing Tiers

### 6.1 Free Tier
- 1,000 API calls/month
- Basic anomaly detection
- 7-day data retention
- 1 concurrent query
- Email support

### 6.2 Basic Tier ($29/month)
- 10,000 API calls/month
- Full anomaly detection + predictions
- 30-day data retention
- 3 concurrent queries
- Priority email support

### 6.3 Pro Tier ($99/month)
- 100,000 API calls/month
- All features + insights engine
- 90-day data retention
- 10 concurrent queries
- Webhook support
- Chat support

### 6.4 Enterprise Tier (Custom)
- Unlimited API calls
- All features + custom integrations
- Custom data retention
- 50 concurrent queries
- Dedicated support
- SLA guarantees

## 7. User Interface

### 7.1 Landing Page
- Hero section with value proposition
- Feature showcase
- Pricing comparison
- Customer testimonials
- Email signup form

### 7.2 Dashboard
- Real-time metrics overview
- Anomaly alerts
- Health score visualization
- Recent insights
- Quick actions

### 7.3 Event Ingestion Page
- Event submission form
- Batch upload interface
- Ingestion history
- Rate limit indicators

### 7.4 Analytics Pages
- Anomaly detection view
- Prediction charts
- Funnel analysis
- Webhook management

### 7.5 Query Console (New)
- Visual query builder
- Real-time execution monitoring
- DAG visualization
- Execution history
- Worker pool statistics
- Data source status

### 7.6 Admin Panel
- User management
- Tier reconciliation
- System monitoring
- Configuration management

## 8. API Endpoints

### 8.1 Event Management
- POST /events - Ingest single event
- POST /events/batch - Ingest batch events
- GET /events/:seller - Get event history

### 8.2 Analytics
- GET /metrics/:seller/anomalies - Get anomaly detection results
- GET /metrics/:seller/predictions - Get predictions
- GET /metrics/:seller/health - Get health score
- GET /insights/:seller - Get insights
- GET /insights/:seller/lifecycle - Get insight lifecycle status

### 8.3 Query Execution (New)
- POST /query - Execute analytics query
- GET /query/:id - Get query execution status
- GET /query/:id/results - Get query results
- DELETE /query/:id - Cancel query execution

### 8.4 Webhooks
- POST /webhooks - Register webhook
- GET /webhooks/:seller - List webhooks
- PUT /webhooks/:id - Update webhook
- DELETE /webhooks/:id - Delete webhook
- POST /webhooks/:id/test - Test webhook

### 8.5 Funnel Analysis
- POST /funnels - Create funnel configuration
- GET /funnels/:seller - List funnels
- GET /funnels/:id/results - Get funnel results

### 8.6 Admin
- GET /admin/users - List all users
- GET /admin/reconciliation - Get tier reconciliation data
- POST /admin/reconciliation/sync - Sync tier data

## 9. Development Roadmap

### Phase 1: Core Analytics (Completed)
- ✅ Event ingestion
- ✅ Ring buffer implementation
- ✅ DSP pipeline (FIR, FFT, HFD)
- ✅ Anomaly detection
- ✅ Predictions
- ✅ Basic caching

### Phase 2: Enhanced Features (Completed)
- ✅ Insights engine
- ✅ Health scores
- ✅ Behavioral fingerprinting
- ✅ Webhooks
- ✅ Funnel analysis
- ✅ Configuration management

### Phase 3: Team Collaboration (Completed)
- ✅ Role-based access control
- ✅ Project management
- ✅ Task tracking
- ✅ Stripe integration
- ✅ Admin tier reconciliation

### Phase 4: Query Execution Model (Completed)
- ✅ Query Plan DSL
- ✅ DAG execution engine
- ✅ Multi-threaded scheduler
- ✅ Federated data sources
- ✅ Query Console UI
- ✅ Execution monitoring

### Phase 5: Future Enhancements (Planned)
- [ ] Machine learning model integration
- [ ] Advanced anomaly detection algorithms
- [ ] Real-time streaming analytics
- [ ] Multi-region deployment
- [ ] Advanced visualization tools
- [ ] Mobile application

## 10. Success Metrics

### 10.1 Technical Metrics
- API response time < 500ms p99
- System uptime > 99.9%
- Cache hit rate > 80%
- Query execution success rate > 95%

### 10.2 Business Metrics
- Monthly active sellers
- API calls per seller
- Conversion rate (free → paid)
- Customer retention rate
- Net Promoter Score (NPS)

### 10.3 User Satisfaction
- Feature adoption rate
- Support ticket volume
- User feedback scores
- Query Console usage metrics

## 11. Compliance & Standards

### 11.1 Data Protection
- GDPR compliance
- CCPA compliance
- Data minimization principles
- Right to deletion support

### 11.2 Security Standards
- OWASP Top 10 compliance
- Regular security audits
- Penetration testing
- Vulnerability scanning

### 11.3 Performance Standards
- Deterministic reproducibility
- Execution invariants enforcement
- Data sufficiency validation
- Signal quality monitoring

---

**Document Version**: 2.0  
**Last Updated**: 2026-01-21  
**Status**: Active Development
