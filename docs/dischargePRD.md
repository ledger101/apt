Below is a concise but complete Product Requirements Document (PRD) for your responsive web app that lets Site Managers upload Excel test templates, automatically extracts and stores the data in Firestore, and enables Office Managers to view the uploaded data.
I reviewed the two Excel templates you shared to anchor the schema and parsing rules:
•	“STEPPED DISCHARGE TEST & RECOVERY” template includes borehole/project metadata and multiple Discharge Rate sections (1–6), plus Recovery, with time-series columns like TIME (MIN), WATER LEVEL (M), DRAW DOWN (M), YIELD (L/S) and water-quality points (pH, Temp, EC)..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
•	“CONSTANT DISCHARGE AND RECOVERY – BOREHOLE TEST RECORD” includes borehole/site metadata (e.g., BOREHOLE NO = KMDW 09, SITE NAME = KAMISENGO, CLIENT = LMC, CONTRACTOR = APT), pump/context fields (e.g., WATER LEVEL 2.74 m, CASING HEIGHT 0.37 m, DEPTH OF PUMP 100.5 m, PUMP TYPE WA110-2), test timing (TEST STARTED, Start time 09:30:00), and extensive time-series for observation holes and discharge borehole with water level, drawdown, yield, recovery columns, and a computed note (e.g., AVAILABLE DRAWDOWN = 97.76 m). [KMDW09 CON…D RECOVERY | Excel]
________________________________________
1) Overview
Goal. Build a mobile-friendly web app that:
1.	Allows Site Managers to upload Excel files based on standardized field test templates (stepped discharge & constant discharge).
2.	Parses the spreadsheets, validates and normalizes their contents, and stores them in Firebase Firestore with links to the original files in Cloud Storage.
3.	Provides Office Managers a secure dashboard to browse, filter, and view test datasets with drill-down into the time-series.
Primary templates supported at launch
•	Stepped Discharge Test & Recovery (multi rate steps + recovery; water-quality checkpoints)..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
•	Constant Discharge & Recovery (observation holes + discharge borehole; recovery; computed summary values). [KMDW09 CON…D RECOVERY | Excel]
Out of scope (v1).
•	Editing data in-app (beyond metadata corrections) — can be a Phase 2 item.
•	PDF report generation (Phase 2).
•	GIS mapping & advanced hydrogeology analytics (Phase 2+).
________________________________________
2) Users & Roles
•	Site Manager
o	Upload Excel test files (new tests).
o	See their own upload history & status (Queued/Parsed/Failed).
•	Office Manager
o	View all parsed tests across sites.
o	Filter by project, borehole, date, and test type.
o	Open a test detail page with metadata + time-series preview/export.
•	Admin (optional for v1)
o	Manage user access, re-run parsers, fix mappings, archive records.
________________________________________
3) Functional Requirements
3.1 Upload & Ingestion
•	Supported formats: .xlsx files conforming to your two templates.
•	Upload flow (Site Manager):
1.	Choose file → select Test Type (auto-detection also attempted).
2.	Validate structure & key headers before accepting the upload.
3.	On success: store original file in Cloud Storage; create a Parse Job document; trigger background parsing.
•	Auto-detection rules (heuristics):
o	If sheet contains “STEPPED DISCHARGE TEST & RECOVERY” and columns TIME (MIN) / WATER LEVEL (M) / DRAW DOWN (M) / YIELD (L/S) and Discharge Rate 1..6, classify as stepped discharge..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
o	If sheet title includes “CONSTANT DISCHARGE AND RECOVERY”, with OBservation Hole 1..3 plus Discharge Borehole columns and Available Drawdown note, classify as constant discharge. [KMDW09 CON…D RECOVERY | Excel]
3.2 Parsing & Validation
•	Parser per template extracts:
o	Metadata (project/borehole/site, coordinates, pump/installation context).
	Examples from your files: BOREHOLE NO, SITE NAME, CLIENT, CONTRACTOR, WATER LEVEL, CASING HEIGHT, DEPTH OF PUMP, PUMP TYPE, Start time. [KMDW09 CON…D RECOVERY | Excel]
	For stepped tests: Project No., Province, Borehole No., Latitude/Longitude, Site Name, Borehole Depth, Datum Above Casing, Existing Pump, Static Water Level (mbdl), Casing Height (magl), Pump Depth, Inlet Diameter, Pump Type, S/W/L (mbch)..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
o	Time-series data:
	Stepped Discharge: For each Discharge Rate (1–6), capture rows with Time (min), Water Level (m), Drawdown (m), Yield (L/s); capture Recovery series similarly; capture pH, Temp (°C), EC (µS/cm) for each rate if present..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
	Constant Discharge: Capture main discharge time-series (Time, Water Level, Drawdown, Yield), Observation Holes 1–3 time-series (Time, Water Level/Drawdown), Recovery series per section; capture notes like AVAILABLE DRAWDOWN and Total time pumped (min) if available. [KMDW09 CON…D RECOVERY | Excel]
•	Validation
o	Required metadata presence (Borehole No, Site Name, Test Date/Start Time, Test Type).
o	Units & ranges sanity checks (e.g., non-negative time, reasonable water levels/depths; yields ≥ 0).
o	Template conformance (headers/sections exist; at least N valid rows).
•	Normalization
o	Convert Excel dates (e.g., 46296.0) to ISO 8601 UTC datetimes; store local timezone offset. [KMDW09 CON…D RECOVERY | Excel]
o	Standardize units as stored fields (e.g., yield_lps, water_level_m, drawdown_m).
3.3 Storage & Data Model (Firestore)
Collections (proposed):
•	projects/{projectId} – optional if you manage projects.
•	boreholes/{boreholeId}
o	Fields: boreholeNo, siteName, coordinates, client, contractor, etc.
•	tests/{testId} (top-level, referencing a borehole)
o	Fields: testType ("stepped_discharge" | "constant_discharge"), boreholeRef, startTime, endTime, summary (e.g., availableDrawdown_m), sourceFilePath, status, createdBy.
o	Subcollections:
	series – one document per logical series, to avoid 1MB document size limits with long time-series:
	Example (Stepped):\ series/{seriesId} with seriesType: "discharge_rate" | "recovery", rateIndex (1..6), and points: [{t_min, wl_m, ddn_m, q_lps}]..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
	Example (Constant):\ series/{seriesId} with seriesType: "discharge" | "obs_hole_1" | "obs_hole_2" | "obs_hole_3" | "recovery", and appropriate points. [KMDW09 CON…D RECOVERY | Excel]
	quality – optional per-rate pH/Temp/EC for stepped tests..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
