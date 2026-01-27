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
import { Employee, Certification, LeaveRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PersonnelService {

  constructor(private firestore: Firestore) { }

  // ==================== EMPLOYEES ====================

  /**
   * Create a new employee
   */
  async createEmployee(employee: Omit<Employee, 'employeeId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const employeesCollection = collection(this.firestore, 'employees');
      const employeeData = {
        ...employee,
        hireDate: employee.hireDate instanceof Timestamp ? employee.hireDate : Timestamp.fromDate(employee.hireDate as Date),
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const docRef = await addDoc(employeesCollection, employeeData);
      console.log('Employee created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Get all employees for an organization
   */
  async getEmployees(orgId: string): Promise<Employee[]> {
    try {
      const employeesCollection = collection(this.firestore, 'employees');
      const q = query(employeesCollection, where('orgId', '==', orgId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        employeeId: doc.id,
        ...doc.data(),
        hireDate: doc.data()['hireDate'].toDate(),
        createdAt: doc.data()['createdAt'].toDate(),
        updatedAt: doc.data()['updatedAt'].toDate()
      } as Employee));
    } catch (error) {
      console.error('Error getting employees:', error);
      throw error;
    }
  }

  /**
   * Update an employee
   */
  async updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
    try {
      const employeeDoc = doc(this.firestore, 'employees', employeeId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (updates.hireDate) {
        updateData.hireDate = updates.hireDate instanceof Timestamp ? updates.hireDate : Timestamp.fromDate(updates.hireDate as Date);
      }

      await updateDoc(employeeDoc, updateData);
      console.log('Employee updated:', employeeId);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  // ==================== CERTIFICATIONS ====================

  /**
   * Add certification to employee
   */
  async addCertification(certification: Omit<Certification, 'certificationId'>): Promise<string> {
    try {
      const certificationsCollection = collection(this.firestore, 'certifications');
      const certData = {
        ...certification,
        issueDate: certification.issueDate instanceof Timestamp ? certification.issueDate : Timestamp.fromDate(certification.issueDate as Date),
        expiryDate: certification.expiryDate ? (certification.expiryDate instanceof Timestamp ? certification.expiryDate : Timestamp.fromDate(certification.expiryDate as Date)) : null
      };

      const docRef = await addDoc(certificationsCollection, certData);
      console.log('Certification added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding certification:', error);
      throw error;
    }
  }

  /**
   * Get certifications for employee
   */
  async getEmployeeCertifications(employeeId: string): Promise<Certification[]> {
    try {
      const certificationsCollection = collection(this.firestore, 'certifications');
      const q = query(certificationsCollection, where('employeeId', '==', employeeId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        certificationId: doc.id,
        ...doc.data(),
        issueDate: doc.data()['issueDate'].toDate(),
        expiryDate: doc.data()['expiryDate']?.toDate()
      } as Certification));
    } catch (error) {
      console.error('Error getting certifications:', error);
      throw error;
    }
  }

  // ==================== LEAVE REQUESTS ====================

  /**
   * Create a leave request
   */
  async createLeaveRequest(leaveRequest: Omit<LeaveRequest, 'leaveId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const leaveCollection = collection(this.firestore, 'leave-requests');
      const leaveData = {
        ...leaveRequest,
        startDate: leaveRequest.startDate instanceof Timestamp ? leaveRequest.startDate : Timestamp.fromDate(leaveRequest.startDate as Date),
        endDate: leaveRequest.endDate instanceof Timestamp ? leaveRequest.endDate : Timestamp.fromDate(leaveRequest.endDate as Date),
        approvedAt: leaveRequest.approvedAt ? (leaveRequest.approvedAt instanceof Timestamp ? leaveRequest.approvedAt : Timestamp.fromDate(leaveRequest.approvedAt as Date)) : null,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      const docRef = await addDoc(leaveCollection, leaveData);
      console.log('Leave request created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating leave request:', error);
      throw error;
    }
  }

  /**
   * Get leave requests for employee
   */
  async getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
    try {
      const leaveCollection = collection(this.firestore, 'leave-requests');
      const q = query(leaveCollection, where('employeeId', '==', employeeId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        leaveId: doc.id,
        ...doc.data(),
        startDate: doc.data()['startDate'].toDate(),
        endDate: doc.data()['endDate'].toDate(),
        approvedAt: doc.data()['approvedAt']?.toDate(),
        createdAt: doc.data()['createdAt'].toDate(),
        updatedAt: doc.data()['updatedAt'].toDate()
      } as LeaveRequest));
    } catch (error) {
      console.error('Error getting leave requests:', error);
      throw error;
    }
  }

  /**
   * Update leave request status
   */
  async updateLeaveRequestStatus(leaveId: string, status: LeaveRequest['status'], approvedBy?: string): Promise<void> {
    try {
      const leaveDoc = doc(this.firestore, 'leave-requests', leaveId);
      const updateData: any = {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (approvedBy) {
        updateData.approvedBy = approvedBy;
        updateData.approvedAt = Timestamp.fromDate(new Date());
      }

      await updateDoc(leaveDoc, updateData);
      console.log('Leave request updated:', leaveId);
    } catch (error) {
      console.error('Error updating leave request:', error);
      throw error;
    }
  }
}