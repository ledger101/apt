# Appendices

## Document Overview

**Appendices Date:** February 1, 2026  
**Total Appendices:** 8  
**Purpose:** Supporting documentation and reference materials

---

## Appendix A: Glossary

### A.1 Technical Terms

| Term | Definition |
|------|------------|
| Angular Elements | Web components created from Angular components |
| CI/CD | Continuous Integration / Continuous Deployment |
| CSR | Client-Side Rendering |
| FCP | First Contentful Paint |
| Firestore | Firebase NoSQL database |
| LCP | Largest Contentful Paint |
| Next.js | React framework with SSR/SSG |
| OIDC | OpenID Connect authentication protocol |
| RBAC | Role-Based Access Control |
| SSR | Server-Side Rendering |
| SSG | Static Site Generation |
| TTI | Time to Interactive |
| WCAG | Web Content Accessibility Guidelines |

### A.2 Business Terms

| Term | Definition |
|------|------------|
| Daily Test Pumping | Geotechnical testing process |
| Progress Report | Daily activity and personnel report |
| Site Manager | Field personnel who upload reports |
| Office Manager | Office personnel who review reports |
| Chargeable Hours | Billable work hours |
| Borehole | Drilled hole for testing |
| Discharge Test | Pumping test for aquifer characterization |

### A.3 Project Terms

| Term | Definition |
|------|------------|
| Migration | Moving from one technology to another |
| Rollback | Reverting to previous version |
| Hotspot | High-risk area requiring attention |
| Handoff | Transfer of work between agents |
| Quality Gate | Checkpoint for quality verification |
| Skill-First | Approach prioritizing skill utilization |
| Strangler Pattern | Gradual migration pattern |

---

## Appendix B: Technology Stack Comparison

### B.1 Current vs Target Stack

| Layer | Current | Target | Rationale |
|-------|---------|--------|-----------|
| Framework | Angular 20.0.4 | Next.js 15+ | SSR, performance, SEO |
| Language | TypeScript 5.8.2 | TypeScript 5+ | Consistency |
| Styling | Tailwind CSS 3.4.7 | Tailwind CSS 3.4+ | Reuse existing |
| State | RxJS + Services | Zustand + React Query | Modern patterns |
| Routing | Angular Router | Next.js App Router | Framework-native |
| Forms | Angular Forms | React Hook Form + Zod | Better validation |
| Charts | Chart.js 4.5.1 | Recharts | React-native |
| Grids | AG Grid Angular | AG Grid React | React version |
| PDF | jsPDF 3.0.3 | jsPDF | Reuse existing |
| Excel | XLSX 0.18.5 | XLSX | Reuse existing |

### B.2 Firebase Services

| Service | Current Usage | Target Usage | Changes |
|---------|---------------|--------------|---------|
| Firestore | Database | Database | None |
| Auth | OIDC + Microsoft Entra ID | OIDC + Microsoft Entra ID | None |
| Storage | File uploads | File uploads | None |
| Functions | Planned | Active | Implement |
| Hosting | Angular app | Next.js app | Update config |

---

## Appendix C: File Structure Reference

### C.1 Current Angular Structure

```
src/app/
├── components/
│   ├── alert/
│   ├── empty-state/
│   ├── navbar/
│   ├── reports/
│   ├── spinner/
│   └── upload/
├── guards/
│   └── auth.guard.ts
├── interceptors/
│   ├── error.interceptor.ts
│   └── loading.interceptor.ts
├── models/
│   ├── pumping-data.model.ts
│   └── index.ts
├── modules/
│   ├── financial/
│   ├── fleet/
│   ├── ohs/
│   ├── operations/
│   ├── personnel/
│   └── supply-chain/
├── pages/
│   ├── dashboard/
│   └── login/
├── services/
│   ├── auth.service.ts
│   ├── excel-parsing.service.ts
│   ├── firestore.service.ts
│   ├── fleet.service.ts
│   └── invoice-config.service.ts
├── app.config.ts
├── app.routes.ts
├── app.ts
└── styles.scss
```

