import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Material, Requisition, InventoryTransaction, Supplier, Project, PurchaseOrder, GoodsReceivedNote, Disbursement } from '../models';

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

  // Project methods
  async getProjectsByOrg(orgId: string): Promise<Project[]> {
    return this.firestoreService.getProjectsByOrg(orgId);
  }

  async getProject(projectId: string): Promise<Project | null> {
    return this.firestoreService.getProject(projectId);
  }

  async createProject(project: Omit<Project, 'projectId'>): Promise<string> {
    return this.firestoreService.createProject(project);
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    return this.firestoreService.updateProject(projectId, updates);
  }

  async deleteProject(projectId: string): Promise<void> {
    return this.firestoreService.deleteProject(projectId);
  }

  // Supplier methods
  async getSuppliersByOrg(orgId: string): Promise<Supplier[]> {
    return this.firestoreService.getSuppliersByOrg(orgId);
  }

  async getSupplier(supplierId: string): Promise<Supplier | null> {
    return this.firestoreService.getSupplier(supplierId);
  }

  async createSupplier(supplier: Omit<Supplier, 'supplierId'>): Promise<string> {
    return this.firestoreService.createSupplier(supplier);
  }

  async updateSupplier(supplierId: string, updates: Partial<Supplier>): Promise<void> {
    return this.firestoreService.updateSupplier(supplierId, updates);
  }

  async deleteSupplier(supplierId: string): Promise<void> {
    return this.firestoreService.deleteSupplier(supplierId);
  }

  // Purchase Order methods
  async getPurchaseOrdersByOrg(orgId: string): Promise<PurchaseOrder[]> {
    return this.firestoreService.getPurchaseOrdersByOrg(orgId);
  }

  async getPurchaseOrder(poId: string): Promise<PurchaseOrder | null> {
    return this.firestoreService.getPurchaseOrder(poId);
  }

  async createPurchaseOrder(po: Omit<PurchaseOrder, 'poId'>): Promise<string> {
    return this.firestoreService.createPurchaseOrder(po);
  }

  async updatePurchaseOrder(poId: string, updates: Partial<PurchaseOrder>): Promise<void> {
    return this.firestoreService.updatePurchaseOrder(poId, updates);
  }

  async deletePurchaseOrder(poId: string): Promise<void> {
    return this.firestoreService.deletePurchaseOrder(poId);
  }

  // GRN methods
  async getGRNsByOrg(orgId: string): Promise<GoodsReceivedNote[]> {
    return this.firestoreService.getGRNsByOrg(orgId);
  }

  async getGRN(grnId: string): Promise<GoodsReceivedNote | null> {
    return this.firestoreService.getGRN(grnId);
  }

  async createGRN(grn: Omit<GoodsReceivedNote, 'grnId'>): Promise<string> {
    return this.firestoreService.createGRN(grn);
  }

  async updateGRN(grnId: string, updates: Partial<GoodsReceivedNote>): Promise<void> {
    return this.firestoreService.updateGRN(grnId, updates);
  }

  async deleteGRN(grnId: string): Promise<void> {
    return this.firestoreService.deleteGRN(grnId);
  }

  // Disbursement methods
  async getDisbursementsByOrg(orgId: string): Promise<Disbursement[]> {
    return this.firestoreService.getDisbursementsByOrg(orgId);
  }

  async getDisbursement(disbursementId: string): Promise<Disbursement | null> {
    return this.firestoreService.getDisbursement(disbursementId);
  }

  async createDisbursement(disbursement: Omit<Disbursement, 'disbursementId'>): Promise<string> {
    return this.firestoreService.createDisbursement(disbursement);
  }

  async updateDisbursement(disbursementId: string, updates: Partial<Disbursement>): Promise<void> {
    return this.firestoreService.updateDisbursement(disbursementId, updates);
  }

  async deleteDisbursement(disbursementId: string): Promise<void> {
    return this.firestoreService.deleteDisbursement(disbursementId);
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