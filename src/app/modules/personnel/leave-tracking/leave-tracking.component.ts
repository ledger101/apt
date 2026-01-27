import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PersonnelService } from '../../../services/personnel.service';
import { Employee, LeaveRequest } from '../../../models';

interface LeaveTrackingState {
  isLoading: boolean;
  leaveForm: FormGroup;
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  selectedEmployee: Employee | null;
  error: string | null;
  success: string | null;
}

@Component({
  selector: 'app-leave-tracking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './leave-tracking.component.html',
  styleUrls: ['./leave-tracking.component.scss']
})
export class LeaveTrackingComponent implements OnInit {
  state: LeaveTrackingState;

  constructor(
    private fb: FormBuilder,
    private personnelService: PersonnelService,
    private router: Router
  ) {
    this.state = {
      isLoading: false,
      leaveForm: this.createLeaveForm(),
      employees: [],
      leaveRequests: [],
      selectedEmployee: null,
      error: null,
      success: null
    };
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadAllLeaveRequests();
  }

  formatDate(timestamp: any): Date {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  private createLeaveForm(): FormGroup {
    return this.fb.group({
      employeeId: ['', [Validators.required]],
      type: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      reason: ['', [Validators.required]]
    });
  }

  async loadEmployees(): Promise<void> {
    try {
      // TODO: Get orgId from auth service
      const orgId = 'default-org';
      this.state.employees = await this.personnelService.getEmployees(orgId);
    } catch (error: any) {
      this.state.error = error.message || 'Failed to load employees';
    }
  }

  async loadAllLeaveRequests(): Promise<void> {
    try {
      this.state.isLoading = true;
      // For MVP, load all leave requests (in real app, filter by org/department)
      // Since we don't have a method to get all, we'll load per employee
      const allRequests: LeaveRequest[] = [];
      for (const employee of this.state.employees) {
        const requests = await this.personnelService.getEmployeeLeaveRequests(employee.employeeId);
        allRequests.push(...requests);
      }
      this.state.leaveRequests = allRequests.sort((a, b) => {
        const aTime = this.formatDate(a.createdAt).getTime();
        const bTime = this.formatDate(b.createdAt).getTime();
        return bTime - aTime;
      });
    } catch (error: any) {
      this.state.error = error.message || 'Failed to load leave requests';
    } finally {
      this.state.isLoading = false;
    }
  }

  calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  }

  async onLeaveSubmit(): Promise<void> {
    if (this.state.leaveForm.invalid) {
      this.state.error = 'Please fill in all required fields';
      return;
    }

    const formValue = this.state.leaveForm.value;
    const days = this.calculateDays(formValue.startDate, formValue.endDate);

    if (days <= 0) {
      this.state.error = 'End date must be after start date';
      return;
    }

    try {
      this.state.isLoading = true;
      this.state.error = null;

      const leaveData = {
        ...formValue,
        days,
        status: 'Pending' as const
      };

      await this.personnelService.createLeaveRequest(leaveData);
      this.state.success = 'Leave request submitted successfully!';
      this.state.leaveForm.reset();
      this.loadAllLeaveRequests();
    } catch (error: any) {
      this.state.error = error.message || 'Failed to submit leave request';
    } finally {
      this.state.isLoading = false;
    }
  }

  async updateLeaveStatus(leaveId: string, status: LeaveRequest['status']): Promise<void> {
    try {
      this.state.isLoading = true;
      // TODO: Get current user ID
      const approvedBy = 'manager-id';

      await this.personnelService.updateLeaveRequestStatus(leaveId, status, status === 'Approved' ? approvedBy : undefined);
      this.state.success = `Leave request ${status.toLowerCase()} successfully!`;
      this.loadAllLeaveRequests();
    } catch (error: any) {
      this.state.error = error.message || 'Failed to update leave request';
    } finally {
      this.state.isLoading = false;
    }
  }

  getEmployeeName(employeeId: string): string {
    const employee = this.state.employees.find(e => e.employeeId === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
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