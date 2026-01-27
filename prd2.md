 
As Mary, your Business Analyst, I have consolidated your vision into a comprehensive Project Brief. This document serves as the foundational "North Star" for the development of your geotechnical enterprise system.
Proposed Solution
•	Overview: A modular SAP Fiori application architecture consisting of five integrated tiles, designed with an "offline-first" mentality for remote site use.
•	Key Modules:
1.	Personnel Management: End-to-end lifecycle from onboarding to leave tracking and certification monitoring10.
2.	Supply Chain: Real-time inventory, material master, and requisition workflows11.
3.	Fleet & Equipment: Register for vehicles and rigs, fuel tracking, mileage tracking and preventative maintenance scheduling12.
4.	Finance & Admin: Progress report-to-invoice automation, expense management, and cash flow analysis13.
5.	Operations: Technical report automation (Excel uploads), OHS form digitization, and aquifer test data management (Constant/Step discharge)- Excel uploads.
•	Technical Vision: A Fiori "Tile" architecture that is role-based, adaptive, and coherent, providing a simple entry point for both field and office staff151515.
4. Target Users & Stakeholders
•	On-Site Drillers/Technicians: Primary users of the Operations and OHS tiles; require simple, high-contrast, and offline-capable interfaces16161616.
•	Operations Managers: Use the "Control Tower" view to monitor rig deployments, fleet health, and personnel rotations across multiple sites1717.
•	Finance/Admin Team: Responsible for processing progress reports into invoices and managing the supply chain requisitions181818.
•	Executive Leadership: Interested in high-level KPIs regarding project profitability, equipment ROI, and enterprise-wide compliance
6. Scope & MVP Definition
•	In-Scope for MVP:
o	Fiori Home Screen with 5 active Tiles.
o	Excel-to-Technical-Report parser for aquifer testing and daily progress.
o	Basic Fleet Register and maintenance alerts.
o	Personnel attendance and OHS form submission. 
________________________________________
🧠 Mary’s Rationale & Decisions
•	Why Fiori? I have chosen to emphasize the Fiori architecture because it aligns with your vision of "Tiles" and provides the consistent, role-based UX needed for a workforce transitioning from paper
•	Technical Reporting: I focused the MVP on "Excel uploads" for aquifer data and progress reports. This respects current technical workflows while providing the "digital container" needed for centralized storage before moving to direct data entry later.
•	Personnel Focus: Given your mention of 24/7 rotations, I prioritized "Daily Activities" and "Leave Tracking" to ensure operational safety and compliance are baked into the core system40.
________________________________________
 PRD Section 1: Goals and Background Context
Current Draft:
•	Project Goal: To develop a modular, Fiori-driven ERP and operational control system that centralizes geotechnical data and enterprise workflows.
•	Context: The system will replace fragmented manual processes with five core "Tiles" (Personnel, Supply Chain, Fleet, Finance, and Operations), specifically optimized for remote drilling environments where 24/7 technical precision and OHS compliance are paramount.
•	Target MVP Focus: Prioritizing the "Technical Report Parser" (Excel-to-System) for progress reports and constant/step discharge aquifer tests and the automation of invoicing from field progress reports.
🧠 John’s Rationale & Decisions
•	Excel-to-Technical Parser: I decided to keep the MVP focused on ingesting Excel data rather than full manual data entry for technical tests. This minimizes field friction while achieving the goal of centralized data.
•	Fiori Architecture: I am leaning into the "Tile" approach because it supports a phased rollout. We can deploy the "Operations" and "OHS" tiles first to the field, then follow with Finance.
•	Offline-First Assumption: I am assuming a "Sync-when-connected" architecture is a hard requirement given the remote nature of rig sites.
PRD Section 2: Functional Requirements
Tile Group 1: Personnel & User Management
•	FR 1.1: Digital Onboarding: Capture specialized certifications (e.g., drilling licenses, safety inductions) and employee data.
•	FR 1.2: Progress Report: Upload excel document with progress report. It shows An hourly time-entry system for day/night shifts with a mandatory toggle for Chargeable vs. Non-Chargeable hours.
•	FR 1.3: Attendance & Leave: Dashboard to track leave days and site-specific attendance to ensure 24/7 rig coverage.
Tile Group 2: Supply Chain Management
•	FR 2.1: Material Master: A hierarchical repository of all parts (bits, casing, lubricants) and consumables.
•	FR 2.2: Requisition Workflow: Field-to-office automated approval process for material requests.
•	FR 2.3: Site-Specific Drawdowns: Ability to track inventory levels at specific project warehouses, managing the drawdown of materials as the project progresses.
Tile Group 3: Fleet & Equipment Management
•	FR 3.1: Asset Register: Unified register for vehicles (mileage-based) and drilling rigs (engine-hour-based).
•	FR 3.2: Maintenance Engine: Automated alerts for scheduled service based on mileage e.g. vehicle service every 5000km or next service at 175000km or for machines service after 3000hours. Service mileage configured on asset registration. 
•	FR 3.3: Logistics & Deployment: Real-time tracking of machine location (site/project) and current operational status (Active, Standby, Breakdown).
Tile Group 4: Finance & Administration
•	FR 4.1: Progress-to-Invoice Engine: Logic to parse uploaded progress reports and generate draft invoices based on "Actuals" (samples tested, hours pumped or hours of activity).
•	FR 4.2: Realization Analysis: Dashboard comparing project estimates (budget) vs. actual expenses (labor, fuel, materials).
•	FR 4.3: Cashflow Control: Visibility of inflows and expenses
Tile Group 5: Operations (Technical Core)
•	FR 5.1: Excel Technical Ingestion: A secure upload portal for Constant and Step Discharge Excel files. The system must extract key data (Drawdown vs. Time).
•	FR 5.2: OHS Form Engine: Dynamic digital forms for site safety checklists with mandatory photo/signature capture.
•	FR 5.3: Automated Technical Reporting: Generation of final aquifer test reports using standardized models based on ingested data.
📋 PRD Section 3: User Stories & Acceptance Criteria
US 1: Technical Data Ingestion (The Heart of Operations)
As a Geotechnical Technician,
I want to upload the pump test Excel file directly into the system via the Fiori Operations tile,
So that I don't have to manually type in thousands of drawdown data points.
•	Acceptance Criteria:
o	System must support .xlsx and .csv formats.
o	System must validate that the file contains required headers (Time, Water Level, Discharge Rate).
o	Upon upload, the system must generate a preview graph of the drawdown curve.
o	Data must be automatically associated with the specific Project and Rig ID.
 Uploaded progress report includes Chargeable vs. Non-Chargeable Tracking
