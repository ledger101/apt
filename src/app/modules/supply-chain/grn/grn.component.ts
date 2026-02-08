import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SupplyChainService } from '../../../services/supply-chain.service';
import { GoodsReceivedNote, GoodsReceivedItem, PurchaseOrder, PurchaseOrderItem, Project, InventoryTransaction } from '../../../models';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-grn',
  templateUrl: './grn.component.html',
  styleUrls: ['./grn.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
})
export class GrnComponent implements OnInit {
  grns: GoodsReceivedNote[] = [];
  purchaseOrders: PurchaseOrder[] = [];
  projects: Project[] = [];
  
  grnForm: FormGroup;
  selectedPO: PurchaseOrder | null = null;
  isLoading = false;
  showForm = false;

  qualityCheckOptions = ['Passed', 'Failed', 'Partial'];

  constructor(
    private fb: FormBuilder,
    private supplyChainService: SupplyChainService
  ) {
    this.grnForm = this.fb.group({
      poId: ['', Validators.required],
      dateReceived: [new Date().toISOString().split('T')[0], Validators.required],
      receivedBy: ['', Validators.required],
      deliveryNoteRef: [''],
      invoiceRef: [''],
      qualityCheckStatus: ['Passed', Validators.required],
      discrepancyNotes: [''],
      items: this.fb.array([])
    });
  }

  ngOnInit() {
    this.loadData();
  }

  get items(): FormArray {
    return this.grnForm.get('items') as FormArray;
  }

