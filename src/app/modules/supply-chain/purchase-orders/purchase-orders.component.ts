import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupplyChainService } from '../../../services/supply-chain.service';
import { PurchaseOrder, PurchaseOrderItem, Material, Supplier, Project, Requisition } from '../../../models';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-purchase-orders',
  templateUrl: './purchase-orders.component.html',
  styleUrls: ['./purchase-orders.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
})
export class PurchaseOrdersComponent implements OnInit {
  purchaseOrders: PurchaseOrder[] = [];
  materials: Material[] = [];
  suppliers: Supplier[] = [];
  projects: Project[] = [];
  requisitions: Requisition[] = [];
  
  poForm: FormGroup;
  isEditing = false;
  editingPOId: string | null = null;
  isLoading = false;
  showForm = false;

  statusOptions = ['Draft', 'Sent', 'Acknowledged', 'Receiving', 'Closed', 'Cancelled'];
  paymentTermsOptions = ['Net 30', 'Net 60', 'Net 90', 'COD', 'Advance Payment', '50% Advance'];
  currencies = ['USD', 'ZAR', 'EUR', 'GBP'];

  constructor(
    private fb: FormBuilder,
    private supplyChainService: SupplyChainService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.poForm = this.fb.group({
      supplierId: ['', Validators.required],
      projectId: ['', Validators.required],
      siteId: [''],
      expectedDeliveryDate: ['', Validators.required],
      paymentTerms: ['Net 30', Validators.required],
      currency: ['USD', Validators.required],
      notes: [''],
      requisitionId: [''],
      taxPercent: [15, [Validators.min(0), Validators.max(100)]],
      shippingCost: [0, [Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      items: this.fb.array([])
    });
  }

  ngOnInit() {
    this.loadData();
    
    // Check if creating from requisition
    this.route.queryParams.subscribe(params => {
      if (params['requisitionId']) {
        this.createFromRequisition(params['requisitionId']);
      }
    });
  }

  get items(): FormArray {
    return this.poForm.get('items') as FormArray;
  }

  async loadData() {
    this.isLoading = true;
    try {
      const orgId = 'org1';
      [this.purchaseOrders, this.materials, this.suppliers, this.projects, this.requisitions] = await Promise.all([
        this.supplyChainService.getPurchaseOrdersByOrg(orgId),
        this.supplyChainService.getMaterialsByOrg(orgId),
        this.supplyChainService.getSuppliersByOrg(orgId),
        this.supplyChainService.getProjectsByOrg(orgId),
        this.supplyChainService.getRequisitionsByOrg(orgId)
      ]);
      
      // Sort POs by date descending
      this.purchaseOrders.sort((a, b) => {
        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  showAddForm() {
    this.isEditing = false;
    this.editingPOId = null;
    this.poForm.reset({
      paymentTerms: 'Net 30',
      currency: 'USD',
      taxPercent: 15,
      shippingCost: 0,
      discount: 0
    });
    this.items.clear();
    this.addLineItem();
    this.showForm = true;
  }

  createLineItem(materialId = '', quantity = 1, unitPrice = 0): FormGroup {
    const group = this.fb.group({
      materialId: [materialId, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(0.01)]],
      unitPrice: [unitPrice, [Validators.required, Validators.min(0)]]
    });

    // Auto-fill unit price when material is selected
    group.get('materialId')?.valueChanges.subscribe(matId => {
      if (matId) {
        const material = this.materials.find(m => m.materialId === matId);
        if (material) {
          group.patchValue({ unitPrice: material.unitPrice }, { emitEvent: false });
        }
      }
    });

    return group;
  }

  addLineItem() {
    this.items.push(this.createLineItem());
  }

  removeLineItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  getMaterial(materialId: string): Material | undefined {
    return this.materials.find(m => m.materialId === materialId);
  }

  getLineTotal(item: any): number {
    return (item.value.quantity || 0) * (item.value.unitPrice || 0);
  }

  getSubtotal(): number {
    return this.items.controls.reduce((sum, item) => sum + this.getLineTotal(item), 0);
  }

  getTaxAmount(): number {
    const taxPercent = this.poForm.get('taxPercent')?.value || 0;
    return this.getSubtotal() * (taxPercent / 100);
  }

  getTotal(): number {
    const subtotal = this.getSubtotal();
    const tax = this.getTaxAmount();
    const shipping = this.poForm.get('shippingCost')?.value || 0;
    const discount = this.poForm.get('discount')?.value || 0;
    return subtotal + tax + shipping - discount;
  }

  generatePONumber(): string {
    const year = new Date().getFullYear();
    const existingPOs = this.purchaseOrders.filter(po => po.poNumber.startsWith(`PO-${year}-`));
    const maxNumber = existingPOs.reduce((max, po) => {
      const match = po.poNumber.match(/PO-\d{4}-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return `PO-${year}-${String(maxNumber + 1).padStart(3, '0')}`;
  }

  async createFromRequisition(requisitionId: string) {
    const requisition = this.requisitions.find(r => r.requisitionId === requisitionId);
    if (!requisition || requisition.status !== 'Approved') {
      console.warn('Requisition not found or not approved');
      return;
    }

    this.showAddForm();
    
    // Pre-fill form with requisition data
    this.poForm.patchValue({
      projectId: requisition.projectId,
      siteId: requisition.siteId,
      requisitionId: requisition.requisitionId,
      notes: `Created from Requisition: ${requisition.title}`
    });

    // Add items from requisition
    this.items.clear();
    requisition.items.forEach(reqItem => {
      this.items.push(this.createLineItem(
        reqItem.materialId,
        reqItem.quantity - reqItem.fulfilledQuantity,
        reqItem.unitPrice
      ));
    });
  }

  editPO(po: PurchaseOrder) {
    if (po.status !== 'Draft') {
      alert('Only Draft purchase orders can be edited');
      return;
    }

    this.isEditing = true;
    this.editingPOId = po.poId;
    
    const expectedDate = po.expectedDeliveryDate instanceof Timestamp
      ? new Date(po.expectedDeliveryDate.toMillis()).toISOString().split('T')[0]
      : new Date(po.expectedDeliveryDate).toISOString().split('T')[0];

    this.poForm.patchValue({
      supplierId: po.supplierId,
      projectId: po.projectId,
      siteId: po.siteId,
      expectedDeliveryDate: expectedDate,
      paymentTerms: po.paymentTerms,
      currency: po.currency,
      notes: po.notes || '',
      taxPercent: po.taxAmount ? (po.taxAmount / po.subtotal * 100) : 15,
      shippingCost: po.shippingCost || 0,
      discount: po.discount || 0
    });

    this.items.clear();
    po.items.forEach((item: any) => {
      this.items.push(this.createLineItem(
        item.materialId,
        item.quantityOrdered,
        item.unitPrice
      ));
    });

    this.showForm = true;
  }

  async savePO(sendNow: boolean = false) {
    if (this.poForm.invalid || this.items.length === 0) {
      alert('Please fill all required fields and add at least one line item');
      return;
    }

    this.isLoading = true;
    try {
      const formValue = this.poForm.value;
      const supplier = this.suppliers.find(s => s.supplierId === formValue.supplierId);
      
      if (!supplier) {
        alert('Invalid supplier selected');
        return;
      }

      const items: PurchaseOrderItem[] = formValue.items.map((item: any, index: number) => {
        const material = this.getMaterial(item.materialId);
        return {
          lineNumber: index + 1,
          materialId: item.materialId,
          materialCode: material?.code || '',
          materialName: material?.name || '',
          description: material?.description || '',
          quantityOrdered: item.quantity,
          unit: material?.unit || '',
          unitPrice: item.unitPrice,
          lineTotal: item.quantity * item.unitPrice,
          quantityReceived: 0,
          quantityOutstanding: item.quantity
        };
      });

      const subtotal = this.getSubtotal();
      const taxAmount = this.getTaxAmount();
      const totalAmount = this.getTotal();

      const poData: Omit<PurchaseOrder, 'poId'> = {
        orgId: 'org1',
        poNumber: this.isEditing && this.editingPOId 
          ? this.purchaseOrders.find(p => p.poId === this.editingPOId)!.poNumber
          : this.generatePONumber(),
        supplierId: formValue.supplierId,
        supplierName: supplier.companyName,
        requisitionIds: formValue.requisitionId ? [formValue.requisitionId] : [],
        projectId: formValue.projectId,
        siteId: formValue.siteId || '',
        expectedDeliveryDate: Timestamp.fromDate(new Date(formValue.expectedDeliveryDate)),
        status: sendNow ? 'Sent' : 'Draft',
        items: items,
        subtotal: subtotal,
        taxAmount: taxAmount,
        shippingCost: formValue.shippingCost,
        discount: formValue.discount,
        totalAmount: totalAmount,
        currency: formValue.currency,
        paymentTerms: formValue.paymentTerms,
        notes: formValue.notes,
        createdBy: 'current-user',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        sentAt: sendNow ? Timestamp.now() : undefined
      };

      if (this.isEditing && this.editingPOId) {
        await this.supplyChainService.updatePurchaseOrder(this.editingPOId, poData);
      } else {
        await this.supplyChainService.createPurchaseOrder(poData);
      }

      await this.loadData();
      this.cancelEdit();
      alert(sendNow ? 'Purchase Order sent successfully!' : 'Purchase Order saved as draft');
    } catch (error) {
      console.error('Error saving PO:', error);
      alert('Error saving purchase order');
    } finally {
      this.isLoading = false;
    }
  }

  async sendPO(po: PurchaseOrder) {
    if (po.status !== 'Draft') {
      alert('Only Draft purchase orders can be sent');
      return;
    }

    if (!confirm(`Send Purchase Order ${po.poNumber} to ${po.supplierName}?`)) {
      return;
    }

    try {
      await this.supplyChainService.updatePurchaseOrder(po.poId, {
        status: 'Sent',
        sentAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await this.loadData();
      alert('Purchase Order sent successfully!');
    } catch (error) {
      console.error('Error sending PO:', error);
      alert('Error sending purchase order');
    }
  }

  async deletePO(po: PurchaseOrder) {
    if (po.status !== 'Draft') {
      alert('Only Draft purchase orders can be deleted');
      return;
    }

    if (!confirm(`Are you sure you want to delete PO ${po.poNumber}?`)) {
      return;
    }

    try {
      await this.supplyChainService.deletePurchaseOrder(po.poId);
      await this.loadData();
      alert('Purchase Order deleted successfully');
    } catch (error) {
      console.error('Error deleting PO:', error);
      alert('Error deleting purchase order');
    }
  }

  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.editingPOId = null;
    this.poForm.reset();
    this.items.clear();
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Sent': 'bg-blue-100 text-blue-800',
      'Acknowledged': 'bg-purple-100 text-purple-800',
      'Receiving': 'bg-yellow-100 text-yellow-800',
      'Closed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(date: Timestamp | Date): string {
    const d = date instanceof Timestamp ? date.toDate() : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  }

  getSupplierName(supplierId: string): string {
    return this.suppliers.find(s => s.supplierId === supplierId)?.companyName || 'Unknown';
  }

  getProjectName(projectId: string): string {
    return this.projects.find(p => p.projectId === projectId)?.projectName || 'Unknown';
  }

  getApprovedRequisitions(): Requisition[] {
    return this.requisitions.filter(r => r.status === 'Approved');
  }
}