•	parseJobs/{jobId} – ingestion pipeline status & logs (errors, row counts, detected template type).
Example documents (JSON)
// tests/{testId} for a stepped discharge file
{
  "testType": "steppeddischarge",
  "boreholeRef": "boreholes/KMDW09",
  "startTime": "2025-11-05T09:30:00Z",
  "endTime": null,
  "summary": { "notes": null },
  "sourceFilePath": "gs://…/uploads/stepdischarge2025-11-05.xlsx",
  "status": "parsed",
  "createdBy": "uidsite_manager"
}
``
// tests/{testId} for a constant discharge file
{
  "testType": "constantdischarge",
  "boreholeRef": "boreholes/KMDW09",
  "startTime": "2025-11-05T09:30:00Z",
  "endTime": "2025-11-06T10:00:00Z",
  "summary": { "availableDrawdownm": 97.76 },
  "sourceFilePath": "gs://…/uploads/KMDW09constant2025-11-05.xlsx",
  "status": "parsed",
  "createdBy": "uidsitemanager"
}
3.4 View & Explore (Office Manager)
•	Dashboard: table view of tests with columns: Test Type, Borehole No, Site, Start Date, Status, Uploaded by.
•	Filters: by Test Type (Stepped/Constant), Borehole, Site, Date Range, Contractor/Client.
•	Detail Page:
o	Metadata (borehole/site, pump, casing, etc.). (e.g., fields present in your templates like WATER LEVEL, CASING HEIGHT, DEPTH OF PUMP, PUMP TYPE). [KMDW09 CON…D RECOVERY | Excel]
o	Series tabs:
	Stepped: Rate 1–6 charts + Recovery; water-quality callouts (pH/Temp/EC)..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
	Constant: Discharge + Observation Holes 1–3 + Recovery charts; summary (Available Drawdown). [KMDW09 CON…D RECOVERY | Excel]
o	Download options: CSV export per series; download original Excel.
3.5 Search & Audit
•	Search across Borehole No, Site Name, Client, Contractor, date.
•	Audit trail per test: who uploaded, when parsed, parse errors fixed.
________________________________________
4) Non Functional Requirements
•	Security & Auth: Firebase Authentication (email/password). (SSO via Microsoft Entra ID can be added later.)
•	Authorization: Firestore Security Rules enforce role-based access:
o	Site Managers: upload + view their own tests.
o	Office Managers: view all tests.
•	Performance: Parse typical files (<5 MB) within < 15 seconds on average; dashboard loads in < 2 seconds for common filters.
•	Reliability: At-least-once parsing with idempotency (re-upload same file doesn’t duplicate data; version it).
•	Scalability: Subcollections for time-series to avoid large docs.
•	Observability: Parse job logs with error counts, missing headers, row rejects.
________________________________________
5) Detailed Field Mapping (V1)
5.1 “Stepped Discharge Test & Recovery” → Firestore
Source (sheet): “STEPPED DISCHARGE TEST & RECOVERY / BOREHOLE TEST RECORD” headers and tables..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
tests/{testId} fields
•	testType: "stepped_discharge"
•	boreholeRef: link to boreholes/{boreholeNo}
•	startTime: from DATE + TIME near Discharge Rate 1 (convert Excel date/time).
•	summary: store info such as staticWaterLevel_mbdl, boreholeDepth_m, etc. (from metadata block with BOREHOLE DEPTH (m), DATUM LEVEL ABOVE CASING (m), EXISTING PUMP, WATER LEVEL (mbdl), CASING HEIGHT (magl), DEPTH OF PUMP (m), DIAM PUMP INLET (mm), PUMP TYPE)..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
•	sourceFilePath, status, createdBy.
tests/{testId}/series (one per discharge rate & recovery)
•	For each Discharge Rate 1..6:
o	seriesType: "discharge_rate", rateIndex: 1..6
o	points: [{ t_min, wl_m, ddn_m, q_lps }] from the columns TIME (MIN), WATER LEVEL (M), DRAW DOWN (M), YIELD (L/S)..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
•	Recovery:
o	seriesType: "recovery"
o	points: [{ t_min, wl_m, recovery_m }] (use the RECOVERY table columns)..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
tests/{testId}/quality
•	For each rate section, extract pH, TEMP (°C), EC (µS/cm) if filled..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
boreholes/{boreholeNo}
•	boreholeNo, siteName, coordinates (lat, lng) when present; contractor, client if listed; province, district. (From headers like PROVINCE, DISTRICT, SITE NAME, LATITUDE/LONGITUDE, CONTRACTOR)..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
5.2 “Constant Discharge & Recovery” → Firestore
Source (sheet): “CONSTANT DISCHARGE AND RECOVERY – BOREHOLE TEST RECORD” with BOREHOLE NO, SITE NAME, CLIENT, CONTRACTOR, equipment fields and extensive time-series for Observation Holes and Discharge Borehole, plus Available Drawdown. [KMDW09 CON…D RECOVERY | Excel]
tests/{testId} fields
•	testType: "constant_discharge"
•	boreholeRef: boreholes/KMDW09 (example).
•	startTime, endTime: from TEST STARTED/COMPLETED & Start time (convert Excel serial date/time like 46296.0 + 09:30:00 to ISO 8601). [KMDW09 CON…D RECOVERY | Excel]
•	summary.availableDrawdown_m: parse AVAILABLE DRAWDOWN = 97.76m if present. [KMDW09 CON…D RECOVERY | Excel]
•	pumpContext: { waterLevel_m: 2.74, casingHeight_m: 0.37, pumpDepth_m: 100.5, pumpInletDiam_mm: 230.0, pumpType: "WA110-2" }. [KMDW09 CON…D RECOVERY | Excel]
•	sourceFilePath, status, createdBy.
tests/{testId}/series
•	seriesType: "discharge" with points: [{ t_min, wl_m, ddn_m, q_lps }]. [KMDW09 CON…D RECOVERY | Excel]
•	seriesType: "obs_hole_1" | "obs_hole_2" | "obs_hole_3" with points: [{ t_min, wl_m, ddn_m }]. [KMDW09 CON…D RECOVERY | Excel]
•	seriesType: "recovery" for each relevant section (store as one combined series if columns share the same time base or separate if distinct per hole). [KMDW09 CON…D RECOVERY | Excel]
boreholes/{boreholeNo}
•	boreholeNo: "KMDW 09", siteName: "KAMISENGO", client: "LMC", contractor: "APT". (Extracted from the header rows.) [KMDW09 CON…D RECOVERY | Excel]
________________________________________
6) UX Flows & Screens (Responsive)
1.	Sign in → Email & password (v1).
2.	Upload (Site Manager)
o	Drag & drop or File picker → auto-detect template → optional override.
o	Preview key metadata detected (Borehole No, Site, Test Type, Start Date).
o	Submit → show Job status card with a live log.
3.	Dashboard (Office Manager)
o	Filters (left) + Results table (right).
o	Rows show Borehole, Site, Test Type, Start Time, Status.
4.	Test Detail
o	Top: metadata panel (borehole/site, pump context).
o	Tabs with charts:
	Stepped: tabs Rate 1–6 + Recovery; side callouts for pH/Temp/EC..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
	Constant: Discharge, Obs 1–3, Recovery, and Available Drawdown card. [KMDW09 CON…D RECOVERY | Excel]
