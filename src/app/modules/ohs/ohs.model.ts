export interface ChecklistItem {
  id: number;
  question: string;
  critical: boolean;
  response?: 'yes' | 'no';
  comments: string;
}

export interface ActionItem {
  number: number;
  description: string;
  responsiblePerson: string;
  dueDate: string;
}

export interface PersonnelDetails {
  name: string;
  employeeId: string;
  jobTitle: string;
  department: string;
  signature?: string;
}

export interface OhsForm {
  // Administrative Metadata
  formTitle: string;
  referenceNumber: string;
  version: string;
  dateOfIssue: string;
  nextReviewDate: string;
  author: string;
  approver: string;

  // Personnel
  observer: PersonnelDetails;
  employee: PersonnelDetails;
  superintendent: PersonnelDetails;

  // Operational Context
  date: string;
  time: string;
  section: string;
  location: string;
  area: string;
  shiftType: 'mining' | 'others';
  shift: string; // Morning/Afternoon/Night or Day/Night
  crew: string; // A-D or 1-3
  reason: string;

  // Discipline and Checklist
  discipline: string;
  checklist: ChecklistItem[];

  // Evaluation
  competencyOutcome: 'competent' | 'not_yet_competent';
  forwardToHR: boolean;

  // Action Plan
  actionItems: ActionItem[];

  // Evidence
  photoEvidence: string[]; // URLs or file paths
}