### C.2 Target Next.js Structure

```
nextjs-app/
├── app/
│   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── reports/
│   │   ├── financial/
│   │   ├── fleet/
│   │   ├── ohs/
│   │   ├── personnel/
│   │   └── supply-chain/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── about/
│   │   └── contact/
│   ├── api/
│   │   ├── auth/
│   │   ├── reports/
│   │   ├── upload/
│   │   └── webhook/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── features/
│   ├── layouts/
│   └── admin-elements/
├── lib/
│   ├── firebase/
│   ├── excel/
│   ├── utils/
│   └── hooks/
├── types/
├── public/
│   └── angular-elements/
└── next.config.js
```

---

## Appendix D: Data Model Reference

### D.1 Core Data Models

```typescript
// Report Model
interface Report {
  reportId: string;
  orgId: string;
  projectId: string;
  siteId: string;
  rigId: string;
  reportDate: Date;
  client: string;
  projectSiteArea: string;
  rigNumber: string;
  controlBHId?: string;
  obsBH1Id?: string;
  obsBH2Id?: string;
  obsBH3Id?: string;
  challenges: string[];
  supervisorName: string;
  clientRepName: string;
  status: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  fileRef: string;
  checks: {
    templateVersion: string;
    parseWarnings: string[];
    parseErrors: string[];
  };
  dayShift: Shift;
  nightShift: Shift;
}

// Shift Model
interface Shift {
  startTime: string;
  endTime: string;
  totalHours: number;
  chargeableHours: number;
  activities: Activity[];
  personnel: Personnel[];
}

// Activity Model
interface Activity {
  order: number;
  activity: string;
  from: string;
  to: string;
  total: string;
  chargeable: boolean | null;
}

// Personnel Model
interface Personnel {
  name: string;
  hoursWorked: number;
}

// Discharge Test Model
interface DischargeTest {
  testId: string;
  testType: 'stepped_discharge' | 'constant_discharge';
  boreholeRef: string;
  startTime?: Date;
  endTime?: Date;
  summary: {
    availableDrawdown_m?: number;
    totalTimePumped_min?: number;
    staticWL_m?: number;
    pump?: {
      depth_m?: number;
      inletDiam_mm?: number;
      type?: string;
    };
    notes?: string;
  };
  sourceFilePath: string;
  status: 'parsed' | 'failed' | 'draft';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### D.2 Firestore Collection Structure

```
/organizations/{orgId}
  └── /projects/{projectId}
        └── /sites/{siteId}
              └── /rigs/{rigId}

/reports/{reportId}
  ├── /dayShift (document)
  │     ├── /activities/{activityId}
  │     └── /personnel/{personId}
  └── /nightShift (document)
        ├── /activities/{activityId}
        └── /personnel/{personId}

/sites/{siteId}_{boreholeNo}
  └── /tests/{testId}
        ├── discharge1
        ├── discharge2
        ├── discharge3
        ├── recovery
        ├── observationHole1
        ├── observationHole2
        ├── observationHole3
        └── quality_rate{rateIndex}

/materials/{materialId}
/requisitions/{requisitionId}
/inventory-transactions/{transactionId}
/pre-start-checks/{checkId}
/invoices/{invoiceId}
/invoice-configs/{configId}
```

---

## Appendix E: API Reference

### E.1 REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/reports | Get all reports | Yes |
| GET | /api/reports/[id] | Get report by ID | Yes |
| POST | /api/reports | Create report | Yes |
| PUT | /api/reports/[id] | Update report | Yes |
| DELETE | /api/reports/[id] | Delete report | Yes |
| POST | /api/upload | Upload file | Yes |
| GET | /api/sites | Get all sites | Yes |
| GET | /api/sites/[id] | Get site by ID | Yes |
| GET | /api/boreholes | Get all boreholes | Yes |
| GET | /api/boreholes/[id] | Get borehole by ID | Yes |
| GET | /api/tests | Get all tests | Yes |
| GET | /api/tests/[id] | Get test by ID | Yes |

### E.2 API Request/Response Examples

**Get Reports:**
```http
GET /api/reports?siteId=site123&status=Submitted
Authorization: Bearer {token}

