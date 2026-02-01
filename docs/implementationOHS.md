# Implementation Guide for Integrating OHS Requirements

This guide provides step-by-step instructions for integrating the OHS requirements outlined in `ohs.md` into the existing codebase. The goal is to create a dedicated OHS tile and implement the necessary functionalities for the OHS page.

---

## 1. Requirement Analysis

### Key Integration Points:
- **Dashboard**: Add a dedicated OHS tile for navigation.
- **OHS Page**: Implement discipline selection, checklist loading, and form validation.
- **Business Logic**: Ensure compliance rules are enforced.
- **Evaluation and Tracking**: Add competency toggles, HR workflows, and action plans.
- **Report Generation**: Automate professional report creation.

---

## 2. Dashboard Integration

### Steps to Create the OHS Tile:
1. Navigate to the dashboard component directory (e.g., `src/app/pages/dashboard/`).
2. Add a new tile for OHS in the HTML file:
   ```html
   <div class="tile" (click)="navigateToOHS()">
       <h3>OHS</h3>
       <p>Manage safety observations and inspections</p>
   </div>
   ```
3. Implement the `navigateToOHS` method in the dashboard component TypeScript file:
   ```typescript
   navigateToOHS() {
       this.router.navigate(['/ohs']);
   }
   ```
4. Update the dashboard SCSS file to style the new tile.

---

## 3. OHS Page Implementation

### Discipline Selection Functionality:
1. Create a dropdown menu in the OHS page HTML file:
   ```html
   <label for="discipline">Select Discipline:</label>
   <select id="discipline" [(ngModel)]="selectedDiscipline" (change)="loadChecklist()">
       <option value="chemicals">Chemicals</option>
       <option value="energy">Energy Isolation</option>
       <option value="equipment">Mobile Equipment</option>
       <option value="hazards">Hazard Control</option>
   </select>
   ```
2. Implement the `loadChecklist` method in the OHS page TypeScript file to dynamically load checklists based on the selected discipline.

### Checklist Loading:
1. Define checklist data in a service (e.g., `ohs.service.ts`).
2. Fetch the checklist data in the `loadChecklist` method and bind it to the view.

### Form Completion and Validation:
1. Add form fields for binary inputs (YES/NO) and comments.
2. Use Angular FormBuilder to handle form validation.
3. Trigger mandatory fields for corrective actions when "NO" is selected.

---

## 4. Compliance Business Logic

### Binary Input Handling:
- Add toggle buttons for YES/NO inputs.
- Bind the inputs to the form model.

### Mandatory Corrective Actions:
- Use Angular Validators to make corrective action fields mandatory when "NO" is selected.

### Critical Control Alerts:
1. Highlight critical controls in bold.
2. Display a high-priority alert and notify the Area Superintendent when "NO" is selected for critical controls.

---

## 5. Evaluation and Action Tracking

### Competency Outcome Toggles:
- Add a toggle for "Competent" or "Not Yet Competent".
- Trigger HR workflows for "Not Yet Competent" outcomes.

### Dynamic Action Plan Table:
1. Create a table with columns for Action Number, Description, Responsible Person, and Due Date.
2. Allow users to dynamically add rows to the table.

### Photo Evidence Upload:
- Add a file upload field for attaching photos to findings.

---

## 6. Automated Report Generation

### Document Metadata:
- Include fields for form title, reference number, version, and review dates.

### Visual Summary:
- Display YES/NO responses and highlight critical control failures.

### Digital Signature Blocks:
- Add fields for digital signatures of the Observer, Employee, and Superintendent.

### Aggregated Data:
- Implement a management dashboard to display aggregated data from multiple reports.

---

By following these steps, the OHS requirements can be effectively integrated into the existing codebase. Ensure thorough testing at each stage to validate functionality and compliance with the outlined requirements.