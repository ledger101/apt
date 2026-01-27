import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
    selector: 'app-personnel-home',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './personnel-home.component.html',
    styleUrls: ['./personnel-home.component.scss']
})
export class PersonnelHomeComponent {
    quickActions: QuickAction[] = [
        {
            title: 'Leave Tracking',
            description: 'Manage leave requests and approvals',
            icon: 'calendar',
            route: '/personnel/leave-tracking',
            color: 'blue'
        },
        {
            title: 'Onboarding',
            description: 'New employee onboarding process',
            icon: 'user-add',
            route: '/personnel/onboarding',
            color: 'green'
        }
    ];

    summaryCards: SummaryCard[] = [
        {
            label: 'Total Employees',
            value: 45,
            icon: 'users',
            color: 'blue',
            trend: '+3 this quarter'
        },
        {
            label: 'Pending Leave',
            value: 5,
            icon: 'calendar',
            color: 'yellow',
            trend: '3 awaiting approval'
        },
        {
            label: 'Active Onboarding',
            value: 2,
            icon: 'user-add',
            color: 'green',
            trend: 'In progress'
        },
        {
            label: 'Certifications Due',
            value: 7,
            icon: 'badge',
            color: 'purple',
            trend: 'Next 30 days'
        }
    ];

    constructor(private router: Router) { }

    navigateTo(route: string): void {
        this.router.navigate([route]);
    }

    getIconPath(icon: string): string {
        const iconMap: { [key: string]: string } = {
            'users': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
            'calendar': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            'user-add': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
            'badge': 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
        };
        return iconMap[icon] || '';
    }
}
