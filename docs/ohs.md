This Product Requirements Document (PRD) outlines the functional and structural requirements for a digital OHS management system, based on the standardized procedures for Planned Task Observations (PTO), Critical Control Verifications (CCV), and Inspection Reports found in the sources.
________________________________________
1. Product Overview
The app will digitise the end-to-end OHS workflow—from field data collection (observations and inspections) to automated report generation and action tracking. It ensures compliance with Safety Operating Procedures (SOPs) and provides real-time alerts for critical safety failures.
________________________________________
2. Target User Personas
•	Observer/Assessor: Conducts field observations and inspections.
•	Employee/Candidate: The subject of the safety observation.
•	Superintendent/Manager: Reviews findings, agrees to action plans, and provides final sign-off.
•	HR/Training Department: Receives notifications for "Not Yet Competent" outcomes to schedule training.
________________________________________
3. Functional Requirements: Data Collection
3.1 Metadata and Identification
The system must capture:
•	Document Reference: Automatic mapping of Ref Numbers (e.g., 0623, 0627, 0630) and version control.
•	Dynamic Personnel Fields: Name, Employee ID, Job Title, Department, and digital Signature for both the observer and the employee.
•	Contextual Fields: 
o	Date and Time of observation.
o	Location/Section/Area.
o	Shift/Crew Selection: Toggle between "Mining" (Morning/Afternoon/Night; Crew A-D) and "Others" (Day/Night; Crew 1-3).
o	Reason for Observation: Dropdown including "Incident follow up", "Periodic PTO", and "New Employee".
3.2 Standardised Checklist Content
The app must load specific checklist items based on the risk discipline selected:
•	Chemicals/Hazardous Substances: Verify SDS understanding, training, and gas detection.
•	Energy Isolation: Verify de-energization, personal lock/tag usage, and "bump tests".
•	Mobile Equipment: Check for speed limit compliance, seatbelt usage, and pedestrian exclusion zones.
•	Identify and Control Hazards: Check for hazard assessments and ALARP (As Low As Reasonably Practicable) principles.
________________________________________
4. Business Logic and Compliance Rules
•	Binary Input & Comments: Users must select YES (Compliance) or NO (Non-compliance). If "NO" is selected, a mandatory field for Corrective Action must be triggered.
•	Activity Not Assessed: If a step is skipped, the user must leave the tick-box blank and write "Activity Not Assessed" in the comments.
•	Critical Control Protocol (The "STOP" Rule): Steps highlighted in BOLD are critical controls. If marked "NO", the app must immediately display a high-priority alert: "STOP ACTIVITY IMMEDIATELY" and notify the Area Superintendent.
•	Scoring Logic (CCV specific): For CCV forms, the system must calculate a "Summary Score" for each section based on the number of compliant items (e.g., /3, /4, /7, or /10).
________________________________________
5. Evaluation and Action Tracking
•	Competency Outcome: A toggle for Competent (C) or Not Yet Competent (NYC).
•	HR Integration: If NYC is selected, an automated workflow should be triggered to notify HR for training scheduling.
•	Action Plan Table: A dynamic table to record: 
1.	Action Item Number.
2.	Description of Action.
3.	Responsible Person.
4.	Due Date.
•	Inspection Evidence: For general inspections, the ability to upload Photo Evidence for each finding is required.
________________________________________
6. Report Generation
The system must automatically generate a professional report (PDF) that includes:
•	Header Information: All document reference and versioning data.
•	Visual Summary: A clear display of YES/NO responses, specifically highlighting Critical Control failures.
•	Sign-off Block: Digital signatures of the Observer, Employee, and the Superintendent's agreement on the follow-up actions.
•	Aggregated Data (Management Dashboard): While the sources focus on individual forms, the system should allow for aggregating these into a "Progress Report" format, showing shifts, hrs worked, and challenges encountered, similar to the daily progress reports in related technical tasks.

