import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp
} from '@angular/fire/firestore';
import { Vehicle, Rig, MaintenanceSchedule, PreStartCheck } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FleetService {

  constructor(private firestore: Firestore) { }

  // ==================== VEHICLES ====================

  /**
   * Create a new vehicle
   */
  async createVehicle(vehicle: Omit<Vehicle, 'vehicleId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const vehiclesCollection = collection(this.firestore, 'vehicles');
      const vehicleData = {
        ...vehicle,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const docRef = await addDoc(vehiclesCollection, vehicleData);
      console.log('Vehicle created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  /**
   * Get all vehicles for an organization
   */
  async getVehicles(orgId: string): Promise<Vehicle[]> {
    try {
      const vehiclesCollection = collection(this.firestore, 'vehicles');
      const q = query(vehiclesCollection, where('orgId', '==', orgId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        vehicleId: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt'].toDate(),
        updatedAt: doc.data()['updatedAt'].toDate()
      } as Vehicle));
    } catch (error) {
      console.error('Error getting vehicles:', error);
      throw error;
    }
  }

  /**
   * Update vehicle mileage and check for service alerts
   */
  async updateVehicleMileage(vehicleId: string, newMileage: number): Promise<void> {
    try {
      const vehicleDoc = doc(this.firestore, 'vehicles', vehicleId);
      const updateData = {
        mileage: newMileage,
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(vehicleDoc, updateData);
      console.log('Vehicle mileage updated:', vehicleId);
    } catch (error) {
      console.error('Error updating vehicle mileage:', error);
      throw error;
    }
  }

  // ==================== RIGS ====================

  /**
   * Create a new rig
   */
  async createRig(rig: Omit<Rig, 'rigId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const rigsCollection = collection(this.firestore, 'rigs');
      const rigData = {
        ...rig,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const docRef = await addDoc(rigsCollection, rigData);
      console.log('Rig created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating rig:', error);
      throw error;
    }
  }

  /**
   * Get all rigs for an organization
   */
  async getRigs(orgId: string): Promise<Rig[]> {
    try {
      const rigsCollection = collection(this.firestore, 'rigs');
      const q = query(rigsCollection, where('orgId', '==', orgId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        rigId: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt'].toDate(),
        updatedAt: doc.data()['updatedAt'].toDate()
      } as Rig));
    } catch (error) {
      console.error('Error getting rigs:', error);
      throw error;
    }
  }

  /**
   * Update rig engine hours
   */
  async updateRigHours(rigId: string, newHours: number): Promise<void> {
    try {
      const rigDoc = doc(this.firestore, 'rigs', rigId);
      const updateData = {
        engineHours: newHours,
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(rigDoc, updateData);
      console.log('Rig hours updated:', rigId);
    } catch (error) {
      console.error('Error updating rig hours:', error);
      throw error;
    }
  }

  /**
   * Update rig status and location
   */
  async updateRigStatus(rigId: string, status: Rig['status'], location: string, projectId?: string, siteId?: string): Promise<void> {
    try {
      const rigDoc = doc(this.firestore, 'rigs', rigId);
      const updateData: any = {
        status,
        location,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (projectId) updateData.projectId = projectId;
      if (siteId) updateData.siteId = siteId;

      await updateDoc(rigDoc, updateData);
      console.log('Rig status updated:', rigId);
    } catch (error) {
      console.error('Error updating rig status:', error);
      throw error;
    }
  }

  // ==================== MAINTENANCE SCHEDULES ====================

  /**
   * Create a maintenance schedule
   */
  async createMaintenanceSchedule(schedule: Omit<MaintenanceSchedule, 'scheduleId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const schedulesCollection = collection(this.firestore, 'maintenance-schedules');
      const scheduleData = {
        ...schedule,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const docRef = await addDoc(schedulesCollection, scheduleData);
      console.log('Maintenance schedule created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating maintenance schedule:', error);
      throw error;
    }
  }

  /**
   * Get maintenance schedules for an asset
   */
  async getAssetMaintenanceSchedules(assetId: string): Promise<MaintenanceSchedule[]> {
    try {
      const schedulesCollection = collection(this.firestore, 'maintenance-schedules');
      const q = query(schedulesCollection, where('assetId', '==', assetId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        scheduleId: doc.id,
        ...doc.data(),
        dueDate: doc.data()['dueDate'].toDate(),
        completedAt: doc.data()['completedAt']?.toDate(),
        createdAt: doc.data()['createdAt'].toDate(),
        updatedAt: doc.data()['updatedAt'].toDate()
      } as MaintenanceSchedule));
    } catch (error) {
      console.error('Error getting maintenance schedules:', error);
      throw error;
    }
  }

  /**
   * Update maintenance schedule status
   */
  async updateMaintenanceStatus(scheduleId: string, status: MaintenanceSchedule['status'], notes?: string): Promise<void> {
    try {
      const scheduleDoc = doc(this.firestore, 'maintenance-schedules', scheduleId);
      const updateData: any = {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (notes) updateData.notes = notes;
      if (status === 'Completed') updateData.completedAt = Timestamp.fromDate(new Date());

      await updateDoc(scheduleDoc, updateData);
      console.log('Maintenance status updated:', scheduleId);
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      throw error;
    }
  }

  // ==================== MAINTENANCE SCHEDULES ====================

  /**
   * Get all maintenance schedules for an organization
   */
  async getMaintenanceSchedules(orgId: string): Promise<MaintenanceSchedule[]> {
    try {
      const schedulesCollection = collection(this.firestore, 'maintenance-schedules');
      const q = query(schedulesCollection, where('orgId', '==', orgId));
      const querySnapshot = await getDocs(q);

      const schedules: MaintenanceSchedule[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        schedules.push({
          scheduleId: doc.id,
          ...data
        } as MaintenanceSchedule);
      });

      console.log('Maintenance schedules loaded:', schedules.length);
      return schedules;
    } catch (error) {
      console.error('Error getting maintenance schedules:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if vehicle needs service
   */
  needsService(vehicle: Vehicle): boolean {
    return vehicle.mileage >= vehicle.nextServiceMileage;
  }

  /**
   * Check if rig needs service
   */
  needsServiceRig(rig: Rig): boolean {
    return rig.engineHours >= rig.nextServiceHours;
  }

  /**
   * Calculate next service for vehicle
   */
  calculateNextService(vehicle: Vehicle): number {
    return vehicle.lastServiceMileage + vehicle.serviceInterval;
  }

  /**
   * Calculate next service for rig
   */
  calculateNextServiceRig(rig: Rig): number {
    return rig.lastServiceHours + rig.serviceInterval;
  }

  // ==================== PRE-START CHECKS ====================

  /**
   * Submit a pre-start check
   */
  async submitPreStartCheck(check: Omit<PreStartCheck, 'checkId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const checksCollection = collection(this.firestore, 'preStartChecks');
      const checkData = {
        ...check,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const docRef = await addDoc(checksCollection, checkData);
      console.log('Pre-start check submitted:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting pre-start check:', error);
      throw error;
    }
  }

  /**
   * Get pre-start checks by vehicle
   */
  async getPreStartChecksByVehicle(vehicleId: string): Promise<PreStartCheck[]> {
    try {
      const checksCollection = collection(this.firestore, 'preStartChecks');
      const q = query(checksCollection, where('vehicleId', '==', vehicleId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        checkId: doc.id,
        ...doc.data(),
        date: doc.data()['date'],
        createdAt: doc.data()['createdAt'],
        updatedAt: doc.data()['updatedAt']
      } as PreStartCheck));
    } catch (error) {
      console.error('Error getting pre-start checks:', error);
      throw error;
    }
  }
}