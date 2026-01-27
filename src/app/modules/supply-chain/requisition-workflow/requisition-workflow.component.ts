import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { SupplyChainService } from '../../../services/supply-chain.service';
import { Requisition, RequisitionItem, Material } from '../../../models';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-requisition-workflow',
  templateUrl: './requisition-workflow.component.html',
  styleUrls: ['./requisition-workflow.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
})
export class RequisitionWorkflowComponent implements OnInit {
  requisitions: Requisition[] = [];
  materials: Material[] = [];
  requisitionForm: FormGroup;
  isEditing = false;
  editingRequisitionId: string | null = null;
  isLoading = false;
  showForm = false;

  priorities = ['Low', 'Medium', 'High', 'Critical'];
  types = ['Material', 'Equipment', 'Service'];
  statuses = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Partially Fulfilled', 'Fulfilled', 'Cancelled'];

  constructor(
    private fb: FormBuilder,
    private supplyChainService: SupplyChainService,
    private router: Router
  ) {
    this.requisitionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      projectId: ['', Validators.required],
      siteId: ['', Validators.required],
      priority: ['Medium', Validators.required],
      type: ['Material', Validators.required],
      requiredDate: ['', Validators.required],
      notes: [''],
      items: this.fb.array([])
    });
  }

  ngOnInit() {
    this.loadRequisitions();
    this.loadMaterials();
  }

  get items(): FormArray {
    return this.requisitionForm.get('items') as FormArray;
  }

  async loadRequisitions() {
    this.isLoading = true;
    try {
      const orgId = 'org1';
      this.requisitions = await this.supplyChainService.getRequisitionsByOrg(orgId);
    } catch (error) {
      console.error('Error loading requisitions:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMaterials() {
    try {
      const orgId = 'org1';
      this.materials = await this.supplyChainService.getMaterialsByOrg(orgId);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  }

  showAddForm() {
    this.isEditing = false;
    this.editingRequisitionId = null;
    this.requisitionForm.reset({
      priority: 'Medium',
      type: 'Material'
    });
    this.clearItems();
    this.addItem();
    this.showForm = true;
  }

  editRequisition(requisition: Requisition) {
    this.isEditing = true;
    this.editingRequisitionId = requisition.requisitionId;
    this.requisitionForm.patchValue({
      title: requisition.title,
      description: requisition.description,
      projectId: requisition.projectId,
      siteId: requisition.siteId,
      priority: requisition.priority,
      type: requisition.type,
      requiredDate: requisition.requiredDate.toDate().toISOString().split('T')[0],
      notes: requisition.notes || ''
    });

    this.clearItems();
    requisition.items.forEach(item => {
      this.addItem(item);
    });

    this.showForm = true;
  }

  clearItems() {
    while (this.items.length > 0) {
      this.items.removeAt(0);
    }
  }

  addItem(existingItem?: RequisitionItem) {
    const itemForm = this.fb.group({
      materialId: [existingItem?.materialId || '', Validators.required],
      quantity: [existingItem?.quantity || 1, [Validators.required, Validators.min(0.01)]],
      purpose: [existingItem?.purpose || '', Validators.required],
      notes: [existingItem?.notes || '']
    });
    this.items.push(itemForm);
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.editingRequisitionId = null;
    this.requisitionForm.reset();
    this.clearItems();
  }

  async saveRequisition() {
    if (this.requisitionForm.invalid) {
      return;
    }

    this.isLoading = true;
    try {
      const formValue = this.requisitionForm.value;
      const items = formValue.items.map((item: any) => {
        const material = this.materials.find(m => m.materialId === item.materialId);
        return {
          materialId: item.materialId,
          materialCode: material?.code || '',
          materialName: material?.name || '',
          quantity: item.quantity,
          unit: material?.unit || '',
          unitPrice: material?.unitPrice || 0,
          totalPrice: (material?.unitPrice || 0) * item.quantity,
          purpose: item.purpose,
          notes: item.notes,
          fulfilledQuantity: 0,
          status: 'Pending'
        };
      });

      const totalValue = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

      const requisitionData = {
        ...formValue,
        orgId: 'org1',
        requestedBy: 'user1',
        status: 'Draft',
        items,
        totalValue,
        requiredDate: new Date(formValue.requiredDate)
      };

      if (this.isEditing && this.editingRequisitionId) {
        await this.supplyChainService.updateRequisition(this.editingRequisitionId, requisitionData);
      } else {
        await this.supplyChainService.createRequisition(requisitionData);
      }

      this.cancelEdit();
      await this.loadRequisitions();
    } catch (error) {
      console.error('Error saving requisition:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async submitRequisition(req: Requisition) {
    this.isLoading = true;
    try {
      await this.supplyChainService.updateRequisition(req.requisitionId, {
        status: 'Submitted',
        submittedAt: Timestamp.now()
      });
      await this.loadRequisitions();
    } catch (error) {
      console.error('Error submitting requisition:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteRequisition(requisition: Requisition) {
    if (!confirm(`Are you sure you want to delete requisition "${requisition.title}"?`)) {
      return;
    }

    this.isLoading = true;
    try {
      await this.supplyChainService.deleteRequisition(requisition.requisitionId);
      await this.loadRequisitions();
    } catch (error) {
      console.error('Error deleting requisition:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getMaterialName(materialId: string): string {
    const material = this.materials.find(m => m.materialId === materialId);
    return material ? material.name : 'Unknown Material';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Draft': 'text-gray-600 bg-gray-50',
      'Submitted': 'text-blue-600 bg-blue-50',
      'Approved': 'text-green-600 bg-green-50',
      'Rejected': 'text-red-600 bg-red-50',
      'Partially Fulfilled': 'text-yellow-600 bg-yellow-50',
      'Fulfilled': 'text-green-600 bg-green-50',
      'Cancelled': 'text-gray-600 bg-gray-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'Low': 'text-green-600',
      'Medium': 'text-yellow-600',
      'High': 'text-orange-600',
      'Critical': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}