o	Actions: Download CSV, Download Original Excel.
________________________________________
7) Technical Architecture
•	Frontend: Web app (responsive) using Angular or React (Material UI).
•	Backend (serverless):
o	Cloud Storage bucket uploads/ (original files).
o	Cloud Functions (Node.js) triggered on new file → parse (with exceljs/SheetJS) → write to Firestore.
o	Firestore for metadata, series, jobs logs.
•	Observability: Function logs; parseJobs collection with status, errors.
________________________________________
8) Security Model
•	Authentication: Firebase Auth (email/password in v1).
•	Authorization: Firestore Security Rules (example below).
•	Data privacy: No personal data; restrict reads/writes per role; signed URLs for file download.
// Example Firestore security rules (sketch)
rulesversion = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSM() { return request.auth.token.role == 'sitemanager'; }
    function isOM() { return request.auth.token.role == 'office_manager'; }
    function isAdmin() { return request.auth.token.role == 'admin'; }

    match /parseJobs/{jobId} {
      allow create: if isSM();
      allow read: if isSM() || isOM() || isAdmin();
      allow update, delete: if isAdmin();
    }

    match /tests/{testId} {
      allow read: if isOM() || isAdmin() || isSM();
      allow create: if isSM();
      allow update, delete: if isAdmin();
      match /series/{seriesId} {
        allow read: if isOM() || isAdmin() || isSM();
      }
    }

    match /boreholes/{bId} {
      allow read: if isOM() || isAdmin() || isSM();
      allow write: if isAdmin();
    }
  }
}
________________________________________
9) Acceptance Criteria (V1)
•	Upload: A valid .xlsx from your templates uploads, is auto-classified, parsed, and appears as a Parsed test within 1 minute; original file accessible via secure download. (Classification rules match the headers/sections present in your files.) [APT - STEP…ECOVERY(2) | Excel], [KMDW09 CON…D RECOVERY | Excel]
•	Data integrity:
o	Stepped: All Rate 1–6 rows and Recovery rows are captured with correct columns; any pH/Temp/EC present are stored..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
o	Constant: Discharge and Observation Holes 1–3 series captured; Available Drawdown parsed when present. [KMDW09 CON…D RECOVERY | Excel]
•	Search/Filter: Office Manager can filter by Borehole, Site, Test Type, Date Range and open the detail page with charts.
•	Security: Users cannot access tests they aren’t permitted to; uploads require login.
________________________________________
10) Error Handling
•	Template mismatch: If expected headers (e.g., “TIME (MIN)”, “WATER LEVEL (M)”) aren’t found, the parse job is marked Failed with a readable error pointing to the missing header..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
•	Partial rows: Skip rows with missing numeric values; count and report row rejects.
•	Bad dates: If Excel date serials (e.g., 46296.0) can’t be converted, store null and flag a warning. [KMDW09 CON…D RECOVERY | Excel]
________________________________________
11) Testing Plan (Key Cases)
•	Happy path: One file per template parses completely and shows all series & metadata. [APT - STEP…ECOVERY(2) | Excel], [KMDW09 CON…D RECOVERY | Excel]
•	Edge cases:
o	Stepped test with only Rates 1–3 filled (others empty)..xlsx\&action=default\&mobileredirect=true) [APT - STEP…ECOVERY(2) | Excel]
o	Constant test without Observation Hole 3 data (ensure optional). [KMDW09 CON…D RECOVERY | Excel]
o	Recovery present but sparse.
o	Non-numeric characters mixed into numeric cells (graceful coercion or skip).
o	Very long tests (several thousand minutes) → verify doc size & pagination in series.
________________________________________
12) Delivery Plan
•	Week 1: UI scaffolding (auth, upload), Cloud Storage, parse job model.
•	Week 2: Stepped parser, mapping & validation; dashboard list.
•	Week 3: Constant parser, observation holes, recovery; detail views & charts.
•	Week 4: Security rules hardening, exports, polish, and UAT.
________________________________________
13) Future Enhancements (Phase 2)
•	Minor-field editing & approval workflow (Office Manager): small corrections to names, IDs, and typos with audit logs.
•	PDF report generation from parsed data (with summary tables & charts).
•	SSO (Microsoft) and role provisioning automation.
•	Derived analytics: specific capacity, step-drawdown curves, transmissivity estimates.
________________________________________
 Below is implementation ready parser pseudo code for both Excel templates you shared, including header matching, template detection, validation, and unit normalization. It’s language agnostic (reads like TypeScript/JS), and you can adapt it to Cloud Functions using exceljs or SheetJS. I’ve included robust utilities (fuzzy header matching, numeric coercion, Excel date serials, DMS coordinates) and Firestore write patterns with chunking for large time series.
