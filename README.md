# FinTrack Pro — Enterprise Financial Management Platform

> SARS-Compliant Accounting · Gemini AI Insights · Spring Boot 3 · React 18 · CI/CD on Render

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [SDLC & Project Structure](#sdlc--project-structure)
4. [Security Design](#security-design)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [API Reference](#api-reference)
9. [Deployment](#deployment)

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        RENDER.COM                              │
│  ┌──────────────────┐        ┌──────────────────────────────┐  │
│  │  React 18 + Vite │  HTTPS │  Spring Boot 3 (Java 21)     │  │
│  │  (Static Site)   │◄──────►│  REST API  + JWT Auth        │  │
│  └──────────────────┘        │  Spring Security + JPA       │  │
│                              └──────────────┬───────────────┘  │
│                                             │                  │
│                              ┌──────────────▼───────────────┐  │
│                              │  PostgreSQL (Render DB)       │  │
│                              └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
           │                              │
           ▼                             ▼
    GitHub Actions              Gemini AI API (Google)
    Jenkins Pipeline             (Financial Insights)
    Docker Build & Push
```

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite | Fast builds, type-safe financial calculations |
| Styling | Tailwind CSS v3 | Utility-first, consistent design system |
| Charts | Recharts | Composable, accessible financial charts |
| Backend | Spring Boot 3.2 + Java 21 | Enterprise-grade, mature ecosystem |
| Security | Spring Security + JWT (JJWT) | Industry-standard stateless auth |
| Database | PostgreSQL 16 | ACID compliance for financial data |
| ORM | Spring Data JPA + Hibernate | Type-safe database operations |
| AI | Google Gemini 1.5 Flash API | Financial analysis & invoice OCR |
| Containerisation | Docker + Docker Compose | Reproducible environments |
| CI/CD | GitHub Actions + Jenkins | Automated testing and deployment |
| Hosting | Render.com | Zero-config PaaS with free tier |

---

## SDLC & Project Structure

### Phase 1 — Requirements & Design
- South African SARS compliance (VAT 201, CIT returns)
- Multi-currency support with ZAR as default
- Role-based access (Admin, Accountant, Viewer)
- AI-powered financial insights via Gemini
- Invoice OCR using Gemini Vision

### Phase 2 — Architecture
- Hexagonal / Clean Architecture in backend
- Feature-based folder structure in frontend
- JWT stateless authentication
- Centralised exception handling
- Global CORS + security filter chain

### Phase 3 — Implementation
See `backend/` and `frontend/` directories.

### Phase 4 — Testing
- Backend: JUnit 5 + Mockito + Spring Boot Test
- Frontend: Vitest + React Testing Library
- Integration: Testcontainers with PostgreSQL

### Phase 5 — Deployment
See [CI/CD Pipeline](#cicd-pipeline) below.

---

## Security Design

```
Request → CORS Filter → JWT Filter → Spring Security → Controller
                              ↓
                    Validate JWT signature
                    Check token expiry
                    Load UserDetails
                    Set SecurityContext
```

- Passwords hashed with **BCrypt** (strength 12)
- JWTs signed with **HS512**, expire in 24h
- Refresh tokens stored in DB, rotated on use
- All endpoints require authentication except `/api/auth/**` and `/api/public/**`
- HTTPS enforced on Render (TLS termination at proxy)
- SQL injection prevented via JPA parameterised queries
- XSS prevented via React's default escaping + CSP headers

---

## Getting Started

### Prerequisites
- Java 21+
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL 16 (or use Docker Compose)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/your-org/fintrack-pro.git
cd fintrack-pro

# 2. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start with Docker Compose (recommended)
docker compose up -d

# 4. OR run services individually:

# Terminal 1 — Backend
cd backend
./mvnw spring-boot:run

# Terminal 2 — Frontend
cd frontend
npm install && npm run dev
```

Access at: http://localhost:5173

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=jdbc:postgresql://localhost:5432/fintrack
DATABASE_USERNAME=fintrack
DATABASE_PASSWORD=your_secure_password
JWT_SECRET=your-256-bit-secret-here
JWT_EXPIRATION_MS=86400000
GEMINI_API_KEY=your-gemini-api-key
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-app.onrender.com
```

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## CI/CD Pipeline

### GitHub Actions (`.github/workflows/deploy.yml`)
```
Push to main
    → Run tests (backend + frontend)
    → Build Docker image
    → Push to Docker Hub
    → Trigger Render deploy via webhook
```

### Jenkins (`Jenkinsfile`)
```
Checkout → Test → Build JAR → Build Docker → Push → Deploy
```

### Render Deployment
- Backend: Web Service (Docker image from Docker Hub)
- Frontend: Static Site (built from `frontend/dist`)
- Database: Render PostgreSQL (free tier)

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| GET | `/api/auth/me` | Get current user profile |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List (paginated, filterable) |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/{id}` | Update transaction |
| DELETE | `/api/transactions/{id}` | Delete transaction |

### AI Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/analyze` | Analyse financial data |
| POST | `/api/ai/process-invoice` | OCR invoice image |
| GET | `/api/ai/suggestions` | Spending recommendations |

---

## Deployment

### Render.com Setup

1. Create a **PostgreSQL** database on Render
2. Create a **Web Service** linked to your GitHub repo
   - Build Command: `./mvnw clean package -DskipTests`
   - Start Command: `java -jar target/fintrack-1.0.0.jar`
   - Set all environment variables in Render dashboard
3. Create a **Static Site** for the frontend
   - Build Command: `cd frontend && npm ci && npm run build`
   - Publish Directory: `frontend/dist`
4. Add a `_redirects` file for React Router SPA routing

### Docker Push (manual)
```bash
docker build -t yourdockerhub/fintrack-backend:latest ./backend
docker push yourdockerhub/fintrack-backend:latest
```
