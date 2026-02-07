# Implementation Plan: Angular to Next.js 14 Migration

This plan outlines the modernization of the `testPad` application, moving from Angular to Next.js 14 (App Router) while preserving core business logic and data models.

## User Review Required

> [!IMPORTANT]
> The new application will be created in a subdirectory `apt-next/` to ensure the current Angular application remains functional and accessible during the migration process.

## Proposed Changes

### Project Structure & Setup

#### [NEW] apt-next/
Initialization of a Next.js 14+ project with the following tech stack:
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn/UI
- **Language**: TypeScript (Strict)
- **State Management**: Zustand / React Context

---

### Core Logic Porting

#### [NEW] apt-next/src/types/pumping-data.ts
Porting the source-of-truth interfaces from the Angular model.

#### [NEW] apt-next/src/lib/logic/excel-parser.ts
Extraction of the logic from `ExcelParsingService.ts` into a pure TypeScript class/module, removing all Angular decorators and `FileReader` wrappers in favor of modern `async/await` patterns.

---

### UI & Integration

#### [NEW] apt-next/src/components/uploader.tsx
A new React-based file uploader component that utilizes the ported `excel-parser.ts`.

#### [NEW] apt-next/src/app/dashboard/page.tsx
The main dashboard page leveraging Firestore for real-time data display.

---

## Verification Plan

### Automated Tests
- **Unit Tests for Logic**: Create unit tests in `apt-next/src/lib/logic/__tests__/excel-parser.test.ts` to verify parsing results match expected JSON outputs.
- **Command**: `npm test` (once Vitest/Jest is configured).

### Manual Verification
1.  **Side-by-Side Comparison**: Run both apps (Angular on port 4200, Next.js on port 3000).
2.  **The "Golden File" Test**: Upload the same Excel template to both applications and verify that the generated JSON/Firestore objects are identical.
3.  **Auth Flow**: Verify login/logout functionality via Firebase.
Runtime FirebaseError



Firebase: Error (auth/unauthorized-domain).