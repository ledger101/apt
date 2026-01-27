Below is a concise, implementation ready Product Requirements Document (PRD) for a responsive web app that lets Site Managers upload your Excel daily shift reports, automatically extracts and stores the data in Firestore, and enables Office Managers to view progress reports and track status.
________________________________________
PRD — Daily Test Pumping Progress Reporting App

________________________________________
1) Purpose & Background
The team currently captures daily test pumping progress using an Excel template and exports to PDF for sharing. The goal is to streamline data ingestion, storage, and reporting by enabling Site Managers to upload the Excel sheet directly to a responsive web app. The app will parse the sheet, validate entries, and store normalized data in Firestore, while Office Managers can monitor progress reports, filter by site/rig/date, and export if needed.
Reference files provided
•	Excel template (fields: Date, Client, Project/Site Area, Rig No, Shift Start/End, Activities by row, Chargeable Y/N, Personnel on duty, Challenges, Supervisor, Client Rep, and analogous Night shift section)..xlsx) 
•	PDF sample (e.g., Date 14/01/2026; Site “KAMISENGO”; Control BH_ID “KMDWO9”; multiple activity rows for Day & Night shifts with start/stop/total; personnel and hours; challenges; supervisor & client rep). 
________________________________________
2) Goals & Non Goals
Goals
1.	Upload & Extract: Drag drop/upload the provided Excel (.xlsx) template, parse its content reliably, and store in Firestore.
2.	Validation: Catch structural mismatches (wrong columns/sheets), missing mandatory fields (e.g., Date, Site, Rig), and time logic errors.
3.	Progress Visibility: Office Managers can view dashboards and tabular detail by site/rig/date (with chargeable vs non chargeable hours).
4.	Auditability: Keep original file, extraction metadata, and immutable report records with versioning.
5.	Responsive UX: Usable on phones/tablets (field) and desktops (office).
6.	Manual form entry of reports (beyond minimal corrections).
7.	Advanced analytics (e.g., productivity KPIs across rigs over quarters).
________________________________________
3) Users & Roles
•	Site Manager (SM): Uploads Excel template, reviews auto parsed preview, resolves validation errors, submits. 
•	Office Manager (OM): Views dashboards, filters, exports, and marks reports as reviewed/approved.
•	Administrator (Admin): Manages users/roles, site/rig master data, indexes, archive policy.
Authentication & Access
•	Sign in: Firebase Auth (OIDC/SAML).
•	Authorization: Role based (SM, OM, Admin) with client side checks  
________________________________________
4) Key User Stories
1.	As a Site Manager, I can upload the Excel “Daily Test Pumping Progress Report” template, see an extracted preview, fix flagged issues, and submit, so the report is stored accurately..xlsx) 
2.	As an Office Manager, I can filter reports by Date range / Project-Site / Rig / Client / Chargeable hours and view day vs night shift summaries, personnel hours, and challenges, with ability to export to Excel/PDF. , 
3.	As an Admin, I can view ingestion logs, reprocess failed uploads, and manage reference data (sites, rigs, clients).
________________________________________
5) Scope & Functional Requirements
5.1 File Ingestion & Parsing
•	Accepted file types: .xlsx (template based).
•	File size limit: 10 MB (configurable).
•	Upload flow:
1.	SM uploads → 2) parse sheet client side using angular. → 3) Results appear in preview grid → 4) SM confirms submission → 5) Data & file persisted; status set to “Submitted”.
•	Template detection: Validate presence of known headings and layout from the provided template (e.g., DATE, CLIENT, PROJECT/SITE AREA, SHIFT START/END, Day/Night sections, Activities rows 1–10 with From/To/Total and Chargeable Y/N, Personnel on duty table, Challenges, Supervisor, Client’s representative)..xlsx) 
•	Error handling:
o	Missing mandatory fields (Date, Site, Rig) → block submission.
o	Activity list: allow fewer than 10 rows; ignore blank trailing rows.
o	Personnel list: capture name + hours; ignore empty rows.
5.2 Data Validation Rules
•	Date: required; must be a valid calendar date.
•	Times: 24 hour format; night shift supports wrap around (e.g., 18:20 → 06:00).
•	Totals: Total Hrs recomputed client side; chargeable hours tallied per shift and per day.
•	Text fields: Trim whitespace; max lengths (e.g., names ≤ 100 chars; challenges ≤ 500 chars).
•	IDs: Control_BH_ID, OBS_BH_*_ID are optional text fields when present. , 
5.3 Review & Approval
•	Statuses: Draft (pre-submit) → Submitted → Reviewed → Approved → Archived.
•	Office Manager: Can mark Reviewed/Approved, add review notes, and request re upload.
5.4 Reporting & Dashboards
•	Filters: Date range, Client, Project/Site area, Rig, Shift (Day/Night), Chargeable.
•	Cards/KPIs:
o	Total hours (day, night, combined)
o	Chargeable vs non chargeable split
o	Number of activities completed
o	Personnel count and total hours
•	Tables:
o	Activities (chronological, with duration and chargeable flag)
o	Personnel hours (day/night, totals)
o	Challenges list
•	Exports: CSV/XLSX/PDF of filtered results and a printable daily report.
________________________________________
6) Input Mapping (Template → Firestore)
Note: Mapping is based on the provided Excel template structure and the sample PDF’s populated values. , 
6.1 Top level Report Fields
•	reportDate (Date) ← “DATE” (e.g., 10/01/2025; sample shows 14/01/2026) , 
•	client (String) ← “CLIENT” (e.g., LMC) , 
•	projectSiteArea (String) ← “PROJECT/SITE AREA” (e.g., MALUNDWE / KAMISENGO) , 
•	rigNumber (String) ← “RIG No_1” (text value following “RIG No”).xlsx) 
•	controlBHId (String) ← “Control BH_ID” (e.g., KMDWO9) , 
•	obsBH1Id, obsBH2Id, obsBH3Id (String, optional) ← “OBS_BH_*_ID” fields , 
•	dayShift (Object) & nightShift (Object) → see below.
•	challenges (Array) ← “CHALLENGES” list (up to 4 entries; sample shows “HNM”). , 
•	supervisorName (String) ← “Supervisor [Name]” (e.g., DALITSO SAKALA) 
•	clientRepName (String) ← “Client's representative [Name]” (e.g., SUNGENI TEMBO / CEPHAS NGAZIMBI) 
6.2 Shift Object Structure
{
  "shiftLabel": "Day | Night",
  "startTime": "06:00",
  "endTime": "18:00",
  "activities": [
    {
      "order": 1,
      "activity": "ARRIVAL ON SITE",
      "from": "06:00",
      "to": "06:50",
      "total": "0:50",
      "chargeable": false
    }
  ],
  "personnel": [
    { "name": "DESMOND CHISENGA", "hoursWorked": 12 },
    { "name": "FRIDAH KANYENZE", "hoursWorked": 12 }
  ],
  "computed": {
    "totalHours": 12.0,
    "chargeableHours": 10.35
  }
}
(Example values aligned with the sample PDF’s activity and personnel rows.) 
________________________________________
7) System Architecture
Frontend
•	Stack: Angular (Vite/Next.js), TypeScript, Tailwind, Firebase Web SDK.
•	Responsive: Mobile first; breakpoints for phone (≤480px), tablet (481–1024px), desktop (≥1025px).
•	PWA (optional): Installable, offline upload queue (Phase 2).
Backend
•	Firebase Authentication (OIDC with Microsoft Entra ID) for SSO.
•	Cloud Storage for Firebase for original file storage.
•	Cloud Functions for:
o	File trigger on upload → parse .xlsx via exceljs or sheetjs/xlsx.
o	Data validation, normalization, and write to Cloud Firestore.
o	Thumbnail/preview generation (optional) and error notifications.
•	Cloud Firestore (Native mode) for structured report data.
Data Flow
1.	SM uploads Excel → Cloud Storage (/uploads/{org}/{YYYY}/{MM}/{fileId}.xlsx)
2.	Cloud Function (storage finalize) parses and validates; on success writes documents to Firestore (reports/{reportId} + subcollections).
3.	Frontend listens to Firestore queries to render dashboards and tables.
4.	OM actions (review/approve) update report status in Firestore.
Observability
•	Function logs (Cloud Logging), error alerts (Email/Slack), ingestion metrics dashboard (optional via BigQuery export).
________________________________________
8) Firestore Data Model
Collections & Documents
/organizations/{orgId}

