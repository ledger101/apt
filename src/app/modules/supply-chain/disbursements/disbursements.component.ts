import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupplyChainService } from '../../../services/supply-chain.service';
import { Disbursement, DisbursementItem, Material, Project, Requisition, InventoryTransaction } from '../../../models';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-disbursements',
  templateUrl: './disbursements.component.html',
  styleUrls: ['./disbursements.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
})
export class DisbursementsComponent implements OnInit {
  disbursements: Disbursement[] = [];
  materials: Material[] = [];
  projects: Project[] = [];
  requisitions: Requisition[] = [];
  
  disbursementForm: FormGroup;
  isLoading = false;
  showForm = false;
  selectedRequisition: Requisition | null = null;

  statusOptions = ['Issued', 'Partially Returned', 'Returned', 'Closed'];

  constructor(
    private fb: FormBuilder,
    private supplyChainService: SupplyChainService,
    private router: Router
  ) {
    this.disbursementForm = this.fb.group({
      projectId: ['', Validators.required],
      siteId: [''],
      requisitionId: [''],
      dateIssued: [this.getTodayDate(), Validators.required],
      receivedBy: ['', Validators.required],
      purpose: ['', Validators.required],
      workOrderNumber: [''],
      notes: [''],
      items: this.fb.array([])
    });
  }

  ngOnInit() {
    this.loadData();
  }

  get items(): FormArray {
    return this.disbursementForm.get('items') as FormArray;
  }

