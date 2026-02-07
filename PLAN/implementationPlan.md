# Implementation Plan: Angular to Next.js Migration

This plan translates the high-level strategy in this folder (MASTER_STRATEGY, 01–03) into concrete, ordered steps you can execute in the codebase. It assumes a strict TypeScript setup, `pumping-data.model.ts` as the data source of truth, and Firebase as the backend.

---

## Phase 0 – Groundwork & Branching

1. Create migration branches
   - Create `migration/setup`, `migration/logic-core`, and `migration/feature-dashboard` branches from `main`.
   - Protect `main` and treat it as read-only during migration.
2. Freeze current Angular behavior
   - Capture screenshots/recordings of the current login, upload, and dashboard flows.
   - Export a **small**, **medium**, and **large** representative Excel file that the current app parses successfully.
   - Note any known edge cases (e.g., weird date formats, missing columns) in a short checklist in `docs/excelUploads.md` or a new doc.
3. Confirm “skills” and reference points
   - For **logic changes**, always open `src/app/models/pumping-data.model.ts` side by side.
   - For **UI work**, keep `src/styles.scss` and relevant Angular component HTML open to preserve layout and visual semantics.

---

## Phase 1 – Next.js Skeleton (Branch: `migration/setup`)

1. Scaffold Next.js 14 app
   - In `apt-next/` (or a new adjacent directory), initialize a Next.js 14 App Router project using TypeScript.
   - Ensure `strict` mode is enabled in `tsconfig.json`.
2. Configure Tailwind & base styles
   - Add Tailwind to the Next.js app and mirror configuration from the root `tailwind.config.js` where appropriate.
   - Port global SCSS variables and utility classes from `src/styles/_variables.scss` and `_utilities.scss` into Tailwind config or global CSS where feasible.
3. Basic app structure
   - Create top-level `app/layout.tsx`, `app/page.tsx`, and placeholder `app/(auth)/login/page.tsx`, `app/(dashboard)/dashboard/page.tsx` routes.
   - Add `loading.tsx` and `error.tsx` where relevant to match the loading/error behavior of the Angular app.
4. Firebase initialization
   - Create `apt-next/src/lib/firebase.ts` that initializes Firebase (Auth + Firestore) using the same config as `firebase.json`.
   - Export minimal helpers: `getAuth()`, `getFirestore()` to be reused by services and hooks.
5. Commit & PR
   - Open a PR `migration/setup` → `main` describing the scaffolding and confirming that the app boots and renders a minimal dashboard placeholder.

---

## Phase 2 – Core Models & Parsing Logic (Branch: `migration/logic-core`)

1. Port data models
   - Copy `src/app/models/pumping-data.model.ts` into `apt-next/src/lib/models/pumping-data.model.ts` (or `apt-next/src/types/pumping-data.ts`).
   - Fix any path/TS issues while preserving interfaces, enums, and mapped types 1:1.
2. Introduce validation schemas
   - Define Zod (or similar) schemas for the key interfaces (e.g., `PumpingDataRow`, `UploadPayload`).
   - Export type-safe parsing helpers such as `parsePumpingRow(raw: unknown): PumpingDataRow`.
3. Refactor ExcelParsingService
   - Locate the existing Angular `ExcelParsingService` in `src/app/services`.
   - Extract it into a framework-neutral TS module in `apt-next/src/lib/services/excel-parsing.ts`:
     - Remove Angular decorators and DI.
     - Replace RxJS pipelines with async/await or small helpers where possible.
     - Expose a single high-level API: `parseExcelFile(file: File): Promise<ParsingResult>` that returns typed data based on `pumping-data.model.ts`.
4. Unit tests for parsing
   - Add tests for `parseExcelFile` using the sample Excel sheets captured in Phase 0.
   - Verify that:
     - Valid files produce the same number of rows and aggregate totals as the Angular implementation.
     - Known invalid cases (bad dates, missing columns) produce the same error messages or codes.