/projects/{projectId}
  - name
  - client
  - sites: [siteId]

/sites/{siteId}
  - name
  - projectId
  - rigs: [rigId]

/rigs/{rigId}
  - rigNumber
  - siteId

/reports/{reportId}
  - orgId, projectId, siteId, rigId
  - reportDate (Timestamp)
  - client (String)
  - controlBHId, obsBH1Id, obsBH2Id, obsBH3Id
  - challenges: [String]
  - supervisorName, clientRepName
  - status: "Submitted|Reviewed|Approved|Archived"
  - createdBy (uid), createdAt, updatedAt
  - fileRef: gs://... (path to original .xlsx)
  - checks: { templateVersion, parseWarnings: [String], parseErrors: [String] }

  /dayShift (doc)
    - startTime, endTime
    - totalHours (Number), chargeableHours (Number)

    /activities/{activityId}
      - order, activity, from, to, total, chargeable

    /personnel/{personId}
      - name, hoursWorked

  /nightShift (doc)
    - (same structure as dayShift)
Indexes
•	Composite: (siteId ASC, reportDate DESC) for site timelines.
•	Composite: (client ASC, rigId ASC, reportDate DESC).
•	Single-field: status, projectId, rigId.
Field Constraints
•	Strings trimmed; maximum lengths enforced by Cloud Functions before write.
•	Numbers normalized (hours as decimal).
•	Times stored both as strings (for display) and computed numeric durations for analytics.
________________________________________
9) UI/UX Requirements
Upload Page (SM)
•	Drag drop zone; shows file name, size, and template version detection.
•	Preview tabs: Header, Day Shift, Night Shift, Personnel, Challenges.
•	Validation panel with actionable errors/warnings (click to highlight offending cell).
•	Buttons: Submit, Discard, Download Error Report (CSV).
Reports (OM)
•	Filters: date range picker, client, project/site, rig, shift, chargeable flag.
•	Metrics cards + stacked bar for chargeable vs non chargeable hours (day/night).
•	Tables:
o	Daily Summary (one row per report)
o	Activities (expandable rows)
o	Personnel
o	Challenges
•	Actions: Mark Reviewed, Approve, Export (CSV/XLSX/PDF), Open Source File.
Responsive Behavior
•	Mobile: single column; swipe tabs; sticky filters.
•	Desktop: two column layout; persistent filters sidebar; virtualized tables for performance.
Accessibility
•	WCAG 2.1 AA: keyboard navigation, color contrast, ARIA roles, focus outlines, and accessible chart descriptions.
________________________________________
10) Parsing & Business Logic Details
•	Template recognition: Ensure specific labels from the sheet are present (e.g., DAILY TEST-PUMPING PROGRESS REPORT, Activity, From (Hrs), To (Hrs), Total Hrs, Chargeable [Tick], Personnel on duty)..xlsx) 
•	Compute durations:
o	Parse From/To as HH:mm.
o	If Night shift and to < from, add 24h wrap.
o	Recompute total and use recomputed value (log mismatch if provided total differs).
•	Chargeable hours: Sum across activity rows where chargeable = true.
•	Personnel hours: Sum for each shift and cross check against shift total (warning only; may differ for valid reasons such as overlap).
•	Row limits: Up to 10 activities per shift; ignore blank rows. , 
•	Data normalization: Uppercase for BH IDs; title case for names; trimmed strings.
•	Versioning: Store templateVersion hash to detect layout changes.
________________________________________
11) Security, Privacy, Compliance
•	Auth: Firebase Auth with Microsoft Entra ID (OIDC).
•	AuthZ: Firestore Security Rules; users can only access data for their orgId and per role.
•	At rest: Storage & Firestore encryption by default.
•	In transit: HTTPS enforced (Firebase Hosting).
•	PII: Personnel names are stored; implement least privilege and data retention policy (e.g., archive after 24 months).
________________________________________
12) Non Functional Requirements (NFRs)
•	Performance:
o	Upload parse turnaround: ≤ 5s for typical files (≤ 200 rows combined).
o	Dashboards load: first contentful paint ≤ 2s on 3G fast; queries paginated.
•	Availability: 99.9% monthly (Firebase SLA dependent).
•	Scalability: Functions stateless; Firestore indexes sized for 10k+ reports/year.
•	Reliability: Dead letter queue (e.g., Pub/Sub) for failed parses; retry with backoff.
•	Observability: Error rate < 0.5% per 1,000 uploads; alert on spike.
________________________________________
13) DevOps & Environments
•	Envs: dev, staging, prod with separate Firebase projects.
•	CI/CD: GitHub Actions; lint, test, deploy to Firebase Hosting/Functions.
•	Config: Runtime config for allowed MIME types, size limits, org whitelists.
•	Backups: Firestore daily export to Cloud Storage; lifecycle rules (30–90 days).
________________________________________
14) Acceptance Criteria (Phase 1)
1.	Uploading a valid template file results in a successful parse and creation of a reports/{reportId} doc, with day & night shift activities and personnel captured as per sample structure. (Verified using your provided PDF values as a test case.) 
2.	Incorrect template or missing mandatory fields triggers human readable validation errors and prevents submission..xlsx) 
3.	Office Manager can filter by Site, Rig, Date range and see chargeable vs non chargeable hours with accurate totals.
4.	The original .xlsx file is stored and linked from the report record.
5.	Role based access enforced via Firestore Security Rules.
________________________________________
15) Risks & Mitigations
•	Template drift: If the sheet layout changes, parsing may fail. → Mitigate with templateVersion hash and admin page to update mapping quickly.
•	Time format inconsistencies (e.g., 6:00 vs 06:00): Normalize with robust parsing + unit tests. 
•	Names spelling variance: Accept free text; optionally introduce staff directory in Phase 2.
•	Night shift wrap complexity: Thorough unit tests for midnight crossover.
________________________________________
16) Open Questions
1.	Should we enforce a master list of Projects/Sites/Rigs or accept free text then map later?
2.	Do we need per client visibility rules (multi tenant, client logins)?
3.	Is a PWA with offline queue required in Phase 1 for low connectivity sites?
4.	Export formats—which are mandatory (CSV, XLSX, PDF)?
5.	Should we auto email the Approved PDF to a distribution list?
________________________________________
17) Phase 1 Delivery Plan (Indicative)
•	Week 1–2: UI scaffolding, Auth (Entra ID), Storage upload, parsing function (v1)
•	Week 3: Firestore model, Security Rules, validation & preview UX
•	Week 4: Dashboards & filters, exports, review/approve workflow
•	Week 5: Hardening (tests, logs, indexes), docs, training, go live
________________________________________
18) Example Record (abbrev.)
This approximates the structure saved after parsing your sample PDF file (values illustrative).
{
  "reportId": "2026-01-14KAMISENGORIG1",
  "reportDate": "2026-01-14",
  "client": "LMC",
  "projectSiteArea": "KAMISENGO",
  "rigNumber": "1",
  "controlBHId": "KMDWO9",
  "obsBH1Id": "KMM01",
  "obsBH2Id": null,
  "obsBH3Id": null,
  "challenges": ["HNM"],
  "supervisorName": "DALITSO SAKALA",
  "clientRepName": "SUNGENI TEMBO / CEPHAS NGAZIMBI",
  "status": "Submitted",
  "dayShift": {
    "startTime": "06:00",
    "endTime": "18:00",
    "activities": [
      { "order": 1, "activity": "ARRIVAL ON SITE", "from": "06:00", "to": "06:50", "total": "0:50", "chargeable": false },
      { "order": 2, "activity": "TOOLBOX TALK", "from": "06:50", "to": "07:20", "total": "0:30", "chargeable": false },
      { "order": 4, "activity": "CONSTANT DISCHARGE TEST PUMPING", "from": "07:30", "to": "10:30", "total": "3:00", "chargeable": true }
    ],
    "personnel": [
      { "name": "DESMOND CHISENGA", "hoursWorked": 12 },
      { "name": "FRIDAH KANYENZE", "hoursWorked": 12 }
    ]
  },
  "nightShift": {
    "startTime": "18:00",
    "endTime": "06:00",
    "activities": [
      { "order": 7, "activity": "CONSTANT DISCHARGE TEST PUMPING", "from": "00:00", "to": "06:00", "total": "6:00", "chargeable": true }
    ],
    "personnel": [
      { "name": "LACKSON KANGWANDA", "hoursWorked": 12 },
      { "name": "GILBERT KASHITO", "hoursWorked": 12 }
    ]
  },
  "fileRef": "gs://bucket/uploads/2026/01/report.xlsx"
}
(Fields mirror values and structure seen in the sample PDF and the template.) , 
________________________________________
19) Next Steps
1.	Confirm the field mapping above (especially BH IDs, personnel rules, challenges cap). , 
2.	Decide on Phase 1 exports (CSV/XLSX/PDF) and whether you want PWA offline in v1.
3.	I’ll prepare:
o	A field level validation spec and Firestore Security Rules draft.
o	A small sample dataset using your PDF to run end to end.
________________________________________