________________________________________
0) High level flow
function handleNewUpload(storageFilePath, uploaderUid):
    workbook = loadWorkbookFromStorage(storageFilePath)  // .xlsx
    sheet = workbook.firstVisibleSheet()

    detection = detectTemplateType(sheet)
    if detection.type == 'steppeddischarge':
        result = parseSteppedDischarge(sheet)
    else if detection.type == 'constantdischarge':
        result = parseConstantDischarge(sheet)
    else:
        return failJob("Template not recognized")

    if not result.ok:
        return failJob(result.error)

    // normalize + validate common metadata (borehole, site, times, etc.)
    normalized = normalizeCommon(result.data)

    // write to Firestore (tests, series subcollections, quality, parseJobs log)
    writeToFirestore(normalized, storageFilePath, uploaderUid)

    return succeedJob(result.summary)  // row counts, warnings
________________________________________
1) Shared utilities
1.1 Header normalization & fuzzy match
function norm(s):
    return lower(trim(replaceMultipleSpacesWithOne(s)))
           .replaceAll('\n',' ')
           .replaceAll('\r',' ')
           .replaceAll('\t',' ')
           .replaceAll('°','')    // for Temp °C
           .replaceAll('µ','u')   // µS -> uS
           .replaceAll('(m)','m')
           .replaceAll('(mm)','mm')
           .replaceAll('(min)','min')

// Pattern dictionary (regex; keep flexible for typos/case)
const HEADERPATTERNS = {
  timemin:       /^(time|t).min$/,
  waterlevelm:  /^(water\slevel|wl).m$/,
  drawdownm:     /^(draw\sdown|drawdown|dd).m$/,
  yieldlps:      /^(yield|discharge|q).(l.?\/.?s)$/,

  // Stepped sections & quality
  dischargerate: /^discharge\srate\s(\d+)$/,
  recoverytitle: /^recovery$/,
  ph:             /^pH\s:?\s$/,
  tempc:         /^temp.c$/,
  ecuScm:        /^ec.(u?s\/cm)$/,

  // Constant test blocks
  obshole:       /^observation\shole\s(\d+)$/,
  dischargebh:   /^discharge\s*borehole$/,
}

function findHeaderIndices(row):
    // returns {colName -> columnIndex}
    indices = {}
    for col in row.columns:
        n = norm(col.text)
        for key, rx in HEADERPATTERNS:
            if rx.test(n):
                indices[key] = col.index
    return indices

function findCell(sheet, regexOrText):
    // scans first N rows/columns to find a text cell matching regex/text
    for r in 1..SCANMAXROWS:
      for c in 1..SCANMAX_COLS:
        val = text(sheet.getCell(r,c))
        if isMatch(norm(val), regexOrText):
           return {row: r, col: c}
    return null
1.2 Numeric parsing & unit helpers
function toFloat(v):
    // tolerant numeric parse: strip commas/spaces, handle "2.74", "-0.01", "230.0", etc.
    if v is null or v == '':
        return null
    s = String(v).replaceAll(',', '').trim()
    num = parseFloat(s)
    return isFinite(num) ? num : null

function toInt(v):
    f = toFloat(v)
    return (f == null) ? null : round(f)

function ensureNonNegative(n): return (n == null) ? null : max(0, n)

function mmtom(mm):
    return (mm == null) ? null : (toFloat(mm) / 1000.0)

function lps(v): return toFloat(v)  // already L/s in templates
function meters(v): return toFloat(v)

function normalizeUnitsPoint(p):
    // p: {time?, wl?, ddn?, q?}
    return {
       tmin: ensureNonNegative(toFloat(p.time)),
       wlm:  meters(p.wl),
       ddnm: meters(p.ddn),
       qlps: lps(p.q)
    }
1.3 Excel serial date / time & timezone
// Excel 1900 date system: serial 1 = 1899-12-31; beware 1900 leap-bug (ignored in pseudo-code)
function excelSerialDateToISO(serial, timeStr = null, tzOffsetMinutes = +120 /* e.g., GMT+02 */):
    if serial == null: return null
    epoch = Date('1899-12-30T00:00:00Z')  // common baseline used for serial conversions
    msFromDays = round(serial * 86400000)
    dt = new Date(epoch.ms + msFromDays)
    if timeStr:
        // merge hh:mm:ss into dt (interpreted in local tz)
        [hh,mm,ss] = parseTime(timeStr)  // "09:30:00"
        dt.setHours(hh); dt.setMinutes(mm); dt.setSeconds(ss)
    // apply tz offset to store UTC ISO
    dtUTC = new Date(dt.ms - tzOffsetMinutes*60000)
    return dtUTC.toISOString()
1.4 Coordinates (supports “-17.12345, 31.09876” or DMS)
function parseCoordinate(value):
    // Accept "lat, lon" OR single field for LATITUDE / LONGITUDE separately
    // Optional DMS: 17°30'30"S -> -17.5083; 31°06'00"E -> 31.1
    if value matches DMS:
        return dmsToDecimal(value)
    else:
        return toFloat(value)
1.5 Table extraction helpers
function readTable(sheet, startRow, headerRow, headerMap, stopAtRegexes):
    // Extract rows under a known header row until blank line or next section
    rows = []
    r = headerRow + 1
    while r <= sheet.maxRow:
        // stop if next section title encountered
        titleCell = text(sheet.getCell(r, headerMap.firstCol))
        if any(rx.test(norm(titleCell)) for rx in stopAtRegexes):
            break

        // consider a row empty if all relevant columns are empty
        values = {}
        empty = true
        for key, colIdx in headerMap:
            val = sheet.getCell(r, colIdx).value
            values[key] = val
            if val not empty: empty = false
        if empty: break

        rows.push(values)
        r += 1
    return rows
