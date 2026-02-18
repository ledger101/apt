#!/usr/bin/env node

/**
 * File Upload Script for APT Application
 * 
 * This script traverses the 'drive' folder, parses Excel files,
 * and uploads them to Firestore with error logging.
 * 
 * Usage: 
 *   node upload-files-to-firestore.js              # Normal mode (requires Firebase credentials)
 *   node upload-files-to-firestore.js --dry-run    # Dry run mode (no Firebase required)
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const admin = require('firebase-admin');

// Check for dry-run mode
const DRY_RUN = process.argv.includes('--dry-run');

// Initialize Firebase Admin (skip in dry-run mode)
if (!DRY_RUN) {
  try {
    // Try to initialize with environment variable or default credentials
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'epikemplatinum'
      });
    } else if (fs.existsSync('./serviceAccountKey.json')) {
      const serviceAccount = require('./serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'epikemplatinum'
      });
    } else {
      console.log('⚠️  Warning: No Firebase credentials found. Running in dry-run mode...');
      console.log('    Use --dry-run flag to suppress this warning\n');
      process.argv.push('--dry-run');
      // Re-check DRY_RUN flag
      if (!DRY_RUN) {
        // Force dry run mode
        throw new Error('No credentials - switching to dry-run mode');
      }
    }
  } catch (error) {
    if (!DRY_RUN) {
      console.error('Failed to initialize Firebase:', error.message);
      console.log('Continuing in dry-run mode...\n');
      process.argv.push('--dry-run');
    }
  }
}

const db = DRY_RUN ? null : admin.firestore();

// Constants
const DRIVE_FOLDER = path.join(__dirname, 'drive');
const LOG_FILE = path.join(__dirname, 'upload-errors.log');
const SUCCESS_LOG = path.join(__dirname, 'upload-success.log');

// Statistics
const stats = {
  totalFiles: 0,
  processedFiles: 0,
  successfulUploads: 0,
  failedUploads: 0,
  skippedFiles: 0
};

/**
 * Log error to file
 */
function logError(message, error = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ERROR: ${message}${error ? '\n' + error.stack : ''}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.error('❌', message);
}

/**
 * Log success to file
 */
