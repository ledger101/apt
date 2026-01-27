import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupplyChainService } from '../../../services/supply-chain.service';
import { Material } from '../../../models';

@Component({
  selector: 'app-material-master',
  templateUrl: './material-master.component.html',
  styleUrls: ['./material-master.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
})
export class MaterialMasterComponent implements OnInit {
  materials: Material[] = [];
  materialForm: FormGroup;
  isEditing = false;
  editingMaterialId: string | null = null;
  isLoading = false;
  showForm = false;

  categories = ['Fuel', 'Chemicals', 'Equipment', 'Consumables', 'Tools', 'Spare Parts'];
  units = ['L', 'kg', 'm', 'pcs', 'm³', 'tons', 'gallons'];

  constructor(
    private fb: FormBuilder,
    private supplyChainService: SupplyChainService,
    private router: Router
  ) {
    this.materialForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', Validators.required],
      category: ['', Validators.required],
      subcategory: [''],
      unit: ['', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      minStockLevel: [0, [Validators.required, Validators.min(0)]],
      maxStockLevel: [null],
      supplier: [''],
      partNumber: [''],
      specifications: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadMaterials();
  }

  async loadMaterials() {
    this.isLoading = true;
    try {
      const orgId = 'org1';
      this.materials = await this.supplyChainService.getMaterialsByOrg(orgId);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      this.isLoading = false;
    }
  }

  showAddForm() {
    this.isEditing = false;
    this.editingMaterialId = null;
    this.materialForm.reset({
      isActive: true,
      unitPrice: 0,
      minStockLevel: 0
    });
    this.showForm = true;
  }

  editMaterial(material: Material) {
    this.isEditing = true;
    this.editingMaterialId = material.materialId;
    this.materialForm.patchValue({
      code: material.code,
      name: material.name,
      description: material.description,
      category: material.category,
      subcategory: material.subcategory || '',
      unit: material.unit,
      unitPrice: material.unitPrice,
      minStockLevel: material.minStockLevel,
      maxStockLevel: material.maxStockLevel || null,
      supplier: material.supplier || '',
      partNumber: material.partNumber || '',
      specifications: material.specifications || '',
      isActive: material.isActive
    });
    this.showForm = true;
  }

  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.editingMaterialId = null;
    this.materialForm.reset();
  }

  async saveMaterial() {
    if (this.materialForm.invalid) {
      return;
    }

    this.isLoading = true;
    try {
      const formValue = this.materialForm.value;
      const materialData = {
        ...formValue,
        orgId: 'org1',
        currentStock: 0,
        createdBy: 'user1'
      };

      if (this.isEditing && this.editingMaterialId) {
        await this.supplyChainService.updateMaterial(this.editingMaterialId, materialData);
      } else {
        await this.supplyChainService.createMaterial(materialData);
      }

      this.cancelEdit();
      await this.loadMaterials();
    } catch (error) {
      console.error('Error saving material:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteMaterial(material: Material) {
    if (!confirm(`Are you sure you want to delete ${material.name}?`)) {
      return;
    }

    this.isLoading = true;
    try {
      await this.supplyChainService.deleteMaterial(material.materialId);
      await this.loadMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getStockStatus(material: Material): { status: string; color: string } {
    const currentStock = material.currentStock || 0;
    if (currentStock <= material.minStockLevel) {
      return { status: 'Low Stock', color: 'text-red-600 bg-red-50' };
    } else if (material.maxStockLevel && currentStock >= material.maxStockLevel) {
      return { status: 'Overstock', color: 'text-yellow-600 bg-yellow-50' };
    }
    return { status: 'In Stock', color: 'text-green-600 bg-green-50' };
  }

  getStockStatusClass(material: Material): string {
    const currentStock = material.currentStock || 0;
    if (currentStock <= material.minStockLevel) {
      return 'inactive';
    } else if (material.maxStockLevel && currentStock >= material.maxStockLevel) {
      return 'pending';
    }
    return 'active';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}