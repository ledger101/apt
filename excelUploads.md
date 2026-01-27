# Excel Upload Implementation Plan

## Overview
Implement automatic detection and parsing of three Excel report types:
1. **Progress Report** (Daily Drilling Report) - existing implementation
2. **Stepped Discharge Test & Recovery** - partially implemented
3. **Constant Discharge & Recovery** - partially implemented

When an Excel file is uploaded, the system will automatically detect the template type and parse accordingly.

## Current State Analysis

### Existing Components
- `ExcelParsingService.parseAquiferFile()` - handles discharge detection and parsing
- `ExcelParsingService.parseExcelFile()` - handles progress reports
- `UploadComponent` - attempts discharge parsing first, falls back to progress report
- Models: `DischargeTest`, `Borehole`, `Series`, `Quality`, `Report`

### Detection Logic
Current detection in `detectTemplateType()`:
- Stepped: looks for "STEPPED DISCHARGE TEST & RECOVERY" or "discharge rate 1"
- Constant: looks for "CONSTANT DISCHARGE AND RECOVERY" or "observation hole 1"

### Parsing Status
- **Progress Report**: Fully implemented
- **Stepped Discharge**: Parser exists, needs refinement
- **Constant Discharge**: Parser exists, needs refinement

## Implementation Plan

### 1. Unified Detection System
**Goal**: Single entry point that detects all three template types

**Changes**:
- Modify `ExcelParsingService.parseFile()` to be the main entry point
- Enhance `detectTemplateType()` to include progress report detection
- Add heuristics for each type:
  - Progress: Sheet name "Daily report drilling", headers like "Date", "Shift", "Activity"
  - Stepped: Title "STEPPED DISCHARGE TEST & RECOVERY", columns TIME(MIN), WATER LEVEL(M), DRAW DOWN(M), YIELD(L/S)
  - Constant: Title "CONSTANT DISCHARGE AND RECOVERY", observation holes, discharge borehole

### 2. Parser Refinement

#### Stepped Discharge Parser
**Current Issues**:
- Metadata extraction incomplete
- Quality parameters (pH, Temp, EC) not fully captured
- Recovery section parsing needs improvement

**Enhancements**:
- Complete metadata mapping from PRD section 5.1
- Extract quality checkpoints per discharge rate
- Handle variable number of rates (1-6)
- Validate required fields: Borehole No, Site Name, Test Date/Time

#### Constant Discharge Parser
**Current Issues**:
- Observation hole parsing may miss optional holes
- Recovery series integration
- Available Drawdown extraction

**Enhancements**:
- Support 1-3 observation holes
- Parse recovery as separate series
- Extract computed values (Available Drawdown, Total time pumped)
- Handle time-series for discharge borehole + obs holes

### 3. Data Model Updates

#### Firestore Structure (per PRD)
```
tests/{testId}
├── testType: "stepped_discharge" | "constant_discharge" | "progress_report"
├── boreholeRef: "boreholes/{boreholeId}"
├── startTime, endTime
├── summary: { availableDrawdown_m, notes, etc. }
├── sourceFilePath
├── status: "parsed" | "failed"
└── createdBy

tests/{testId}/series/{seriesId}
├── seriesType: "discharge_rate" | "recovery" | "discharge" | "obs_hole_1" | etc.
├── rateIndex?: number (for stepped rates)
├── pageIndex: number (for chunking)
└── points: [{t_min, wl_m, ddn_m, q_lps}]

tests/{testId}/quality/{qualityId} (stepped only)
├── rateIndex: number
├── pH, tempC, ec_uScm
└── timestamp

boreholes/{boreholeId}
├── boreholeNo, siteName, coordinates
├── client, contractor, province, district
├── pump details, casing info
└── static water levels
```

#### Model Updates
- Ensure `DischargeTest` supports both discharge types
- Add `ProgressReport` model if separate from existing `Report`
- Update `Series` enum for all series types
- Add chunking logic for large time-series (>400 points)

### 4. Upload Flow Enhancement

#### Detection Priority
1. Try discharge detection (stepped/constant)
2. If fails, try progress report detection
3. If both fail, show error with template guidance

#### Validation & Error Handling
- Template-specific validation rules
- Clear error messages for missing headers
- Partial success handling (warn on missing optional data)
- File size limits and performance monitoring

#### UI Updates
- Show detected template type in preview
- Template-specific preview tabs
- Chart generation for time-series data
- Progress indicators during parsing

### 5. Storage & Persistence

#### Cloud Storage
- Upload original files to `uploads/` bucket
- Generate secure download URLs
- File versioning for re-uploads

#### Firestore Operations
- Atomic writes: file upload + Firestore update
- Idempotency: prevent duplicate tests from same file
- Chunking for large series (400 points per document)
- Error recovery and rollback

### 6. Testing & Validation

#### Test Cases
- Valid stepped discharge file (all rates + recovery)
- Valid constant discharge file (discharge + obs holes)
- Valid progress report
- Invalid/malformed files
- Edge cases: missing optional data, extra columns

#### Integration Tests
- End-to-end upload flow
- Data persistence verification
- UI rendering of parsed data
- Error handling scenarios

## Implementation Steps

1. **Week 1**: Unified detection system
   - Create `parseFile()` entry point
   - Enhance detection heuristics
   - Update upload component logic

2. **Week 2**: Parser refinement
   - Fix stepped discharge metadata extraction
   - Complete constant discharge observation holes
   - Add quality parameter parsing

3. **Week 3**: Data model & storage
   - Update Firestore schemas
   - Implement chunking for series
   - Add progress report model integration

4. **Week 4**: UI & validation
   - Template-specific previews
   - Enhanced error messages
   - Testing and bug fixes

## Success Criteria

- Automatic detection accuracy >95%
- Parsing success rate >90% for valid templates
- Firestore storage within 15 seconds for typical files (<5MB)
- Clear error messages for invalid files
- UI shows appropriate preview for each template type

## Future Enhancements

- PDF report generation
- GIS mapping integration
- Advanced analytics (step-drawdown curves)
- Bulk upload capabilities
- Template validation before upload