  async loadData() {
    this.isLoading = true;
    try {
      const orgId = 'org1';
      [this.grns, this.purchaseOrders, this.projects] = await Promise.all([
        this.supplyChainService.getGRNsByOrg(orgId),
        this.supplyChainService.getPurchaseOrdersByOrg(orgId),
        this.supplyChainService.getProjectsByOrg(orgId)
      ]);
    } catch (error) {
      console.error('Error loading GRN data:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  getOpenPurchaseOrders(): PurchaseOrder[] {
    return this.purchaseOrders.filter(po => 
      po.status === 'Sent' || po.status === 'Acknowledged' || po.status === 'Receiving'
    );
  }

  selectPO(event: Event) {
    const poId = (event.target as HTMLSelectElement).value;
    this.selectedPO = this.purchaseOrders.find(po => po.poId === poId) || null;
    
    if (this.selectedPO) {
      this.loadPOItems();
    } else {
      this.items.clear();
    }
  }

  loadPOItems() {
    if (!this.selectedPO) return;

    this.items.clear();
    
    this.selectedPO.items.forEach((item: PurchaseOrderItem) => {
      const qtyOutstanding = item.quantityOrdered - item.quantityReceived;
      
      this.items.push(this.fb.group({
        lineNumber: [this.items.length + 1],
        poLineNumber: [item.lineNumber],
        materialId: [item.materialId],
        materialCode: [item.materialCode],
        materialName: [item.materialName],
        quantityOrdered: [item.quantityOrdered],
        quantityPreviouslyReceived: [item.quantityReceived],
        quantityOutstanding: [qtyOutstanding],
        quantityReceived: [0, [Validators.required, Validators.min(0), Validators.max(qtyOutstanding)]],
        quantityRejected: [0, [Validators.min(0)]],
        unit: [item.unit],
        unitCost: [item.unitPrice],
        storageLocation: [''],
        conditionNotes: ['']
      }));
    });
  }

  onQuantityChange(index: number) {
    const itemControl = this.items.at(index);
    const qtyReceived = itemControl.get('quantityReceived')?.value || 0;
    const qtyRejected = itemControl.get('quantityRejected')?.value || 0;
    const qtyOutstanding = itemControl.get('quantityOutstanding')?.value || 0;
    
    // Validate that received + rejected doesn't exceed outstanding
    if (qtyReceived + qtyRejected > qtyOutstanding) {
      alert('Received + Rejected quantity cannot exceed outstanding quantity');
      itemControl.get('quantityReceived')?.setValue(0);
      itemControl.get('quantityRejected')?.setValue(0);
    }
  }

  calculateTotalValue(): number {
    let total = 0;
    this.items.controls.forEach(control => {
      const qtyReceived = control.get('quantityReceived')?.value || 0;
      const unitCost = control.get('unitCost')?.value || 0;
      total += qtyReceived * unitCost;
    });
    return total;
  }

  showAddForm() {
    this.showForm = true;
    this.grnForm.reset({
      dateReceived: new Date().toISOString().split('T')[0],
      qualityCheckStatus: 'Passed'
    });
    this.selectedPO = null;
    this.items.clear();
  }

  cancelForm() {
    this.showForm = false;
    this.grnForm.reset();
    this.selectedPO = null;
    this.items.clear();
  }

  async saveGRN() {
    if (!this.grnForm.valid || !this.selectedPO) {
      alert('Please fill all required fields and select a PO');
      return;
    }

    // Validate that at least one item has quantity received
    const hasReceivedItems = this.items.controls.some(
      control => (control.get('quantityReceived')?.value || 0) > 0
    );

    if (!hasReceivedItems) {
      alert('Please enter received quantity for at least one item');
      return;
    }

    this.isLoading = true;
    try {
      const orgId = 'org1';
      const currentUser = 'current-user-id'; // TODO: Get from auth service
      
      // Generate GRN number
      const grnNumber = await this.generateGRNNumber(orgId);
      
      const formValue = this.grnForm.value;
      const dateReceived = new Date(formValue.dateReceived);
      
      // Prepare GRN items
      const grnItems: GoodsReceivedItem[] = this.items.controls
        .map((control, index) => ({
          lineNumber: index + 1,
          poLineNumber: control.get('poLineNumber')?.value,
          materialId: control.get('materialId')?.value,
          materialCode: control.get('materialCode')?.value,
          materialName: control.get('materialName')?.value,
          quantityOrdered: control.get('quantityOrdered')?.value,
          quantityReceived: control.get('quantityReceived')?.value || 0,
          quantityRejected: control.get('quantityRejected')?.value || 0,
          unit: control.get('unit')?.value,
          unitCost: control.get('unitCost')?.value,
          lineTotal: (control.get('quantityReceived')?.value || 0) * control.get('unitCost')?.value,
          storageLocation: control.get('storageLocation')?.value,
          conditionNotes: control.get('conditionNotes')?.value
        }))
        .filter(item => item.quantityReceived > 0); // Only include items with received quantity

      const grn: Omit<GoodsReceivedNote, 'grnId'> = {
        orgId,
        grnNumber,
        poId: this.selectedPO.poId,
        poNumber: this.selectedPO.poNumber,
        supplierId: this.selectedPO.supplierId,
        supplierName: this.selectedPO.supplierName,
        projectId: this.selectedPO.projectId,
        siteId: this.selectedPO.siteId,
        dateReceived: Timestamp.fromDate(dateReceived),
        receivedBy: formValue.receivedBy,
        deliveryNoteRef: formValue.deliveryNoteRef,
        invoiceRef: formValue.invoiceRef,
        qualityCheckStatus: formValue.qualityCheckStatus,
        items: grnItems,
        totalValue: this.calculateTotalValue(),
        notes: '',
        discrepancyNotes: formValue.discrepancyNotes,
        createdBy: currentUser,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Create GRN
      const grnId = await this.supplyChainService.createGRN(grn);

      // Update PO line items with quantities received
      const updatedPOItems = this.selectedPO.items.map(poItem => {
        const grnItem = grnItems.find(gi => gi.poLineNumber === poItem.lineNumber);
        if (grnItem) {
          const newQtyReceived = poItem.quantityReceived + grnItem.quantityReceived;
          return {
            ...poItem,
            quantityReceived: newQtyReceived,
            quantityOutstanding: poItem.quantityOrdered - newQtyReceived
          };
        }
        return poItem;
      });

      // Check if PO is fully received
      const allItemsReceived = updatedPOItems.every(
        item => item.quantityReceived >= item.quantityOrdered
      );
      const newPOStatus = allItemsReceived ? 'Closed' : 'Receiving';

      // Update PO
      await this.supplyChainService.updatePurchaseOrder(this.selectedPO.poId, {
        status: newPOStatus,
        items: updatedPOItems,
        updatedAt: Timestamp.now()
      });

      // Create inventory transactions for received items (only if quality check passed)
      if (formValue.qualityCheckStatus === 'Passed' || formValue.qualityCheckStatus === 'Partial') {
        for (const grnItem of grnItems) {
          if (grnItem.quantityReceived > 0) {
            const transaction: Omit<InventoryTransaction, 'transactionId' | 'transactionDate' | 'createdAt'> = {
              orgId,
              siteId: this.selectedPO.siteId,
              materialId: grnItem.materialId,
              transactionType: 'Adjustment',
              quantity: grnItem.quantityReceived,
              previousStock: 0, // TODO: Get actual stock from inventory
              newStock: grnItem.quantityReceived, // TODO: Calculate actual new stock
              reference: grnId,
              referenceType: 'PurchaseOrder',
              performedBy: currentUser,
              notes: `Received via GRN ${grnNumber} from PO ${this.selectedPO.poNumber}`
            };
            await this.supplyChainService.createInventoryTransaction(transaction);
          }
        }
      }

      alert('GRN created successfully');
      this.cancelForm();
      await this.loadData();
    } catch (error) {
      console.error('Error saving GRN:', error);
      alert('Failed to save GRN. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async generateGRNNumber(orgId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const orgGRNs = this.grns.filter(g => g.grnNumber.includes(`GRN-${currentYear}`));
    const maxNumber = orgGRNs.reduce((max, grn) => {
      const match = grn.grnNumber.match(/GRN-\d{4}-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    
    const nextNumber = maxNumber + 1;
    return `GRN-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
  }

  getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.projectId === projectId);
    return project ? project.projectName : projectId;
  }

  getPONumber(poId: string): string {
    const po = this.purchaseOrders.find(p => p.poId === poId);
    return po ? po.poNumber : poId;
  }

  formatDate(timestamp: Timestamp): string {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleDateString();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  getQualityCheckClass(status: string): string {
    switch (status) {
      case 'Passed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  async deleteGRN(grnId: string) {
    if (!confirm('Are you sure you want to delete this GRN? This action cannot be undone and may affect inventory records.')) {
      return;
    }

    this.isLoading = true;
    try {
      await this.supplyChainService.deleteGRN(grnId);
      alert('GRN deleted successfully');
      await this.loadData();
    } catch (error) {
      console.error('Error deleting GRN:', error);
      alert('Failed to delete GRN. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }
}
