# Backend Architecture Plan (Updated)

## Overview
The backend architecture for the Daily Test Pumping Progress Reporting App will now leverage Angular for parsing, validation, and Firestore integration. This approach ensures that all data processing is handled client-side, reducing reliance on server-side Cloud Functions.

---

## Key Components

### 1. **File Parsing in Angular**
- **Library**:
  - Use `exceljs` or `sheetjs/xlsx` for parsing `.xlsx` files directly in the Angular application.
- **Parsing Logic**:
  - Extract data from the uploaded Excel file.
  - Map the extracted data to the Firestore schema.
  - Validate the data structure and content.

---

### 2. **Validation in Angular**
- **Client-Side Validation**:
  - Ensure mandatory fields (e.g., Date, Site, Rig) are present.
  - Validate time formats and logical consistency (e.g., night shift wrap-around).
  - Normalize text fields (e.g., trim whitespace, enforce max lengths).
- **Error Handling**:
  - Display validation errors in the preview grid.
  - Allow users to correct errors before submission.

---

### 3. **Firestore Integration**
- **Data Storage**:
  - Write normalized data directly to Firestore from the Angular application.
  - Maintain subcollections for `dayShift` and `nightShift` activities and personnel.
- **Versioning**:
  - Store the template version hash to detect layout changes.
  - Maintain immutable records for auditability.

---

### 4. **Data Flow**
1. **File Upload**:
   - Site Manager uploads an Excel file via the frontend.
   - File is parsed and validated in Angular.
2. **Data Submission**:
   - Normalized data is written directly to Firestore.
3. **Dashboard Updates**:
   - Firestore triggers update the frontend dashboards in real-time.
4. **Review and Approval**:
   - Office Manager reviews and approves the report via the frontend.
   - Status updates are reflected in Firestore.

---

### 5. **Observability**
- **Error Tracking**:
  - Log parsing and validation errors in the browser console.
- **User Feedback**:
  - Provide real-time feedback on validation and submission status.

---

## Technology Stack
- **Framework**: Angular.
- **Parsing Library**: `exceljs` or `sheetjs/xlsx`.
- **Database**: Firestore (Native mode).

---

## Next Steps
1. Implement file parsing and validation logic in Angular.
2. Integrate Firestore write operations in the Angular service.
3. Test the end-to-end data flow with sample files.
4. Ensure robust error handling and user feedback mechanisms.
