# Supply Chain Management Module - Implementation Plan

## Executive Summary

This document outlines the implementation plan for a comprehensive Supply Chain Management module designed for small to medium-sized businesses. The module aims to eliminate paper trails, centralize communication, and provide real-time visibility of materials, costs, and project requirements. 

**Key Goal:** Know where your materials are and what they cost at all times.

**Financial Integration Note:** All monetary expenses tracked in this module are designed to integrate with a financial module to be implemented later. Cost data will be structured to support future double-entry bookkeeping, profit/loss reporting, and cash flow analysis.

---

## 1. Core Functional Modules

The application is divided into four main "hubs" to maintain a clean and intuitive user interface.

### 1.1 Inventory & Warehouse Hub

#### Purpose
Centralized inventory management across multiple project sites with real-time stock tracking.

#### Key Features

**Multi-Location Management**
* Each project site is treated as a unique warehouse
* Separate inventory tracking for each location (e.g., "Project A" vs. "Project B")
* Transfer capabilities between locations
* Location-specific access controls

**Material Master**
* Central catalog of all purchasable items
* Standardized naming conventions (e.g., "Grade A Cement," "2x4 Timber")
* Prevents duplicate entries and naming inconsistencies
* Includes:
  - Item name and description
  - Category (Tools, Consumables, Raw Materials, etc.)
  - Unit of Measure (kg, liters, units, boxes, etc.)
  - Standard cost (for budgeting)
  - Reorder level threshold
  - Preferred suppliers

**Stock Tracking**
* Real-time visibility of inventory levels
* Three-tier stock status:
  - **On Hand:** Physical quantity available
  - **Reserved:** Allocated to approved requisitions
  - **Incoming:** Quantities on pending purchase orders
* Movement history and audit trail
* Stock valuation capabilities

**Financial Integration Points:**
* Item costs for inventory valuation
* COGS (Cost of Goods Sold) calculation when items are disbursed
* Stock variance reporting for financial reconciliation

---

### 1.2 Requisition & Approval Hub

#### Purpose
Streamlined material request process with built-in approval workflows.

#### Key Features

**Request Entry**
* Project managers can create requisitions from any location
* Select items from Material Master catalog
* Specify:
  - Quantity needed
  - Required date
  - Project/site destination
  - Priority level (Normal, Urgent, Critical)
  - Justification notes

**Approval Workflow**
* Multi-level approval system (configurable)
* Automated notifications to supervisors
* Approve/Reject with mandatory comments
* Budget checking before approval
* Escalation for overdue approvals

**Availability Check**
* Automatic warehouse stock verification
* Three possible outcomes:
  1. **In Stock:** Material available for immediate disbursement
  2. **Partial Stock:** Some quantity available, remainder needs procurement
  3. **Out of Stock:** Triggers procurement process

**Status Tracking**
* Real-time status updates:
  - Pending Review
  - Approved
  - Rejected
  - Procurement In Progress
  - Partially Fulfilled
  - Ready for Pickup
  - Completed
  - Cancelled

**Financial Integration Points:**
* Budget allocation per requisition
* Cost estimation before approval
* Commitment tracking (approved but not yet spent)
* Variance reporting (estimated vs. actual costs)

---

### 1.3 Procurement Hub

#### Purpose
Automated purchase order generation and goods receipt processing.

#### Key Features

**Auto-PO Generation**
* Automatically creates Purchase Orders for approved out-of-stock requisitions
* Pre-populates data from requisitions
* Supports manual PO creation for planned purchases
* PO includes:
  - Supplier information
  - Item details and quantities
  - Unit prices and total amount
  - Requested delivery date
  - Delivery location
  - Terms and conditions
  - Linked requisition number(s)

**Supplier Management**
* Centralized supplier directory
* Supplier information:
  - Company name and registration
  - Contact person and details
  - Email (for automated PO sending)
  - Tax ID/VAT number
  - Payment terms
  - Lead time
  - Performance ratings

**Purchase Order Tracking**
* Status workflow:
  - Draft
  - Sent to Supplier
  - Acknowledged
  - In Transit
  - Partially Received
  - Fully Received
  - Closed

**Goods Received Note (GRN)**
* Record material receipts when deliveries arrive
* Support for partial deliveries
* Quality inspection notes
* Discrepancy reporting (quantity/quality issues)
* Automatic inventory updates
* Notification to requisitioner
* GRN includes:
  - PO reference
  - Received quantity vs. ordered quantity
  - Condition notes
  - Receiver name and timestamp
  - Storage location assigned

**Financial Integration Points:**
* PO amounts for commitment reporting
* Actual costs captured on GRN
* Three-way matching (PO, GRN, Invoice) for accounts payable
* Supplier payment tracking
* Cost variance analysis (ordered vs. received costs)

---

### 1.4 Project Disbursement (Drawdowns)

#### Purpose
Track material movement from warehouse to project consumption.

#### Key Features

**Issue Material**
* Record when materials leave the warehouse
* Mark materials as "consumed" by specific projects
* Track:
  - Date and time of disbursement
  - Quantity issued
  - Recipient (worker, sub-contractor, project section)
  - Purpose/activity
  - Issuing storekeeper

**Return Processing**
* Handle unused material returns
* Return to stock with reason codes
* Update inventory and project allocations