here is a field by field mapping from the Excel template cell addresses to the Firestore document structure we defined. I inspected the uploaded workbook directly to anchor the mappings to precise coordinates (sheet “Daily report drilling”). 1 (Sample values and structure are also verified against your sample PDF.) 2
Sheet: Daily report drilling\ Note on merged cells: Some labels are followed by merged or open text areas. For extraction, treat the first data cell to the right of the label as the value cell unless a value is already present in the same row (examples included below).
________________________________________
1) Top Level Report Header → /reports/{reportId}
•	Title (ignored for data)
o	Excel: A1 = "DAILY TEST-PUMPING PROGRESS REPORT"
o	Firestore: (not stored)
o	Rationale: Static heading. 1
•	reportDate
o	Excel: I6 (e.g., 2025-10-01)
o	Firestore: reportDate: Timestamp
o	Notes: Cast to date; timezone = Africa/Harare (config). 1
•	client
o	Excel: D7 (e.g., LMC)
o	Firestore: client: string 1
•	shiftLabel (Day/Night for the first block)
o	Excel: I7 (e.g., Day)
o	Firestore: (not stored at root; shift label lives inside dayShift/nightShift)
o	Action: If I7 == "Day", map first block to dayShift. 1
•	rigNumber
o	Excel: A9 contains RIG No_1 (label + value combined).
o	Parse rule: Extract everything after RIG No → "1"
o	Firestore: rigNumber: "1" 1
•	projectSiteArea
o	Excel: E9 (e.g., MALUNDWE)
o	Firestore: projectSiteArea: string 1
•	dayShift.startTime / dayShift.endTime
o	Excel: H9 (start), J9 (end) → e.g., 06:00, 18:00
o	Firestore: dayShift.startTime: "06:00", dayShift.endTime: "18:00"
o	Notes: Store canonical "HH:mm". Compute numeric durations server side. 1
•	controlBHId / obsBH1Id / obsBH2Id / obsBH3Id
o	Excel labels row: C10="Control BH_ID:", E10="OBS_BH_1_ID:", G10="OBS_BH_2_ID:", I10="OBS_BH_3_ID:"
o	Value cells (template leaves them blank): the value typically sits one column to the right of each label, same row.
	Expected value cells: D10, F10, H10, J10