The following checklist questions and performance requirements are categorised by their specific safety discipline as detailed in the sources.
1. Chemicals and Hazardous Substances
This discipline involves both Planned Task Observations (PTO) and Critical Control Verifications (CCV).
From PTO Standardised Steps:
•	Are hazardous substances handled only by authorised personnel in accordance with prescribed controls?
•	Does the worker obtain, read, and follow the Safety Data Sheet (SDS) instructions?
•	Has the worker been trained in the use, handling, storage, and disposal of the specific chemicals?
•	Is a hot work permit issued and is continuous LEL gas monitoring used when ignition sources are near flammable materials?
•	Are appropriate personal gas detection monitors worn, and do workers evacuate if alarms sound?
•	Are explosives storage areas only accessed by authorised persons?
•	Is the blast danger zone evacuated before blasting, and is the material checked for misfires before loading?
From CCV Performance Requirements:
•	Does the worker understand the health hazards, reactivity, and flammability of the chemicals?
•	Is the worker wearing the correct PPE for the specific task?
•	Does the team understand the procedure for finding unknown substances?
•	Are chemicals compatible with their storage containers, and are containers/pipes labelled legibly?
•	Is the delivery driver following safe loading/unloading practices, and have truck contents been verified?
•	Are substances stored and segregated according to SDS requirements?
2. Mobile Equipment and Light Vehicles
From PTO Standardised Steps:
•	Are traffic rules obeyed and is driving adapted to road conditions?
•	Are safety devices (seatbelts, backup alarms, strobe lights, kill switches) functional and used?
•	Are cell phones or electronic devices (excluding approved radios) avoided during operation?
•	Are loads and loose items secured?
•	Is movement prevented when parking using wheel chocks, parking ditches, or berms?
•	Do pedestrians stand clear of the travel path and operating radius?
From CCV Performance Requirements:
•	Is the team member alert, rested, and free of distractions?
•	Has interaction between vehicles and pedestrians been minimised by physical barriers or exclusion zones?
•	Are berms built with competent material to the mid-axle height of the largest vehicle?
•	Is positive two-way communication established when passing equipment or entering exclusion zones?
•	Is the equipment fitted with an appropriate fire suppression system or extinguisher, and has it been inspected?
3. Energy Isolation and Stored Energy
From PTO Standardised Steps:
•	Are all energy sources (electrical, mechanical, hydraulic, etc.) identified and isolated?
•	Is stored energy discharged prior to starting work?
•	Are personal locks and tags used on all isolation points?
•	Is isolation effectiveness verified via a "bump test" for a zero energy state?
•	Are guards and safety systems restored after work is completed?
From CCV Performance Requirements:
•	Have locks and tags been installed so they cannot be bypassed or defeated?
•	Are deadman switches, emergency stops, and pull cords confirmed functional?
•	Does the work plan specifically address the reinstallation of guards before returning to service?
4. Equipment Safeguards and Rotating Equipment
From PTO Standardised Steps:
•	Are only authorised personnel allowed to alter, bypass, or remove safeguards?
•	Is equipment operated according to manufacturer specs with safeguards in place?
•	Are tools disconnected when not in use or during servicing?
•	Are emergency shutoffs clearly identified, visible, and accessible?
From CCV Performance Requirements:
•	Is an exclusion zone demarcated with hazard and precautionary actions identified?
•	Is the worker clear of potential line of fire situations?
•	Are there designated covered walkways under conveyor belts?
•	Have individuals performed effective mechanical blocking using approved blocks?
•	Are articulation and bed locks in place during maintenance?
5. Identifying and Controlling Hazards
From PTO Standardised Steps:
•	Does the worker use their Stop Unsafe Work Authority?
•	Is a hazard assessment conducted prior to starting work?
•	Are risks minimised to As Low As Reasonably Practicable (ALARP)?
•	Is a formal Management of Change (MOC) initiated when necessary?
6. General Competency and Site Inspection
Competency (General PTO):
•	Is the worker fit for duty and unaffected by fatigue, medication, or drugs?
•	Do they work according to established job instructions and know emergency procedures?
Site Inspection Criteria:
•	Safety signs, PPE availability, and functional fire alarms/first aid kits.
•	Walkways and floors clean and free of debris.
•	Lifting equipment (cranes/hoists) certified and load limits marked.
•	Electrical wiring condition and proper labelling of panels.
•	Slope stability (checking for cracks or sliding) and ground control measures (mesh/bolts).
•	Traffic management (haul road maintenance and speed limits).


Common fields across the OHS reports in the sources include administrative metadata, personnel identification, operational context, and structured evaluation outcomes.
1. Administrative and Document Metadata
Standardized document control information is required at the top of every form:
•	Form Title and Reference Number: Every document contains a specific title and a reference number (e.g., 0623, 0627, FM0635).
•	Version and Review Dates: Reports track the version number, date of issue, and the date of next review.
•	Authorisation: Fields for the author and the person who approved the form are standard.
2. Personnel Identification
All reports require detailed information about the people involved in the observation or assessment:
•	Observer/Assessor Details: Common fields include Name, Employee ID, Job Title, Department, and Signature.
•	Employee/Candidate Details: For Planned Task Observations (PTOs), the report must capture the name of the worker being observed, their ID, Job Title, Department, and Signature.
•	Management Oversight: A field for the Employees’ Superintendent (Name and Signature) is included to confirm agreement on follow-up actions.
3. Operational and Environmental Context
These fields define where and when the activity occurred:
•	Temporal Data: Every report captures the Date and Time of the observation or inspection.
•	Location: Specific fields for the Section, Location, and Area are common to both PTOs and CCVs.
•	Shift and Crew: Reports distinguish between "Mining" shifts (Morning/Afternoon/Night, Crew A-D) and "Others" (Day/Night, Crew 1-3).
•	Reason for Observation: A list of triggers such as "Incident follow up", "Periodic PTO", or "New Employee" is used to categorize the report.
4. Compliance and Assessment Logic
The core of the reports consists of a checklist with standardized fields for recording safety data:
•	Compliance Toggles: All forms use a binary YES (Compliant) or NO (Non-compliant) field for each safety requirement.
•	Comments/Actions Section: A field follows each checklist item to allow for "Activity Not Assessed" notes or to specify Corrective Actions when a "NO" is recorded.
•	Summary Scores: Critical Control Verification (CCV) forms include a summary score for each section (e.g., /3, /4, /7) to quantify compliance.
5. Evaluations and Follow-up Actions
The final section of the reports focuses on outcomes and accountability:
•	Competency Outcome: A toggle for Competent (C) or Not Yet Competent (NYC) based on the report's outcome.
•	Training Integration: A field to indicate if the form should be forwarded to HR for training scheduling.
•	Action Plan Table: A standardized table found in most reports contains columns for: 
o	Action Number.
o	Action Description/Finding.
o	Responsible Person.
o	Due Date.
•	Evidence: In general inspections, a field for Photo Evidence is provided for each finding.

