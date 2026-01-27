import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Material, Requisition, InventoryTransaction } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SupplyChainService {

  constructor(private firestoreService: FirestoreService) { }

  // Material methods
  async getMaterialsByOrg(orgId: string): Promise<Material[]> {
    return this.firestoreService.getMaterialsByOrg(orgId);
  }

  async getMaterial(materialId: string): Promise<Material | null> {
    return this.firestoreService.getMaterial(materialId);
  }

  async createMaterial(material: Omit<Material, 'materialId'>): Promise<string> {
    return this.firestoreService.createMaterial(material);
  }

  async updateMaterial(materialId: string, updates: Partial<Material>): Promise<void> {
    return this.firestoreService.updateMaterial(materialId, updates);
  }

  async deleteMaterial(materialId: string): Promise<void> {
    return this.firestoreService.deleteMaterial(materialId);
  }

  // Requisition methods
  async getRequisitionsByOrg(orgId: string): Promise<Requisition[]> {
    return this.firestoreService.getRequisitionsByOrg(orgId);
  }

  async getRequisition(requisitionId: string): Promise<Requisition | null> {
    return this.firestoreService.getRequisition(requisitionId);
  }

  async createRequisition(requisition: Omit<Requisition, 'requisitionId'>): Promise<string> {
    return this.firestoreService.createRequisition(requisition);
  }

  async updateRequisition(requisitionId: string, updates: Partial<Requisition>): Promise<void> {
    return this.firestoreService.updateRequisition(requisitionId, updates);
  }

  async deleteRequisition(requisitionId: string): Promise<void> {
    return this.firestoreService.deleteRequisition(requisitionId);
  }

  // Inventory Transaction methods
  async getInventoryTransactionsBySite(siteId: string): Promise<InventoryTransaction[]> {
    return this.firestoreService.getInventoryTransactionsBySite(siteId);
  }

  async createInventoryTransaction(transaction: Omit<InventoryTransaction, 'transactionId' | 'transactionDate' | 'createdAt'>): Promise<string> {
    return this.firestoreService.createInventoryTransaction(transaction);
  }

  // Alias methods for component compatibility
  async getMaterialsByOrgAlias(orgId: string): Promise<Material[]> {
    return this.getMaterialsByOrg(orgId);
  }

  async getRequisitionsByOrgAlias(orgId: string): Promise<Requisition[]> {
    return this.getRequisitionsByOrg(orgId);
  }

  async getInventoryTransactionsBySiteAlias(siteId: string): Promise<InventoryTransaction[]> {
    return this.getInventoryTransactionsBySite(siteId);
  }

  async createInventoryTransactionAlias(transaction: Omit<InventoryTransaction, 'transactionId'>): Promise<string> {
    return this.createInventoryTransaction(transaction);
  }
}