``
________________________________________
2) Template detection
function detectTemplateType(sheet):
    hasStepped = findCell(sheet, /stepped\sdischarge\stest\s&\srecovery/i) != null
    hasConstant = findCell(sheet, /constant\sdischarge\sand\srecovery/i) != null

    if hasStepped and not hasConstant: return {type: 'steppeddischarge'}
    if hasConstant and not hasStepped: return {type: 'constantdischarge'}

    // Fallback heuristics
    if findCell(sheet, /discharge\srate\s1/i): return {type: 'steppeddischarge'}
    if findCell(sheet, /observation\shole\s*1/i): return {type: 'constantdischarge'}

    return {type: 'unknown'}
________________________________________
3) Parser: Stepped Discharge Test & Recovery
3.1 Metadata extraction
function parseSteppedDischarge(sheet):
    meta = {}
    // Probe around top-left region for the labeled fields
    meta.projectNo         = getNear(sheet, /project\sno/i)
    meta.mapRef            = getNear(sheet, /map\sreference/i)
    meta.province          = getNear(sheet, /province/i)
    meta.boreholeNo        = getNear(sheet, /borehole\sno/i)
    meta.altBhNo           = getNear(sheet, /^alt(.|ernative)?\sbh\sno/i)
    meta.siteName          = getNear(sheet, /site\sname/i)
    meta.district          = getNear(sheet, /district/i)
    meta.latitude          = parseCoordinate(getNear(sheet, /latitude/i))
    meta.longitude         = parseCoordinate(getNear(sheet, /longitude/i))
    meta.elevationm       = meters(getNear(sheet, /elevation/i))
    meta.boreholeDepthm   = meters(getNear(sheet, /borehole\sdepth.m/i))
    meta.datumAboveCasingm= meters(getNear(sheet, /datum.above\scasing.m/i))
    meta.existingPump      = getNear(sheet, /existing\spump/i)
    meta.staticWLmbdl     = meters(getNear(sheet, /water\slevel.mbdl/i))
    meta.casingHeightmagl = meters(getNear(sheet, /casing\sheight.magl/i))
    meta.contractor        = getNear(sheet, /contractor/i)
    meta.pumpDepthm       = meters(getNear(sheet, /depth\sof\spump.m/i))
    meta.pumpInletDiammm  = toFloat(getNear(sheet, /diam(eter)?\spump\sinlet.mm/i))
    meta.pumpType          = getNear(sheet, /pump\stype/i)
    meta.swlmbch        = meters(getNear(sheet, /s\/w\/l.mbch/i)) // if present

    // Dates/times may appear near each Discharge Rate section
    // We will read per-section start times; for test-level startTime pick first non-null
    startISO = null

    series = []         // array of {seriesType, rateIndex?, points[]}
    quality = []        // array of {rateIndex, pH?, tempC?, ecuScm?}
    warnings = []
