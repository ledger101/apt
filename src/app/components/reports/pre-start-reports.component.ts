import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PreStartCheck, Vehicle } from '@app/models';
import { FleetService } from '@app/services/fleet.service';
import { AuthService } from '@app/services/auth.service';

@Component({
  selector: 'app-pre-start-reports',
  templateUrl: './pre-start-reports.component.html',
  styleUrls: ['./pre-start-reports.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PreStartReportsComponent implements OnInit {
  vehicles: Vehicle[] = [];
  selectedVehicleId: string = '';
  checks: PreStartCheck[] = [];
  loading = false;

  constructor(private fleetService: FleetService, private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    await this.loadVehicles();
  }

  async loadVehicles() {
    try {
      const userProfile = this.authService.getCurrentUserProfile();
      if (userProfile) {
        this.vehicles = await this.fleetService.getVehicles(userProfile.orgId);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  }

  onVehicleChange() {
    if (this.selectedVehicleId) {
      this.loadChecks();
    } else {
      this.checks = [];
    }
  }

  async loadChecks() {
    this.loading = true;
    try {
      this.checks = await this.fleetService.getPreStartChecksByVehicle(this.selectedVehicleId);
    } catch (error) {
      console.error('Error loading checks:', error);
    } finally {
      this.loading = false;
    }
  }

  viewCheck(check: PreStartCheck) {
    // Placeholder: open modal or navigate to detail
    console.log('View check:', check);
    alert('View details not implemented yet.');
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}