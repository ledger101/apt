## Plan: Add Light Vehicle Pre-Start Check Feature

Implement a driver-completed checklist for light vehicle pre-start checks, accessible via a new tile in fleet navigation. System auto-populates date and shift (morning/afternoon/evening) based on submission time. Drivers submit via form; managers view reports filtered by vehicle, using Firestore for storage and existing auth guards for access.

### Steps
1. Define pre-start check data model in [src/app/models/index.ts](src/app/models/index.ts) with fields like `checkId`, `vehicleId`, `date`, `shift`, `checklistItems` (array of yes/no questions), `submittedBy`, `status`.
2. Create `PreStartCheckComponent` in [src/app/modules/fleet/pre-start-check/](src/app/modules/fleet/pre-start-check/) mirroring [src/app/modules/ohs/ohs.component.ts](src/app/modules/ohs/ohs.component.ts), with form for checklist, auto-date/shift logic, and submission to Firestore.
3. Extend `FleetService` in [src/app/services/fleet.service.ts](src/app/services/fleet.service.ts) with methods `submitPreStartCheck` and `getPreStartChecksByVehicle` for CRUD operations.
4. Update [src/app/modules/fleet/fleet-routing.module.ts](src/app/modules/fleet/fleet-routing.module.ts) to add `/pre-start-check` route and [src/app/modules/fleet/fleet-navigation.component.ts](src/app/modules/fleet/fleet-navigation.component.ts) to include new tile.
5. Add manager view component in [src/app/components/reports/](src/app/components/reports/) for listing checks by vehicle, adapting [src/app/components/reports/reports.component.ts](src/app/components/reports/reports.component.ts) patterns.

### Further Considerations
1. Determine shift logic (e.g., morning: 6-12, afternoon: 12-18, evening: 18-6) and implement in component init.
 
 form specifications
 Header Information
Form Title: Daily Light Vehicle Pre-start Check Sheet

Week Starting Monday (Date): [Date Picker]

Vehicle Number: LV [Text Input]

Personnel: (7 slots for Names)

Inspection Checklist
The form requires a grid for each day (Mon-Sun) with three shifts per day: Morning (Mor), Afternoon (Aft), and Night.

1. Safety Devices
Check Flashing Beacon Operating

Check HI Vis Aerial (Flag)

Check Horn Operation

Seatbelts Working and in Good Condition

Audible Reverse Alarm Functioning

Check Jack, Vehicle Tools and Spares Tyre Condition

Hazard Warning Triangles, First Aid Kit (Available & in Date)

Check Vehicle Chocks (2 Available and Serviceable)

Is Fire Extinguisher Fully Charged, Certified & Secure

2. Under Bonnet
Check Engine Oil Level

Check Brake Fluid Level (Visual Do Not Remove Cap)

Check Radiator Coolant Level (Cold Start Only)

Check Clutch Fluid Level (Visual Do Not Remove Cap)

Check Battery Terminal Condition (Cables Tight and Secure)

Check Windscreen Washer Fluid Level

3. External
Check Parking, Indicator, Tail & Brake Light Function

Check Headlight Function

Check Tyres for Correct Pressure, Tread Wear & any Defects

Check Wheel Nuts for Security (all nuts fitted, no studs sheared)

Check Windscreen for Cracks, Damages Etc.

Check for Damage to Bodywork, Panels (Dents, Scratches)

Check yellow wheel nut markers are correctly fitted (if out of alignment immediately get the vehicle checked at LV Workshop or Tyre Bay)

4. Internal
Check Foot Brake Operation

Check Hand (Park) Brake Operation

Log Data
Odometer Reading: [Numeric Input] kms (Daily)

Any Abnormal Vehicle Functions: [Text Input]

Fuel Added: [Numeric/Text Input]

Footer & Authorization
General Comments: [Long Text Area]

Compliance Note: If any "failed check" is preceded with an asterisk (*), the vehicle must not be driven and the defect must be reported to the Maintenance Department Immediately.

Action Note: Immediately report any defects or faults that are identified to your Supervisor and raise a Maintenance Job Request.

Checked by LV Supervisor / Planner Company: [Text Input]

Name: [Text Input]

Signature: [Signature Field]