o	Firestore: controlBHId, obsBH1Id, obsBH2Id, obsBH3Id (strings; uppercase normalization) 1
________________________________________
2) Day Shift — Activities (Rows 13–22)
Headers (for reference)
•	A11="Activity", F12="From (Hrs)", G12="To (Hrs)", H12="Total Hrs", I12="Yes", J12="No" 1
Row indices: 10 entries → rows 13..22.\ Column mapping:
•	activity (text)
o	Excel: B13:E22 (merged/expanded text area to the right of A index)
o	Firestore path: /reports/{id}/dayShift/activities/{n}.activity: string
•	from / to / total
o	Excel: F13:F22 (From), G13:G22 (To), H13:H22 (Total)
o	Firestore:
	...activities.{n}.from: "HH:mm"
	...activities.{n}.to: "HH:mm"
	...activities.{n}.total: "H:MM" (stored for display)
o	Compute rule: Recompute numeric duration on the backend; if mismatch, log parse warning. 1
•	chargeable
o	Excel: Tick under Yes or No columns → I13:I22 or J13:J22
o	Parse rule: If I has a mark → true; if J → false; if both blank →false;.
o	Firestore: ...activities.{n}.chargeable: boolean|null 1
•	order
o	Excel: A13:A22 (1..10)
o	Firestore: ...activities.{n}.order: number 1
________________________________________
3) Day Shift — Personnel (Rows 25–29)
Headers
•	A23="Personnel on duty", row 24 contains column labels. Two parallel name/hour columns exist. 1
Row indices: 25..29 (up to 5 entries).\ Column mapping:
•	Left column person
o	Excel: B25:B29 (names), F25:F29 (hours)
o	Firestore: Create entries in a single array:
	{ name: Bxx, hoursWorked: Fxx }