function logSuccess(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] SUCCESS: ${message}\n`;
  fs.appendFileSync(SUCCESS_LOG, logMessage);
  console.log('✅', message);
}

/**
 * Get cell value from worksheet
 */
function getCellValue(sheet, cellRef) {
  const cell = sheet[cellRef];
  if (!cell) return null;
  
  // Handle different cell types
  if (cell.t === 'n') return cell.v; // number
  if (cell.t === 's') return cell.v; // string
  if (cell.t === 'b') return cell.v; // boolean
  if (cell.t === 'd') return cell.v; // date
  
  return cell.v;
}

/**
 * Detect file type based on content and filename
 */
function detectFileType(workbook, filename) {
  const sheetNames = workbook.SheetNames;
  const firstSheet = workbook.Sheets[sheetNames[0]];
  
  // First check the filename for obvious patterns
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('step') && 
      (lowerFilename.includes('discharge') || lowerFilename.includes('test'))) {
    return 'stepped_discharge';
  }
  
  if (lowerFilename.includes('constant') && 
      (lowerFilename.includes('discharge') || lowerFilename.includes('test'))) {
    return 'constant_discharge';
  }
  
  // Check sheet content
  const cellA1 = getCellValue(firstSheet, 'A1') || '';
  const cellB3 = getCellValue(firstSheet, 'B3') || '';
  const cellC3 = getCellValue(firstSheet, 'C3') || '';
  const cellA3 = getCellValue(firstSheet, 'A3') || '';
  
  // Convert to strings and check
  const a1Str = cellA1.toString().toLowerCase();
  const b3Str = cellB3.toString().toLowerCase();
  const c3Str = cellC3.toString().toLowerCase();
  const a3Str = cellA3.toString().toLowerCase();
  
  // Check for discharge test patterns
  if (a1Str.includes('step') || a1Str.includes('stepped')) {
    return 'stepped_discharge';
  }
  
  if (a1Str.includes('constant')) {
    return 'constant_discharge';
  }
  
  if (b3Str.includes('borehole') || c3Str.includes('borehole') || a3Str.includes('borehole')) {
    // Likely a constant discharge test
    return 'constant_discharge';
  }
  
  // Check for daily report patterns
  if (sheetNames.some(name => name.toLowerCase().includes('daily'))) {
    return 'progress_report';
  }
  
  return 'unknown';
}

/**
 * Parse stepped discharge test
 */
function parseSteppedDischarge(workbook, filePath) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  const data = {
    type: 'stepped_discharge',
    fileName: path.basename(filePath),
    filePath: filePath,
    uploadedAt: admin.firestore.Timestamp.now(),
    metadata: {
      projectNo: getCellValue(sheet, 'C5'),
      boreholeNo: getCellValue(sheet, 'C6'),
      altBhNo: getCellValue(sheet, 'C7'),
      boreholeDepthm: getCellValue(sheet, 'C9'),
      staticWLmbdl: getCellValue(sheet, 'C10'),
      pumpDepthm: getCellValue(sheet, 'C11'),
      mapRef: getCellValue(sheet, 'H5'),
      latitude: getCellValue(sheet, 'H6'),
      longitude: getCellValue(sheet, 'H7'),
      elevationm: getCellValue(sheet, 'H8'),
      datumAboveCasingm: getCellValue(sheet, 'H9'),
      casingHeightmagl: getCellValue(sheet, 'H10'),
      pumpInletDiammm: getCellValue(sheet, 'H11'),
      province: getCellValue(sheet, 'M5'),
      district: getCellValue(sheet, 'M6'),
      siteName: getCellValue(sheet, 'M7'),
      existingPump: getCellValue(sheet, 'M9'),
      contractor: getCellValue(sheet, 'M10'),
      pumpType: getCellValue(sheet, 'M11')
    },
    rates: []
  };
  
  // Parse rate data (simplified - you may need to expand this)
  const rate1 = {
    rateIndex: 1,
    date: getCellValue(sheet, 'C14'),
    time: getCellValue(sheet, 'F14'),
    dataPoints: []
  };
  
  // Read data rows (simplified example)
  for (let row = 17; row <= 40; row++) {
    const time = getCellValue(sheet, `A${row}`);
    const wl = getCellValue(sheet, `B${row}`);
    const ddn = getCellValue(sheet, `C${row}`);
    const q = getCellValue(sheet, `D${row}`);
    
    if (time !== null || wl !== null) {
      rate1.dataPoints.push({ time, wl, ddn, q });
    }
  }
  
  data.rates.push(rate1);
  
  return data;
}

/**
 * Parse constant discharge test
 */
function parseConstantDischarge(workbook, filePath) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  const data = {
    type: 'constant_discharge',
    fileName: path.basename(filePath),
    filePath: filePath,
    uploadedAt: admin.firestore.Timestamp.now(),
    metadata: {
      boreholeNo: getCellValue(sheet, 'C3'),
      siteName: getCellValue(sheet, 'P4'),
      client: getCellValue(sheet, 'P5'),
      contractor: getCellValue(sheet, 'P3'),
      altBhNo: getCellValue(sheet, 'G5'),
      latitude: getCellValue(sheet, 'G7'),
      longitude: getCellValue(sheet, 'G8'),
      boreholeDepthm: getCellValue(sheet, 'C9'),
      datumAboveCasingm: getCellValue(sheet, 'G9'),
      existingPump: getCellValue(sheet, 'C10'),
      staticWLm: getCellValue(sheet, 'G10'),
      casingHeightm: getCellValue(sheet, 'C11'),
      pumpDepthm: getCellValue(sheet, 'G11'),
      pumpInletDiammm: getCellValue(sheet, 'C12'),
      pumpType: getCellValue(sheet, 'G12'),
      testDate: getCellValue(sheet, 'B11'),
      startTime: getCellValue(sheet, 'E11')
    },
    discharge: {
      dataPoints: []
    }
  };
  
  // Parse discharge data
  for (let row = 16; row <= 150; row++) {
    const time = getCellValue(sheet, `A${row}`);
    const wl = getCellValue(sheet, `B${row}`);
    const ddn = getCellValue(sheet, `C${row}`);
    const q = getCellValue(sheet, `D${row}`);
    
    if (time !== null || wl !== null) {
      data.discharge.dataPoints.push({ time, wl, ddn, q });
    }
  }
  
  return data;
}

/**
 * Upload data to Firestore
 */
async function uploadToFirestore(data) {
  const collection = data.type === 'stepped_discharge' 
    ? 'stepped_discharge_tests'
    : data.type === 'constant_discharge'
    ? 'constant_discharge_tests'
    : 'parse_jobs';
  
  // Create a document ID based on the file name and upload time
  const docId = `${data.metadata?.boreholeNo || 'unknown'}_${Date.now()}`;
  
  // In dry-run mode, just log what would be uploaded
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would upload to ${collection}/${docId}`);
    return { collection, docId };
  }
  
  await db.collection(collection).doc(docId).set(data);
  
  return { collection, docId };
}