**Project Allocation**
* Link disbursements to specific:
  - Project phase
  - Cost center
  - Budget line item
  - Work order

**Financial Integration Points:**
* Real-time project cost tracking
* Cost allocation to specific project phases
* Burn rate analysis
* Budget vs. actual reporting
* Material cost component of overall project costs
* Data feeds to future financial module for:
  - Project profitability analysis
  - Cost control reporting
  - Revenue recognition support

---

## 2. Database Blueprint (Entities)

### Entity Relationship Overview

```
Projects ←→ Requisitions ←→ Purchase Orders ←→ GRN ←→ Stock Ledger
    ↓              ↓                ↓              ↓
Warehouses    Materials      Suppliers    Disbursements
```

### 2.1 Projects/Warehouses

**Purpose:** Define project sites and associated warehouse locations.

**Key Attributes:**
* Project ID (Primary Key)
* Project Name
* Project Code (for easy reference)
* Physical Address
* Site Manager Name
* Site Manager Contact (phone, email)
* Project Start Date
* Expected End Date
* Status (Active, Completed, On Hold)
* Budget Allocation
* Cost Center Code (for financial integration)

**Financial Fields:**
* Total Budget
* Budget Consumed to Date
* Committed Costs
* Available Budget

---

### 2.2 Material Master

**Purpose:** Central catalog of all materials and items.

**Key Attributes:**
* Material ID (Primary Key)
* Material Name
* Material Code (SKU/Part Number)
* Description
* Category (lookup: Tools, Consumables, Raw Materials, Equipment, etc.)
* Sub-Category
* Unit of Measure (UOM)
* Standard Cost (for estimation)
* Reorder Level
* Reorder Quantity
* Preferred Supplier ID (Foreign Key)
* Active Status
* Created Date
* Last Modified Date

**Financial Fields:**
* Standard Cost
* Average Cost (moving average)
* Last Purchase Cost
* Cost Type (Fixed, Variable)

---

### 2.3 Supplier List

**Purpose:** Maintain supplier information for procurement.

**Key Attributes:**
* Supplier ID (Primary Key)
* Company Name
* Registration Number
* Contact Person
* Email Address
* Phone Number
* Physical Address
* Billing Address
* Tax ID / VAT Number
* Payment Terms (lookup: Net 30, Net 60, Cash on Delivery, etc.)
* Average Lead Time (days)
* Credit Limit
* Performance Rating
* Active Status

**Financial Fields:**
* Outstanding Balance
* Credit Terms
* Payment History Status

---

### 2.4 Requisition

**Purpose:** Track material requests from project sites.

**Key Attributes:**
* Requisition ID (Primary Key)
* Requisition Number (user-friendly, auto-generated)
* Date Created
* Requester Name/User ID
* Project ID (Foreign Key)
* Priority Level
* Required By Date
* Status (Pending, Approved, Rejected, Fulfilled, Cancelled)
* Approval Date
* Approver User ID
* Approval Comments
* Rejection Reason (if applicable)
* Total Estimated Value

**Line Items (Child Table):**
* Line Number
* Material ID (Foreign Key)
* Quantity Requested
* Unit of Measure
* Estimated Unit Cost
* Estimated Total Cost
* Quantity Approved
* Quantity Fulfilled
* Status (Pending, In Stock, To Be Ordered, Fulfilled)

**Financial Fields:**
* Total Estimated Cost
* Total Approved Cost
* Budget Line Item Reference
* Cost Center

---

### 2.5 Purchase Order (PO)

**Purpose:** Track purchases from suppliers.

**Key Attributes:**
* PO ID (Primary Key)
* PO Number (user-friendly, auto-generated)
* Date Created
* Supplier ID (Foreign Key)
* Requisition ID (Foreign Key, can be multiple)
* Expected Delivery Date
* Delivery Location (Project/Warehouse ID)
* PO Status (Draft, Sent, Acknowledged, Receiving, Closed, Cancelled)
* Total Amount
* Currency
* Payment Terms
* Created By User ID
* Approved By User ID
* Notes/Special Instructions

**Line Items (Child Table):**
* Line Number
* Material ID (Foreign Key)
* Description
* Quantity Ordered
* Unit of Measure
* Unit Price
* Line Total
* Tax Amount
* Quantity Received
* Quantity Outstanding

**Financial Fields:**
* Subtotal
* Tax Amount
* Discount
* Shipping/Freight Cost
* Total PO Value
* Amount Received (to date)
* Amount Outstanding
* Payment Status

---

### 2.6 Goods Received Note (GRN)

**Purpose:** Record receipt of materials from suppliers.

**Key Attributes:**
* GRN ID (Primary Key)
* GRN Number (user-friendly, auto-generated)
* Date Received
* PO ID (Foreign Key)
* Supplier ID (Foreign Key)
* Received By User ID
* Delivery Note Reference
* Invoice Reference (if available)
* Warehouse Location ID
* Quality Check Status (Passed, Failed, Partial)
* Notes/Discrepancies

**Line Items (Child Table):**
* Line Number
* PO Line Number (reference)
* Material ID (Foreign Key)
* Quantity Ordered
* Quantity Received
* Quantity Rejected
* Unit of Measure
* Condition Notes
* Storage Location/Bin

**Financial Fields:**
* Actual Unit Cost
* Line Total Cost
* Variance vs. PO Price

