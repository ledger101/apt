# Insurance Data Models

This directory contains all TypeScript data models for the OptiPlus Insurance Data Management & Reporting App.

## File Structure

```
models/
├── insurance-data.model.ts  # Main insurance data models (IFRS 17-compliant)
├── pension-data.model.ts    # Legacy compatibility layer
├── index.ts                 # Central export file
└── README.md                # This file
```

## Usage

Import models from the central index file:

```typescript
import { 
  Institution, 
  IncomeStatement, 
  KPIRatios,
  InstitutionDataPackage 
} from '@app/models';
```

Or import directly from the source file:

```typescript
import { Institution } from '@app/models/insurance-data.model';
```

## Core Data Models

### Institution Models

#### `Institution`
Main collection document representing an insurance institution's metadata.

**Key Fields:**
- `id`: Unique identifier (format: `{institutionCode}_{year}_{quarter}`)
- `institutionName`: Name of the insurance institution
- `businessType`: Type of insurer (e.g., 'Non-Life Reinsurer', 'Direct Insurer')
- `financialYear`: Reporting year
- `financialQuarter`: Reporting quarter ('Q1', 'Q2', 'Q3', 'Q4')
- `principalOfficer`, `complianceManager`, `financeDirector`: Officer details
- `status`: Submission status ('draft', 'submitted', 'approved', 'rejected')

### Financial Statement Models

#### `IncomeStatement`
Statement of Comprehensive Income data (subcollection: `institutions/{instId}/income_statements`)

**Key Sections:**
- **Revenue**: `netWrittenPremium`, `insuranceRevenue`, `revenuePAA`, `revenueNonPAA`
- **Insurance Service Expenses**: `expectedIncurredClaims`, `incurredClaims`, `insuranceContractExpenses`
- **Reinsurance**: `allocationOfReinsurancePremiums`, `amountsRecoverableFromReinsurers`
- **Results**: `insuranceServiceResult`, `profitLossBeforeTax`, `profitLossAfterTax`

#### `FinancialPosition`
Statement of Financial Position data (subcollection: `institutions/{instId}/financial_positions`)

**Key Sections:**
- **Non-Current Assets**: `intangibleAssets`, `propertyPlantEquipment`, `investmentProperty`, `quotedEquities`, `bonds`
- **Current Assets**: Nested object with `cashAndBankBalances`, `otherReceivables`, etc.
- **Liabilities**: `insuranceContractLiabilities`, `reinsuranceContractHeldLiabilities`, `currentProvisions`
- **Equity**: `shareCapital`, `sharePremium`, `retainedEarnings`

#### `BusinessClassPerformance`
Performance metrics by insurance class (subcollection: `institutions/{instId}/business_class_performance`)

**Business Classes:**
- `fire`: Fire insurance
- `motor`: Motor vehicle insurance
- `engineering`: Engineering insurance
- `marine`: Marine insurance
- `aviation`: Aviation insurance
- `paccident`: Personal accident insurance
- `other`: Other insurance types

**Metrics:** Same revenue and expense structure as `IncomeStatement`, but segmented by business class.

#### `AssetBreakdown`
Detailed asset category breakdown (subcollection: `institutions/{instId}/asset_breakdown`)

**Fields:**
- `assetCategory`: Type of asset (e.g., 'Zimbabwe Government Securities', 'Gold Coins', 'REIT')
- `amount`: Asset value
- `percentage`: Percentage of total assets (optional)

### Optional Models

#### `Demographics`
Demographic characteristics of policyholders (subcollection: `institutions/{instId}/demographics`)

**Fields:**
- `policyCountByGender`: Policy distribution by gender
- `policyCountByRegion`: Regional distribution
- `policyCountByAgeGroup`: Age group distribution

#### `Governance`
Corporate structure and governance information (subcollection: `institutions/{instId}/governance`)

**Fields:**
- `boardMembers`: Array of board member details
- `parentCompany`, `subsidiaries`: Corporate structure
- `regulatoryLicenseNumber`, `licenseExpiryDate`: Compliance information

## KPI and Reporting Models

### `KPIRatios`
Calculated key performance indicators (not stored directly, computed from other data)

**Underwriting Ratios:**
- `claimsRatio`: (Incurred Claims / Insurance Revenue) × 100%
- `expenseRatio`: ((Insurance Service Expenses + Admin Expenses) / Insurance Revenue) × 100%
- `combinedRatio`: Claims Ratio + Expense Ratio
- `operatingRatio`: Combined Ratio - ((Investment Income / Insurance Revenue) × 100%)

**Investment Ratios:**
- `investmentYield`: Investment Income / Average Total Investments

**Profitability Ratios:**
- `returnOnEquity`: Profit After Tax / Average Net Worth
- `returnOnAssets`: Profit After Tax / Average Total Assets
- `profitMargin`: Profit After Tax / Insurance Revenue

### `SectorAggregateData`
Aggregated sector-wide data for reports

**Contains:**
- Total counts and sums across all institutions
- Segmentation by business type and business class
- Sector-wide KPIs

### `ReportExportConfig`
Configuration for report generation and export

**Fields:**
- `reportType`: Type of report (e.g., 'executive-summary', 'consolidated-income-statement')
- `period`: Reporting period
- `format`: Export format ('pdf' or 'excel')
- `includeCharts`: Whether to include visualizations
- `includedInstitutions`: Optional filter for specific institutions

**Report Types:**
- `executive-summary`
- `consolidated-income-statement`
- `consolidated-financial-position`
- `business-class-performance`
- `claims-analysis`
- `expense-analysis`
- `investment-analysis`
- `capital-solvency`
- `kpi-dashboard`

