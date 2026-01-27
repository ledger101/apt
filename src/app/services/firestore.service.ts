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
  query,
  where,
  orderBy
} from '@angular/fire/firestore';
import { Report, AquiferTest, Material, Requisition, InventoryTransaction, Borehole, DischargeTest, Series, Quality, ParseJob } from '../models/pumping-data.model';

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

  // ==================== DISCHARGE REPORTS ====================

  /**
   * Save a borehole to Firestore
   */
  async saveBorehole(borehole: Borehole): Promise<void> {
    try {
      const boreholesCollection = collection(this.firestore, 'boreholes');
      const boreholeData = {
        ...borehole,
        createdAt: borehole.createdAt,
        updatedAt: borehole.updatedAt
      };
      await addDoc(boreholesCollection, boreholeData);
      console.log('Borehole saved successfully:', borehole.boreholeId);
    } catch (error) {
      console.error('Error saving borehole:', error);
      throw error;
    }
  }

  /**
   * Save a discharge test to Firestore
   */
  async saveDischargeTest(test: DischargeTest): Promise<void> {
    try {
      const testsCollection = collection(this.firestore, 'tests');
      const testData = {
        ...test,
        startTime: test.startTime ? Timestamp.fromDate(test.startTime) : null,
        endTime: test.endTime ? Timestamp.fromDate(test.endTime) : null,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt
      };
      await addDoc(testsCollection, testData);
      console.log('Discharge test saved successfully:', test.testId);
    } catch (error) {
      console.error('Error saving discharge test:', error);
      throw error;
    }
  }

  /**
   * Save series data for a test
   */
  async saveSeries(testId: string, series: Series[]): Promise<void> {
    try {
      for (const s of series) {
        const seriesCollection = collection(this.firestore, `tests/${testId}/series`);
        const seriesData = {
          ...s,
          createdAt: s.createdAt
        };
        await addDoc(seriesCollection, seriesData);
      }
      console.log('Series saved successfully for test:', testId);
    } catch (error) {
      console.error('Error saving series:', error);
      throw error;
    }
  }

  /**
   * Save quality data for a test
   */
  async saveQuality(testId: string, quality: Quality[]): Promise<void> {
    try {
      for (const q of quality) {
        const qualityCollection = collection(this.firestore, `tests/${testId}/quality`);
        const qualityData = {
          ...q,
          createdAt: q.createdAt
        };
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
