import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupplyChainService } from '../../../services/supply-chain.service';
import { Project } from '../../../models';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  projectForm: FormGroup;
  isEditing = false;
  editingProjectId: string | null = null;
  isLoading = false;
  showForm = false;

  statusOptions = ['Active', 'Completed', 'On Hold', 'Cancelled'];

  constructor(
    private fb: FormBuilder,
    private supplyChainService: SupplyChainService,
    private router: Router
  ) {
    this.projectForm = this.fb.group({
      projectName: ['', [Validators.required, Validators.minLength(2)]],
      projectCode: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      physicalAddress: [''],
      siteManager: [''],
      siteManagerContact: [''],
      startDate: ['', Validators.required],
      expectedEndDate: [''],
      status: ['Active', Validators.required],
      totalBudget: [0, [Validators.min(0)]],
      budgetConsumed: [0, [Validators.min(0)]],
      costCenterCode: ['']
    });
  }

  ngOnInit() {
    this.loadProjects();
  }

  async loadProjects() {
    this.isLoading = true;
    try {
      const orgId = 'org1';
      this.projects = await this.supplyChainService.getProjectsByOrg(orgId);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      this.isLoading = false;
    }
  }

  showAddForm() {
    this.isEditing = false;
    this.editingProjectId = null;
    this.projectForm.reset({
      status: 'Active',
      totalBudget: 0,
      budgetConsumed: 0
    });
    this.showForm = true;
  }

  editProject(project: Project) {
    this.isEditing = true;
    this.editingProjectId = project.projectId;
    this.projectForm.patchValue({
      projectName: project.projectName,
      projectCode: project.projectCode,
      description: project.description || '',
      physicalAddress: project.physicalAddress || '',
      siteManager: project.siteManager || '',
      siteManagerContact: project.siteManagerContact || '',
      startDate: project.startDate?.toDate ? project.startDate.toDate().toISOString().split('T')[0] : '',
      expectedEndDate: project.expectedEndDate?.toDate ? project.expectedEndDate.toDate().toISOString().split('T')[0] : '',
      status: project.status,
      totalBudget: project.totalBudget || 0,
      budgetConsumed: project.budgetConsumed || 0,
      costCenterCode: project.costCenterCode || ''
    });
    this.showForm = true;
  }

  cancelEdit() {
    this.showForm = false;
    this.isEditing = false;
    this.editingProjectId = null;
    this.projectForm.reset();
  }

  async saveProject() {
    if (this.projectForm.invalid) {
      return;
    }

    this.isLoading = true;
    try {
      const formValue = this.projectForm.value;
      const projectData = {
        ...formValue,
        orgId: 'org1',
        startDate: new Date(formValue.startDate),
        expectedEndDate: formValue.expectedEndDate ? new Date(formValue.expectedEndDate) : null,
        createdBy: 'user1'
      };

      if (this.isEditing && this.editingProjectId) {
        await this.supplyChainService.updateProject(this.editingProjectId, projectData);
      } else {
        await this.supplyChainService.createProject(projectData);
      }

      this.cancelEdit();
      await this.loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteProject(project: Project) {
    if (!confirm(`Are you sure you want to delete project "${project.projectName}"?`)) {
      return;
    }

    this.isLoading = true;
    try {
      await this.supplyChainService.deleteProject(project.projectId);
      await this.loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getBudgetStatus(project: Project): { percentage: number; color: string } {
    if (!project.totalBudget || project.totalBudget === 0) {
      return { percentage: 0, color: 'bg-gray-400' };
    }
    const percentage = ((project.budgetConsumed || 0) / project.totalBudget) * 100;
    let color = 'bg-green-500';
    if (percentage >= 90) {
      color = 'bg-red-500';
    } else if (percentage >= 75) {
      color = 'bg-yellow-500';
    }
    return { percentage: Math.min(percentage, 100), color };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
