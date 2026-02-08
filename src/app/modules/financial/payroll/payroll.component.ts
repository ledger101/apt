import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FirestoreService } from '../../../services/firestore.service';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payroll.component.html',
  styleUrls: ['./payroll.component.scss']
})
export class PayrollComponent implements OnInit {
  loading = false;
  error: string | null = null;
  
  // Summary stats
  totalEmployees = 0;
  activePayPeriods = 0;
  pendingTimesheets = 0;
  totalMonthlyPayroll = 0;

  constructor(
    private firestoreService: FirestoreService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadSummaryData();
  }

  async loadSummaryData() {
    this.loading = true;
    this.error = null;
    try {
      // Load summary statistics
      const employees = await this.firestoreService.getEmployees();
      const payPeriods = await this.firestoreService.getPayPeriods();
      
      this.totalEmployees = employees.filter(e => e.employmentStatus === 'Active').length;
      this.activePayPeriods = payPeriods.filter(p => p.status === 'Open').length;
      
      // Calculate total monthly payroll (simplified - would need more complex calculation in real app)
      this.totalMonthlyPayroll = 0; // TODO: Calculate from employee salaries
      this.pendingTimesheets = 0; // TODO: Calculate from timesheets
      
    } catch (error: any) {
      this.error = error.message || 'Failed to load payroll summary';
      console.error('Error loading payroll summary:', error);
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    this.router.navigate(['/financial']);
  }
}