---

### 2.7 Stock Ledger

**Purpose:** Comprehensive history of all inventory movements.

**Key Attributes:**
* Transaction ID (Primary Key)
* Transaction Date & Time
* Transaction Type (GRN, Disbursement, Transfer, Adjustment, Return)
* Material ID (Foreign Key)
* Warehouse/Project ID (Foreign Key)
* Reference Document (PO Number, GRN Number, Disbursement Number)
* Quantity In (additions to stock)
* Quantity Out (reductions from stock)
* Balance After Transaction
* Unit Cost
* Total Value
* User ID (who performed the transaction)
* Notes

**Financial Fields:**
* Transaction Cost
* Cumulative Value
* Cost per Unit (for FIFO/LIFO/Average costing methods)

---

### 2.8 Disbursement (Material Issue)

**Purpose:** Record materials issued to projects.

**Key Attributes:**
* Disbursement ID (Primary Key)
* Disbursement Number (user-friendly, auto-generated)
* Date Issued
* Project ID (Foreign Key)
* Requisition ID (Foreign Key, if applicable)
* Issued By User ID
* Received By (name/ID)
* Purpose/Activity Description
* Work Order Number (optional)
* Status (Issued, Partially Returned, Returned, Closed)

**Line Items (Child Table):**
* Line Number
* Material ID (Foreign Key)
* Quantity Issued
* Unit of Measure
* Unit Cost (from stock ledger)
* Total Cost
* Quantity Returned (if applicable)

**Financial Fields:**
* Total Issue Cost
* Project Cost Center
* Budget Line Item
* Phase/Activity Code (for project accounting)

---

## 3. The Process Flow

### 3.1 Standard Requisition-to-Consumption Flow

```
1. REQUEST → 2. VERIFY → 3. PROCURE (if needed) → 4. RECEIVE → 5. ISSUE → 6. CONSUME
```

#### Detailed Step-by-Step Process

**Step 1: Create Requisition**
* **Actor:** Project Manager at Site Alpha
* **Action:** Creates requisition for 50 bags of cement
* **System Actions:**
  - Assigns unique requisition number
  - Records timestamp and requester
  - Calculates estimated cost based on standard material cost
  - Sets status to "Pending Approval"
  - Sends notification to designated approver

**Step 2: Verify Availability**
* **Actor:** System (automatic) + Storekeeper/Approver
* **System Actions:**
  - Checks warehouse inventory for Site Alpha
  - Determines availability status
  
  **Scenario A: Material Available (Full or Partial)**
  - Shows approver that material is in stock
  - Displays current stock level and location
  - Recommends immediate disbursement
  
  **Scenario B: Material Unavailable**
  - Flags requisition for procurement
  - Suggests preferred supplier
  - Shows estimated lead time

**Step 3A: Approve for Direct Disbursement (If Available)**
* **Actor:** Supervisor/Manager
* **Action:** Reviews and approves requisition
* **System Actions:**
  - Changes status to "Approved - Ready for Issue"
  - Reserves stock quantity (reduces available quantity)
  - Notifies storekeeper to prepare materials
  - Notifies requester of approval
  - Records approval timestamp and comments

**Step 3B: Approve for Procurement (If Unavailable)**
* **Actor:** Supervisor/Manager
* **Action:** Reviews and approves requisition
* **System Actions:**
  - Changes status to "Approved - To Be Ordered"
  - Triggers Purchase Order creation workflow
  - Notifies procurement officer
  - Maintains requisition in "pending fulfillment" state

**Step 4: Create Purchase Order**
* **Actor:** Procurement Officer
* **Action:** Reviews approved requisitions flagged for procurement
* **System Actions:**
  - Auto-populates PO with:
    - Material details from requisition
    - Preferred supplier from Material Master
    - Quantities needed
    - Delivery location
  - Procurement officer can:
    - Consolidate multiple requisitions into one PO
    - Adjust quantities for bulk ordering
    - Negotiate and enter unit prices
    - Set expected delivery date
  - System generates PO number
  - Status set to "Draft"
* **Action:** Procurement officer finalizes and sends PO
* **System Actions:**
  - Status changes to "Sent to Supplier"
  - Email sent to supplier with PO details
  - Requisition status updates to "On Order"
  - Expected delivery date communicated to requester

**Step 5: Receive Goods (GRN)**
* **Actor:** Storekeeper or Site Staff
* **Action:** Supplier delivers 50 bags of cement to Site Alpha
* **Process:**
  - Storekeeper opens receiving interface
  - Selects the relevant PO
  - Verifies delivered quantity against PO
  - Performs quality check
  - Records:
    - Actual quantity received (could be different from ordered)
    - Condition of materials
    - Delivery note/invoice reference
    - Storage location
  - Confirms receipt in system
* **System Actions:**
  - Creates GRN record
  - Updates Stock Ledger:
    - Adds 50 bags to Site Alpha warehouse
    - Records transaction type as "GRN"
    - Links to PO for traceability
  - Updates PO status:
    - If fully received: "Closed"
    - If partial: "Partially Received" with outstanding quantity
  - Updates requisition status to "Fulfilled - Ready for Issue"
  - Sends notification to requester: "Your materials have arrived"
  - Records actual cost (may differ from estimated cost)
  - **Financial Integration:** Creates payable commitment for accounts payable module