5. Commit & PR
   - Open a PR `migration/logic-core` → `main` summarizing the pure TS parsing module and tests.

---

## Phase 3 – Data Access & Auth Integration

1. Firestore service layer
   - Create `apt-next/src/lib/services/firestore.ts` encapsulating all CRUD operations used by the Angular app (e.g., fetch pumping records, save uploads, fetch reports).
   - Mirror data shapes as defined in `pumping-data.model.ts` and any related interfaces.
2. React hooks for data access
   - Implement hooks like `usePumpingData()`, `useUploadHistory()`, and `useAuthUser()` using `swr` or `tanstack/react-query`.
   - Ensure hooks return loading, error, and data states in a way that maps cleanly to current Angular templates.
3. Auth flow
   - Implement a Firebase Auth flow under `app/(auth)/login/page.tsx` using the same providers as the Angular app.
   - Add an `AuthProvider` and `RequireAuth` guard component and wrap dashboard routes.
4. Commit & PR
   - Open a PR describing the Firestore service, hooks, and auth wiring.

---

## Phase 4 – UI Reconstruction (Branch: `migration/feature-dashboard`)

1. Layout & navigation
   - Implement a `Navbar` and any side navigation based on Angular templates in `src/app/components/navbar`.
   - Recreate layout regions (header, main content, sidebar, footer) using Next.js Layouts and Tailwind.
2. Dashboard
   - Rebuild dashboard cards and charts in `app/(dashboard)/dashboard/page.tsx`.
   - Initially wire them to mock data shaped exactly like `PumpingData` to validate layout and interactions.
3. Upload flow
   - Implement a drag-and-drop or file-picker-based upload component in `app/(dashboard)/upload/page.tsx`.
   - On submit, call `parseExcelFile` and render validation results (errors, warnings) in a similar UX to the Angular app.
   - Provide clear progress/feedback using a Spinner/Alert pattern similar to existing Angular components in `src/app/components/upload` and `spinner`.
4. Reports & tables
   - Port the key reporting views (tables, filters) into React components and connect them to `usePumpingData()` and related hooks.
   - Ensure pagination, sorting, and filtering behavior matches the Angular implementation.
5. Styling & consistency pass
   - Compare with `styles.scss` and modular SCSS files to adjust spacing, colors, and typography.
   - Optionally introduce shadcn/ui for buttons, inputs, and dialogs while preserving core visual identity.
6. Commit & PR
   - Open a PR summarizing UI parity status with a checklist of screens and components completed.

---

## Phase 5 – Integration, Parity, and Cleanup

1. Wire real data
   - Replace mock dashboard data with real hooks/services.
   - Connect the upload flow to Firestore write operations so parsed data persists.
2. End-to-end verification
   - Run both Angular and Next.js apps side by side.
   - For each test Excel file, confirm that:
     - The parsed row counts and totals match.
     - Validation errors and warnings are equivalent.
     - The resulting stored records in Firestore have the same shape.
3. Performance & UX polish
   - Run Lighthouse on key pages and address any regressions.
   - Smooth out loading states and error boundaries (e.g., fallback UIs, retry buttons).
4. Documentation
   - Update `docs/IMPLEMENTATION_SUMMARY.md` (or create a new section) describing:
     - Where the new parsing logic lives.
     - How to run tests.
     - How to add new upload templates or fields.
5. Decommission Angular
   - Once parity is achieved and validated, plan a controlled cut-over:
     - Switch production traffic to the Next.js app.
     - Archive or progressively remove Angular-specific code and configs.

---

## Phase 6 – Future Enhancements (Optional)

1. Improve observability
   - Add structured logging around upload and parsing steps using a central logger (e.g., `apt-next/src/lib/logging`).
   - Add basic error tracking (Sentry or similar).
2. Advanced validation tools
   - Introduce an admin-only view for inspecting raw vs. normalized data for debugging.
3. Additional templates
   - Extend the parsing module to support new Excel templates while reusing the same validation pipeline.
