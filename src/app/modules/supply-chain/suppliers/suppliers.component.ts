import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupplyChainService } from '../../../services/supply-chain.service';
import { Supplier } from '../../../models';

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  supplierForm: FormGroup;
  isEditing = false;
  editingSupplierId: string | null = null;
  isLoading = false;
  showForm = false;

  paymentTermsOptions = ['Net 30', 'Net 60', 'COD', 'Net 15', 'Net 90', 'Advance Payment'];

  constructor(
    private fb: FormBuilder,
    private supplyChainService: SupplyChainService,
    private router: Router
  ) {
    this.supplierForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      registrationNumber: [''],
      contactPerson: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      physicalAddress: [''],
      billingAddress: [''],
      taxId: [''],
      paymentTerms: ['Net 30', Validators.required],
      averageLeadTimeDays: [0, [Validators.min(0)]],
      creditLimit: [0, [Validators.min(0)]],
      performanceRating: [3, [Validators.min(1), Validators.max(5)]],
      notes: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadSuppliers();
  }

  async loadSuppliers() {
    this.isLoading = true;
    try {
      const orgId = 'org1';
      this.suppliers = await this.supplyChainService.getSuppliersByOrg(orgId);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      this.isLoading = false;
    }
  }

  showAddForm() {
    this.isEditing = false;
    this.editingSupplierId = null;
    this.supplierForm.reset({
      isActive: true,
      paymentTerms: 'Net 30',
      averageLeadTimeDays: 0,
      creditLimit: 0,
      performanceRating: 3
    });
    this.showForm = true;
  }

  editSupplier(supplier: Supplier) {
    this.isEditing = true;
    this.editingSupplierId = supplier.supplierId;
    this.supplierForm.patchValue({
      companyName: supplier.companyName,
      registrationNumber: supplier.registrationNumber || '',
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      physicalAddress: supplier.physicalAddress || '',
      billingAddress: supplier.billingAddress || '',
      taxId: supplier.taxId || '',
      paymentTerms: supplier.paymentTerms,
      averageLeadTimeDays: supplier.averageLeadTimeDays || 0,
      creditLimit: supplier.creditLimit || 0,
      performanceRating: supplier.performanceRating || 3,
      notes: supplier.notes || '',
      isActive: supplier.isActive
    });
    this.showForm = true;
  }

  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.editingSupplierId = null;
    this.supplierForm.reset();
  }

  async saveSupplier() {
    if (this.supplierForm.invalid) {
      return;
    }

    this.isLoading = true;
    try {
      const formValue = this.supplierForm.value;
      const supplierData = {
        ...formValue,
        orgId: 'org1',
        createdBy: 'user1'
      };

      if (this.isEditing && this.editingSupplierId) {
        await this.supplyChainService.updateSupplier(this.editingSupplierId, supplierData);
      } else {
        await this.supplyChainService.createSupplier(supplierData);
      }

      this.cancelEdit();
      await this.loadSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteSupplier(supplier: Supplier) {
    if (!confirm(`Are you sure you want to delete ${supplier.companyName}?`)) {
      return;
    }

    this.isLoading = true;
    try {
      await this.supplyChainService.deleteSupplier(supplier.supplierId);
      await this.loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getStarRating(rating: number): string {
    return '⭐'.repeat(Math.round(rating));
  }

  navigateToDashboard(): void {
    this.router.navigate(['/supply-chain/dashboard']);
  }
}