3.2 Section loops (Rates 1–6 + Recovery)
    // For each potential rate index 1..6
    for rate in [1,2,3,4,5,6]:
        titleCell = findCell(sheet, new RegExp('^discharge\srate\s' + rate + '
    // Recovery section
    recTitle = findCell(sheet, HEADERPATTERNS.recoverytitle)
    if recTitle != null:
        headerRow = findHeaderRowBelow(sheet, recTitle.row, [HEADERPATTERNS.timemin, HEADERPATTERNS.waterlevelm])
        if headerRow != null:
            headerMap = mapHeaders(sheet.getRow(headerRow), {
                time: HEADERPATTERNS.timemin,
                wl:   HEADERPATTERNS.waterlevelm,
                rec:  /^recovery.*m$/i  // if present
            })
            rows = readTable(sheet, headerRow+1, headerRow, headerMap, [
                HEADERPATTERNS.dischargerate
            ])
            pts = []
            for row in rows:
                p = {
                  tmin: ensureNonNegative(toFloat(row.time)),
                  wlm:  meters(row.wl),
                  recoverym: meters(row.rec)  // optional
                }
                if p.tmin != null || p.wlm != null || p.recoverym != null:
                    pts.push(p)
            if pts.length > 0:
                series.push({ seriesType: "recovery", points: pts })
3.3 Return parsed object
    return {
      ok: true,
      data: {
        testType: "steppeddischarge",
        meta,
        startISO,
        series,
        quality
      },
      summary: {
        totalRates: count(series where seriesType=="dischargerate"),
        totalPoints: sum(len(s.points) for s in series),
        qualityCount: quality.length,
        warnings
      }
    }
________________________________________
4) Parser: Constant Discharge & Recovery
4.1 Metadata extraction
function parseConstantDischarge(sheet):
    meta = {}
    meta.boreholeNo       = getNear(sheet, /borehole\sno/i)
    meta.altBhNo          = getNear(sheet, /^alt(.|ernative)?\sbh\sno/i)
    meta.siteName         = getNear(sheet, /site\sname/i)
    meta.client           = getNear(sheet, /client/i)
    meta.contractor       = getNear(sheet, /contractor/i)
    meta.coordinates      = parseCoordinatesBothIfPresent(sheet) // latitude/longitude or combined
    meta.boreholeDepthm  = meters(getNear(sheet, /borehole\sdepth/i))
    meta.datumAboveCasingm = meters(getNear(sheet, /datum.above\scasing/i))
    meta.existingPump     = getNear(sheet, /existing\spump/i)
    meta.staticWLm       = meters(getNear(sheet, /^water\slevel:?/i))
    meta.casingHeightm   = meters(getNear(sheet, /casing\sheight/i))
    meta.pumpDepthm      = meters(getNear(sheet, /depth\sof\spump/i))
    meta.pumpInletDiammm = toFloat(getNear(sheet, /diam(eter)?\spump\sinlet/i))
    meta.pumpType         = getNear(sheet, /pump\stype/i)

    // Dates & times
    testStartedSerial = toFloat(getNear(sheet, /test\sstarted/i))
    testCompletedSerial = toFloat(getNear(sheet, /test\scompleted/i))  // may be empty
    startTimeStr      = getNear(sheet, /^start\stime/i)                // "09:30:00"
    meta.startISO     = excelSerialDateToISO(testStartedSerial, startTimeStr)
    meta.endISO       = excelSerialDateToISO(testCompletedSerial, null)

    // Derived summary values
    meta.availableDrawdownm = meters(extractInline(sheet, /available\sdrawdown\s=\s([0-9.-]+)/i))
    meta.totalTimePumpedmin = toFloat(getNear(sheet, /total\stime\s*pumped/i))

    series = []
    warnings = []
4.2 Locate the main composite table
This template often uses a wide grid with column groups for:
•	Discharge Borehole (Time, Water Level, Drawdown, Yield)
•	Observation Hole 1..3 (Time, Water Level, Drawdown)
•	Recovery columns (sometimes share Time or have their own block)
    // Find header row containing multiple known labels
    hdrRow = findRowThatContains(sheet, [
        HEADERPATTERNS.timemin,
        HEADERPATTERNS.dischargebh
    ])
    if hdrRow == null:
        return {ok:false, error:"Main header row not found"}

    // Build column groups by scanning left->right
    columns = sheet.getRow(hdrRow).cells
    groups = []  // [{name:'discharge', keys:{time,wl,ddn,yield}}, {name:'obshole1', …}, …]
    i = 1
    while i <= columns.length:
        cellText = norm(columns[i].text)
        if HEADERPATTERNS.dischargebh.test(cellText):
            // look ahead for its subheaders in next row (wl, ddn, yield)
            map = scanSubHeaders(sheet, hdrRow+1, i, {
              time: HEADERPATTERNS.timemin,
              wl:   HEADERPATTERNS.waterlevelm,
              ddn:  HEADERPATTERNS.drawdownm,
              q:    HEADERPATTERNS.yieldlps
            })
            groups.push({name:'discharge', keys:map})
            i += map.span
        else if HEADERPATTERNS.obshole.test(cellText):
            holeIndex = extractNumber(cellText)  // 1..3
            map = scanSubHeaders(sheet, hdrRow+1, i, {
              time: HEADERPATTERNS.timemin,
              wl:   HEADERPATTERNS.waterlevelm,
              ddn:  HEADERPATTERNS.drawdownm
            })
            groups.push({name:'obshole' + holeIndex, keys:map})
            i += map.span
        else if HEADERPATTERNS.recoverytitle.test(cellText):
            map = scanSubHeaders(sheet, hdrRow+1, i, {
              time: HEADERPATTERNS.timemin,
              wl:   HEADERPATTERNS.waterlevel_m
            })
            groups.push({name:'recovery', keys:map})
            i += map.span
        else:
            i += 1
4.3 Read down the table and build series
    // Data starts after (hdrRow + 2)
    dataStart = hdrRow + 2
    r = dataStart
    maxEmptyStreak = 50
    emptyStreak = 0

    // create containers for points per group
    points = {
      discharge: [],
      obshole1: [], obshole2: [], obshole3: [],
      recovery: []
    }

    while r <= sheet.maxRow && emptyStreak < maxEmptyStreak:
        rowEmpty = true

        for g in groups:
            k = g.keys
            // read values if columns exist
            t  = (k.time ? sheet.getCell(r, k.time).value : null)
            wl = (k.wl   ? sheet.getCell(r, k.wl).value   : null)
            dd = (k.ddn  ? sheet.getCell(r, k.ddn).value  : null)
            q  = (k.q    ? sheet.getCell(r, k.q).value    : null)

            if any([t,wl,dd,q] not empty):
                rowEmpty = false
                if g.name == 'recovery':
                    p = {
                      tmin: ensureNonNegative(toFloat(t)),
                      wlm:  meters(wl)
                    }
                    if p.tmin != null || p.wlm != null:
                        points.recovery.push(p)
                else if startsWith(g.name, 'obshole'):
                    p = normalizeUnitsPoint({time:t, wl:wl, ddn:dd, q:null})
                    if p.tmin != null || p.wlm != null || p.ddnm != null:
                        points[g.name].push(p)
                else if g.name == 'discharge':
                    p = normalizeUnitsPoint({time:t, wl:wl, ddn:dd, q:q})
                    if p.tmin != null || p.wlm != null || p.ddnm != null || p.qlps != null:
                        points.discharge.push(p)

        if rowEmpty: emptyStreak += 1 else: emptyStreak = 0
        r += 1

    // Build series array
    series = []
    if points.discharge.length > 0:  series.push({seriesType:'discharge',  points:points.discharge})
    for idx in [1,2,3]:
        name = 'obshole' + idx
        if points[name].length > 0:   series.push({seriesType:name, points:points[name]})
    if points.recovery.length > 0:    series.push({seriesType:'recovery',   points:points.recovery})

    return {
      ok: true,
      data: {
        testType: "constant_discharge",
        meta,
        startISO: meta.startISO,
        series
      },
      summary: {
        totalPoints: sum(len(s.points) for s in series),
        groupsParsed: len(groups),
        warnings
      }
    }
________________________________________
5) Normalization & validation (common)
function normalizeCommon(parsed):
    // Required fields
    require(parsed.meta.boreholeNo || parsed.meta.siteName, "Missing borehole/site")
    // Normalize coordinates to decimals if present
    if parsed.meta.latitude != null:  parsed.meta.latitude  = parseCoordinate(parsed.meta.latitude)
    if parsed.meta.longitude != null: parsed.meta.longitude = parseCoordinate(parsed.meta.longitude)

    // Clamp nonsense values
    if parsed.meta.staticWLm != null and parsed.meta.staticWLm < 0:
        parsed.meta.staticWLm = null

    // Drop impossible time points or negative yields
    for s in parsed.series:
        s.points = [
          p for p in s.points
          if (p.tmin == null || p.tmin >= 0) && (p.qlps == null || p.q_lps >= 0)
        ]

    return parsed
