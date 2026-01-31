# Storage Plan: Site-Based Organization for Discharge Data

## Overview
Reorganize Firestore data structure to use **Site Name** as the primary key, with boreholes as sub-collections under each site.

## Current Structure (Before)
```
boreholes/{boreholeId}
  ├── boreholeNo
  ├── siteName
  ├── coordinates
  └── ...

tests/{testId}
  ├── testType
  ├── boreholeRef → "boreholes/{boreholeId}"
  ├── summary
  └── subcollections:
      ├── series/{seriesId}
      └── quality/{qualityId}
```

## New Structure (After)
```
sites/{siteId}  ← Site Name as key identifier
  ├── siteName
  ├── client
  ├── contractor
  ├── province
  ├── district
  ├── coordinates (lat/lon)
  ├── createdAt
  └── updatedAt
  
  └── boreholes/{boreholeId}  ← Borehole as sub-collection
      ├── boreholeNo
      ├── altBhNo
      ├── boreholeDepth_m
      ├── staticWL_mbdl
      ├── casingHeight_magl
      ├── elevation_m
      ├── datumAboveCasing_m
      ├── existingPump
      ├── pumpDepth_m
      ├── pumpInletDiam_mm
      ├── pumpType
      ├── swl_mbch
      ├── createdAt
      └── updatedAt
      
      └── tests/{testId}  ← Tests as sub-collection of borehole
          ├── testType ("stepped_discharge" | "constant_discharge")
          ├── startTime
          ├── endTime
          ├── summary { availableDrawdown_m, totalTimePumped_min, staticWL_m, pump {}, notes }
          ├── sourceFilePath
          ├── status ("draft" | "parsed" | "failed")
          ├── createdBy
          ├── createdAt
          └── updatedAt
          
          └── series/{seriesId}  ← Series as sub-collection of test
              ├── seriesType ("discharge" | "discharge_rate" | "recovery" | "obshole1" | etc.)
              ├── rateIndex (for stepped discharge rates)
              ├── pageIndex (for chunking >400 points)
              ├── points [{t_min, wl_m, ddn_m, qlps}]
              └── createdAt
          
          └── quality/{qualityId}  ← Quality data as sub-collection of test
              ├── rateIndex
              ├── pH
              ├── tempC
              ├── ec_uScm
              └── createdAt

parseJobs/{jobId}  ← Parse jobs remain at root level
  ├── testRef → "sites/{siteId}/boreholes/{boreholeId}/tests/{testId}"
  ├── status
  ├── warnings
  ├── counts
  ├── sourceFilePath
  ├── createdBy
  └── createdAt
```

## Benefits
1. **Hierarchical Organization**: Naturally groups boreholes by site, making queries more intuitive
2. **Site-Level Queries**: Easy to retrieve all boreholes and tests for a specific site
3. **Better Data Locality**: Related data (site → boreholes → tests) is stored together
4. **Scalability**: Sub-collection structure scales better as data grows
5. **Site-Level Metadata**: Can store site-wide information (coordinates, client, contractor) once

## Implementation Changes Required

### 1. Model Updates (`src/app/models/pumping-data.model.ts`)
- Add `Site` interface with siteId as primary key
- Update `Borehole` interface to remove site-level fields (moved to Site)
- Update `DischargeTest` to use nested path references

### 2. Firestore Service Updates (`src/app/services/firestore.service.ts`)
- `saveSite()`: Create or update site document
- `saveBorehole()`: Save to `sites/{siteId}/boreholes/{boreholeId}` path
- `saveDischargeTest()`: Save to `sites/{siteId}/boreholes/{boreholeId}/tests/{testId}` path
- `saveSeries()`: Save to nested path under test
- `saveQuality()`: Save to nested path under test
- `getTestsBySite()`: Query all tests under a site
- `getBoreholesBySite()`: Query all boreholes under a site

### 3. Excel Parsing Service Updates (`src/app/services/excel-parsing.service.ts`)
- Extract site information separately from borehole information
- Generate `siteId` from siteName (slugified)
- Return both `site` and `borehole` objects from parsing

### 4. Upload Component Updates (`src/app/components/upload/upload.component.ts`)
- Handle saving site data before borehole
- Update path references in parse jobs

## Migration Strategy (If Existing Data)
1. **Phase 1**: Deploy new code that writes to both old and new structures
2. **Phase 2**: Run migration script to copy existing data to new structure
3. **Phase 3**: Update queries to read from new structure
4. **Phase 4**: Remove old structure write logic and deprecate old paths

## Key Identifiers
- **siteId**: Slugified siteName (e.g., "kamisengo" from "KAMISENGO")
- **boreholeId**: Slugified boreholeNo (e.g., "kmdw-09" from "KMDW 09")
- **testId**: Generated timestamp-based ID (e.g., "discharge-1738318800000")

## Query Examples (New Structure)
```typescript
// Get all boreholes for a site
const boreholesRef = collection(firestore, `sites/${siteId}/boreholes`);

// Get all tests for a specific borehole
const testsRef = collection(firestore, `sites/${siteId}/boreholes/${boreholeId}/tests`);

// Get all series for a test
const seriesRef = collection(firestore, `sites/${siteId}/boreholes/${boreholeId}/tests/${testId}/series`);

// Get all tests across all sites (using collection group)
const allTestsQuery = collectionGroup(firestore, 'tests');
```

## Rollout Plan
1. ✅ Create storagePlan.md (this document)
2. ⏳ Update models to include Site interface
3. ⏳ Update FirestoreService with new save/query methods
4. ⏳ Update ExcelParsingService to extract site data
5. ⏳ Update UploadComponent to save site → borehole → test
6. ⏳ Test with sample Excel files
7. ⏳ Update reports/dashboard components to use new structure
