# 02. Agent Orchestration Strategy

To manage the complexity of this migration, we will define a "Virtual Squad" of agents. Each agent (persona) focuses on a specific domain to ensure separation of concerns and high-quality output.

## 1. The Squad

### Agent 1: Migration Lead (User Proxy)
*   **Identity**: You (The human developer).
*   **Role**: Decision maker, context provider, reviewer of PRs, and "glue" between specific tasks. Directed by the `MASTER_STRATEGY`.

### Agent 2: "Angular Analyst"
*   **Role**: Forensics and Extraction.
*   **Responsibilities**:
    *   Deep reading of existing Angular `*.ts` files.
    *   Explaining complex RxJS chains.
    *   Identifying hidden dependencies in `modules`.
*   **Skills/Context**: `angular-migration`, `typescript-expert`, `code-documentation`.

### Agent 3: "Next.js Architect"
*   **Role**: Scaffolding, Routing, Core Layouts.
*   **Responsibilities**:
    *   Setting up the `app/` directory structure.
    *   Implementing Layouts (`layout.tsx`), Loading states (`loading.tsx`), and Error boundaries (`error.tsx`).
    *   Configuring Tailwind and Global Styles.
*   **Skills/Context**: `nextjs-app-router-patterns`, `react-patterns`, `tailwind-patterns`.

### Agent 4: "Logic Porting Specialist"
*   **Role**: Pure Typescript refactoring.
*   **Responsibilities**:
    *   Translating `ExcelParsingService` to data-neutral TS classes.
    *   Ensuring `pumping-data.model.ts` interfaces are preserved 1:1.
    *   Writing Type Guards and Zod schemas for validation.
*   **Skills/Context**: `typescript-expert`, `firebase`, `excel-parsing-logic`.

### Agent 5: "QA Sentinel"
*   **Role**: Testing and Verification.
*   **Responsibilities**:
    *   Ensuring the new React components match the logic of old Angular components.
    *   Verifying data integrity between old and new uploaders.
*   **Skills/Context**: `testing-patterns`, `e2e-testing-patterns`.

## 2. Handoff Protocols

1.  **Interface Contract**: Before any UI work begins, the **Logic Porting Specialist** must strictly define the TypeScript Interfaces. The Angular interfaces are the source of truth.
2.  **Git Branching**:
    *   `main`: Stable.
    *   `migration/setup`: Initial Next.js setup.
    *   `migration/logic-core`: Porting services.
    *   `migration/feature-dashboard`: UI work.
3.  **Context Loading**: When switching agents/tasks, we must explicitly load the relevant `.agent/skills` (conceptually) or reference the `ARCHITECTURAL_ANALYSIS` to ensure constraints are respected.