The total hours per shift must equal the duration of the assigned shift before submission.
US 3: Automated Progress Invoicing
As a Finance Admin,
I want to see a list of "Unbilled Progress" based on the uploaded progress reports,
So that I can generate a draft invoice with one click.
•	Acceptance Criteria:
o	The system must pull "Actuals" (i.e. total hours of billable activities) from the uploaded progress reports.
o	The system must apply the specific Activity’s rate to these actuals.
o	The draft invoice must be editable by the Finance Admin before finalizing/ storing.
US 4: OHS Compliance & Safety
As a Site Supervisor,
I want to complete the daily OHS checklist on my tablet,
So that I can confirm the rig is safe to operate and compliant with environmental regulations.
•	Acceptance Criteria:
o	The form must allow for photo uploads for "Safety Hazards."
o	The form must require a digital signature from the Supervisor.
o	If a "Critical Failure" is checked (e.g., hydraulic leak), an automated alert must be sent to the Fleet Manager.
________________________________________
🧠 John’s Rationale & Decisions
•	The "One-Click" Goal: For US 3, the link between the activity rate and field actuals is the most complex part of the build, but it’s the one that will solve your cash flow issues. (for mvp we start with single rate for all billable activities
Great. We are moving into Section 2: Information Architecture & Fiori Launchpad Layout.
This section defines the "Skeleton" of the application. I’ve organized the site map to mirror your 5-module structure, ensuring that the Fiori Launchpad remains clean and actionable for field personnel who might be wearing gloves or working in harsh conditions.
________________________________________
📋 UI/UX Spec Section 2: Information Architecture
2.1 Launchpad Structure (The 5 Tile Groups)
The home screen will be divided into the following Semantic Groups:
1.	Personnel Management: (Tiles: Employee Profiles, Time Entry(hours worked from progress report), Leave Requests, Certifications)
2.	Logistics & Materials: (Tiles: Inventory Lookup, Request Supplies, Warehouse Drawdown)
3.	Fleet & Equipment: (Tiles: Vehicle Register, Rig Status, Fuel Log, Service Alerts, Mileage updates)
4.	Financial Control: (Tiles: Invoicing Dashboard, Expense Entries, Project Profitability)
5.	Rig Operations (Priority): (Tiles: OHS Checklists, Aquifer Test Uploads, Daily Progress Reports)
2.2 Navigation Patterns
•	Deep Linking: Clicking a "Service Alert" on the Fleet tile takes the user directly to the Maintenance floorplan for that specific rig/vehicle.
•	Breadcrumbs: Essential for the Supply Chain module to help users navigate between Warehouse levels and Material Master items.
•	Global Search: A top-bar search that allows a manager to quickly find a specific Rig ID or Project Number across all modules.
2.3 Screen Floorplans
•	Analytical List Page: Used for the Finance Admin to filter and review unbilled activities from progress reports.
•	Object Page: Used for Rig/Vehicle profiles, displaying engine hours, service history, mileage and current location in a single view.
•	Wizard Floorplan: Used for the Aquifer Test Upload to guide the technician through: 1. File Selection -> 2. Data Validation -> 3. Submission.
    