•	Right column person
o	Excel: G25:G29 (names), J25:J29 (hours)
o	Firestore: Same array (append):
	{ name: Gxx, hoursWorked: Jxx }
•	Index
o	Excel: A25:A29 (1..5) → used only for row order, not stored. 1
Firestore target: /reports/{id}/dayShift/personnel/{personId} (or a single array personnel[]—pick one model and keep consistent; earlier PRD uses a subcollection personnel.)
________________________________________
4) Night Shift Header → /reports/{id}/nightShift
Header row
•	B31="SHIFT:", C31="NIGHT" (label/value)
•	Start/End:
o	Excel: F31 (start, 18:00), I31 (end, 06:00)
o	Firestore: nightShift.startTime, nightShift.endTime
o	Wrap rule: If to < from, add 24h during numeric computations. 1
________________________________________
5) Night Shift — Activities (Rows 34–43)
Headers (row 32–33) mirror the Day block. 1
Row indices: 34..43\ Column mapping (same as Day):
•	activity → B34:E43
•	from / to / total → F34:F43, G34:G43, H34:H43
•	chargeable → ticks in I34:I43 (Yes) or J34:J43 (No)
•	order → A34:A43 (1..10)
•	Firestore: /reports/{id}/nightShift/activities/{n} fields as in Day. 1
________________________________________
6) Night Shift — Personnel (Rows 46–50)
Headers
•	A44="Personnel on duty", row 45 contains column labels. 1
Row indices: 46..50\ Mapping (same two column pattern):
•	Left column: B46:B50 (names), F46:F50 (hours)
•	Right column: G46:G50 (names), J46:J50 (hours)
•	Firestore: Append to /reports/{id}/nightShift/personnel entries, identical schema to Day. 1
________________________________________
7) Challenges, Supervisor, Client Rep
•	challenges[]
o	Excel: A51="CHALLENGES", row numbers at A52:A55
o	Values: text usually typed in B52:B55 (template shows numbers in col A; col B is the free text area)
o	Firestore: challenges: [ strings ] (trim blanks)
o	Max 4; ignore empty rows. 1
•	supervisorName
o	Excel: A57="Supervisor [Name]:" → value typically in B57 (spanning rightwards if merged)
o	Firestore: supervisorName: string 1
•	clientRepName
o	Excel: A58="Client's representative [Name]:" → value typically in B58 (span rightwards)
o	Firestore: clientRepName: string 1
________________________________________
8) Derived / Computed Fields (Server side)
•	dayShift.computed.totalHours / chargeableHours
o	Sum of Total and chargeable rows from H13:H22 and I/J13:I/J22 (boolean logic) after recomputing duration from From/To for consistency.
•	nightShift.computed.totalHours / chargeableHours
o	Same for rows 34..43, with midnight wrap handling.
•	status, createdBy, timestamps
o	Not from Excel; set by backend on ingest and user action.
________________________________________
9) Firestore Document Examples (JSON)
9.1 Root document (abbrev.)
{
  "reportDate": "2025-10-01",
  "client": "LMC",
  "projectSiteArea": "MALUNDWE",
  "rigNumber": "1",
  "controlBHId": "KMDWO9",
  "obsBH1Id": "KMM01",
  "obsBH2Id": null,
  "obsBH3Id": null,
  "challenges": ["HNM"],
  "supervisorName": "DALITSO SAKALA",
  "clientRepName": "SUNGENI TEMBO / CEPHAS NGAZIMBI",
  "status": "Submitted",
  "fileRef": "gs://…/report.xlsx"
}
(Illustrative values reflect your sample PDF.) 2
9.2 Day shift activity (one row)
{
  "order": 1,
  "activity": "ARRIVAL ON SITE",
  "from": "06:00",
  "to": "06:50",
  "total": "0:50",
  "chargeable": false
}
2
________________________________________
10) Parser Rules (Practical Notes)
1.	Blank trailing rows: ignore if activity, from, to, total, and both tick cells are empty.
2.	Chargeable tick: treat any non blank content (text, “x”, “✓”, checkmark) as a tick.
3.	Time normalization: accept 6:00:00 AM, 6:00, 06:00, 6.00, and coerce to "HH:mm".
4.	Merged areas: when a label exists (e.g., Control BH_ID: at C10), capture the next non empty cell to the right on the same row if the canonical value cell is empty.
5.	Validation: If Date (I6), Client (D7), Site (E9), Rig (A9) are missing, block submission and report a structured error referencing the exact cell. Allow use to manually enter the data
________________________________________
11) Quick Reference — Cell → Field Map
I6           → reportDate
D7           → client
A9 (parse)   → rigNumber
E9           → projectSiteArea
H9, J9       → dayShift.startTime, dayShift.endTime
D10,F10,H10,J10 → controlBHId, obsBH1Id, obsBH2Id, obsBH3Id

