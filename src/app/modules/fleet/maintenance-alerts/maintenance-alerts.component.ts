import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FleetService } from '../../../services/fleet.service';
import { Vehicle, Rig, MaintenanceSchedule } from '../../../models';
import { Timestamp } from 'firebase/firestore';

interface MaintenanceAlertsState {
  isLoading: boolean;
  overdueMaintenance: MaintenanceSchedule[];
  upcomingMaintenance: MaintenanceSchedule[];
  vehicles: Vehicle[];
  rigs: Rig[];
  error: string | null;
}

@Component({
  selector: 'app-maintenance-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance-alerts.component.html',
  styleUrls: ['./maintenance-alerts.component.scss']
})
export class MaintenanceAlertsComponent implements OnInit {
  state: MaintenanceAlertsState;

  constructor(private fleetService: FleetService, private router: Router) {
    this.state = {
      isLoading: false,
      overdueMaintenance: [],
      upcomingMaintenance: [],
      vehicles: [],
      rigs: [],
      error: null
    };
  }

  ngOnInit(): void {
    this.loadMaintenanceAlerts();
    this.loadAssets();
  }

  async loadMaintenanceAlerts(): Promise<void> {
    try {
      this.state.isLoading = true;
      // TODO: Get orgId from auth service
      const orgId = 'default-org';

      // Load maintenance schedules
      const schedules = await this.fleetService.getMaintenanceSchedules(orgId);

      // Filter overdue and upcoming
      const now = Timestamp.fromDate(new Date());
      this.state.overdueMaintenance = schedules.filter(schedule =>
        schedule.status === 'Overdue' ||
        (schedule.dueDate < now && schedule.status !== 'Completed')
      );

      const nextMonth = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      this.state.upcomingMaintenance = schedules.filter(schedule =>
        schedule.dueDate >= now &&
        schedule.dueDate <= nextMonth &&
        schedule.status === 'Pending'
      );

    } catch (error: any) {
      this.state.error = error.message || 'Failed to load maintenance alerts';
    } finally {
      this.state.isLoading = false;
    }
  }

  async loadAssets(): Promise<void> {
    try {
      // TODO: Get orgId from auth service
      const orgId = 'default-org';
      this.state.vehicles = await this.fleetService.getVehicles(orgId);
      this.state.rigs = await this.fleetService.getRigs(orgId);
    } catch (error: any) {
      console.error('Failed to load assets:', error);
    }
  }

  getAssetName(schedule: MaintenanceSchedule): string {
    if (schedule.assetType === 'Vehicle') {
      const vehicle = this.state.vehicles.find(v => v.vehicleId === schedule.assetId);
      return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'Unknown Vehicle';
    } else {
      const rig = this.state.rigs.find(r => r.rigId === schedule.assetId);
      return rig ? rig.name : 'Unknown Rig';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: any): string {
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    return date ? new Date(date).toLocaleDateString() : 'N/A';
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}