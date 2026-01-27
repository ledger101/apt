import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PersonnelService } from '../../../services/personnel.service';
import { Employee, Certification } from '../../../models';

interface OnboardingState {
  isLoading: boolean;
  employeeForm: FormGroup;
  certificationForm: FormGroup;
  employees: Employee[];
  selectedEmployee: Employee | null;
  error: string | null;
  success: string | null;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent {
  state: OnboardingState;

  constructor(
    private fb: FormBuilder,
    private personnelService: PersonnelService,
    private router: Router
  ) {
    this.state = {
      isLoading: false,
      employeeForm: this.createEmployeeForm(),
      certificationForm: this.createCertificationForm(),
      employees: [],
      selectedEmployee: null,
      error: null,
      success: null
    };

    this.loadEmployees();
  }

  private createEmployeeForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      position: ['', [Validators.required]],
      department: ['', [Validators.required]],
      hireDate: ['', [Validators.required]]
    });
  }

  private createCertificationForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      issuer: ['', [Validators.required]],
      issueDate: ['', [Validators.required]],
      expiryDate: ['']
    });
  }

  async loadEmployees(): Promise<void> {
    try {
      this.state.isLoading = true;
      // TODO: Get orgId from auth service
      const orgId = 'default-org';
      this.state.employees = await this.personnelService.getEmployees(orgId);
    } catch (error: any) {
      this.state.error = error.message || 'Failed to load employees';
    } finally {
      this.state.isLoading = false;
    }
  }

  async onEmployeeSubmit(): Promise<void> {
    if (this.state.employeeForm.invalid) {
      this.state.error = 'Please fill in all required fields';
      return;
    }

    try {
      this.state.isLoading = true;
      this.state.error = null;

      const formValue = this.state.employeeForm.value;
      const employeeData = {
        ...formValue,
        orgId: 'default-org', // TODO: from auth
        certifications: [],
        status: 'Active' as const,
        createdBy: 'user-id' // TODO: from auth
      };

      await this.personnelService.createEmployee(employeeData);
      this.state.success = 'Employee created successfully!';
      this.state.employeeForm.reset();
      this.loadEmployees();
    } catch (error: any) {
      this.state.error = error.message || 'Failed to create employee';
    } finally {
      this.state.isLoading = false;
    }
  }

  selectEmployee(employee: Employee): void {
    this.state.selectedEmployee = employee;
    this.state.certificationForm.reset();
  }

  onEmployeeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const index = parseInt(target.value, 10);
    if (!isNaN(index) && index >= 0 && index < this.state.employees.length) {
      this.selectEmployee(this.state.employees[index]);
    }
  }

  async onCertificationSubmit(): Promise<void> {
    if (!this.state.selectedEmployee || this.state.certificationForm.invalid) {
      this.state.error = 'Please select an employee and fill in certification details';
      return;
    }

    try {
      this.state.isLoading = true;
      this.state.error = null;

      const formValue = this.state.certificationForm.value;
      const certData = {
        ...formValue,
        employeeId: this.state.selectedEmployee.employeeId,
        status: 'Valid' as const
      };

      await this.personnelService.addCertification(certData);
      this.state.success = 'Certification added successfully!';
      this.state.certificationForm.reset();
      this.loadEmployees(); // Refresh to show updated certifications
    } catch (error: any) {
      this.state.error = error.message || 'Failed to add certification';
    } finally {
      this.state.isLoading = false;
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