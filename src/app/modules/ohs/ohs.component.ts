import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OhsService } from './ohs.service';
import { OhsForm, ChecklistItem, ActionItem, PersonnelDetails } from './ohs.model';

@Component({
  selector: 'app-ohs',
  templateUrl: './ohs.component.html',
  styleUrls: ['./ohs.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class OhsComponent {
  selectedDiscipline: string = '';
  form: OhsForm = this.createEmptyForm();

  disciplines = [
    { value: 'chemicals', label: 'Chemicals and Hazardous Substances' },
    { value: 'energy', label: 'Energy Isolation and Stored Energy' },
    { value: 'equipment', label: 'Mobile Equipment and Light Vehicles' },
    { value: 'safeguards', label: 'Equipment Safeguards and Rotating Equipment' },
    { value: 'hazards', label: 'Identifying and Controlling Hazards' },
    { value: 'general', label: 'General Competency and Site Inspection' }
  ];

  reasons = [
    'Incident follow up',
    'Periodic PTO',
    'New Employee'
  ];

  constructor(private ohsService: OhsService, private router: Router) {}

  loadChecklist() {
    this.form.discipline = this.selectedDiscipline;
    this.form.checklist = this.ohsService.getChecklist(this.selectedDiscipline);
  }

  addActionItem() {
    const newItem: ActionItem = {
      number: this.form.actionItems.length + 1,
      description: '',
      responsiblePerson: '',
      dueDate: ''
    };
    this.form.actionItems.push(newItem);
  }

  removeActionItem(index: number) {
    this.form.actionItems.splice(index, 1);
    // Renumber
    this.form.actionItems.forEach((item, i) => item.number = i + 1);
  }

  onPhotoSelected(event: any) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.form.photoEvidence.push(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(index: number) {
    this.form.photoEvidence.splice(index, 1);
  }

  submitForm() {
    console.log('Submitting OHS form:', this.form);
    // TODO: Implement form submission to backend/Firestore
    alert('Form submitted successfully!');
  }

  private createEmptyForm(): OhsForm {
    return {
      formTitle: '',
      referenceNumber: '',
      version: '1.0',
      dateOfIssue: new Date().toISOString().split('T')[0],
      nextReviewDate: '',
      author: '',
      approver: '',

      observer: { name: '', employeeId: '', jobTitle: '', department: '' },
      employee: { name: '', employeeId: '', jobTitle: '', department: '' },
      superintendent: { name: '', employeeId: '', jobTitle: '', department: '' },

      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      section: '',
      location: '',
      area: '',
      shiftType: 'mining',
      shift: '',
      crew: '',
      reason: '',

      discipline: '',
      checklist: [],

      competencyOutcome: 'competent',
      forwardToHR: false,

      actionItems: [],

      photoEvidence: []
    };
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}