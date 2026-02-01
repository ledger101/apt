# 01. Architectural Analysis: Angular to Next.js Migration

## 1. Current Architecture Summary
The current application is a Single Page Application (SPA) built with **Angular**. It heavily relies on client-side processing for data validation before upload.

*   **Frontend Framework**: Angular (Components, Services, Modules).
*   **Styling**: SCSS / Tailwind CSS (mixed).
*   **Data Processing**: 
    *   **ExcelParsingService**: Logic-heavy service responsible for parsing Excel files in the browser, validating data against complex rules, and mapping it to the internal data model.
    *   **PumpingData Model**: Complex TypeScript `interface` and mapped types defined in `pumping-data.model.ts` that serve as the distinct source of truth.
*   **Backend / BaaS**: Google Firebase.
    *   **Firestore**: NoSQL database.
    *   **Authentication**: Firebase Auth (integrated via Angular wrapper/service).
*   **State Management**: Singleton Angular Services (`providedIn: root`) holding local state (RxJS `BehaviorSubjects`).

## 2. Target Architecture Definition
The target is a modern, performant web application using **Next.js 14+ (App Router)**.

*   **Framework**: Next.js 14+ (React).
*   **Language**: TypeScript (Strict).
*   **Styling**: Tailwind CSS + Shadcn/UI (for rapid component development and accessibility).
*   **Backend / Data Access**:
    *   **Read Operations (Real-time)**: Direct Firestore Web SDK calls from Client Components (using hooks) for dashboards requiring real-time updates.
    *   **Write Operations / Sensitive Logic**: React Server Actions for structured mutations.
    *   **Static/Cached Data**: Server Components for fetching non-real-time configuration data.
*   **Hosting**: Vercel (recommended) or Firebase Hosting (for static export/hybrid).

## 3. Migration Hotspots & Strategy

### A. Core Logic: `ExcelParsingService`
*   **Challenge**: This contains the "brains" of the data entry process. It is currently tightly coupled with Angular's dependency injection and potential RxJS streams.
*   **Strategy**: Refactor into a **Pure TypeScript Module**. 
    *   Remove Angular decorators (`@Injectable`).
    *   Replace RxJS observables with standard Promises/Async-Await where possible, or keep RxJS only if complex stream manipulation is strictly necessary (prefer plain JS logic for portability).
    *   This logic will run primarily on the **Client Side** (in the browser) to allow immediate user feedback during file drag-and-drop, preserving privacy and reducing server load.

### B. Data Layer: `FirestoreService`
*   **Challenge**: Angular services often mix state management with data fetching.
*   **Strategy**: Adapting to React Hooks pattern.
    *   Use libraries like `swr` (Stale-While-Revalidate) or `tanstack/react-query` to manage caching and server state.
    *   Create custom hooks (e.g., `useFirestoreCollection`, `useAuth`) to encapsulate Firebase logic, mirroring the subscription model of the original services.

### C. State Management
*   **Challenge**: Moving away from singleton Services with mutable state.
*   **Strategy**: 
    *   **Server State**: Managed via React Query/SWR.
    *   **Global Client State**: Use **Zustand** for lightweight global state (e.g., User Session, Active Upload Progress) or **React Context** for simpler dependency injection needs.
