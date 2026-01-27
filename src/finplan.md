# Plan for Financial Control Module Implementation

## Objective
The "Financial Control" tile is currently unresponsive due to its route in `src/app/app.routes.ts` incorrectly reloading the `DashboardComponent`. The goal is to create a new `FinancialModule` and update the routing configuration to fix this issue. The `FinancialModule` will include sub-items for `Requisitions`, `Invoices`, and `Income and Expense`.

## Plan

1. **Analyze Current Routing Configuration**
   - Read the `src/app/app.routes.ts` file to identify the placeholder route for the Financial Control tile.

2. **Create FinancialModule**
   - Create a new `FinancialModule` in the `src/app/modules/` directory.
   - Define sub-modules or components for:
     - `Requisitions`
     - `Invoices`
     - `Income and Expense`

3. **Update Routing Configuration**
   - Modify the `src/app/app.routes.ts` file to point the Financial Control tile to the new `FinancialModule`.

4. **Verify Functionality**
   - Ensure the Financial Control tile routes correctly to the `FinancialModule` and its sub-items.

5. **Document Changes**
   - Record all changes and implementation details in this `finplan.md` file for future reference.

## Implementation Details

### Changes Made

1. **Updated `src/app/app.routes.ts`**:
   - Changed the placeholder route for 'finance' from loading `DashboardComponent` to loading `FinancialModule` using lazy loading.

2. **Created `FinancialModule`**:
   - Located at `src/app/modules/financial/financial.module.ts`.
   - Includes routes for sub-modules: `requisitions`, `invoices`, `income-expense`.
   - Added a default route with `FinancialComponent` that provides navigation links to sub-items.

3. **Created Sub-Modules**:
   - `RequisitionsModule`: Contains `RequisitionsComponent` (standalone).
   - `InvoicesModule`: Contains `InvoicesComponent` (standalone).
   - `IncomeExpenseModule`: Contains `IncomeExpenseComponent` (standalone).

4. **Created Components**:
   - `FinancialComponent`: Root component for the financial module, displays links to sub-items.
   - `RequisitionsComponent`: Simple component displaying "Requisitions".
   - `InvoicesComponent`: Simple component displaying "Invoices".
   - `IncomeExpenseComponent`: Simple component displaying "Income & Expense".

5. **Fixed Module Declarations**:
   - Ensured all components are properly imported in their respective modules (standalone components in `imports` array).

### Verification

- The application builds successfully without errors.
- The Financial Control tile in the dashboard now routes to `/finance`, which loads the `FinancialModule`.
- The root `/finance` path displays a navigation page with links to Requisitions, Invoices, and Income & Expense.
- Clicking the links navigates to the respective sub-components.

## Deliverables
- A functional `FinancialModule` with sub-items for `Requisitions`, `Invoices`, and `Income and Expense`.
- Updated routing configuration in `src/app/app.routes.ts`.
- Documentation of changes in `finplan.md`.