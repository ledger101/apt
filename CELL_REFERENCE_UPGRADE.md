# Cell Reference Upgrade - Excel Parsing Service

## Overview
The Excel parsing service has been upgraded to use **direct cell references** instead of pattern matching for extracting data from Step Discharge and Constant Discharge test templates. This provides more reliable and consistent parsing.

## Key Changes

### 1. Cell Reference Mappings
Added two comprehensive cell reference configuration objects:

#### **STEPPED_DISCHARGE_CELLS**
- **Metadata cells**: Precise locations for all metadata fields (C6-I13)
  - Project info, borehole details, coordinates, pump specifications
- **Rate configurations**: 6 discharge rate sections with:
  - Date/time cells
  - Data ranges (rows 18-30, 36-48, 54-66)
  - Column mappings for time, water level, drawdown, yield
  - Quality parameter cells (pH, temp, EC)
- **Recovery section**: Data range rows 72-95

#### **CONSTANT_DISCHARGE_CELLS**
- **Metadata cells**: Borehole and test information (C5-G15)
- **Discharge borehole**: Columns B-E, rows 19-100
- **Observation holes 1-3**: Separate column sets (F-H, I-K, L-N)
- **Recovery data**: Columns O-P

### 2. New Helper Methods

#### `getCellByRef(sheet, cellRef)`
Retrieves value from a specific cell reference (e.g., 'C5')

#### `extractDataRange(sheet, startRow, endRow, columns)`
Extracts data from a range using cell references
- Returns array of row objects
- Automatically filters empty rows
- More efficient than pattern-based scanning

#### `rowToDischargePoint(row, hasYield)`
Converts raw row data to DischargePoint format
- Handles optional yield field
- Applies unit normalization
- Ensures non-negative time values

### 3. Upgraded Parsing Methods

#### **parseSteppedDischarge()**
- **Before**: Used pattern matching to find headers and labels
- **After**: Direct cell reference extraction
  - Metadata from fixed cells
  - Iterates through 6 rate configurations
  - Extracts quality parameters from known cells
  - Recovery data from fixed range

#### **parseConstantDischarge()**
- **Before**: Scanned for headers and column groups dynamically
- **After**: Direct cell reference extraction
  - Metadata from fixed cells
  - Separate extraction for discharge, obs holes, recovery
  - Each section has defined cell ranges
  - No need for dynamic header detection

## Benefits

### 1. **Reliability**
- No dependency on header text variations
- Works even if labels are modified
- Consistent results across different template versions

### 2. **Performance**
- Faster extraction (no pattern matching)
- Direct cell access
- Reduced iteration over sheet cells

### 3. **Maintainability**
- Clear mapping structure at top of service
- Easy to update cell locations
- Self-documenting code

### 4. **Accuracy**
- Eliminates false matches from pattern matching
- Precise data location targeting
- Better handling of edge cases

## Backward Compatibility
- Legacy pattern-matching methods retained for fallback
- Old methods marked with comments but not removed
- Can switch between approaches if needed

## Testing Recommendations

1. **Stepped Discharge Tests**
   - Upload templates with all 6 rates populated
   - Upload templates with partial rates (1-3)
   - Verify quality parameters extraction
   - Check recovery data parsing

2. **Constant Discharge Tests**
   - Test with discharge borehole only
   - Test with observation holes 1-3
   - Verify recovery data extraction
   - Test with varying data lengths

3. **Edge Cases**
   - Empty cells within data ranges
   - Partial metadata
   - Different coordinate formats
   - Missing optional fields

## Cell Reference Documentation

### Stepped Discharge Template Structure
```
Metadata Section (Rows 6-13):
C6: Project No    | I6: Map Ref
C7: Province      | F7: Borehole No | I7: Alt BH No
C8: Site Name     | F8: District    | I8: Latitude
C9: Elevation     | F9: BH Depth    | I9: Longitude
...

Rate 1 (Left column):
C16: Date | F16: Time
B18-E30: Data (Time, WL, DDN, Q)
D31: pH | E31: Temp | E32: EC

Rate 4 (Right column):
H16: Date | K16: Time
G18-J30: Data (Time, WL, DDN, Q)
I31: pH | J31: Temp | J32: EC

Recovery Section:
B72-D95: Data (Time, WL, Recovery)
```

### Constant Discharge Template Structure
```
Metadata Section (Rows 5-15):
C5: Borehole No   | G5: Alt BH No
C6: Site Name     | G6: Client
C7: Contractor    | G7: Latitude
...

Data Section (Rows 19-100):
B-E: Discharge BH (Time, WL, DDN, Q)
F-H: Obs Hole 1 (Time, WL, DDN)
I-K: Obs Hole 2 (Time, WL, DDN)
L-N: Obs Hole 3 (Time, WL, DDN)
O-P: Recovery (Time, WL)
```

## Future Enhancements

1. **Configuration File**: Move cell mappings to external JSON for easy updates
2. **Template Versions**: Support multiple template versions with different cell layouts
3. **Validation**: Add cell-level validation to detect template structure changes
4. **Dynamic Range**: Auto-detect actual data range end instead of fixed row 100

## Migration Notes

- No changes required to existing file upload UI
- Existing data structures unchanged
- Same validation and error handling flow
- Compatible with current Firestore models
