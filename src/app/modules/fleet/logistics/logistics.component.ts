import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FleetService } from '../../../services/fleet.service';
import { Vehicle, Rig } from '../../../models';

interface LogisticsState {
  isLoading: boolean;
  vehicles: Vehicle[];
  rigs: Rig[];
  activeVehicles: Vehicle[];
  activeRigs: Rig[];
  error: string | null;
}

@Component({
  selector: 'app-logistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logistics.component.html',
  styleUrls: ['./logistics.component.scss']
})
export class LogisticsComponent implements OnInit {
  state: LogisticsState;

  constructor(private fleetService: FleetService, private router: Router) {
    this.state = {
      isLoading: false,
      vehicles: [],
      rigs: [],
      activeVehicles: [],
      activeRigs: [],
      error: null
    };
  }

  ngOnInit(): void {
    this.loadFleetData();
  }

  async loadFleetData(): Promise<void> {
    try {
      this.state.isLoading = true;
      // TODO: Get orgId from auth service
      const orgId = 'default-org';

      this.state.vehicles = await this.fleetService.getVehicles(orgId);
      this.state.rigs = await this.fleetService.getRigs(orgId);

      // Filter active assets
      this.state.activeVehicles = this.state.vehicles.filter(v => v.status === 'Active');
      this.state.activeRigs = this.state.rigs.filter(r => r.status === 'Active' || r.status === 'Standby');

    } catch (error: any) {
      this.state.error = error.message || 'Failed to load fleet data';
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

  getLocationStatus(location: string): string {
    // Simple logic to determine if asset is at site or depot
    if (location.toLowerCase().includes('site') || location.toLowerCase().includes('field')) {
      return 'At Site';
    } else if (location.toLowerCase().includes('depot') || location.toLowerCase().includes('base')) {
      return 'At Depot';
    } else {
      return 'In Transit';
    }
  }

  getLocationClass(location: string): string {
    const status = this.getLocationStatus(location);
    switch (status) {
      case 'At Site': return 'bg-green-100 text-green-800';
      case 'At Depot': return 'bg-blue-100 text-blue-800';
      case 'In Transit': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  get assetsAtSite(): number {
    return [...this.state.vehicles, ...this.state.rigs].filter(asset => this.getLocationStatus(asset.location) === 'At Site').length;
  }

  get assetsAtDepot(): number {
    return [...this.state.vehicles, ...this.state.rigs].filter(asset => this.getLocationStatus(asset.location) === 'At Depot').length;
  }

  get assetsInTransit(): number {
    return [...this.state.vehicles, ...this.state.rigs].filter(asset => this.getLocationStatus(asset.location) === 'In Transit').length;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}