________________________________________
6) Firestore write pattern (chunking & indexing)
Firestore doc size is limited (~1 MB); for long tests, chunk points.
function writeToFirestore(parsed, storageFilePath, uploaderUid):
    // 1) Ensure borehole doc exists
    bhId = slugify(parsed.meta.boreholeNo || parsed.meta.siteName)
    upsert('boreholes/'+bhId, {
       boreholeNo: parsed.meta.boreholeNo ?? null,
       siteName: parsed.meta.siteName ?? null,
       client: parsed.meta.client ?? null,
       contractor: parsed.meta.contractor ?? null,
       coordinates: (parsed.meta.latitude && parsed.meta.longitude)
                    ? {lat:parsed.meta.latitude, lon:parsed.meta.longitude} : null,
       updatedAt: now()
    })

    // 2) Create test doc
    testId = newId()
    set('tests/'+testId, {
       testType: parsed.testType,
       boreholeRef: 'boreholes/'+bhId,
       startTime: parsed.startISO ?? parsed.meta.startISO ?? null,
       endTime: parsed.meta.endISO ?? null,
       summary: {
         availableDrawdownm: parsed.meta.availableDrawdownm ?? null,
         totalTimePumpedmin: parsed.meta.totalTimePumpedmin ?? null,
         staticWLm: parsed.meta.staticWLm ?? parsed.meta.staticWLmbdl ?? null,
         pump: {
           depthm: parsed.meta.pumpDepthm ?? null,
           inletDiammm: parsed.meta.pumpInletDiammm ?? null,
           type: parsed.meta.pumpType ?? null
         }
       },
       sourceFilePath: storageFilePath,
       status: 'parsed',
       createdBy: uploaderUid,
       createdAt: now()
    })

    // 3) Write series with chunking
    for s in parsed.series:
        chunkSize = 400  // tune to stay under doc limit
        for (i=0; i < s.points.length; i+=chunkSize):
            page = s.points.slice(i,i+chunkSize)
            seriesDoc = {
                seriesType: s.seriesType,
                rateIndex: s.rateIndex ?? null,
                pageIndex: (i / chunkSize),
                points: page,
                createdAt: now()
            }
            add('tests/'+testId+'/series', seriesDoc)

    // 4) Quality (stepped only)
    if parsed.quality:
        for q in parsed.quality:
            add('tests/'+testId+'/quality', {
                rateIndex: q.rateIndex,
                pH: q.pH ?? null,
                tempC: q.tempC ?? null,
                ecuScm: q.ec_uScm ?? null,
                createdAt: now()
            })

    // 5) Parse job log
    add('parseJobs', {
        testRef: 'tests/'+testId,
        status: 'parsed',
        warnings: parsed.summary?.warnings ?? [],
        counts: {series: parsed.series.length, points: sum(len(s.points) for s in parsed.series)},
        sourceFilePath: storageFilePath,
        createdBy: uploaderUid,
        createdAt: now()
    })
________________________________________
7) Error handling & resiliency
function failJob(message):
    add('parseJobs', { status:'failed', error: message, createdAt: now() })
    return {ok:false, error:message}

function require(condition, message):
    if not condition: throw new ParseError(message)

try/catch in handleNewUpload():
    try { … }
    catch (e):
        return failJob(e.message ?? 'Unknown parse error')
Tolerance strategy
•	Missing optional columns → log warnings[] and proceed.
•	Non numeric where numeric expected → coerce via toFloat or skip the row.
•	Duplicate uploads: compute a stable hash of the normalized time series; if an identical hash exists for the same borehole within a small time window, mark as duplicate and link.
________________________________________
8) Test cases you can run quickly
1.	Happy path – Stepped: File with all Discharge Rate 1–6 and Recovery populated; pH/Temp/EC present for two rates.
2.	Partial rates: Only Rates 1–3; others missing → should parse existing, warn about missing headers for absent rates without failing.
3.	Happy path – Constant: Wide table with Discharge + Observation Holes 1–3 + Recovery; verify availableDrawdown_m.
4.	Sparse recovery: Recovery only has times and WL; ddn missing → store WL and times.
5.	Very long test: ≥ 7000 minutes → ensure chunking produces multiple series docs and stays under Firestore doc size limits.
6.	Bad date/time: Excel serial malformed → startISO null, warning logged.
7.	Coordinates in DMS: Verify DMS → decimal conversion.
________________________________________
9) Drop in mappers (helpers referenced above)
function getNear(sheet, rx):
    // Find a label cell that matches rx; return the value cell to its right (same row, next non-empty)
    label = findCell(sheet, rx)
    if label == null: return null
    for dc in [1..4]:
        v = sheet.getCell(label.row, label.col + dc).value
        if v not empty: return v
    // fallback: look one row below, same col
    v = sheet.getCell(label.row + 1, label.col).value
    return v ?? null

function mapHeaders(row, expectedMap):
    result = {}
    for c in row.columns:
        n = norm(c.text)
        for key, rx in expectedMap:
            if rx.test(n) and result[key] == null:
                result[key] = c.index
    result.firstCol = min(result.* where not null) ?? row.firstNonEmptyCol
    return result

function findHeaderRowBelow(sheet, startRow, patterns[]):
    for r in (startRow+1)..(startRow+8):
        rowText = join(' | ', [norm(cell.text) for cell in sheet.getRow(r).cells])
        if all(pat.test(rowText) for pat in patterns):
            return r
    return null

function readNeighbor(sheet, row, col, rx):
    // scan nearby cells in a small rectangle (same row to the right; next rows down)
    for dc in 1..6:
      valLabel = text(sheet.getCell(row, col+dc))
      if isMatch(norm(valLabel), rx):
        // return the value immediately to its right or below
        return sheet.getCell(row, col+dc+1).value ?? sheet.getCell(row+1, col+dc).value
    for dr in 1..3:
      valLabel = text(sheet.getCell(row+dr, col))
      if isMatch(norm(valLabel), rx):
        return sheet.getCell(row+dr, col+1).value
    return null

function findInlineLabelValueBelow(sheet, startRow, rx, limitRows):
    for r in (startRow+1)..(startRow+limitRows):
        t = text(sheet.getCell(r, 1)) + ' ' + text(sheet.getCell(r, 2))
        if isMatch(norm(t), rx):
            // attempt value from same row later columns
            for c in 3..(3+5):
                v = sheet.getCell(r, c).value
                if v not empty: return v
    return null

function parseCoordinatesBothIfPresent(sheet):
    lat = getNear(sheet, /lat(it|)ude/i)
    lon = getNear(sheet, /lon(g|)titude/i)
    if lat or lon: return {lat: parseCoordinate(lat), lon: parseCoordinate(lon)}
    combo = getNear(sheet, /co[- ]?ordinates/i)  // e.g., "-17.1, 31.0"
    if combo:
        [a,b] = splitOnComma(combo)
        return {lat: parseCoordinate(a), lon: parseCoordinate(b)}
    return null
