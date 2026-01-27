# Frontend Architecture Design

## Overview
The frontend architecture for the Daily Test Pumping Progress Reporting App will be built using Angular, TypeScript, and Tailwind CSS. The design will focus on creating a responsive, user-friendly interface for Site Managers and Office Managers to upload, validate, and view reports.

---

## Key Components

### 1. **Upload Flow**
- **Drag-and-Drop Zone**: Allows users to drag and drop Excel files for upload.
- **File Validation**:
  - Check file type (.xlsx only).
  - Validate file size (limit: 10 MB).
  - Detect template version and structure.
- **Preview Grid**:
  - Display parsed data for review.
  - Highlight validation errors with actionable messages.
- **Actions**:
  - Submit: Save the report to Firestore.
  - Discard: Clear the upload and reset the form.
  - Download Error Report: Export validation errors as a CSV.

---

### 2. **Validation**
- **Client-Side Validation**:
  - Ensure mandatory fields (e.g., Date, Site, Rig) are present.
  - Validate time formats and logical consistency (e.g., night shift wrap-around).
  - Highlight missing or incorrect fields in the preview grid.
- **Error Panel**:
  - Display a list of validation errors.
  - Allow users to click on errors to navigate to the corresponding field.

---

### 3. **Dashboards**
- **Filters**:
  - Date Range Picker.
  - Dropdowns for Client, Project/Site, Rig, and Shift (Day/Night).
  - Toggle for Chargeable/Non-Chargeable hours.
- **Metrics Cards**:
  - Total Hours (Day, Night, Combined).
  - Chargeable vs Non-Chargeable Split.
  - Number of Activities Completed.
  - Personnel Count and Total Hours.
- **Tables**:
  - Daily Summary: One row per report.
  - Expandable Rows: Show detailed activities and personnel.
  - Challenges: List challenges reported for each shift.
- **Export Options**:
  - CSV, XLSX, and PDF formats.
  - Printable daily report.

---

## Responsive Design
- **Mobile**:
  - Single-column layout.
  - Swipeable tabs for navigation.
  - Sticky filters for easy access.
- **Desktop**:
  - Two-column layout.
  - Persistent sidebar for filters.
  - Virtualized tables for performance.

---

## Accessibility
- WCAG 2.1 AA compliance:
  - Keyboard navigation.
  - ARIA roles for interactive elements.
  - High contrast and focus outlines.
  - Accessible descriptions for charts and tables.

---

## Technology Stack
- **Framework**: Angular.
- **Styling**: Tailwind CSS.
- **State Management**: Angular Services with Observables.
- **API Integration**: Firebase Web SDK for Firestore and Cloud Storage.

---

## Next Steps
1. Implement the upload flow with validation and preview.
2. Design and develop the dashboard components.
3. Test the responsive behavior on mobile and desktop devices.
4. Ensure accessibility compliance.