**Step 6: Issue Materials (Disbursement)**
* **Actor:** Storekeeper
* **Action:** Prepares materials for project use
* **Process:**
  - Accesses approved requisition or creates new issue
  - Selects materials to be issued
  - Records:
    - Quantity issued
    - Recipient name/ID
    - Purpose (e.g., "Foundation work - Block A")
    - Vehicle/transport details (if applicable)
  - Confirms issue in system
* **System Actions:**
  - Creates Disbursement record
  - Updates Stock Ledger:
    - Deducts 50 bags from Site Alpha warehouse
    - Records transaction type as "Disbursement"
    - Links to requisition and project
  - Updates requisition status to "Completed"
  - Captures cost of issued materials
  - **Financial Integration:**
    - Records cost against project budget
    - Allocates cost to specific cost center/phase
    - Reduces inventory value
    - Increases project cost (COGS)

**Step 7: Consumption & Tracking**
* **System maintains:**
  - Complete audit trail from requisition to consumption
  - Project cost accumulation
  - Remaining budget visibility
  - Material usage patterns for future planning

---

### 3.2 Alternative Flows

#### Emergency Direct Purchase
* Urgent material needs bypassing standard requisition
* Authorized users can create "Direct PO"
* Immediate GRN upon receipt
* Post-facto cost allocation to project

#### Inter-Project Transfer
* Materials moved from Project A to Project B
* Transfer requisition created
* Stock Ledger updated for both locations
* Cost allocated to receiving project

#### Stock Return
* Unused materials returned from project
* Return disbursement created
* Stock added back to warehouse
* Project cost credit issued

#### Stock Adjustment
* Physical count discrepancies
* Damage/theft/loss recording
* Adjustment authorization required
* Stock Ledger updated with reason code
* **Financial Impact:** Variance recorded for financial reconciliation

---

## 4. Key Business Requirements

### 4.1 User Roles & Permissions

The system must support role-based access control (RBAC) with the following core roles:

#### Requestor (Project Manager/Site Staff)
**Permissions:**
* Create requisitions for assigned projects
* View own requisitions
* Track requisition status
* Confirm goods receipt at site
* View project inventory

**Restrictions:**
* Cannot approve own requisitions
* Cannot modify approved requisitions
* Cannot access other projects (unless assigned)

#### Approver (Supervisor/Manager)
**Permissions:**
* View all pending requisitions
* Approve/reject requisitions
* Add approval comments
* View estimated costs
* Override availability recommendations (with reason)
* View all project budgets
* Access consolidated reports

**Restrictions:**
* Cannot create POs directly (unless also Procurement role)
* Cannot receive goods (unless also Storekeeper role)

#### Storekeeper (Warehouse/Inventory Manager)
**Permissions:**
* View all requisitions for assigned warehouse
* Check inventory levels
* Issue materials (create disbursements)
* Receive goods (create GRN)
* Perform stock counts and adjustments
* Transfer materials between locations
* Process returns
* Generate inventory reports

**Restrictions:**
* Cannot approve requisitions
* Cannot create/modify POs (unless also Procurement role)
* Limited to assigned warehouse/project locations

#### Procurement Officer (Buyer)
**Permissions:**
* View approved requisitions flagged for procurement
* Create and modify draft POs
* Send POs to suppliers
* Manage supplier directory
* Track PO status
* Handle supplier communications
* Record partial deliveries

**Restrictions:**
* Cannot approve requisitions
* Cannot issue materials
* Cannot modify received GRNs

#### System Administrator
**Permissions:**
* Full system access
* Manage user accounts and roles
* Configure Material Master
* Set up projects/warehouses
* Configure approval workflows
* Access all reports and audit logs
* Perform system maintenance

---

### 4.2 Mobile-Friendly Design

**Critical Requirements:**
* Responsive design for smartphones and tablets
* Works on iOS and Android
* Progressive Web App (PWA) capabilities for offline access
* Touch-optimized interface

**Key Mobile Use Cases:**

1. **Site Requisition Creation**
   * Quick material search with auto-complete
   * Voice-to-text for notes
   * Camera integration for photos (damaged items, requirements)
   * GPS location capture for audit

2. **Goods Receipt (GRN)**
   * Barcode/QR code scanning for PO lookup
   * Photo documentation of delivered materials
   * Quick quantity entry with number pad
   * Digital signature capture for delivery confirmation
   * Offline mode for areas with poor connectivity

3. **Material Disbursement**
   * Fast material selection
   * Barcode scanning for item verification
   * Quick quantity adjustment
   * Recipient selection from saved list

4. **Status Checks**
   * Dashboard view of pending items
   * Push notifications for approvals needed
   * Real-time status updates

**Technical Considerations:**
* Minimize data transfer for low-bandwidth scenarios
* Local caching for frequently accessed data
* Sync capabilities when connection restored
* Battery-efficient design

---

### 4.3 Audit Trail & Compliance

**Comprehensive Logging:**

Every transaction must record:
* **Who:** User ID and name
* **What:** Action performed (created, modified, approved, received, issued)
* **When:** Timestamp (date and time)
* **Where:** Location (project/warehouse)
* **Why:** Comments, reason codes, or notes
* **How Much:** Quantities and values involved