________________________________________
10) What you’ll get out of the box
•	Auto detection of both templates.
•	Robust header matching despite formatting differences or minor typos.
•	Unit safe normalization to wl_m, ddn_m, q_lps, *_m, *_mm.
•	Chunked series writes suitable for long duration tests.
•	Clear warnings & job logs for fast troubleshooting.
________________________________________
Optional follow ups (I can draft next):
•	Concrete Node.js/TypeScript implementation for Cloud Functions (using exceljs + Firestore Admin SDK).
•	Sample unit tests for the header mapper and date/number coercion.
•	A reparser function to fix failed jobs and re ingest with updated mapping.
Would you like the Cloud Functions version in TypeScript next, or a lightweight parser that runs in the browser (for client side preview before upload)? , 'i'))
        if titleCell == null: continue

        // Try read DATE/TIME near this title (same row or next 2 rows, right side)
        dateVal = readNeighbor(sheet, titleCell.row, titleCell.col, /date/i)
        timeVal = readNeighbor(sheet, titleCell.row, titleCell.col, /time/i)
        rateStartISO = excelSerialDateToISO(toFloat(dateVal), asText(timeVal))
        if startISO == null and rateStartISO != null: startISO = rateStartISO

        // Find the header row beneath the section title (scan next ~5 rows)
        headerRow = findHeaderRowBelow(sheet, titleCell.row, [HEADERPATTERNS.timemin, HEADERPATTERNS.waterlevelm, HEADERPATTERNS.drawdownm, HEADERPATTERNS.yieldlps])
        if headerRow == null:
            warnings.push("Rate " + rate + ": headers not found"); continue

        headerMap = mapHeaders(sheet.getRow(headerRow), {
           time: HEADERPATTERNS.timemin,
           wl:   HEADERPATTERNS.waterlevelm,
           ddn:  HEADERPATTERNS.drawdownm,
           q:    HEADERPATTERNS.yieldlps
        })

        rows = readTable(sheet, headerRow+1, headerRow, headerMap, [
                 HEADERPATTERNS.dischargerate, HEADERPATTERNS.recoverytitle
        ])

        pts = []
        for row in rows:
            p = normalizeUnitsPoint({
                 time: row.time, wl: row.wl, ddn: row.ddn, q: row.q
            })
            if p.tmin == null && p.wlm == null && p.ddnm == null && p.qlps == null:
                continue
            pts.push(p)

        if pts.length > 0:
            series.push({ seriesType: "dischargerate", rateIndex: rate, points: pts })

        // Water quality items may be listed at bottom of this rate block
        phVal   = findInlineLabelValueBelow(sheet, headerRow, /pH\s:?\s$/i, limitRows=10)
        tempVal = findInlineLabelValueBelow(sheet, headerRow, /temp.c/i, limitRows=10)
        ecVal   = findInlineLabelValueBelow(sheet, headerRow, /ec.(u?s\/cm)/i, limitRows=10)
        if phVal != null || tempVal != null || ecVal != null:
            quality.push({
               rateIndex: rate,
               pH: toFloat(phVal),
               tempC: toFloat(tempVal),
               ec_uScm: toFloat(ecVal)
            })
``
{{9-raw-markdown-a996d974-26d3-40f0-913f-1db68e85b1e1}}
3.3 Return parsed object
{{10-raw-markdown-a996d974-26d3-40f0-913f-1db68e85b1e1}}
________________________________________
4) Parser: Constant Discharge & Recovery
4.1 Metadata extraction
{{11-raw-markdown-a996d974-26d3-40f0-913f-1db68e85b1e1}}
4.2 Locate the main composite table
This template often uses a wide grid with column groups for:
•	Discharge Borehole (Time, Water Level, Drawdown, Yield)
•	Observation Hole 1..3 (Time, Water Level, Drawdown)
•	Recovery columns (sometimes share Time or have their own block)
{{12-raw-markdown-a996d974-26d3-40f0-913f-1db68e85b1e1}}
4.3 Read down the table and build series
{{13-raw-markdown-a996d974-26d3-40f0-913f-1db68e85b1e1}}
________________________________________
5) Normalization & validation (common)
{{14-raw-markdown-a996d974-26d3-40f0-913f-1db68e85b1e1}}
________________________________________
6) Firestore write pattern (chunking & indexing)
Firestore doc size is limited (~1 MB); for long tests, chunk points.
{{15-raw-markdown-a996d974-26d3-40f0-913f-1db68e85b1e1}}
________________________________________
7) Error handling & resiliency
{{16-raw-markdown-a996d974-26d3-40f0-913f-1db68e85b1e1}}
Tolerance strategy
•	Missing optional columns → log warnings[] and proceed.
•	Non numeric where numeric expected → coerce via toFloat or skip the row.
•	Duplicate uploads: compute a stable hash of the normalized time series; if an identical hash exists for the same borehole within a small time window, mark as duplicate and link.
________________________________________
8) Test cases you can run quickly
1.	Happy path – Stepped: File with all Discharge Rate 1–6 and Recovery populated; pH/Temp/EC present for two rates.
2.	Partial rates: Only Rates 1–3; others missing → should parse existing, warn about missing headers for absent rates without failing.
3.	Happy path – Constant: Wide table with Discharge + Observation Holes 1–3 + Recovery; verify availableDrawdown_m.
4.	Sparse recovery: Recovery only has times and WL; ddn missing → store WL and times.
5.	Very long test: ≥ 7000 minutes → ensure chunking produces multiple series docs and stays under Firestore doc size limits.
6.	Bad date/time: Excel serial malformed → startISO null, warning logged.
7.	Coordinates in DMS: Verify DMS → decimal conversion.
________________________________________
9) Drop in mappers (helpers referenced above)
{{17-raw-markdown-a996d974-26d3-40f0-913f-1db68e85b1e1}}
________________________________________
10) What you’ll get out of the box
•	Auto detection of both templates.
•	Robust header matching despite formatting differences or minor typos.
•	Unit safe normalization to wl_m, ddn_m, q_lps, *_m, *_mm.
•	Chunked series writes suitable for long duration tests.
•	Clear warnings & job logs for fast troubleshooting.
________________________________________
 
