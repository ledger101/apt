import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  collectionGroup
} from '@angular/fire/firestore';
import { Report, AquiferTest, Material, Requisition, InventoryTransaction, Site, Borehole, DischargeTest, Series, Quality, ParseJob, Invoice, InvoiceConfig, Income, Expense, Employee, PayPeriod, SalaryStructure, Timesheet, Deduction, Payslip, EmployeeDeduction, Project, Supplier, PurchaseOrder, GoodsReceivedNote, Disbursement } from '../models/pumping-data.model';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: Firestore) {
    console.log('FirestoreService initialized for pumping reports');
  }
  
  /**
   * Helper function to check if a Date object is valid
   */
  private isValidDate(date: any): date is Date {
    return date instanceof Date && !isNaN(date.getTime());
  }
  
  /**
   * Helper function to safely convert a Date to a Timestamp
   * Returns null if the date is invalid
   */
  private safeTimestampFromDate(date: Date | undefined | null): Timestamp | null {
    if (!date) {
      return null;
    }
    
    if (!this.isValidDate(date)) {
      console.warn('Invalid date encountered, skipping conversion to Timestamp:', date);
      return null;
    }
    
    return Timestamp.fromDate(date);
  }

  // ==================== PUMPING REPORTS ====================

  /**
   * Save a pumping report to Firestore
   */
  async saveReport(report: Report): Promise<void> {
    try {
      const reportsCollection = collection(this.firestore, 'reports');
      const reportData = {
        ...report,
        reportDate: Timestamp.fromDate(report.reportDate),
        createdAt: Timestamp.fromDate(report.createdAt),
        updatedAt: Timestamp.fromDate(report.updatedAt)
      };

      await addDoc(reportsCollection, reportData);
      console.log('Report saved successfully:', report.reportId);
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  }

  /**
   * Get all pumping reports from Firestore
   */
  async getReports(): Promise<Report[]> {
    try {
      const reportsCollection = collection(this.firestore, 'reports');
      const q = query(reportsCollection, orderBy('reportDate', 'desc'));
      const querySnapshot = await getDocs(q);

      const reports: Report[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          ...data,
          id: doc.id,
          reportDate: data['reportDate']?.toDate ? data['reportDate'].toDate() : (data['reportDate'] || new Date()),
          createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : (data['createdAt'] || new Date()),
          updatedAt: data['updatedAt']?.toDate ? data['updatedAt'].toDate() : (data['updatedAt'] || new Date())
        } as any);
      });

      console.log(`Retrieved ${reports.length} reports`);
      return reports;
    } catch (error) {
      console.error('Error getting reports:', error);
      throw error;
    }
  }

  /**
   * Get a specific report by ID
   */
  async getReport(reportId: string): Promise<Report | null> {
    try {
      const reportDoc = doc(this.firestore, 'reports', reportId);
      const docSnap = await getDoc(reportDoc);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          reportDate: data['reportDate']?.toDate() || new Date(),
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date(),
          ...data
        } as any;
      } else {
        console.log('No such report!');
        return null;
      }
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  }

  /**
   * Save an aquifer test to Firestore
   */
  async saveAquiferTest(test: AquiferTest): Promise<void> {
    try {
      const testsCollection = collection(this.firestore, 'aquifer-tests');
      const testData = {
        ...test,
        testDate: Timestamp.fromDate(test.testDate),
        createdAt: Timestamp.fromDate(test.createdAt),
        updatedAt: Timestamp.fromDate(test.updatedAt)
      };

      await addDoc(testsCollection, testData);
      console.log('Aquifer test saved successfully:', test.testId);
    } catch (error) {
      console.error('Error saving aquifer test:', error);
      throw error;
    }
  }

  // ==================== DISCHARGE REPORTS (Site-Based Structure) ====================

  /**
   * Save a site to Firestore
   */
  async saveSite(site: Site): Promise<void> {
    try {
      const sitesCollection = collection(this.firestore, 'sites');
      const siteData = this.cleanForFirestore({
        ...site,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt
      });
      
      // Use siteId as document ID for easier querying
      const siteDocRef = doc(this.firestore, 'sites', site.siteId);
      const siteDoc = await getDoc(siteDocRef);
      
      if (siteDoc.exists()) {
        // Update existing site
        await updateDoc(siteDocRef, { ...siteData, updatedAt: Timestamp.now() });
        console.log('Site updated successfully:', site.siteId);
      } else {
        // Create new site with specific ID
        await setDoc(siteDocRef, siteData);
        console.log('Site created successfully:', site.siteId);
      }
    } catch (error) {
      console.error('Error saving site:', error);
      throw error;
    }
  }

  /**
   * Save a borehole under a site (nested structure)
   */
  async saveBorehole(siteId: string, borehole: Borehole): Promise<void> {
    try {
      const boreholeDocRef = doc(this.firestore, `sites/${siteId}/boreholes`, borehole.boreholeId);
      const boreholeData = this.cleanForFirestore({
        ...borehole,
        createdAt: borehole.createdAt,
        updatedAt: borehole.updatedAt
      });
      
      const docSnap = await getDoc(boreholeDocRef);
      if (docSnap.exists()) {
        await updateDoc(boreholeDocRef, { ...boreholeData, updatedAt: Timestamp.now() });
      } else {
        await setDoc(boreholeDocRef, boreholeData);
      }
      console.log('Borehole saved successfully under site:', siteId, borehole.boreholeId);
    } catch (error) {
      console.error('Error saving borehole:', error);
      throw error;
    }
  }

  // ==================== NEW FLATTENED STRUCTURE METHODS ====================

  /**
   * Save consolidated Site/Borehole/Test Metadata to a single document
   * Path: sites/{siteId}_{boreholeNo}
   */
  async saveBoreholeData(site: Site, borehole: Borehole, test: DischargeTest): Promise<void> {
    try {
      // Create composite ID: siteId_boreholeNo
      const docId = `${site.siteId}_${borehole.boreholeNo}`;
      const docRef = doc(this.firestore, 'sites', docId);
      
      const mergedData = this.cleanForFirestore({
        // Site Data
        siteId: site.siteId,
        siteName: site.siteName,
        client: site.client,
        contractor: site.contractor,
        province: site.province,
        district: site.district,
        coordinates: site.coordinates,
        
        // Borehole Data
        boreholeNo: borehole.boreholeNo,
        boreholeId: borehole.boreholeId,
        altBhNo: borehole.altBhNo,
        elevation_m: borehole.elevation_m,
        boreholeDepth_m: borehole.boreholeDepth_m,
        datumAboveCasing_m: borehole.datumAboveCasing_m,
        existingPump: borehole.existingPump,
        staticWL_mbdl: borehole.staticWL_mbdl,
        casingHeight_magl: borehole.casingHeight_magl,
        pumpDepth_m: borehole.pumpDepth_m,
        pumpInletDiam_mm: borehole.pumpInletDiam_mm,
        pumpType: borehole.pumpType,
        swl_mbch: borehole.swl_mbch,

        // Test Metadata (Summary)
        testId: test.testId,
        testType: test.testType,
        testSummary: test.summary,
        testStartTime: this.safeTimestampFromDate(test.startTime),
        testEndTime: this.safeTimestampFromDate(test.endTime),
        sourceFilePath: test.sourceFilePath,

        updatedAt: Timestamp.now(),
        createdAt: site.createdAt || Timestamp.now()
      });

      // Using setDoc with merge:true to update if exists, or create
      await setDoc(docRef, mergedData, { merge: true });
      console.log('Borehole Data saved successfully:', docId);
    } catch (error) {
      console.error('Error saving borehole data:', error);
      throw error;
    }
  }

  /**
   * Save series data with specific mapped IDs
   * Path: sites/{siteId}_{boreholeNo}/tests/{mappedId}
   */
  async saveSeriesData(siteId: string, boreholeNo: string, seriesList: Series[]): Promise<void> {
     try {
      const parentId = `${siteId}_${boreholeNo}`;
      
      for (const s of seriesList) {
        let docId = '';
        
        // Mapping logic per user requirement
        if (s.seriesType === 'discharge_rate') { 
            // Step Discharge
            docId = `discharge${s.rateIndex}`;
        } else if (s.seriesType === 'recovery') {
          // For step recovery or general recovery
            docId = 'recovery';
        } else if (s.seriesType === 'discharge') { 
            // Constant Discharge
            docId = 'dischargeborehole';
        } else if (s.seriesType === 'obs_hole_1' || s.seriesType === 'obshole1') {
            docId = 'observationHole1';
        } else if (s.seriesType === 'obs_hole_2' || s.seriesType === 'obshole2') {
            docId = 'observationHole2';
        } else if (s.seriesType === 'obs_hole_3' || s.seriesType === 'obshole3') {
            docId = 'observationHole3';
        } else {
             docId = `series_${s.seriesId}`;
        }

        const docRef = doc(this.firestore, `sites/${parentId}/tests`, docId);
        const seriesData = this.cleanForFirestore({
          points: s.points,
          seriesType: s.seriesType,
          rateIndex: s.rateIndex,
          pageIndex: s.pageIndex,
          createdAt: Timestamp.now()
        });
        
        await setDoc(docRef, seriesData);
      }
      console.log('Series saved successfully for:', parentId);
    } catch (error) {
      console.error('Error saving series data:', error);
      throw error;
    }
  }

  /**
   * Save quality data
   * Path: sites/{siteId}_{boreholeNo}/tests/{qualityId}
   */
  async saveQualityData(siteId: string, boreholeNo: string, qualityList: Quality[]): Promise<void> {
    try {
        const parentId = `${siteId}_${boreholeNo}`;
        for (const q of qualityList) {
            const docId = `quality_rate${q.rateIndex}`;
            const docRef = doc(this.firestore, `sites/${parentId}/tests`, docId);
            const data = this.cleanForFirestore({
                ...q,
                createdAt: Timestamp.now()
            });
            await setDoc(docRef, data);
        }
        console.log('Quality saved successfully for:', parentId);
    } catch (error) {
        console.error('Error saving quality data:', error);
        throw error;
    }
  }

  /**
   * Helper to remove undefined values which Firestore doesn't support
   */
  private cleanForFirestore(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (obj instanceof Date || obj instanceof Timestamp) return obj;
    if (Array.isArray(obj)) return obj.map(v => this.cleanForFirestore(v));
    if (typeof obj !== 'object') return obj;

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = this.cleanForFirestore(value);
      }
    }
    return cleaned;
  }

  /**
   * Save a discharge test under a borehole (nested structure)
   */
  async saveDischargeTest(siteId: string, boreholeId: string, test: DischargeTest): Promise<void> {
    try {
      const testDocRef = doc(this.firestore, `sites/${siteId}/boreholes/${boreholeId}/tests`, test.testId);
      const testData = this.cleanForFirestore({
        ...test,
        startTime: this.safeTimestampFromDate(test.startTime),
        endTime: this.safeTimestampFromDate(test.endTime),
        createdAt: test.createdAt,
        updatedAt: test.updatedAt
      });
      
      const docSnap = await getDoc(testDocRef);
      if (docSnap.exists()) {
        await updateDoc(testDocRef, { ...testData, updatedAt: Timestamp.now() });
      } else {
        await setDoc(testDocRef, testData);
      }
      console.log('Discharge test saved successfully for borehole:', boreholeId);
    } catch (error) {
      console.error('Error saving discharge test:', error);
      throw error;
    }
  }

  /**
   * Get all discharge tests from Firestore (consolidated from sites collection)
   */
  async getDischargeTests(): Promise<DischargeTest[]> {
    try {
      const sitesCollection = collection(this.firestore, 'sites');
      const q = query(sitesCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      console.log(`Found ${querySnapshot.size} documents in sites collection`);

      const tests: DischargeTest[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Relaxed check: Accept if it has testId OR boreholeId
        if (data['testId'] || data['boreholeId']) {
             tests.push({
                  testId: data['testId'] || docSnap.id, // Fallback to doc ID if testId missing
                  testType: data['testType'] || 'discharge_test',
                  summary: data['testSummary'] || {},
                  startTime: data['testStartTime']?.toDate ? data['testStartTime'].toDate() : null,
                  endTime: data['testEndTime']?.toDate ? data['testEndTime'].toDate() : null,
                  sourceFilePath: data['sourceFilePath'],
                  status: 'parsed',
                  createdBy: 'unknown',
                  createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date(),
                  updatedAt: data['updatedAt']?.toDate ? data['updatedAt'].toDate() : new Date(),
                  boreholeId: data['boreholeId'] || 'Unknown',
                  boreholeRef: docSnap.id,
                  // View properties
                  contractor: data['contractor'],
                  province: data['province'],
                  // Attempt to get discharge rate from summary or root if saved, otherwise it might be missing
                  dischargeRate: data['dischargeRate'] // Ensure this is saved if needed
              } as any);
        }
      });

      console.log(`Retrieved ${tests.length} discharge tests`);
      return tests;
    } catch (error) {
      console.error('Error getting discharge tests:', error);
      throw error;
    }
  }

  /**
   * Get all tests for a specific site
   */
  async getTestsBySite(siteId: string): Promise<DischargeTest[]> {
    try {
      const tests: DischargeTest[] = [];
      
      const sitesCollection = collection(this.firestore, 'sites');
      // Note: This naive filter relies on 'siteId' field being present. 
      // Composite keys siteId_bhNo make basic where() query harder if siteId field is missing.
      // But we save siteId in saveBoreholeData, so it should be fine.
      const q = query(sitesCollection, where('siteId', '==', siteId));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data['testId'] || data['boreholeId']) {
             tests.push({
                  testId: data['testId'] || docSnap.id,
                  testType: data['testType'] || 'discharge_test',
                  summary: data['testSummary'] || {},
                  startTime: data['testStartTime']?.toDate ? data['testStartTime'].toDate() : null,
                  endTime: data['testEndTime']?.toDate ? data['testEndTime'].toDate() : null,
                  sourceFilePath: data['sourceFilePath'],
                  status: 'parsed',
                  createdBy: 'unknown',
                  createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date(),
                  updatedAt: data['updatedAt']?.toDate ? data['updatedAt'].toDate() : new Date(),
                  boreholeId: data['boreholeId'] || 'Unknown',
                  boreholeRef: docSnap.id,
                  // View properties
                  contractor: data['contractor'],
                  province: data['province'],
                  dischargeRate: data['dischargeRate']
              } as any);
        }
      });
      
      console.log(`Retrieved ${tests.length} tests for site:`, siteId);
      return tests;
    } catch (error) {
      console.error('Error getting tests by site:', error);
      throw error;
    }
  }

  /**
   * Get all boreholes for a specific site
   */
  async getBoreholesBySite(siteId: string): Promise<Borehole[]> {
    try {
      const sitesCollection = collection(this.firestore, 'sites');
      const q = query(sitesCollection, where('siteId', '==', siteId));
      const querySnapshot = await getDocs(q);
      
      const boreholes: Borehole[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        boreholes.push({
          ...data,
          boreholeId: data['boreholeId'] || docSnap.id, // Fallback
          createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : null,
          updatedAt: data['updatedAt']?.toDate ? data['updatedAt'].toDate() : null
        } as Borehole);
      });
      
      console.log(`Retrieved ${boreholes.length} boreholes for site:`, siteId);
      return boreholes;
    } catch (error) {
      console.error('Error getting boreholes by site:', error);
      throw error;
    }
  }

  /**
   * Get all series data for a specific borehole test record
   * Path: sites/{siteId}_{boreholeNo}/tests/
   */
  async getTestSeries(boreholeRef: string): Promise<Series[]> {
    try {
      // boreholeRef is the ID of the document in 'sites' collection (e.g. 'SiteA_BH01')
      const seriesCollection = collection(this.firestore, `sites/${boreholeRef}/tests`);
      const querySnapshot = await getDocs(seriesCollection);
      
      const seriesList: Series[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Check if it looks like a series (has points or is one of the known IDs)
        if (data['points'] || ['discharge1', 'discharge2', 'discharge3', 'recovery', 'dischargeborehole'].includes(doc.id) || doc.id.startsWith('observationHole')) {
             seriesList.push({
                 seriesId: doc.id,
                 seriesType: data['seriesType'] || doc.id,
                 rateIndex: data['rateIndex'],
                 pageIndex: data['pageIndex'],
                 points: data['points'] || [],
                 createdAt: data['createdAt']
             } as Series);
        }
      });
      console.log(`Retrieved ${seriesList.length} series for ${boreholeRef}`);
      return seriesList;
    } catch (error) {
      console.error('Error getting test series:', error);
      throw error;
    }
  }

  /**
   * Save series data for a test (nested under test)
   */
  async saveSeries(siteId: string, boreholeId: string, testId: string, series: Series[]): Promise<void> {
    try {
      for (const s of series) {
        const seriesCollection = collection(this.firestore, `sites/${siteId}/boreholes/${boreholeId}/tests/${testId}/series`);
        const seriesData = this.cleanForFirestore({
          ...s,
          createdAt: s.createdAt
        });
        await addDoc(seriesCollection, seriesData);
      }
      console.log('Series saved successfully for test:', testId);
    } catch (error) {
      console.error('Error saving series:', error);
      throw error;
    }
  }

  /**
   * Save quality data for a test (nested under test)
   */
  async saveQuality(siteId: string, boreholeId: string, testId: string, quality: Quality[]): Promise<void> {
    try {
      for (const q of quality) {
        const qualityCollection = collection(this.firestore, `sites/${siteId}/boreholes/${boreholeId}/tests/${testId}/quality`);
        const qualityData = this.cleanForFirestore({
          ...q,
          createdAt: q.createdAt
        });
        await addDoc(qualityCollection, qualityData);
      }
      console.log('Quality saved successfully for test:', testId);
    } catch (error) {
      console.error('Error saving quality:', error);
      throw error;
    }
  }

  /**
   * Save a parse job to Firestore
   */
  async saveParseJob(job: ParseJob): Promise<void> {
    try {
      const jobsCollection = collection(this.firestore, 'parseJobs');
      const jobData = {
        ...job,
        createdAt: job.createdAt
      };
      await addDoc(jobsCollection, jobData);
      console.log('Parse job saved successfully:', job.jobId);
    } catch (error) {
      console.error('Error saving parse job:', error);
      throw error;
    }
  }

  // ==================== SUPPLY CHAIN ====================

  // Material methods
  async getMaterialsByOrg(orgId: string): Promise<Material[]> {
    try {
      const materialsCollection = collection(this.firestore, 'materials');
      const q = query(materialsCollection, where('orgId', '==', orgId), orderBy('name'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        materialId: doc.id,
        ...doc.data()
      } as Material));
    } catch (error) {
      console.error('Error getting materials:', error);
      throw error;
    }
  }

  async getMaterial(materialId: string): Promise<Material | null> {
    try {
      const materialDoc = await getDoc(doc(this.firestore, 'materials', materialId));
      if (materialDoc.exists()) {
        return {
          materialId: materialDoc.id,
          ...materialDoc.data()
        } as Material;
      }
      return null;
    } catch (error) {
      console.error('Error getting material:', error);
      throw error;
    }
  }

  async createMaterial(material: Omit<Material, 'materialId'>): Promise<string> {
    try {
      const materialsCollection = collection(this.firestore, 'materials');
      const materialData = {
        ...material,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      const docRef = await addDoc(materialsCollection, materialData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  }

  async updateMaterial(materialId: string, updates: Partial<Material>): Promise<void> {
    try {
      const materialRef = doc(this.firestore, 'materials', materialId);
      await updateDoc(materialRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  }

  async deleteMaterial(materialId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, 'materials', materialId));
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }

  // Requisition methods
  async getRequisitionsByOrg(orgId: string): Promise<Requisition[]> {
    try {
      const requisitionsCollection = collection(this.firestore, 'requisitions');
      const q = query(requisitionsCollection, where('orgId', '==', orgId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        requisitionId: doc.id,
        ...doc.data()
      } as Requisition));
    } catch (error) {
      console.error('Error getting requisitions:', error);
      throw error;
    }
  }

  async getRequisition(requisitionId: string): Promise<Requisition | null> {
    try {
      const requisitionDoc = await getDoc(doc(this.firestore, 'requisitions', requisitionId));
      if (requisitionDoc.exists()) {
        return {
          requisitionId: requisitionDoc.id,
          ...requisitionDoc.data()
        } as Requisition;
      }
      return null;
    } catch (error) {
      console.error('Error getting requisition:', error);
      throw error;
    }
  }

  async createRequisition(requisition: Omit<Requisition, 'requisitionId'>): Promise<string> {
    try {
      const requisitionsCollection = collection(this.firestore, 'requisitions');
      const requisitionData = {
        ...requisition,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      const docRef = await addDoc(requisitionsCollection, requisitionData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating requisition:', error);
      throw error;
    }
  }

  async updateRequisition(requisitionId: string, updates: Partial<Requisition>): Promise<void> {
    try {
      const requisitionRef = doc(this.firestore, 'requisitions', requisitionId);
      await updateDoc(requisitionRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating requisition:', error);
      throw error;
    }
  }

  async deleteRequisition(requisitionId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, 'requisitions', requisitionId));
    } catch (error) {
      console.error('Error deleting requisition:', error);
      throw error;
    }
  }

  // Inventory Transaction methods
  async getInventoryTransactionsBySite(siteId: string): Promise<InventoryTransaction[]> {
    try {
      const transactionsCollection = collection(this.firestore, 'inventory-transactions');
      const q = query(transactionsCollection, where('siteId', '==', siteId), orderBy('transactionDate', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        transactionId: doc.id,
        ...doc.data()
      } as InventoryTransaction));
    } catch (error) {
      console.error('Error getting inventory transactions:', error);
      throw error;
    }
  }

  async createInventoryTransaction(transaction: Omit<InventoryTransaction, 'transactionId' | 'transactionDate' | 'createdAt'>): Promise<string> {
    try {
      const transactionsCollection = collection(this.firestore, 'inventory-transactions');
      const transactionData = {
        ...transaction,
        transactionDate: Timestamp.now(),
        createdAt: Timestamp.now()
      };
      const docRef = await addDoc(transactionsCollection, transactionData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating inventory transaction:', error);
      throw error;
    }
  }

  // ==================== SUPPLY CHAIN METHODS ====================

  // Project methods
  async getProjectsByOrg(orgId: string): Promise<Project[]> {
    try {
      const projectsCollection = collection(this.firestore, 'projects');
      const q = query(projectsCollection, where('orgId', '==', orgId), orderBy('projectName'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        projectId: doc.id,
        ...doc.data()
      } as Project));
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  async getProject(projectId: string): Promise<Project | null> {
    try {
      const projectDoc = await getDoc(doc(this.firestore, 'projects', projectId));
      if (projectDoc.exists()) {
        return {
          projectId: projectDoc.id,
          ...projectDoc.data()
        } as Project;
      }
      return null;
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  }

  async createProject(project: Omit<Project, 'projectId'>): Promise<string> {
    try {
      const projectsCollection = collection(this.firestore, 'projects');
      const projectData = {
        ...project,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      const docRef = await addDoc(projectsCollection, projectData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const projectRef = doc(this.firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, 'projects', projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  // Supplier methods
  async getSuppliersByOrg(orgId: string): Promise<Supplier[]> {
    try {
      const suppliersCollection = collection(this.firestore, 'suppliers');
      const q = query(suppliersCollection, where('orgId', '==', orgId), orderBy('companyName'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        supplierId: doc.id,
        ...doc.data()
      } as Supplier));
    } catch (error) {
      console.error('Error getting suppliers:', error);
      throw error;
    }
  }

  async getSupplier(supplierId: string): Promise<Supplier | null> {
    try {
      const supplierDoc = await getDoc(doc(this.firestore, 'suppliers', supplierId));
      if (supplierDoc.exists()) {
        return {
          supplierId: supplierDoc.id,
          ...supplierDoc.data()
        } as Supplier;
      }
      return null;
    } catch (error) {
      console.error('Error getting supplier:', error);
      throw error;
    }
  }

  async createSupplier(supplier: Omit<Supplier, 'supplierId'>): Promise<string> {
    try {
      const suppliersCollection = collection(this.firestore, 'suppliers');
      const supplierData = {
        ...supplier,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      const docRef = await addDoc(suppliersCollection, supplierData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  async updateSupplier(supplierId: string, updates: Partial<Supplier>): Promise<void> {
    try {
      const supplierRef = doc(this.firestore, 'suppliers', supplierId);
      await updateDoc(supplierRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  async deleteSupplier(supplierId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, 'suppliers', supplierId));
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  // Purchase Order methods
  async getPurchaseOrdersByOrg(orgId: string): Promise<PurchaseOrder[]> {
    try {
      const posCollection = collection(this.firestore, 'purchase-orders');
      const q = query(posCollection, where('orgId', '==', orgId), orderBy('orderDate', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        poId: doc.id,
        ...doc.data()
      } as PurchaseOrder));
    } catch (error) {
      console.error('Error getting purchase orders:', error);
      throw error;
    }
  }

  async getPurchaseOrder(poId: string): Promise<PurchaseOrder | null> {
    try {
      const poDoc = await getDoc(doc(this.firestore, 'purchase-orders', poId));
      if (poDoc.exists()) {
        return {
          poId: poDoc.id,
          ...poDoc.data()
        } as PurchaseOrder;
      }
      return null;
    } catch (error) {
      console.error('Error getting purchase order:', error);
      throw error;
    }
  }

  async createPurchaseOrder(po: Omit<PurchaseOrder, 'poId'>): Promise<string> {
    try {
      const posCollection = collection(this.firestore, 'purchase-orders');
      const poData = {
        ...po,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      const docRef = await addDoc(posCollection, poData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  }

  async updatePurchaseOrder(poId: string, updates: Partial<PurchaseOrder>): Promise<void> {
    try {
      const poRef = doc(this.firestore, 'purchase-orders', poId);
      await updateDoc(poRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  }

  async deletePurchaseOrder(poId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, 'purchase-orders', poId));
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  }

  // GRN (Goods Received Note) methods
  async getGRNsByOrg(orgId: string): Promise<GoodsReceivedNote[]> {
    try {
      const grnsCollection = collection(this.firestore, 'goods-received-notes');
      const q = query(grnsCollection, where('orgId', '==', orgId), orderBy('dateReceived', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        grnId: doc.id,
        ...doc.data()
      } as GoodsReceivedNote));
    } catch (error) {
      console.error('Error getting GRNs:', error);
      throw error;
    }
  }

  async getGRN(grnId: string): Promise<GoodsReceivedNote | null> {
    try {
      const grnDoc = await getDoc(doc(this.firestore, 'goods-received-notes', grnId));
      if (grnDoc.exists()) {
        return {
          grnId: grnDoc.id,
          ...grnDoc.data()
        } as GoodsReceivedNote;
      }
      return null;
    } catch (error) {
      console.error('Error getting GRN:', error);
      throw error;
    }
  }

  async createGRN(grn: Omit<GoodsReceivedNote, 'grnId'>): Promise<string> {
    try {
      const grnsCollection = collection(this.firestore, 'goods-received-notes');
      const grnData = {
        ...grn,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      const docRef = await addDoc(grnsCollection, grnData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating GRN:', error);
      throw error;
    }
  }

  async updateGRN(grnId: string, updates: Partial<GoodsReceivedNote>): Promise<void> {
    try {
      const grnRef = doc(this.firestore, 'goods-received-notes', grnId);
      await updateDoc(grnRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating GRN:', error);
      throw error;
    }
  }

  async deleteGRN(grnId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, 'goods-received-notes', grnId));
    } catch (error) {
      console.error('Error deleting GRN:', error);
      throw error;
    }
  }

  // Disbursement methods
  async getDisbursementsByOrg(orgId: string): Promise<Disbursement[]> {
    try {
      const disbursementsCollection = collection(this.firestore, 'disbursements');
      const q = query(disbursementsCollection, where('orgId', '==', orgId), orderBy('dateIssued', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        disbursementId: doc.id,
        ...doc.data()
      } as Disbursement));
    } catch (error) {
      console.error('Error getting disbursements:', error);
      throw error;
    }
  }

  async getDisbursement(disbursementId: string): Promise<Disbursement | null> {
    try {
      const disbursementDoc = await getDoc(doc(this.firestore, 'disbursements', disbursementId));
      if (disbursementDoc.exists()) {
        return {
          disbursementId: disbursementDoc.id,
          ...disbursementDoc.data()
        } as Disbursement;
      }
      return null;
    } catch (error) {
      console.error('Error getting disbursement:', error);
      throw error;
    }
  }

  async createDisbursement(disbursement: Omit<Disbursement, 'disbursementId'>): Promise<string> {
    try {
      const disbursementsCollection = collection(this.firestore, 'disbursements');
      const disbursementData = {
        ...disbursement,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      const docRef = await addDoc(disbursementsCollection, disbursementData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating disbursement:', error);
      throw error;
    }
  }

  async updateDisbursement(disbursementId: string, updates: Partial<Disbursement>): Promise<void> {
    try {
      const disbursementRef = doc(this.firestore, 'disbursements', disbursementId);
      await updateDoc(disbursementRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating disbursement:', error);
      throw error;
    }
  }

  async deleteDisbursement(disbursementId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, 'disbursements', disbursementId));
    } catch (error) {
      console.error('Error deleting disbursement:', error);
      throw error;
    }
  }

  // ==================== INVOICE METHODS ====================

  /**
   * Save an invoice to Firestore
   */
  async saveInvoice(invoice: Invoice): Promise<string> {
    try {
      const invoicesCollection = collection(this.firestore, 'invoices');
      const invoiceData = {
        ...invoice,
        reportDate: Timestamp.fromDate(invoice.reportDate),
        invoiceDate: Timestamp.fromDate(invoice.invoiceDate),
        createdAt: Timestamp.fromDate(invoice.createdAt),
        updatedAt: Timestamp.fromDate(invoice.updatedAt)
      };

      const docRef = await addDoc(invoicesCollection, invoiceData);
      console.log('Invoice saved successfully:', invoice.invoiceNumber);
      return docRef.id;
    } catch (error) {
      console.error('Error saving invoice:', error);
      throw error;
    }
  }

  /**
   * Get all invoices from Firestore
   */
  async getInvoices(orgId?: string): Promise<Invoice[]> {
    try {
      const invoicesCollection = collection(this.firestore, 'invoices');
      let q;

      if (orgId) {
        q = query(invoicesCollection, where('orgId', '==', orgId), orderBy('invoiceDate', 'desc'));
      } else {
        q = query(invoicesCollection, orderBy('invoiceDate', 'desc'));
      }

      const querySnapshot = await getDocs(q);

      const invoices: Invoice[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        invoices.push({
          ...data,
          invoiceId: doc.id,
          reportDate: data['reportDate']?.toDate ? data['reportDate'].toDate() : (data['reportDate'] || new Date()),
          invoiceDate: data['invoiceDate']?.toDate ? data['invoiceDate'].toDate() : (data['invoiceDate'] || new Date()),
          createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : (data['createdAt'] || new Date()),
          updatedAt: data['updatedAt']?.toDate ? data['updatedAt'].toDate() : (data['updatedAt'] || new Date())
        } as any);
      });

      console.log(`Retrieved ${invoices.length} invoices`);
      return invoices;
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
    }
  }

  /**
   * Get a specific invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const invoiceDoc = doc(this.firestore, 'invoices', invoiceId);
      const docSnap = await getDoc(invoiceDoc);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          invoiceId: docSnap.id,
          reportDate: data['reportDate']?.toDate() || new Date(),
          invoiceDate: data['invoiceDate']?.toDate() || new Date(),
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date(),
          ...data
        } as any;
      } else {
        console.log('No such invoice!');
        return null;
      }
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    }
  }

  /**
   * Update an invoice
   */
  async updateInvoice(invoiceId: string, data: Partial<Invoice>): Promise<void> {
    try {
      const invoiceDoc = doc(this.firestore, 'invoices', invoiceId);
      const updateData: any = { ...data };

      // Convert Date fields to Timestamp if present
      if (updateData.reportDate) {
        updateData.reportDate = Timestamp.fromDate(updateData.reportDate as Date);
      }
      if (updateData.invoiceDate) {
        updateData.invoiceDate = Timestamp.fromDate(updateData.invoiceDate as Date);
      }
      if (updateData.createdAt) {
        updateData.createdAt = Timestamp.fromDate(updateData.createdAt as Date);
      }
      if (updateData.updatedAt) {
        updateData.updatedAt = Timestamp.fromDate(updateData.updatedAt as Date);
      }

      await updateDoc(invoiceDoc, updateData);
      console.log('Invoice updated successfully:', invoiceId);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Save invoice configuration
   */
  async saveInvoiceConfig(config: InvoiceConfig): Promise<void> {
    try {
      const configDocRef = doc(this.firestore, 'invoice-configs', config.orgId);
      const configData = {
        ...config,
        updatedAt: Timestamp.fromDate(config.updatedAt)
      };

      await setDoc(configDocRef, configData, { merge: true });
      console.log('Invoice config saved successfully for org:', config.orgId);
    } catch (error) {
      console.error('Error saving invoice config:', error);
      throw error;
    }
  }

  /**
   * Get invoice configuration for an organization
   */
  async getInvoiceConfig(orgId: string): Promise<InvoiceConfig | null> {
    try {
      const configDoc = doc(this.firestore, 'invoice-configs', orgId);
      const docSnap = await getDoc(configDoc);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          updatedAt: data['updatedAt']?.toDate() || new Date()
        } as InvoiceConfig;
      } else {
        console.log('No invoice config found for org:', orgId);
        return null;
      }
    } catch (error) {
      console.error('Error getting invoice config:', error);
      throw error;
    }
  }

  // ==================== INCOME & EXPENSE ====================

  /**
   * Get all incomes for an organization
   */
  async getIncomes(orgId?: string): Promise<Income[]> {
    try {
      const incomesCollection = collection(this.firestore, 'incomes');
      const q = orgId 
        ? query(incomesCollection, where('orgId', '==', orgId), orderBy('incomeDate', 'desc'))
        : query(incomesCollection, orderBy('incomeDate', 'desc'));

      const querySnapshot = await getDocs(q);
      const incomes: Income[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        incomes.push({
          incomeId: doc.id,
          ...data,
          incomeDate: data['incomeDate']?.toDate() || new Date(),
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date()
        } as Income);
      });

      console.log(`Retrieved ${incomes.length} incomes`);
      return incomes;
    } catch (error) {
      console.error('Error getting incomes:', error);
      throw error;
    }
  }

  /**
   * Get a specific income by ID
   */
  async getIncome(incomeId: string): Promise<Income | null> {
    try {
      const incomeDoc = doc(this.firestore, 'incomes', incomeId);
      const docSnap = await getDoc(incomeDoc);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          incomeId: docSnap.id,
          ...data,
          incomeDate: data['incomeDate']?.toDate() || new Date(),
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date()
        } as Income;
      } else {
        console.log('No such income!');
        return null;
      }
    } catch (error) {
      console.error('Error getting income:', error);
      throw error;
    }
  }

  /**
   * Create a new income
   */
  async createIncome(income: Omit<Income, 'incomeId'>): Promise<string> {
    try {
      const incomesCollection = collection(this.firestore, 'incomes');
      const incomeData = {
        ...income,
        incomeDate: income.incomeDate instanceof Date ? Timestamp.fromDate(income.incomeDate) : income.incomeDate,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const docRef = await addDoc(incomesCollection, incomeData);
      console.log('Income created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating income:', error);
      throw error;
    }
  }

  /**
   * Update an income
   */
  async updateIncome(incomeId: string, updates: Partial<Income>): Promise<void> {
    try {
      const incomeDoc = doc(this.firestore, 'incomes', incomeId);
      const updateData: any = { ...updates };

      if (updateData.incomeDate && updateData.incomeDate instanceof Date) {
        updateData.incomeDate = Timestamp.fromDate(updateData.incomeDate);
      }
      updateData.updatedAt = Timestamp.fromDate(new Date());

      await updateDoc(incomeDoc, updateData);
      console.log('Income updated successfully:', incomeId);
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    }
  }

  /**
   * Delete an income
   */
  async deleteIncome(incomeId: string): Promise<void> {
    try {
      const incomeDoc = doc(this.firestore, 'incomes', incomeId);
      await deleteDoc(incomeDoc);
      console.log('Income deleted successfully:', incomeId);
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  }

  /**
   * Get all expenses for an organization
   */
  async getExpenses(orgId?: string): Promise<Expense[]> {
    try {
      const expensesCollection = collection(this.firestore, 'expenses');
      const q = orgId 
        ? query(expensesCollection, where('orgId', '==', orgId), orderBy('expenseDate', 'desc'))
        : query(expensesCollection, orderBy('expenseDate', 'desc'));

      const querySnapshot = await getDocs(q);
      const expenses: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expenses.push({
          expenseId: doc.id,
          ...data,
          expenseDate: data['expenseDate']?.toDate() || new Date(),
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date()
        } as Expense);
      });

      console.log(`Retrieved ${expenses.length} expenses`);
      return expenses;
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  }

  /**
   * Get a specific expense by ID
   */
  async getExpense(expenseId: string): Promise<Expense | null> {
    try {
      const expenseDoc = doc(this.firestore, 'expenses', expenseId);
      const docSnap = await getDoc(expenseDoc);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          expenseId: docSnap.id,
          ...data,
          expenseDate: data['expenseDate']?.toDate() || new Date(),
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date()
        } as Expense;
      } else {
        console.log('No such expense!');
        return null;
      }
    } catch (error) {
      console.error('Error getting expense:', error);
      throw error;
    }
  }

  /**
   * Create a new expense
   */
  async createExpense(expense: Omit<Expense, 'expenseId'>): Promise<string> {
    try {
      const expensesCollection = collection(this.firestore, 'expenses');
      const expenseData = {
        ...expense,
        expenseDate: expense.expenseDate instanceof Date ? Timestamp.fromDate(expense.expenseDate) : expense.expenseDate,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const docRef = await addDoc(expensesCollection, expenseData);
      console.log('Expense created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Update an expense
   */
  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
    try {
      const expenseDoc = doc(this.firestore, 'expenses', expenseId);
      const updateData: any = { ...updates };

      if (updateData.expenseDate && updateData.expenseDate instanceof Date) {
        updateData.expenseDate = Timestamp.fromDate(updateData.expenseDate);
      }
      updateData.updatedAt = Timestamp.fromDate(new Date());

      await updateDoc(expenseDoc, updateData);
      console.log('Expense updated successfully:', expenseId);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId: string): Promise<void> {
    try {
      const expenseDoc = doc(this.firestore, 'expenses', expenseId);
      await deleteDoc(expenseDoc);
      console.log('Expense deleted successfully:', expenseId);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // ==================== PAYROLL - EMPLOYEES ====================

  /**
   * Get all employees for an organization
   */
  async getEmployees(orgId?: string): Promise<Employee[]> {
    try {
      const employeesCollection = collection(this.firestore, 'employees');
      const q = orgId 
        ? query(employeesCollection, where('orgId', '==', orgId), orderBy('createdAt', 'desc'))
        : query(employeesCollection, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const employees: Employee[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        employees.push({
          employeeId: doc.id,
          ...data
        } as Employee);
      });

      console.log(`Retrieved ${employees.length} employees`);
      return employees;
    } catch (error) {
      console.error('Error getting employees:', error);
      throw error;
    }
  }

  /**
   * Get a specific employee by ID
   */
  async getEmployee(employeeId: string): Promise<Employee | null> {
    try {
      const employeeDoc = doc(this.firestore, 'employees', employeeId);
      const docSnap = await getDoc(employeeDoc);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          employeeId: docSnap.id,
          ...data
        } as Employee;
      } else {
        console.log('No such employee!');
        return null;
      }
    } catch (error) {
      console.error('Error getting employee:', error);
      throw error;
    }
  }

  /**
   * Create a new employee
   */
  async createEmployee(employee: Omit<Employee, 'employeeId'>): Promise<string> {
    try {
      const employeesCollection = collection(this.firestore, 'employees');
      const employeeData = {
        ...employee,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const docRef = await addDoc(employeesCollection, employeeData);
      console.log('Employee created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Update an employee
   */
  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
    try {
      const employeeDoc = doc(this.firestore, 'employees', employeeId);
      const updateData: any = { ...updates };
      updateData.updatedAt = Timestamp.fromDate(new Date());

      await updateDoc(employeeDoc, updateData);
      console.log('Employee updated successfully:', employeeId);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  /**
   * Delete an employee
   */
  async deleteEmployee(employeeId: string): Promise<void> {
    try {
      const employeeDoc = doc(this.firestore, 'employees', employeeId);
      await deleteDoc(employeeDoc);
      console.log('Employee deleted successfully:', employeeId);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // ==================== PAYROLL - PAY PERIODS ====================

  /**
   * Get all pay periods for an organization
   */
  async getPayPeriods(orgId?: string): Promise<PayPeriod[]> {
    try {
      const payPeriodsCollection = collection(this.firestore, 'pay-periods');
      const q = orgId 
        ? query(payPeriodsCollection, where('orgId', '==', orgId), orderBy('startDate', 'desc'))
        : query(payPeriodsCollection, orderBy('startDate', 'desc'));

      const querySnapshot = await getDocs(q);
      const payPeriods: PayPeriod[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payPeriods.push({
          payPeriodId: doc.id,
          ...data
        } as PayPeriod);
      });

      console.log(`Retrieved ${payPeriods.length} pay periods`);
      return payPeriods;
    } catch (error) {
      console.error('Error getting pay periods:', error);
      throw error;
    }
  }

  /**
   * Create a new pay period
   */
  async createPayPeriod(payPeriod: Omit<PayPeriod, 'payPeriodId'>): Promise<string> {
    try {
      const payPeriodsCollection = collection(this.firestore, 'pay-periods');
      const payPeriodData = {
        ...payPeriod,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const docRef = await addDoc(payPeriodsCollection, payPeriodData);
      console.log('Pay period created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating pay period:', error);
      throw error;
    }
  }

  /**
   * Update a pay period
   */
  async updatePayPeriod(payPeriodId: string, updates: Partial<PayPeriod>): Promise<void> {
    try {
      const payPeriodDoc = doc(this.firestore, 'pay-periods', payPeriodId);
      const updateData: any = { ...updates };
      updateData.updatedAt = Timestamp.fromDate(new Date());

      await updateDoc(payPeriodDoc, updateData);
      console.log('Pay period updated successfully:', payPeriodId);
    } catch (error) {
      console.error('Error updating pay period:', error);
      throw error;
    }
  }
}