**Immutability:**
* Posted transactions cannot be deleted
* Modifications create new records with reference to original
* Full history preserved for forensic analysis

**Audit Reports:**
* Transaction history by material
* Transaction history by project
* Transaction history by user
* Exception reports (returns, adjustments, rejections)
* Approval chain documentation

**Compliance Features:**
* Export capabilities for external audits
* Digital signatures for critical approvals
* Segregation of duties enforcement
* Configurable approval limits (e.g., requisitions over $5,000 require senior approval)

**Security:**
* All audit logs encrypted
* No deletion of historical data
* Regular automated backups
* Access logging for audit trail viewing

---

### 4.4 Notification System

**Real-Time Alerts:**

* **Requisition Created** → Notify Approver
* **Requisition Approved** → Notify Requester and Storekeeper
* **Requisition Rejected** → Notify Requester with reason
* **PO Created** → Notify Supplier (email) and Storekeeper
* **Goods Received** → Notify Requester and Procurement Officer
* **Stock Low** → Notify Storekeeper and Procurement Officer
* **Approval Overdue** → Escalate to senior management
* **Disbursement Complete** → Notify Requester

**Notification Channels:**
* In-app notifications
* Email
* SMS (for critical alerts)
* Push notifications (mobile app)

**User Preferences:**
* Configurable notification settings per user
* Digest options (immediate, daily summary, weekly summary)
* Quiet hours configuration

---

### 4.5 Reporting & Analytics

**Operational Reports:**
* Current stock levels by warehouse
* Stock valuation report
* Slow-moving/obsolete inventory
* Requisition status summary
* PO status tracking
* Supplier performance metrics
* Material usage by project
* Project cost summary

**Management Reports:**
* Budget vs. actual by project
* Cost trends over time
* Procurement lead time analysis
* Approval cycle time metrics
* Inventory turnover ratios
* Exception reports (adjustments, returns, cancellations)

**Financial Reports (for Integration):**
* Cost of goods issued (COGS) by period
* Inventory valuation
* Committed costs (approved but not received)
* Accounts payable forecast (outstanding POs)
* Project profitability preview
* Variance analysis (standard cost vs. actual cost)

**Export Capabilities:**
* PDF for printing and sharing
* Excel for further analysis
* CSV for data integration
* API for real-time data feeds

---

## 5. Financial Module Integration Design

### 5.1 Integration Philosophy

The supply chain module is designed as a **feeder system** to a comprehensive financial module. All cost and transaction data is structured to support future integration with:

* General Ledger (GL)
* Accounts Payable (AP)
* Accounts Receivable (AR) - for project billing
* Job Costing / Project Accounting
* Budget Management
* Financial Reporting

### 5.2 Key Integration Points

#### Cost Capture
* **Material Standard Cost:** Maintained in Material Master for estimation and budgeting
* **Actual Purchase Cost:** Captured on PO and confirmed on GRN
* **Issued Cost:** Recorded when materials disbursed to projects
* **Cost Allocation:** Linked to projects, cost centers, and budget line items

#### Financial Events Tracked

| Supply Chain Event | Financial Impact | Future GL Entry |
|-------------------|------------------|-----------------|
| **PO Created** | Commitment (encumbrance) | DR: Encumbrance, CR: Reserved for Encumbrance |
| **GRN Posted** | Inventory increase | DR: Inventory, CR: Accounts Payable |
| **Material Issued** | Project cost / COGS | DR: Project Cost/COGS, CR: Inventory |
| **Stock Adjustment** | Inventory variance | DR: Inventory Variance Expense, CR: Inventory |
| **Supplier Payment** | (Future AP module) | DR: Accounts Payable, CR: Cash |

#### Data Structures for Financial Integration

**Cost Centers:**
* Each project mapped to a cost center
* Cost center codes stored in Project entity
* All disbursements tagged with cost center

**Budget Line Items:**
* Requisitions and disbursements linked to budget categories (e.g., "Materials - Cement", "Tools - Small Equipment")
* Budget tracking at requisition approval stage
* Real-time budget consumption visibility

**Chart of Accounts Alignment:**
* Material categories mapped to GL account codes
* Placeholder for future GL account assignment
* Consistent coding for easy integration

**Vendor Master Data:**
* Supplier information structured for AP integration
* Payment terms for cash flow planning
* Tax ID for compliance and reporting

#### Three-Way Match Support
* **PO Amount:** Expected cost commitment
* **GRN Quantity/Cost:** Actual receipt confirmation
* **Invoice (Future):** Supplier bill to be matched against PO and GRN
* System ready to highlight discrepancies for resolution

### 5.3 Financial Data Exports

**For Future Integration:**
* Daily transaction extract (all GRNs, disbursements, adjustments)
* Cost allocation file (project costs by day/week/month)
* Commitment report (open POs)
* Inventory valuation file (for balance sheet)
* Supplier payable summary (for AP module)

**Data Format:**
* Structured JSON or CSV
* Timestamp for incremental updates
* Transaction IDs for traceability
* Ready for ETL (Extract, Transform, Load) processes

### 5.4 Placeholders for Future Enhancement

**Fields Reserved for Financial Module:**
* GL Account Code (on Material Master and transactions)
* Cost Type (Direct, Indirect, Overhead)
* Tax Code and Tax Amount
* Payment Status
* Invoice Reference
* Payment Date
* Financial Period/Fiscal Year