/**
 * Process a single Excel file
 */
async function processFile(filePath) {
  try {
    console.log(`📄 Processing: ${filePath}`);
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Detect file type
    const fileType = detectFileType(workbook, filePath);
    
    if (fileType === 'unknown') {
      stats.skippedFiles++;
      logError(`Skipped unknown file type: ${filePath}`);
      return;
    }
    
    // Parse based on type
    let data;
    if (fileType === 'stepped_discharge') {
      data = parseSteppedDischarge(workbook, filePath);
    } else if (fileType === 'constant_discharge') {
      data = parseConstantDischarge(workbook, filePath);
    } else {
      stats.skippedFiles++;
      logError(`Unsupported file type: ${fileType} for ${filePath}`);
      return;
    }
    
    // Upload to Firestore
    const result = await uploadToFirestore(data);
    
    stats.successfulUploads++;
    logSuccess(`Uploaded ${filePath} to ${result.collection}/${result.docId}`);
    
  } catch (error) {
    stats.failedUploads++;
    logError(`Failed to process ${filePath}`, error);
  } finally {
    stats.processedFiles++;
  }
}

/**
 * Recursively traverse directory and process files
 */
async function traverseDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      await traverseDirectory(fullPath);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.xlsx')) {
      // Skip temporary Excel files (those starting with ~$)
      if (entry.name.startsWith('~$')) {
        continue;
      }
      
      stats.totalFiles++;
      await processFile(fullPath);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting file upload process...');
  if (DRY_RUN) {
    console.log('📋 Running in DRY-RUN mode (no data will be uploaded to Firestore)');
  }
  console.log(`📁 Scanning directory: ${DRIVE_FOLDER}\n`);
  
  // Clear previous log files
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
  }
  if (fs.existsSync(SUCCESS_LOG)) {
    fs.unlinkSync(SUCCESS_LOG);
  }
  
  // Check if drive folder exists
  if (!fs.existsSync(DRIVE_FOLDER)) {
    console.error(`❌ Drive folder not found: ${DRIVE_FOLDER}`);
    process.exit(1);
  }
  
  try {
    await traverseDirectory(DRIVE_FOLDER);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Summary:');
    console.log('='.repeat(60));
    console.log(`Total Excel files found: ${stats.totalFiles}`);
    console.log(`Files processed: ${stats.processedFiles}`);
    console.log(`Successful uploads: ${stats.successfulUploads}`);
    console.log(`Failed uploads: ${stats.failedUploads}`);
    console.log(`Skipped files: ${stats.skippedFiles}`);
    console.log('='.repeat(60));
    
    if (stats.failedUploads > 0) {
      console.log(`\n⚠️  Check ${LOG_FILE} for error details`);
    }
    
    if (stats.successfulUploads > 0) {
      console.log(`\n✅ Check ${SUCCESS_LOG} for successful uploads`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Upload process completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Upload process failed:', error);
    process.exit(1);
  });
}

module.exports = { processFile, traverseDirectory, main };