## Validation and Error Models

### `ValidationResult`
Result of data validation

**Fields:**
- `isValid`: Whether validation passed
- `errors`: Array of validation errors
- `warnings`: Array of validation warnings

### `ValidationError` / `ValidationWarning`
Individual validation issues

**Fields:**
- `field`: Field name with the issue
- `message`: Description of the issue
- `severity`: 'error' or 'warning'
- `sheet`: Excel sheet name (optional)
- `cell`: Excel cell reference (optional)

## Audit and Tracking Models

### `AuditLog`
Audit trail for data changes

**Fields:**
- `timestamp`: When the action occurred
- `userId`, `userName`: Who performed the action
- `action`: Type of action ('create', 'update', 'delete', 'view', 'export')
- `entityType`: Type of entity affected
- `entityId`: ID of the entity
- `changes`: Array of field-level changes (for updates)

### `UploadStatus`
Status tracking for Excel uploads

**Fields:**
- `filename`: Name of uploaded file
- `institutionId`: Associated institution
- `uploadedBy`: User who uploaded
- `status`: 'pending', 'processing', 'completed', or 'failed'
- `progress`: Upload progress (0-100)
- `validationResult`: Validation outcome (optional)
- `errorMessage`: Error details if failed (optional)

## Utility Models

### `InstitutionDataPackage`
Complete data package for an institution

**Contains:**
- `institution`: Institution metadata
- `incomeStatement`: Income statement data
- `financialPosition`: Financial position data
- `businessClassPerformances`: Array of business class performance data
- `assetBreakdowns`: Array of asset breakdown data
- `demographics`: Optional demographics data
- `governance`: Optional governance data

Used for batch upload/update operations and complete data retrieval.

### `InstitutionQueryFilter`
Query filters for retrieving institution data

**Fields:**
- `financialYear`: Filter by year
- `financialQuarter`: Filter by quarter
- `businessType`: Filter by business type
- `institutionCodes`: Filter by specific institution codes
- `status`: Filter by submission status

### `PaginationOptions`
Pagination parameters for data retrieval

**Fields:**
- `limit`: Number of records per page
- `offset`: Starting position
- `orderBy`: Field to sort by
- `orderDirection`: Sort direction ('asc' or 'desc')

### `PaginatedResult<T>`
Wrapper for paginated query results

**Fields:**
- `data`: Array of results
- `total`: Total number of matching records
- `hasMore`: Whether more pages exist
- `nextOffset`: Offset for next page (optional)

## IFRS 17 Compliance

All data models are designed to align with IFRS 17 (International Financial Reporting Standard 17) for insurance contracts, which includes:

- **Premium Allocation Approach (PAA)**: Simplified measurement approach for short-duration contracts
- **Non-PAA Approach**: General measurement model for longer-duration contracts
- **Insurance Revenue Recognition**: Separate tracking of insurance revenue vs. investment components
- **Risk Adjustment**: Explicit recognition of risk adjustments for non-financial risk
- **Reinsurance Contracts**: Separate presentation of reinsurance assets and liabilities

## Firestore Structure

The models map to the following Firestore structure:

```
institutions/{institutionId}
  ├── (document fields: Institution interface)
  ├── income_statements/{periodId} (IncomeStatement)
  ├── financial_positions/{periodId} (FinancialPosition)
  ├── business_class_performance/{id} (BusinessClassPerformance)
  ├── asset_breakdown/{id} (AssetBreakdown)
  ├── demographics/{periodId} (Demographics - optional)
  └── governance/{periodId} (Governance - optional)
```

Where:
- `{institutionId}` format: `{institutionCode}_{year}_{quarter}` (e.g., `emre_2025_q1`)
- `{periodId}` format: `{year}_{quarter}` (e.g., `2025_Q1`)

## Legacy Compatibility

The `pension-data.model.ts` file provides backward compatibility for the previous pension-focused application. It re-exports insurance models and provides legacy type aliases. New code should not use this file.

## Best Practices

1. **Use the index file**: Import from `@app/models` instead of individual files
2. **Type safety**: All models are fully typed - avoid using `any` when working with these models
3. **Required vs Optional**: Pay attention to optional fields (marked with `?`)
4. **Date handling**: All date fields use the `Date` type - convert Firestore Timestamps appropriately
5. **Nested structures**: Some models have nested objects (e.g., `FinancialPosition.currentAssets`) - access them correctly
6. **Validation**: Always validate user input against these models before storing in Firestore
7. **IDs**: Use the prescribed ID formats for consistency:
   - Institution ID: `{code}_{year}_{quarter}`
   - Period ID: `{year}_{quarter}`

## Future Enhancements

Potential additions to the models:

- [ ] Historical trend tracking
- [ ] Comparative analysis models
- [ ] Benchmarking data structures
- [ ] Regulatory compliance tracking
- [ ] Risk management metrics
- [ ] Solvency II alignment (for international comparison)

## Contributing

When adding or modifying models:

1. Update the interface in `insurance-data.model.ts`
2. Add JSDoc comments explaining the purpose and key fields
3. Export the interface in `index.ts`
4. Update this README with usage examples
5. Update the Firestore security rules if needed
6. Update the Excel parsing service to handle new fields

## References

- [IFRS 17 Standard](https://www.ifrs.org/issued-standards/list-of-standards/ifrs-17-insurance-contracts/)
- [Firestore Data Modeling Best Practices](https://firebase.google.com/docs/firestore/data-model)
- [TypeScript Interface Documentation](https://www.typescriptlang.org/docs/handbook/interfaces.html)