**Reports to be Enhanced:**
* Profit & Loss impact preview
* Cash flow forecast (based on POs and payment terms)
* Balance sheet preview (inventory valuation)
* Tax reporting (VAT/GST on purchases)

---

## 6. User Stories - Detailed

### 6.1 Project Manager (The Requester)

#### User Story 1: Create Requisition
**As a** Project Manager,  
**I want to** select items from the Material Master and request them for my specific project site,  
**So that** I don't have to use paper or phone calls and can track my requests digitally.

**Acceptance Criteria:**
* Can search/browse Material Master catalog
* Can add multiple items to a single requisition
* Can specify quantity and required date for each item
* Can add notes/justification for the request
* System auto-calculates estimated total cost
* Receives confirmation with unique requisition number
* Can save draft requisitions and submit later

---

#### User Story 2: Track Status
**As a** Project Manager,  
**I want to** see a "Status" bar (e.g., Pending, Approved, Ordered, Dispatched) for my requests,  
**So that** I know when to expect my materials on-site.

**Acceptance Criteria:**
* Dashboard shows all my requisitions with current status
* Can filter by status, date, or project
* Receives notifications when status changes
* Can view approval comments or rejection reasons
* Can see expected delivery date for items on order
* Status indicator uses color coding (e.g., green for approved, red for rejected, yellow for pending)

---

#### User Story 3: Confirm Receipt
**As a** Project Manager,  
**I want to** click a button to confirm I have received the materials at my site,  
**So that** the system can close the request and update the inventory.

**Acceptance Criteria:**
* Can view items ready for pickup/delivered
* Can confirm full or partial receipt
* Can add notes about condition or quantity discrepancies
* System closes requisition upon confirmation
* Inventory automatically updated
* Option to report issues (damaged, wrong quantity, etc.)

---

### 6.2 Supervisor / Business Owner (The Approver)

#### User Story 4: Review Dashboard
**As an** Approver,  
**I want to** see a list of all pending requisitions across all projects in one place,  
**So that** I can prioritize urgent needs.

**Acceptance Criteria:**
* Dashboard shows pending requisitions from all projects
* Can sort by date, priority, project, or estimated value
* Can see requester name and project location
* High-priority items highlighted
* Shows age of pending requests (days waiting)
* Quick view of estimated cost and availability status

---

#### User Story 5: Approve/Reject with Comments
**As an** Approver,  
**I want to** approve or reject a request with the ability to add a note,  
**So that** the requester knows why a change was made.

**Acceptance Criteria:**
* One-click approve or reject buttons
* Mandatory comment field for rejection
* Optional comment field for approval
* Can modify quantities before approving
* Can approve partial requisition (some items yes, some no)
* Decision recorded with timestamp
* Automatic notification sent to requester

---

#### User Story 6: Budget Oversight
**As a** Business Owner,  
**I want to** see the total value of a Requisition before I approve it,  
**So that** I can manage my company's cash flow effectively.

**Acceptance Criteria:**
* Requisition displays total estimated cost prominently
* Shows available budget for the project
* Warns if requisition exceeds remaining budget
* Can view project's total costs to date
* Can see committed costs (approved but not yet received)
* Approval requires acknowledgment if over budget

---

### 6.3 Storekeeper (The Warehouse Manager)

#### User Story 7: Inventory Check
**As a** Storekeeper,  
**I want the** system to automatically tell me if a requested item is in the project warehouse or needs to be purchased,  
**So that** I don't have to do manual counts.

**Acceptance Criteria:**
* Requisition shows availability status for each item
* Color-coded indicators (green = in stock, red = out of stock, yellow = partial stock)
* Shows current quantity on hand
* Shows location within warehouse (if tracked)
* Lists quantity already reserved for other requisitions
* Automatic check runs when requisition is created

---

#### User Story 8: Inventory Drawdown
**As a** Storekeeper,  
**I want to** record the "Issue" of materials to a specific worker or sub-section of a project,  
**So that** I can keep an accurate balance of what is left.

**Acceptance Criteria:**
* Can create disbursement from approved requisition
* Can specify recipient name/ID
* Can add purpose notes
* System validates sufficient stock before allowing issue
* Inventory automatically reduced
* Transaction recorded in Stock Ledger
* Can print/email issue receipt to recipient

---

#### User Story 9: Stock Alerts
**As a** Storekeeper,  
**I want to** receive a notification when stock levels for a critical material (like cement) fall below a certain limit,  
**So that** I can reorder before we run out.

**Acceptance Criteria:**
* Can set reorder level for each material
* Automatic alert when stock falls below reorder level
* Alert includes material name, current level, reorder level, and suggested reorder quantity
* Can configure alert frequency (immediate, daily digest)
* Can mark alerts as acknowledged
* Alert notification includes quick link to create PO

---

### 6.4 Procurement Officer (The Buyer)

#### User Story 10: Convert to PO
**As a** Procurement Officer,  
**I want to** automatically pull data from an approved (but out-of-stock) requisition into a Purchase Order template,  
**So that** I don't make data-entry errors.

**Acceptance Criteria:**
* Can view list of approved requisitions needing procurement
* "Create PO" button auto-populates PO with requisition data
* Can consolidate multiple requisitions into one PO
* Can edit quantities, prices, and delivery dates
* Material details pulled from Material Master
* Supplier auto-suggested based on Material Master preference

