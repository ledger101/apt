# File Upload Script Documentation

## Overview

The `upload-files-to-firestore.js` script is designed to batch upload Excel files from the `drive` folder structure to Firestore. It automatically detects file types, parses the data, and logs any errors that occur during processing.

## Features

- **Automatic File Discovery**: Recursively scans the `drive` folder for Excel files
- **File Type Detection**: Automatically detects stepped discharge tests, constant discharge tests, and other file types
- **Error Logging**: Logs all parsing failures and errors to `upload-errors.log`
- **Success Tracking**: Records successful uploads in `upload-success.log`
- **Statistics**: Provides a summary of total files processed, successful uploads, and failures

## Prerequisites

1. Node.js (v14 or later)
2. Firebase Admin SDK credentials

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install the required dependencies including `firebase-admin` and `xlsx`.

### 2. Configure Firebase Credentials

You have two options for providing Firebase credentials:

#### Option A: Environment Variable (Recommended)
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
```

#### Option B: Service Account File
Place your Firebase service account key file as `serviceAccountKey.json` in the project root directory.

To get your service account key:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the downloaded JSON file as `serviceAccountKey.json`

## Usage

### Basic Usage

```bash
node upload-files-to-firestore.js
```

### What It Does

1. Scans the `drive` folder for all `.xlsx` files
2. For each file:
   - Detects the file type (stepped discharge, constant discharge, etc.)
   - Parses the Excel data according to the template format
   - Uploads the parsed data to the appropriate Firestore collection
   - Logs success or failure

3. Displays a summary with statistics:
   - Total files found
   - Files processed
   - Successful uploads
   - Failed uploads
   - Skipped files

### Firestore Collections

The script uploads data to the following collections based on file type:

- `stepped_discharge_tests`: For stepped discharge test files
- `constant_discharge_tests`: For constant discharge test files
- `parse_jobs`: For other file types

## File Structure

```
drive/
├── CDW49/
│   ├── CONSTANT DISCHARGE TEST - CDW49.xlsx
│   ├── STEP TEST CDW49.xlsx
│   └── DATA LOGGER/
│       └── CWD49 Level Logger Data.xlsx
├── MDW02/
│   └── MDW02 - CONSTANT DISCHARGE AND RECOVERY.xlsx
└── ...
```

## Supported File Types

### Stepped Discharge Test
- Detects files with "step" or "stepped" in the title
- Parses metadata, rate data, and recovery data
- Expected format matches APT stepped discharge template

### Constant Discharge Test
- Detects files with "constant" in the title
- Parses metadata, discharge data, and observation holes
- Expected format matches APT constant discharge template

## Output Files

### upload-success.log
Contains timestamped entries for each successful upload:
```
[2026-02-18T19:22:21.000Z] SUCCESS: Uploaded drive/CDW49/STEP TEST CDW49.xlsx to stepped_discharge_tests/CDW49_1739901741000
```

### upload-errors.log
Contains timestamped error entries with stack traces:
```
[2026-02-18T19:22:21.000Z] ERROR: Failed to process drive/MDW02/invalid.xlsx
Error: Sheet not found
    at parseSteppedDischarge (upload-files-to-firestore.js:123:15)
    ...
```

## Error Handling

The script handles several types of errors:

1. **File Reading Errors**: Invalid Excel files, corrupted data
2. **Parsing Errors**: Missing required cells, unexpected format
3. **Upload Errors**: Firestore connection issues, permission problems
4. **Unknown File Types**: Files that don't match known templates

All errors are logged to `upload-errors.log` with full stack traces for debugging.

## Troubleshooting

### "Firebase credentials not found"
- Ensure you've set up the service account key correctly
- Check that `GOOGLE_APPLICATION_CREDENTIALS` is set or `serviceAccountKey.json` exists

### "Permission denied" errors
- Verify your service account has write permissions to Firestore
- Check Firebase security rules

### Files are skipped
- Check `upload-errors.log` for details
- Ensure files match the expected template format
- Verify files are valid Excel (.xlsx) format

### No files found
- Verify the `drive` folder exists in the project root
- Ensure files have `.xlsx` extension
- Check folder permissions

## Development

To extend the script to support additional file types:

1. Add a new detection pattern in `detectFileType()` function
2. Create a new parsing function (e.g., `parseNewType()`)
3. Add the file type to the processing logic in `processFile()`
4. Update the Firestore collection mapping in `uploadToFirestore()`

## Safety Features

- Skips temporary Excel files (starting with `~$`)
- Logs all operations for audit trail
- Non-destructive (doesn't modify source files)
- Graceful error handling (one file failure doesn't stop the entire process)

## Example Output

```
🚀 Starting file upload process...

📁 Scanning directory: /home/runner/work/apt/apt/drive

📄 Processing: drive/CDW49/STEP TEST CDW49.xlsx
✅ Uploaded drive/CDW49/STEP TEST CDW49.xlsx to stepped_discharge_tests/CDW49_1739901741000

📄 Processing: drive/MDW02/MDW02 - CONSTANT DISCHARGE AND RECOVERY.xlsx
✅ Uploaded drive/MDW02/MDW02 - CONSTANT DISCHARGE AND RECOVERY.xlsx to constant_discharge_tests/MDW02_1739901742000

============================================================
📊 Upload Summary:
============================================================
Total Excel files found: 25
Files processed: 25
Successful uploads: 23
Failed uploads: 2
Skipped files: 0
============================================================

⚠️  Check upload-errors.log for error details
✅ Check upload-success.log for successful uploads

✅ Upload process completed
```

## Notes

- The script can be run multiple times safely (creates new documents each time)
- To prevent duplicates, consider adding logic to check for existing documents
- Large files may take longer to process
- Network issues may cause uploads to fail (retry logic can be added)

## Support

For issues or questions:
1. Check the error logs first
2. Verify your Firebase configuration
3. Ensure Excel files match the expected template format
4. Review the source code comments for implementation details
