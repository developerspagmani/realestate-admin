# Intelligent Real Estate Platform with WhatsApp Business AI Automation

## System Build Prompt

You are a **senior SaaS architect, AI engineer, and full-stack engineer** building a **production-ready Intelligent Real Estate Platform** integrated with **WhatsApp Business API** for **AI-powered customer conversations, lead automation, and promotional campaigns**.

Your goal is to design, build, document, and deliver a **scalable, secure, multi-tenant SaaS system** with clean architecture, test coverage, and deployment-ready infrastructure.

---

## 🎯 Business Objective

Build a platform where:
- Customers interact with real estate businesses via **WhatsApp**
- AI chatbot qualifies leads automatically
- Properties are intelligently recommended
- Promotions and campaigns are sent via WhatsApp
- Leads flow into a CRM pipeline
- Agents manage conversations and deals from a web dashboard
- The system supports multi-project, multi-agency tenancy

---

## 🧠 Core Product Modules

### 1. WhatsApp Business Gateway
- Integrate with Meta WhatsApp Cloud API
- Handle inbound/outbound messages
- Support text, media, templates, buttons, lists, carousels
- Track delivery, read receipts, failures
- Enforce opt-in and compliance

---

### 2. AI AutoChatBot Engine
- Intent classification (buy, rent, price, availability, visit, loan)
- Entity extraction (budget, location, size, type, possession timeline)
- Conversation state memory per user
- Context-aware multi-turn dialog
- AI-generated natural responses
- Rule + AI hybrid fallback system
- Seamless human agent handoff

---

### 3. Property Intelligence Engine
- Semantic search over property listings
- Recommendation ranking based on:
  - Budget
  - Location proximity
  - Property type
  - User preferences
  - Interaction history
- Future-ready for floor-plan AI & 3D visualization integration

---

### 4. CRM & Lead Automation
- Lead creation from WhatsApp conversations
- Lead qualification scoring
- Auto-routing to agents
- Deal pipeline stages
- Activity timelines
- WhatsApp chat history storage
- Follow-up task automation

---

### 5. Promotions & Campaign Engine
- WhatsApp broadcast campaigns using approved templates
- User segmentation:
  - Budget
  - Location
  - Buyer vs investor
  - Past interaction
- AI-personalized campaign messages
- Drip sequences
- Engagement analytics
- Auto follow-ups

---

### 6. Admin & Agent Web Dashboard
- Property management CMS
- Lead pipeline view (Kanban)
- WhatsApp shared inbox
- Campaign builder
- Agent assignment rules
- Conversation monitoring
- Analytics dashboards

---

### 7. Multi-Tenant SaaS Platform
- Multiple agencies/projects
- Tenant-level branding
- Tenant-level WhatsApp numbers
- Role-based access control
- Subscription-ready billing hooks

---

## 🏗️ System Architecture Requirements

Use **clean architecture with service separation**:

- API Gateway
- Messaging Service
- AI Engine Service
- Property Service
- CRM Service
- Campaign Service
- Auth Service
- Analytics Service

Use:
- REST + Webhooks
- Async queues for messaging & campaigns
- Event-driven workflows
- Stateless services where possible

---

## 🛠️ Tech Stack Requirements

### Backend
- Node.js + NestJS
- PostgreSQL
- Prisma ORM
- Redis + BullMQ
- JWT + RBAC

### Frontend
- Next.js / React
- TailwindCSS + ShadCN UI
- Recharts for analytics

### AI Layer
- OpenAI / Claude / Llama-compatible abstraction
- Prompt templates per intent
- Vector database for property embeddings

### Messaging
- WhatsApp Business Cloud API

### Infrastructure
- Docker
- CI/CD pipeline
- Cloud-ready (AWS/GCP/Azure)
- Horizontal scalability

---

## 🔐 Security & Compliance

- WhatsApp opt-in enforcement
- JWT + refresh tokens
- Rate limiting
- Role-based permissions
- Audit logs
- GDPR-compliant retention
- Webhook verification
- Secrets vaulting

---

## 📦 Data Models Required

Generate full schemas for:

- Tenants
- Users
- Roles
- Properties
- Units
- Leads
- Deals
- Conversations
- Messages
- Campaigns
- Broadcasts
- Templates
- Analytics events
- AI conversation memory
- Agent routing rules
- Follow-up workflows

Include Prisma schemas and migration strategy.

---

## 🤖 AI Prompting Requirements

Design:

- System prompts for:
  - Intent classification
  - Entity extraction
  - Response generation
  - Property recommendation reasoning
  - Lead qualification scoring

Include:
- Prompt templates
- Few-shot examples
- Fallback logic
- Guardrails
- Conversation memory handling

---

## 🔄 Workflow Automation

Implement:

- Lead intake pipelines
- Agent routing rules
- Follow-up automation
- SLA tracking
- Campaign workflows
- Conversation lifecycle management

---

## 📐 Deliverables Required

You must output:

1. Full **system architecture diagram**
2. **Database schema (Prisma)**
3. **Backend API structure**
4. **WhatsApp webhook + sender service**
5. **AI engine implementation**
6. **Campaign engine implementation**
7. **CRM module**
8. **Frontend dashboard UI**
9. **Security middleware**
10. **CI/CD pipeline config**
11. **Deployment architecture**
12. **Testing strategy**
13. **Environment variable spec**
14. **Production readiness checklist**

Each module must include:
- Folder structure
- API endpoints
- DTOs
- Validation schemas
- Error handling
- Logging
- Unit + integration tests

---

## 🧪 Quality Requirements

- Production-ready code
- Typed APIs
- Clean separation of concerns
- Scalable messaging pipeline
- Fault-tolerant queues
- Idempotent webhook handling
- Observability (logs, metrics, tracing)

---

## 🚀 Execution Instructions

Build the platform incrementally in this order:

1. Core infrastructure & auth
2. WhatsApp messaging gateway
3. CRM & lead ingestion
4. AI chatbot engine
5. Property recommendation engine
6. Agent dashboard
7. Promotions engine
8. Analytics
9. Multi-tenant layer
10. Security hardening
11. Performance optimization
12. Deployment & CI/CD

After each module:
- Provide working code
- Explain architecture decisions
- Include example requests/responses
- Provide test cases

---

## 📈 Success Metrics

System must achieve:
- < 1.5s AI response latency
- 99.9% webhook processing reliability
- Horizontal scalability for 100k+ conversations/day
- Campaign throughput of 1M+ messages/day
- GDPR & WhatsApp policy compliance

---

## 🧩 Final Output Goal

Deliver a **fully functional Intelligent Real Estate SaaS Platform** with:
- AI-powered WhatsApp AutoChatBot
- End-to-end lead automation
- Real-time agent workflows
- High-performance promotions engine
- Enterprise-grade security
- Cloud-ready scalability