---

#### User Story 11: Supplier Directory
**As a** Procurement Officer,  
**I want to** select from a pre-saved list of Suppliers,  
**So that** I can quickly send POs to the right contact person.

**Acceptance Criteria:**
* Can search suppliers by name or category
* Supplier dropdown shows name and contact email
* Can view supplier details (contact, address, payment terms)
* Can add new suppliers on-the-fly (if authorized)
* System remembers last supplier used for each material
* Email sent automatically to supplier contact email when PO finalized

---

#### User Story 12: Partial Receipts
**As a** Procurement Officer,  
**I want to** record if a supplier only delivered half of an order,  
**So that** I can track the remaining balance due.

**Acceptance Criteria:**
* GRN allows entry of quantity received (different from ordered)
* System calculates outstanding quantity automatically
* PO status changes to "Partially Received"
* Can create follow-up PO or amend existing PO for balance
* Notifications sent about partial delivery to requester
* Can document reason for partial delivery

---

### 6.5 System / Admin Features

#### User Story 13: Multi-Site View
**As an** Admin,  
**I want to** create a new "Warehouse" for every new project we win,  
**So that** inventory remains separated by location.

**Acceptance Criteria:**
* Can create new project/warehouse from admin panel
* Must specify project name, code, location, and manager
* New project appears in project dropdown for requisitions
* Inventory tracked separately for each location
* Can deactivate completed projects
* Cannot delete projects with transaction history

---

#### User Story 14: Material Uniformity
**As an** Admin,  
**I want to** manage a "Material Master" list that everyone must choose from,  
**So that** we don't have five different names for the same type of screw or nail.

**Acceptance Criteria:**
* Can add/edit/deactivate materials in Material Master
* All users select from Material Master (no free-text entry)
* Can merge duplicate materials
* Can set standard cost and reorder levels
* Can assign materials to categories for organization
* Can import materials from spreadsheet (bulk upload)
* Changes propagate to all existing data

---

## 7. Success Metrics for the App

To measure the effectiveness of the supply chain module, the following KPIs will be tracked:

### 7.1 Zero Paper
**Target:** 100% of requests happen inside the app.

**Measurement:**
* Number of digital requisitions created per month
* % reduction in paper requisition forms
* User adoption rate (% of project managers using the app)

**Target Timeline:** 
* 80% adoption within 3 months of launch
* 100% adoption within 6 months

---

### 7.2 No "Stock-Outs"
**Target:** Materials arrive before the project stops.

**Measurement:**
* Number of project delays due to material shortage
* % of requisitions fulfilled on time (by required date)
* Average lead time from requisition to receipt

**Target Metrics:**
* 95% of requisitions fulfilled by required date
* Zero critical project delays due to material shortage
* Reduce average lead time by 30% compared to current process

---

### 7.3 Accuracy
**Target:** The digital stock count matches the physical stock count at the end of each week.

**Measurement:**
* Stock accuracy rate (% match between system and physical count)
* Value of stock discrepancies
* Frequency of stock adjustments

**Target Metrics:**
* 98% stock accuracy rate
* Discrepancies under 2% of total inventory value
* Quarterly reduction in adjustment frequency

---

### 7.4 Cost Control (Financial Integration)
**Target:** Better visibility leads to cost savings.

**Measurement:**
* % reduction in emergency purchases (higher cost)
* Average cost variance (estimated vs. actual)
* Bulk purchase opportunities identified
* Reduction in excess/obsolete inventory

**Target Metrics:**
* 20% reduction in emergency purchases within 1 year
* Cost variance within ±5%
* Inventory carrying cost reduced by 15%

---

### 7.5 Process Efficiency
**Target:** Faster approval and fulfillment cycles.

**Measurement:**
* Average requisition approval time
* Average time from approval to fulfillment
* % of requisitions auto-converted to PO (no manual intervention)

**Target Metrics:**
* Requisition approval within 24 hours
* Fulfillment within 3 days for in-stock items
* 80% of POs auto-generated from requisitions

---

### 7.6 User Satisfaction
**Target:** High user adoption and satisfaction.

**Measurement:**
* User satisfaction surveys (quarterly)
* App usage metrics (daily active users)
* Support ticket volume (issues reported)

**Target Metrics:**
* User satisfaction score > 4/5
* 90% daily active user rate among registered users
* Support tickets trending downward over time

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Months 1-2)
**Deliverables:**
* Database schema design and implementation
* Material Master setup
* Supplier directory
* Project/Warehouse configuration
* User management and role-based access

**Success Criteria:**
* All core entities created
* Admin can add materials, suppliers, projects
* Users can log in with assigned roles

---

### Phase 2: Core Workflows (Months 3-4)
**Deliverables:**
* Requisition creation and approval
* Availability checking
* Basic inventory tracking
* Stock Ledger implementation

**Success Criteria:**
* Project managers can create requisitions
* Approvers can approve/reject
* Inventory updated correctly for test transactions
* Audit trail visible for all actions

---

### Phase 3: Procurement (Months 5-6)
**Deliverables:**
* Purchase Order creation and management
* Goods Received Note (GRN) processing
* Supplier notifications
* PO tracking and status management

**Success Criteria:**
* Can create PO from requisition
* Can receive goods and update inventory
* PO status tracking functional
* Email notifications working