  async loadData() {
    this.isLoading = true;
    try {
      const orgId = 'org1';
      [this.disbursements, this.materials, this.projects, this.requisitions] = await Promise.all([
        this.supplyChainService.getDisbursementsByOrg(orgId),
        this.supplyChainService.getMaterialsByOrg(orgId),
        this.supplyChainService.getProjectsByOrg(orgId),
        this.supplyChainService.getRequisitionsByOrg(orgId)
      ]);
      
      // Sort disbursements by date descending
      this.disbursements.sort((a, b) => {
        const dateA = a.dateIssued instanceof Timestamp ? a.dateIssued.toMillis() : new Date(a.dateIssued).getTime();
        const dateB = b.dateIssued instanceof Timestamp ? b.dateIssued.toMillis() : new Date(b.dateIssued).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  showAddForm() {
    this.showForm = true;
    this.selectedRequisition = null;
    this.disbursementForm.reset({
      dateIssued: this.getTodayDate()
    });
    this.items.clear();
    this.addItem();
  }

  hideForm() {
    this.showForm = false;
    this.selectedRequisition = null;
    this.disbursementForm.reset();
    this.items.clear();
  }

  onProjectChange() {
    const projectId = this.disbursementForm.get('projectId')?.value;
    if (projectId) {
      // Auto-fill siteId with projectId
      this.disbursementForm.patchValue({ siteId: projectId });
    }
  }

  onRequisitionChange() {
    const requisitionId = this.disbursementForm.get('requisitionId')?.value;
    
    if (!requisitionId) {
      this.selectedRequisition = null;
      this.items.clear();
      this.addItem();
      return;
    }

    // Find and populate from requisition
    const requisition = this.requisitions.find(r => r.requisitionId === requisitionId);
    if (requisition) {
      this.selectedRequisition = requisition;
      
      // Auto-fill project and site
      this.disbursementForm.patchValue({
        projectId: requisition.projectId,
        siteId: requisition.siteId,
        purpose: requisition.description || requisition.title
      });

      // Populate items from requisition
      this.items.clear();
      requisition.items.forEach(reqItem => {
        const material = this.materials.find(m => m.materialId === reqItem.materialId);
        if (material && reqItem.status !== 'Fulfilled' && reqItem.status !== 'Cancelled') {
          const quantityRemaining = reqItem.quantity - reqItem.fulfilledQuantity;
          if (quantityRemaining > 0) {
            this.items.push(this.fb.group({
              materialId: [reqItem.materialId, Validators.required],
              quantityIssued: [quantityRemaining, [Validators.required, Validators.min(0.01)]],
              unitCost: [material.unitPrice || 0, [Validators.required, Validators.min(0)]]
            }));
          }
        }
      });

      if (this.items.length === 0) {
        this.addItem();
      }
    }
  }

  getApprovedRequisitionsForProject(): Requisition[] {
    const projectId = this.disbursementForm.get('projectId')?.value;
    if (!projectId) return [];
    
    return this.requisitions.filter(r => 
      r.projectId === projectId && 
      r.status === 'Approved' &&
      r.items.some(item => item.status !== 'Fulfilled' && item.status !== 'Cancelled')
    );
  }

  addItem() {
    this.items.push(this.fb.group({
      materialId: ['', Validators.required],
      quantityIssued: [1, [Validators.required, Validators.min(0.01)]],
      unitCost: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  onMaterialChange(index: number) {
    const item = this.items.at(index);
    const materialId = item.get('materialId')?.value;
    
    if (materialId) {
      const material = this.materials.find(m => m.materialId === materialId);
      if (material) {
        item.patchValue({
          unitCost: material.unitPrice || 0
        });
      }
    }
  }

  getMaterial(materialId: string): Material | undefined {
    return this.materials.find(m => m.materialId === materialId);
  }

  getAvailableStock(materialId: string): number {
    const material = this.getMaterial(materialId);
    return material?.currentStock || 0;
  }

  isStockSufficient(index: number): boolean {
    const item = this.items.at(index);
    const materialId = item.get('materialId')?.value;
    const quantityIssued = item.get('quantityIssued')?.value || 0;
    
    if (!materialId) return true;
    
    const availableStock = this.getAvailableStock(materialId);
    return quantityIssued <= availableStock;
  }

  isLowStock(materialId: string): boolean {
    const material = this.getMaterial(materialId);
    if (!material || material.currentStock === undefined) return false;
    return material.currentStock <= material.minStockLevel;
  }

  calculateItemTotal(index: number): number {
    const item = this.items.at(index);
    const quantity = item.get('quantityIssued')?.value || 0;
    const unitCost = item.get('unitCost')?.value || 0;
    return quantity * unitCost;
  }

  calculateTotalCost(): number {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      total += this.calculateItemTotal(i);
    }
    return total;
  }

  canSave(): boolean {
    if (!this.disbursementForm.valid || this.items.length === 0) {
      return false;
    }

    // Check all items have sufficient stock
    for (let i = 0; i < this.items.length; i++) {
      if (!this.isStockSufficient(i)) {
        return false;
      }
    }

    return true;
  }

  async saveDisbursement() {
    if (!this.canSave()) {
      alert('Please ensure all fields are valid and sufficient stock is available.');
      return;
    }

    this.isLoading = true;
    try {
      const orgId = 'org1';
      const formValue = this.disbursementForm.value;
      
      // Generate disbursement number
      const disbursementNumber = await this.generateDisbursementNumber();

      // Prepare items
      const items: DisbursementItem[] = [];
      for (let i = 0; i < this.items.length; i++) {
        const itemValue = this.items.at(i).value;
        const material = this.getMaterial(itemValue.materialId);
        
        if (material) {
          items.push({
            lineNumber: i + 1,
            materialId: material.materialId,
            materialCode: material.code,
            materialName: material.name,
            quantity: material.currentStock || 0,
            issuedQuantity: itemValue.quantityIssued,
            quantityIssued: itemValue.quantityIssued,
            unit: material.unit,
            unitCost: itemValue.unitCost,
            totalCost: itemValue.quantityIssued * itemValue.unitCost,
            returnedQuantity: 0,
            quantityReturned: 0,
            purpose: formValue.purpose || ''
          });
        }
      }

      const totalCost = this.calculateTotalCost();

      // Create disbursement
      const disbursement: Omit<Disbursement, 'disbursementId'> = {
        orgId,
        disbursementNumber,
        projectId: formValue.projectId,
        siteId: formValue.siteId || formValue.projectId,
        requisitionId: formValue.requisitionId || undefined,
        dateIssued: Timestamp.fromDate(new Date(formValue.dateIssued)),
        issuedBy: 'current-user', // TODO: Get from auth service
        receivedBy: formValue.receivedBy,
        purpose: formValue.purpose,
        workOrderNumber: formValue.workOrderNumber || undefined,
        status: 'Issued',
        items,
        totalCost,
        notes: formValue.notes || undefined,
        createdBy: 'current-user', // TODO: Get from auth service
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const disbursementId = await this.supplyChainService.createDisbursement(disbursement);

      // Update material stock levels and create inventory transactions
      for (const item of items) {
        const material = this.getMaterial(item.materialId);
        const qtyIssued = item.quantityIssued ?? item.issuedQuantity ?? 0;
        if (material && material.currentStock !== undefined && qtyIssued > 0) {
          const previousStock = material.currentStock;
          const newStock = previousStock - qtyIssued;

          // Update material stock
          await this.supplyChainService.updateMaterial(item.materialId, {
            currentStock: newStock,
            updatedAt: Timestamp.now()
          });

          // Create inventory transaction
          await this.supplyChainService.createInventoryTransaction({
            orgId,
            siteId: formValue.siteId || formValue.projectId,
            materialId: item.materialId,
            transactionType: 'Issue',
            quantity: -qtyIssued,
            previousStock,
            newStock,
            reference: disbursementId,
            referenceType: 'Requisition',
            performedBy: 'current-user', // TODO: Get from auth service
            notes: `Issued to ${formValue.receivedBy} for ${formValue.purpose}`
          });
        }
      }

      // Update requisition status if linked
      if (formValue.requisitionId) {
        await this.updateRequisitionStatus(formValue.requisitionId, items);
      }

      alert('Disbursement created successfully!');
      this.hideForm();
      await this.loadData();
    } catch (error) {
      console.error('Error creating disbursement:', error);
      alert('Failed to create disbursement. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async updateRequisitionStatus(requisitionId: string, disbursedItems: DisbursementItem[]) {
    const requisition = this.requisitions.find(r => r.requisitionId === requisitionId);
    if (!requisition) return;

    // Update fulfilled quantities
    for (const disbursedItem of disbursedItems) {
      const reqItem = requisition.items.find(ri => ri.materialId === disbursedItem.materialId);
      const qtyIssued = disbursedItem.quantityIssued ?? disbursedItem.issuedQuantity ?? 0;
      if (reqItem && qtyIssued > 0) {
        reqItem.fulfilledQuantity += qtyIssued;
        
        if (reqItem.fulfilledQuantity >= reqItem.quantity) {
          reqItem.status = 'Fulfilled';
        } else if (reqItem.fulfilledQuantity > 0) {
          reqItem.status = 'Partially Fulfilled';
        }
      }
    }

    // Check if all items are fulfilled
    const allFulfilled = requisition.items.every(item => 
      item.status === 'Fulfilled' || item.status === 'Cancelled'
    );
    const anyPartiallyFulfilled = requisition.items.some(item => 
      item.status === 'Partially Fulfilled'
    );

    let newStatus: Requisition['status'] = requisition.status;
    if (allFulfilled) {
      newStatus = 'Fulfilled';
    } else if (anyPartiallyFulfilled || requisition.status === 'Partially Fulfilled') {
      newStatus = 'Partially Fulfilled';
    }

    // Update requisition
    await this.supplyChainService.updateRequisition(requisitionId, {
      items: requisition.items,
      status: newStatus,
      updatedAt: Timestamp.now()
    });
  }

  async generateDisbursementNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DISB-${year}-`;
    
    // Find the highest number for this year
    const yearDisbursements = this.disbursements.filter(d => 
      d.disbursementNumber.startsWith(prefix)
    );
    
    let maxNumber = 0;
    yearDisbursements.forEach(d => {
      const parts = d.disbursementNumber.split('-');
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    });
    
    const nextNumber = maxNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  async deleteDisbursement(disbursement: Disbursement) {
    // Disbursements cannot be deleted once created (audit trail requirement)
    alert('Disbursements cannot be deleted once created to maintain audit trail integrity.');
  }

  viewDisbursement(disbursement: Disbursement) {
    // Navigate to view/details page (if implemented)
    // For now, show alert with details
    alert(`Disbursement Details:\n\nNumber: ${disbursement.disbursementNumber}\nProject: ${this.getProjectName(disbursement.projectId)}\nDate: ${this.formatDate(disbursement.dateIssued)}\nReceived By: ${disbursement.receivedBy}\nPurpose: ${disbursement.purpose}\nTotal Cost: ${this.formatCurrency(disbursement.totalCost || 0)}\nStatus: ${disbursement.status}`);
  }

  getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.projectId === projectId);
    return project?.projectName || projectId;
  }

  getMaterialName(materialId: string): string {
    const material = this.getMaterial(materialId);
    return material?.name || materialId;
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Issued': 'bg-blue-100 text-blue-800',
      'Partially Returned': 'bg-yellow-100 text-yellow-800',
      'Returned': 'bg-purple-100 text-purple-800',
      'Closed': 'bg-gray-100 text-gray-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: any): string {
    if (!date) return '';
    
    let jsDate: Date;
    if (date instanceof Timestamp) {
      jsDate = date.toDate();
    } else if (date instanceof Date) {
      jsDate = date;
    } else if (typeof date === 'string') {
      jsDate = new Date(date);
    } else {
      return '';
    }
    
    return jsDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
