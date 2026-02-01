# 03. Execution Roadmap

This roadmap breaks the migration down into five distinct phases, prioritizing low-risk/high-value tasks (logic) before moving to high-effort tasks (UI).

## Phase 1: Discovery & Setup (Days 1-2)
**Goal**: A running Next.js environment co-existing with the project documentation.
1.  **Repo Structure**: Initialize Next.js project alongside (or replacing) the existing structure (depending on repo strategy).
2.  **Configuration**: specialized `tsconfig.json` paths, Tailwind setup (copying config from `tailwind.config.js`).
3.  **Firebase**: Initialize Firebase SDK in a dedicated `@/lib/firebase` module.
4.  **Dependencies**: Install `lucide-react`, `clsx`, `tailwind-merge` (standard utils).

## Phase 2: Core Logic Porting (Days 3-5)
**Goal**: Business logic works in isolation (Unit Testable).
1.  **Models**: Copy `src/app/models/pumping-data.model.ts` to `@/types` or `@/lib/models`. Ensure strict mode compliance.
2.  **Utilities**: Port helper functions (date parsing, string formatting) from `_utilities.scss` (if applicable) or TS helpers.
3.  **Excel Service**:
    *   Isolate `ExcelParsingService`.
    *   Remove Angular dependency injection.
    *   Create `parseExcelFile(file: File): Promise<ParsingResult>` as a pure function/class.
4.  **Firestore Service**:
    *   Create `@/lib/services/firestore.ts`.
    *   Implement basic CRUD methods used in the app.

## Phase 3: UI Reconstruction (Days 6-10)
**Goal**: Visual parity with existing Angular app.
1.  **Layouts**: Recreate the `Navbar` and Sidebar structure using Next.js Layouts.
2.  **Dashboard**: Rebuild the main dashboard widgets.
    *   *Note*: Use dummy data initially to verify layout.
3.  **Upload Form**: Recreate the specific file upload generic components.
4.  **Reports**: Recreate the reporting tables/views.

## Phase 4: Integration & Data Wiring (Days 11-13)
**Goal**: Functional UI connected to real data.
1.  **Auth Integration**: Wrap the root layout in an Auth Context provider.
2.  **Service Wiring**: Connect the "Upload Form" to the ported "Excel Service".
3.  **Persistence**: Connect the results of the parse to the "Firestore Service".
4.  **Feedback**: Implement Toast notifications (replacing Angular Alerts).

## Phase 5: Evaluation (Day 14)
**Goal**: Sign-off.
1.  **Parity Check**: Run both apps side-by-side.
2.  **Performance Audit**: Check Lighthouse scores.
3.  **Cleanup**: Remove legacy Angular files (if a complete replacement).
