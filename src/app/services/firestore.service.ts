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
import { Report, AquiferTest, Material, Requisition, InventoryTransaction, Site, Borehole, DischargeTest, Series, Quality, ParseJob } from '../models/pumping-data.model';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: Firestore) {
    console.log('FirestoreService initialized for pumping reports');
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
        testStartTime: test.startTime ? Timestamp.fromDate(test.startTime) : null,
        testEndTime: test.endTime ? Timestamp.fromDate(test.endTime) : null,
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
        startTime: test.startTime ? Timestamp.fromDate(test.startTime) : null,
        endTime: test.endTime ? Timestamp.fromDate(test.endTime) : null,
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
}