Response:
{
  "reports": [
    {
      "id": "report123",
      "reportDate": "2026-01-15",
      "client": "LMC",
      "projectSiteArea": "KAMISENGO",
      "status": "Submitted"
    }
  ]
}
```

**Upload File:**
```http
POST /api/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
file: [binary data]

Response:
{
  "success": true,
  "fileUrl": "https://storage.googleapis.com/...",
  "data": {
    "type": "progress_report",
    "report": { ... }
  }
}
```

---

## Appendix F: Testing Strategy

### F.1 Test Pyramid

```
        /\
       /  \
      / E2E \      <- Few tests, high confidence
     /--------\
    / Integration \  <- Medium tests, medium confidence
   /----------------\
  /    Unit Tests    \ <- Many tests, fast feedback
 /----------------------\
```

### F.2 Test Coverage Targets

| Layer | Target | Priority |
|-------|--------|----------|
| Unit Tests | 80% | 🔴 Critical |
| Integration Tests | 60% | 🟠 High |
| E2E Tests | 40% | 🟡 Medium |
| Accessibility Tests | 100% | 🔴 Critical |
| Performance Tests | 100% | 🟠 High |

### F.3 Test Categories

**Unit Tests:**
- Component rendering
- Hook behavior
- Utility functions
- Service methods

**Integration Tests:**
- API routes
- Firebase integration
- State management
- Component interactions

**E2E Tests:**
- User workflows
- Authentication flow
- File upload
- Report creation
- Dashboard functionality

**Accessibility Tests:**
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- ARIA labels

**Performance Tests:**
- Page load times
- API response times
- Bundle size
- Memory usage

---

## Appendix G: Security Checklist

### G.1 Authentication & Authorization

- [ ] OIDC integration with Microsoft Entra ID
- [ ] JWT token validation
- [ ] Session management
- [ ] Role-based access control (RBAC)
- [ ] Route protection
- [ ] API authentication
- [ ] Token refresh mechanism

### G.2 Data Security

- [ ] Firestore security rules
- [ ] Data encryption at rest
- [ ] Data encryption in transit (HTTPS)
- [ ] Input validation
- [ ] Output sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention

### G.3 Infrastructure Security

- [ ] Environment variable management
- [ ] Secret management
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] DDoS protection
- [ ] Security headers
- [ ] Content Security Policy

### G.4 Compliance

- [ ] WCAG 2.1 AA compliance
- [ ] Data privacy compliance
- [ ] Security audit
- [ ] Penetration testing
- [ ] Vulnerability scanning

---

## Appendix H: Communication Templates

### H.1 Daily Standup Template

```
**Daily Standup - [Date]**

**[Agent Name]:**
- Yesterday: [What was accomplished]
- Today: [What will be worked on]
- Blockers: [Any blockers or dependencies]
```

### H.2 Handoff Template

```
**Handoff: [From Agent] → [To Agent]**

**Deliverables:**
- [List of completed items]

**Artifacts:**
- [Files, code, documentation]

**Dependencies:**
- [What the receiving agent needs]

**Known Issues:**
- [Any problems or limitations]

**Testing Status:**
- [What has been tested]

**Next Steps:**
- [What the receiving agent should do]
```

### H.3 Incident Report Template

```
**Incident Report - [Date]**

**Incident ID:** [ID]
**Severity:** [Critical/High/Medium/Low]
**Status:** [Open/Resolved]

**Summary:**
[Brief description of the incident]

**Impact:**
[Who was affected and how]

**Timeline:**
- [Time]: [Event]

**Root Cause:**
[What caused the incident]

**Resolution:**
[How the incident was resolved]

