# Master Migration Strategy

**Executive Summary**
 This document outlines the comprehensive strategy for migrating the `testPad` application from **Angular** to **Next.js 14**. The primary goal is to modernize the stack while strictly preserving the complex business logic embedded in the `ExcelParsingService` and ensuring zero data-model divergence.

**Core Documents**
1.  **[01_ARCHITECTURAL_ANALYSIS.md](./01_ARCHITECTURAL_ANALYSIS.md)**: Technical "From -> To" mapping.
2.  **[02_AGENT_ORCHESTRATION_STRATEGY.md](./02_AGENT_ORCHESTRATION_STRATEGY.md)**: Roles and responsibilities for the AI agents/human team.
3.  **[03_EXECUTION_ROADMAP.md](./03_EXECUTION_ROADMAP.md)**: Step-by-step implementation plan.

---

## The "Skill-First" Constraint
**CRITICAL INSTRUCTION**: 
Before undertaking any task in this roadmap, the Agent must specifically identifying the necessary "Skill" or context context required.

*   By default, we assume **Strict TypeScript**.
*   When touching logic, we reference `pumping-data.model.ts` first.
*   When touching UI, we reference the existing `styles.scss` or component HTML to ensure visual consistency.

## Success Metric
The migration is considered successful when the **Next.js** version can:
1.  Log in via Firebase.
2.  Parse the standard Excel template exactly as the Angular version does.
3.  Upload the parsed data to Firestore.
4.  Display the data in the Dashboard.
