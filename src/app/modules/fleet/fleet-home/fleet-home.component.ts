import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FleetService } from '../../../services/fleet.service';

interface QuickAction {
    title: string;
    description: string;
    icon: string;
    route: string;
    color: string;
}

interface SummaryCard {
    label: string;
    value: number | string;
    icon: string;
    color: string;
    trend?: string;
}

@Component({
    selector: 'app-fleet-home',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './fleet-home.component.html',
    styleUrls: ['./fleet-home.component.scss']
})
export class FleetHomeComponent implements OnInit {
    quickActions: QuickAction[] = [
        {
            title: 'Asset Register',
            description: 'Register new vehicles and rigs',
            icon: 'plus',
            route: '/fleet/asset-register',
            color: 'blue'
        },
        {
            title: 'Maintenance Alerts',
            description: 'View upcoming service schedules',
            icon: 'alert',
            route: '/fleet/maintenance-alerts',
            color: 'yellow'
        },
        {
            title: 'Pre-Start Checks',
            description: 'Daily vehicle inspections',
            icon: 'check',
            route: '/fleet/pre-start-check',
            color: 'green'
        },
        {
            title: 'Logistics',
            description: 'Track vehicle locations',
            icon: 'map',
            route: '/fleet/logistics',
            color: 'purple'
        }
    ];

    summaryCards: SummaryCard[] = [
        {
            label: 'Total Vehicles',
            value: 12,
            icon: 'truck',
            color: 'blue',
            trend: '+2 this month'
        },
        {
            label: 'Active Rigs',
            value: 5,
            icon: 'cog',
            color: 'green',
            trend: '3 in operation'
        },
        {
            label: 'Maintenance Due',
            value: 3,
            icon: 'alert',
            color: 'yellow',
            trend: 'Next 7 days'
        },
        {
            label: 'Service Completed',
            value: 8,
            icon: 'check',
            color: 'purple',
            trend: 'This month'
        }
    ];

    constructor(
        private router: Router,
        private fleetService: FleetService
    ) { }

    ngOnInit(): void {
        // Load summary data
        this.loadSummaryData();
    }

    async loadSummaryData(): Promise<void> {
        try {
            const orgId = 'default-org';
            const vehicles = await this.fleetService.getVehicles(orgId);
            const rigs = await this.fleetService.getRigs(orgId);

            this.summaryCards[0].value = vehicles.length;
            this.summaryCards[1].value = rigs.filter(r => r.status === 'Active').length;
        } catch (error) {
            console.error('Error loading summary data:', error);
        }
    }

    navigateTo(route: string): void {
        this.router.navigate([route]);
    }

    getIconPath(icon: string): string {
        const iconMap: { [key: string]: string } = {
            'plus': 'M12 4v16m8-8H4',
            'alert': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
            'check': 'M5 13l4 4L19 7',
            'map': 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
            'truck': 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 104 0',
            'cog': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
        };
        return iconMap[icon] || '';
    }
}