---

### Phase 4: Disbursement & Mobile (Months 7-8)
**Deliverables:**
* Material disbursement module
* Mobile-responsive interface
* Mobile-optimized GRN and issue processes
* Barcode scanning (if hardware available)

**Success Criteria:**
* Can issue materials to projects
* Mobile interface works on phones/tablets
* Can perform key tasks from mobile device
* Stock levels update correctly on disbursement

---

### Phase 5: Reporting & Analytics (Months 9-10)
**Deliverables:**
* Standard operational reports
* Management dashboards
* Financial integration reports
* Data export capabilities

**Success Criteria:**
* Key reports accessible to relevant users
* Data exports working for financial integration
* Dashboards show real-time metrics

---

### Phase 6: Optimization & Refinement (Months 11-12)
**Deliverables:**
* Performance optimization
* User feedback incorporation
* Advanced features (stock alerts, auto-reorder suggestions)
* Training and documentation
* Financial module integration preparation

**Success Criteria:**
* System performs well under load
* User satisfaction targets met
* All success metrics being tracked
* Ready for financial module integration

---

## 9. Technical Considerations

### 9.1 Technology Stack Recommendations

**Frontend:**
* Modern web framework (React, Angular, or Vue.js) for responsive UI
* Progressive Web App (PWA) for mobile offline capability
* Responsive design framework (Bootstrap, Material UI, Tailwind CSS)

**Backend:**
* RESTful API architecture for flexibility
* Node.js, Python (Django/Flask), or .NET Core for backend services
* JWT for authentication
* Real-time notifications (WebSockets or Server-Sent Events)

**Database:**
* Relational database (PostgreSQL, MySQL) for transaction integrity
* Support for ACID properties (critical for financial data)
* Proper indexing for performance
* Regular backup strategy

**Infrastructure:**
* Cloud-hosted for accessibility (AWS, Azure, Google Cloud)
* Auto-scaling for peak loads
* CDN for static assets
* SSL/TLS encryption for all connections

---

### 9.2 Security Requirements

* **Authentication:** Strong password policies, multi-factor authentication for sensitive roles
* **Authorization:** Role-based access control (RBAC) strictly enforced
* **Data Encryption:** At rest and in transit
* **Audit Logging:** All access and modifications logged
* **Session Management:** Automatic timeout for inactive sessions
* **API Security:** Rate limiting, input validation, SQL injection prevention
* **Backup & Recovery:** Daily automated backups, tested recovery procedures

---

### 9.3 Integration APIs

Design API endpoints for future financial module integration:

**Endpoints to Expose:**
* `/api/transactions/daily` - Daily transaction summary
* `/api/inventory/valuation` - Current inventory value
* `/api/projects/costs` - Project cost summary
* `/api/payables/outstanding` - Supplier payables
* `/api/commitments/open` - Open purchase orders

**Data Format:**
* JSON for structured data
* CSV for bulk exports
* Consistent timestamp format (ISO 8601)
* Unique transaction IDs for traceability

---

## 10. Risks & Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| **Low user adoption** | High - System unused, no benefit realized | Comprehensive training, involve users in design, make mobile-friendly, demonstrate quick wins |
| **Data migration challenges** | Medium - Existing data difficult to import | Plan data cleanup early, provide import tools, allow gradual rollout |
| **Connectivity issues at sites** | High - Can't use system without internet | Implement offline mode (PWA), mobile data backup, local caching |
| **Resistance to change** | High - Users prefer old processes | Change management program, executive sponsorship, pilot with enthusiastic users first |
| **Integration complexity** | Medium - Financial module integration delayed | Design with clear integration points, use standard data formats, document thoroughly |
| **Cost overruns** | Medium - Development takes longer than planned | Phased approach, MVP first, regular progress reviews, build vs. buy decision |
| **Data accuracy issues** | High - GIGO (Garbage In, Garbage Out) | Data validation rules, mandatory fields, physical stock counts for verification, audit reports |

---

## 11. Conclusion & Next Steps

This supply chain management module is designed to bring transparency, efficiency, and cost control to your business operations. By eliminating paper trails, centralizing communication, and integrating with future financial systems, you will always know where your materials are and what they cost.

### Immediate Next Steps:

1. **Stakeholder Approval:** Review this plan with key stakeholders (management, project managers, storekeepers, procurement)
2. **Technology Decision:** Choose development platform and technology stack
3. **Team Assembly:** Identify development team (internal or external)
4. **Pilot Project:** Select one project for initial rollout
5. **Data Preparation:** Begin cleaning and standardizing existing material and supplier lists
6. **Detailed Design:** Create wireframes and user interface mockups based on this plan

### Long-Term Vision:

This module lays the foundation for a comprehensive ERP system that will include:
* **Financial Module:** General ledger, accounts payable/receivable, financial reporting
* **HR Module:** Employee management, time tracking, payroll
* **Project Management Module:** Scheduling, task management, resource allocation
* **Analytics & BI:** Advanced reporting, predictive analytics, business intelligence

By starting with supply chain management, you're addressing a critical pain point while building a scalable platform for future growth.

---

**Document Version:** 1.0  
**Date:** February 8, 2026  
**Status:** Draft for Review  
**Next Review Date:** TBD after stakeholder feedback
