import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PreStartCheckService } from './pre-start-check.service';
import { PreStartCheck, PreStartCheckItem, Vehicle } from '@app/models';
import { FleetService } from '@app/services/fleet.service';
import { AuthService } from '@app/services/auth.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-pre-start-check',
  templateUrl: './pre-start-check.component.html',
  styleUrls: ['./pre-start-check.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PreStartCheckComponent implements OnInit {
  check: PreStartCheck = this.createEmptyCheck();
  vehicles: Vehicle[] = [];

  constructor(
    private preStartCheckService: PreStartCheckService,
    private fleetService: FleetService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadVehicles();
    this.initializeCheck();
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

  async initializeCheck() {
    const now = new Date();
    this.check.date = Timestamp.fromDate(now);
    const hour = now.getHours();
    if (hour >= 6 && hour < 12) {
      this.check.shift = 'Morning';
    } else if (hour >= 12 && hour < 18) {
      this.check.shift = 'Afternoon';
    } else {
      this.check.shift = 'Evening';
    }
    this.check.checklistItems = this.preStartCheckService.getChecklist();
    // Set submittedBy and orgId from auth
    const userProfile = this.authService.getCurrentUserProfile();
    if (userProfile) {
      this.check.submittedBy = userProfile.uid;
      this.check.orgId = userProfile.orgId;
    }
  }

  async submitCheck() {
    // Validate
    if (!this.check.vehicleId) {
      alert('Please select a vehicle.');
      return;
    }
    try {
      await this.fleetService.submitPreStartCheck(this.check);
      alert('Pre-start check submitted successfully!');
      this.router.navigate(['/fleet']);
    } catch (error) {
      console.error('Error submitting check:', error);
      alert('Error submitting check.');
    }
  }

  private createEmptyCheck(): PreStartCheck {
    return {
      checkId: '',
      orgId: '', // Set from auth or org
      vehicleId: '',
      date: Timestamp.now(),
      shift: 'Morning',
      checklistItems: [],
      odometerReading: 0,
      submittedBy: '',
      status: 'Submitted',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
  }

  navigateToFleet(): void {
    this.router.navigate(['/fleet']);
  }
}