Day activities (rows 13–22):
  B:E        → ...dayShift.activities[n].activity
  F          → ...dayShift.activities[n].from
  G          → ...dayShift.activities[n].to
  H          → ...dayShift.activities[n].total
  I/J        → ...dayShift.activities[n].chargeable
  A          → ...dayShift.activities[n].order

Day personnel (rows 25–29):
  B,F        → ...dayShift.personnel[].name / .hoursWorked
  G,J        → ...dayShift.personnel[].name / .hoursWorked

Night header (row 31):
  F31, I31   → nightShift.startTime, nightShift.endTime

Night activities (rows 34–43): (same columns as Day)
  B:E, F, G, H, I/J, A  → mapped to nightShift.activities

Night personnel (rows 46–50):
  B,F and G,J → nightShift.personnel

B52:B55      → challenges[]
E57          → supervisorName
E58          → clientRepName
1
________________________________________
12) Do you want me to deliver the extraction function next?
I can implement a Cloud Function (Node.js) that:
•	Reads the .xlsx,
•	Applies the mapping above,
•	Normalizes times and booleans,
•	Writes to Firestore in your schema, and
•	Returns parse warnings with exact cell references (e.g., “H17: total doesn’t match From/To”).
If that works, I’ll proceed with a first pass of the parser code and unit tests.