**Prevention:**
[How to prevent similar incidents]
```

### H.4 Status Update Template

```
**Status Update - [Date]**

**Project:** Daily Test Pumping Progress Reporting App Migration
**Phase:** [Current Phase]
**Week:** [Week Number]

**Progress:**
- Completed: [What was completed]
- In Progress: [What is being worked on]
- Upcoming: [What is planned next]

**Metrics:**
- Tasks Completed: [X/Y]
- Test Coverage: [X%]
- Performance: [X% improvement]

**Risks:**
- [Risk 1]: [Mitigation]
- [Risk 2]: [Mitigation]

**Blockers:**
- [Blocker 1]: [Owner]
- [Blocker 2]: [Owner]

**Next Steps:**
- [Step 1]
- [Step 2]
```

---

## Appendix I: Resource Requirements

### I.1 Development Environment

| Resource | Specification | Purpose |
|----------|---------------|---------|
| Node.js | 18+ | Runtime |
| npm/yarn | Latest | Package manager |
| Git | Latest | Version control |
| VS Code | Latest | IDE |
| Firebase CLI | Latest | Firebase tools |

### I.2 Testing Environment

| Resource | Specification | Purpose |
|----------|---------------|---------|
| Jest | Latest | Unit testing |
| React Testing Library | Latest | Component testing |
| Playwright | Latest | E2E testing |
| Lighthouse | Latest | Performance testing |
| axe-core | Latest | Accessibility testing |

### I.3 Deployment Environment

| Resource | Specification | Purpose |
|----------|---------------|---------|
| Firebase Hosting | - | Static hosting |
| Firebase Functions | - | Serverless functions |
| GitHub Actions | - | CI/CD |
| Vercel (optional) | - | Preview deployments |

### I.4 Monitoring Tools

| Tool | Purpose |
|------|---------|
| Firebase Analytics | User analytics |
| Sentry | Error tracking |
| LogRocket | Session replay |
| Lighthouse CI | Performance monitoring |
| Google Analytics | Web analytics |

---

## Appendix J: External Dependencies

### J.1 Third-Party Services

| Service | Purpose | Criticality |
|---------|---------|-------------|
| Firebase | Backend services | 🔴 Critical |
| Microsoft Entra ID | Authentication | 🔴 Critical |
| Google Cloud Storage | File storage | 🔴 Critical |
| GitHub | Code repository | 🟠 High |
| npm registry | Package management | 🟠 High |

### J.2 External Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| next | 15+ | Framework |
| react | 18+ | UI library |
| firebase | 10+ | Firebase SDK |
| next-auth | 4+ | Authentication |
| zustand | 4+ | State management |
| @tanstack/react-query | 5+ | Data fetching |
| tailwindcss | 3.4+ | Styling |
| shadcn/ui | Latest | UI components |
| xlsx | 0.18.5 | Excel parsing |
| jspdf | 3.0.3 | PDF generation |

---

## Appendix K: Change Log

### K.1 Document Versions

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-01 | Initial release | Architect Agent |

### K.2 Plan Revisions

| Revision | Date | Changes | Approved By |
|----------|------|---------|-------------|
| - | - | - | - |

---

## Appendix L: References

### L.1 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Angular Elements Guide](https://angular.io/guide/elements)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### L.2 Skills Reference

- `.agent/skills/backend-architect/SKILL.md`
- `.agent/skills/frontend-dev-guidelines/SKILL.md`
- `.agent/skills/angular-migration/SKILL.md`
- `.agent/skills/framework-migration-code-migrate/SKILL.md`
- `.agent/skills/deployment-engineer/SKILL.md`
- `.agent/skills/deployment-pipeline-design/SKILL.md`

### L.3 Project Documentation

- `docs/README.md`
- `docs/prd.md`
- `docs/implementation.md`
- `docs/excelUploads.md`

---

**Document Version:** 1.0  
**Last Updated:** February 1, 2026  
**Next Review:** As needed
