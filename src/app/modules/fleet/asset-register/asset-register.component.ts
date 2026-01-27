import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FleetService } from '../../../services/fleet.service';
import { Vehicle, Rig } from '../../../models';
import { AlertComponent } from '../../../components/alert/alert.component';

interface AssetRegisterState {
  isLoading: boolean;
  activeTab: 'vehicles' | 'rigs';
  vehicleForm: FormGroup;
  rigForm: FormGroup;
  vehicles: Vehicle[];
  rigs: Rig[];
  error: string | null;
  success: string | null;
}

@Component({
  selector: 'app-asset-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent],
  templateUrl: './asset-register.component.html',
  styleUrls: ['./asset-register.component.scss']
})
export class AssetRegisterComponent implements OnInit {
  state: AssetRegisterState;

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private router: Router
  ) {
    this.state = {
      isLoading: false,
      activeTab: 'vehicles',
      vehicleForm: this.createVehicleForm(),
      rigForm: this.createRigForm(),
      vehicles: [],
      rigs: [],
      error: null,
      success: null
    };
  }

  get maxYear(): number {
    return new Date().getFullYear() + 1;
  }

  ngOnInit(): void {
    this.loadVehicles();
    this.loadRigs();
  }

  private createVehicleForm(): FormGroup {
    return this.fb.group({
      make: ['', [Validators.required]],
      model: ['', [Validators.required]],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      licensePlate: ['', [Validators.required]],
      mileage: [0, [Validators.required, Validators.min(0)]],
      serviceInterval: [5000, [Validators.required, Validators.min(1000)]],
      location: ['', [Validators.required]]
    });
  }

  private createRigForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      type: ['', [Validators.required]],
      engineHours: [0, [Validators.required, Validators.min(0)]],
      serviceInterval: [3000, [Validators.required, Validators.min(500)]],
      location: ['', [Validators.required]]
    });
  }

  setActiveTab(tab: 'vehicles' | 'rigs'): void {
    this.state.activeTab = tab;
    this.clearMessages();
  }

  async loadVehicles(): Promise<void> {
    try {
      // TODO: Get orgId from auth service
      const orgId = 'default-org';
      this.state.vehicles = await this.fleetService.getVehicles(orgId);
    } catch (error: any) {
      this.state.error = error.message || 'Failed to load vehicles';
    }
  }

  async loadRigs(): Promise<void> {
    try {
      // TODO: Get orgId from auth service
      const orgId = 'default-org';
      this.state.rigs = await this.fleetService.getRigs(orgId);
    } catch (error: any) {
      this.state.error = error.message || 'Failed to load rigs';
    }
  }

  async onVehicleSubmit(): Promise<void> {
    if (this.state.vehicleForm.invalid) {
      this.state.error = 'Please fill in all required fields correctly';
      return;
    }

    try {
      this.state.isLoading = true;
      this.state.error = null;

      const formValue = this.state.vehicleForm.value;
      const lastServiceMileage = formValue.mileage;
      const nextServiceMileage = this.fleetService.calculateNextService({
        ...formValue,
        lastServiceMileage
      } as Vehicle);

      const vehicleData = {
        ...formValue,
        orgId: 'default-org', // TODO: from auth
        lastServiceMileage,
        nextServiceMileage,
        status: 'Active' as const
      };

      await this.fleetService.createVehicle(vehicleData);
      this.state.success = 'Vehicle registered successfully!';
      this.state.vehicleForm.reset();
      this.loadVehicles();
    } catch (error: any) {
      this.state.error = error.message || 'Failed to register vehicle';
    } finally {
      this.state.isLoading = false;
    }
  }

  async onRigSubmit(): Promise<void> {
    if (this.state.rigForm.invalid) {
      this.state.error = 'Please fill in all required fields correctly';
      return;
    }

    try {
      this.state.isLoading = true;
      this.state.error = null;

      const formValue = this.state.rigForm.value;
      const lastServiceHours = formValue.engineHours;
      const nextServiceHours = this.fleetService.calculateNextServiceRig({
        ...formValue,
        lastServiceHours
      } as Rig);

      const rigData = {
        ...formValue,
        orgId: 'default-org', // TODO: from auth
        lastServiceHours,
        nextServiceHours,
        status: 'Standby' as const
      };

      await this.fleetService.createRig(rigData);
      this.state.success = 'Rig registered successfully!';
      this.state.rigForm.reset();
      this.loadRigs();
    } catch (error: any) {
      this.state.error = error.message || 'Failed to register rig';
    } finally {
      this.state.isLoading = false;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Standby': return 'bg-blue-100 text-blue-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Breakdown': return 'bg-red-100 text-red-800';
      case 'Out of Service': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  clearMessages(): void {
    this.state.error = null;
    this.state.success = null;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}