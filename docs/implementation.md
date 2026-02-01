# Implementation Checklist for Daily Test Pumping Progress Reporting App

## Phase 1: Core Upload, Parsing, Storage, and Dashboards

### Week 1: Foundation Setup and Authentication
- [x] Update Data Models: Replace insurance models with pumping interfaces (Report, Shift, Activity, Personnel) based on firestore-data-model.ts and PRD mappings. Update index.ts exports. Remove unused models (e.g., pension-data.model.ts).
- [x] Configure Authentication: Integrate Firebase Auth with Microsoft Entra ID (OIDC). Update auth.service for SSO login. Implement role-based access (SM/OM/Admin) in auth.guard. Add user profile storage (orgId, role).
- [x] Setup Firestore Security Rules: Draft and deploy rules for orgId-based isolation (users access only their org's data; SM can submit, OM can view/approve).
- [x] UI Scaffolding: Update login page for Entra ID flow. Ensure responsive design baseline (mobile-first with Tailwind breakpoints).

### Week 2: Excel Parsing and Upload Enhancement
- [x] Refactor Excel Parsing Service: Rewrite excel-parsing.service to parse pumping templates (detect headings like "DATE", "CLIENT"; handle day/night shifts, activities with From/To/Total/Chargeable, personnel lists). Implement validation (mandatory fields: Date, Site, Rig; time formats; night shift wrap-around; recompute totals).
- [x] Enhance Upload Component: Add preview tabs (Header, Day Shift, Night Shift, Personnel, Challenges). Integrate parsing/validation. Add error panel with clickable highlights and actionable messages. Support file size limit (10MB) and .xlsx only.
- [ ] Integrate Cloud Storage: Update data-upload.service to upload originals to Storage (/uploads/{org}/{YYYY}/{MM}/{fileId}.xlsx). Store fileRef in Firestore.

### Week 3: Firestore Integration and Validation
- [ ] Overhaul Firestore Service: Adapt firestore.service for pumping collections (reports, dayShift/nightShift subcollections). Implement CRUD (create reports on submit, query with filters: siteId, reportDate, client, rigId, chargeable). Add status workflow (Draft → Submitted → Reviewed → Approved → Archived).
- [ ] Client-Side Validation & Submission: Tie parsing errors to UI. On submit, write to Firestore with metadata (templateVersion, parseWarnings/Errors, createdBy, timestamps). Handle batch operations for shifts/activities/personnel.
- [ ] Testing Parsing: Unit tests for parsing logic using sample Excel/PDF data. Validate against PRD mappings (e.g., cell addresses for activities, personnel).

### Week 4: Dashboards, Filters, and Exports
- [ ] Redesign Dashboard for OM: Update dashboard.component with pumping filters (date range, client, site/rig, shift, chargeable). Add metrics cards (total/chargeable hours, activities count, personnel hours). Implement tables (daily summary, expandable activities/personnel, challenges).
- [ ] Add Review/Approval Workflow: UI for OM to mark Reviewed/Approved, add notes, request re-upload. Update Firestore on status changes.
- [ ] Implement Exports: Add CSV/XLSX/PDF export for filtered results. Use libraries like xlsx for Excel, jspdf for PDF (re-add to package.json if needed).

### Week 5: Hardening, Testing, and Go-Live Prep
- [ ] End-to-End Testing: Prepare sample dataset from PRD PDF. Test full flow (upload → parse → validate → store → view → export). Ensure responsive behavior (mobile/tablet/desktop).
- [ ] Accessibility & Performance: Audit for WCAG 2.1 AA (ARIA roles, keyboard nav, contrast). Optimize queries (pagination, indexes as per PRD).
- [ ] Observability & Docs: Add error logging (parseWarnings/Errors). Update README with setup, usage, and troubleshooting. Prepare training docs.
- [ ] Deployment & Monitoring: Deploy to Firebase Hosting/Functions. Set up alerts for errors (>0.5% rate). Backup Firestore daily.

## Progress Notes
- Started implementation on January 20, 2026.
- Completed Week 1 (data models, auth, security rules, UI scaffolding) and Week 2 (parsing service, upload component).
- Current focus: Week 3 tasks (Firestore integration).</content>
<parameter name="filePath">c:\Users\kuziw\APPS\testPad\implementation.md