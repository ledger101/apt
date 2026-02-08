import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirestoreService } from '../../../services/firestore.service';
import { AuthService } from '../../../services/auth.service';
import { Income, Expense } from '../../../models/pumping-data.model';

@Component({
  standalone: true,
  selector: 'app-income-expense',
  imports: [CommonModule, FormsModule],
  templateUrl: './income-expense.component.html',
  styleUrls: ['./income-expense.component.scss']
})
export class IncomeExpenseComponent implements OnInit {
  // Data
  incomes: Income[] = [];
  expenses: Expense[] = [];
  filteredIncomes: Income[] = [];
  filteredExpenses: Expense[] = [];
  
  // UI State
  activeTab: 'income' | 'expense' | 'dashboard' = 'dashboard';
  showIncomeModal = false;
  showExpenseModal = false;
  loading = false;
  error: string | null = null;
  
  // Filters
  searchQuery = '';
  categoryFilter = '';
  statusFilter = '';
  dateFrom = '';
  dateTo = '';
  
  // Forms
  incomeForm: Partial<Income> = this.resetIncomeForm();
  expenseForm: Partial<Expense> = this.resetExpenseForm();
  isEditMode = false;
  
  // Categories
  incomeCategories = ['Invoice', 'Grant', 'Donation', 'Investment', 'Other'];
  expenseCategories = ['Fuel', 'Materials', 'Salaries', 'Equipment', 'Utilities', 'Rent', 'Insurance', 'Other'];
  expenseStatuses: Array<'Pending' | 'Approved' | 'Rejected'> = ['Pending', 'Approved', 'Rejected'];
  
  // Summary
  totalIncome = 0;
  totalExpense = 0;
  netBalance = 0;

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.error = null;
    try {
      [this.incomes, this.expenses] = await Promise.all([
        this.firestoreService.getIncomes(),
        this.firestoreService.getExpenses()
      ]);
      this.applyFilters();
      this.calculateSummary();
    } catch (error: any) {
      this.error = error.message || 'Failed to load data';
      console.error('Error loading income/expense data:', error);
    } finally {
      this.loading = false;
    }
  }

  calculateSummary() {
    this.totalIncome = this.incomes
      .reduce((sum, income) => sum + income.amount, 0);
    
    this.totalExpense = this.expenses
      .filter(expense => expense.status === 'Approved')
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    this.netBalance = this.totalIncome - this.totalExpense;
  }

  applyFilters() {
    // Filter incomes
    this.filteredIncomes = this.incomes.filter(income => {
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchesSearch =
          income.source.toLowerCase().includes(query) ||
          income.category.toLowerCase().includes(query) ||
          (income.description?.toLowerCase().includes(query) || false);
        if (!matchesSearch) return false;
      }

      if (this.categoryFilter && income.category !== this.categoryFilter) {
        return false;
      }

      if (this.dateFrom) {
        const fromDate = new Date(this.dateFrom);
        if (new Date(income.incomeDate) < fromDate) return false;
      }

      if (this.dateTo) {
        const toDate = new Date(this.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(income.incomeDate) > toDate) return false;
      }

      return true;
    });

    // Filter expenses
    this.filteredExpenses = this.expenses.filter(expense => {
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchesSearch =
          expense.category.toLowerCase().includes(query) ||
          (expense.description?.toLowerCase().includes(query) || false) ||
          (expense.payee?.toLowerCase().includes(query) || false);
        if (!matchesSearch) return false;
      }

      if (this.categoryFilter && expense.category !== this.categoryFilter) {
        return false;
      }

      if (this.statusFilter && expense.status !== this.statusFilter) {
        return false;
      }

      if (this.dateFrom) {
        const fromDate = new Date(this.dateFrom);
        if (new Date(expense.expenseDate) < fromDate) return false;
      }

      if (this.dateTo) {
        const toDate = new Date(this.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(expense.expenseDate) > toDate) return false;
      }

      return true;
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.categoryFilter = '';
    this.statusFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }

  // Income methods
  openIncomeModal(income?: Income) {
    if (income) {
      this.incomeForm = { ...income };
      this.isEditMode = true;
    } else {
      this.incomeForm = this.resetIncomeForm();
      this.isEditMode = false;
    }
    this.showIncomeModal = true;
  }

  closeIncomeModal() {
    this.showIncomeModal = false;
    this.incomeForm = this.resetIncomeForm();
    this.isEditMode = false;
  }

  async saveIncome() {
    try {
      this.loading = true;
      const userProfile = this.authService.getCurrentUserProfile();
      const orgId = userProfile?.orgId || 'default-org';
      const userId = userProfile?.uid || 'unknown-user';
      
      const incomeData: Omit<Income, 'incomeId'> = {
        orgId: orgId,
        source: this.incomeForm.source!,
        amount: this.incomeForm.amount!,
        currency: this.incomeForm.currency || 'USD',
        incomeDate: this.incomeForm.incomeDate instanceof Date 
          ? this.incomeForm.incomeDate 
          : new Date(this.incomeForm.incomeDate!),
        category: this.incomeForm.category!,
        description: this.incomeForm.description,
        reference: this.incomeForm.reference,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (this.isEditMode && this.incomeForm.incomeId) {
        await this.firestoreService.updateIncome(this.incomeForm.incomeId, incomeData);
      } else {
        await this.firestoreService.createIncome(incomeData);
      }

      this.closeIncomeModal();
      await this.loadData();
    } catch (error: any) {
      this.error = error.message || 'Failed to save income';
      console.error('Error saving income:', error);
    } finally {
      this.loading = false;
    }
  }

  async deleteIncome(income: Income) {
    if (confirm('Are you sure you want to delete this income entry?')) {
      try {
        this.loading = true;
        await this.firestoreService.deleteIncome(income.incomeId);
        await this.loadData();
      } catch (error: any) {
        this.error = error.message || 'Failed to delete income';
        console.error('Error deleting income:', error);
      } finally {
        this.loading = false;
      }
    }
  }

  // Expense methods
  openExpenseModal(expense?: Expense) {
    if (expense) {
      this.expenseForm = { ...expense };
      this.isEditMode = true;
    } else {
      this.expenseForm = this.resetExpenseForm();
      this.isEditMode = false;
    }
    this.showExpenseModal = true;
  }

  closeExpenseModal() {
    this.showExpenseModal = false;
    this.expenseForm = this.resetExpenseForm();
    this.isEditMode = false;
  }

  async saveExpense() {
    try {
      this.loading = true;
      const userProfile = this.authService.getCurrentUserProfile();
      const orgId = userProfile?.orgId || 'default-org';
      const userId = userProfile?.uid || 'unknown-user';
      
      const expenseData: Omit<Expense, 'expenseId'> = {
        orgId: orgId,
        category: this.expenseForm.category!,
        amount: this.expenseForm.amount!,
        currency: this.expenseForm.currency || 'USD',
        expenseDate: this.expenseForm.expenseDate instanceof Date 
          ? this.expenseForm.expenseDate 
          : new Date(this.expenseForm.expenseDate!),
        description: this.expenseForm.description,
        payee: this.expenseForm.payee,
        receiptRef: this.expenseForm.receiptRef,
        approvedBy: this.expenseForm.approvedBy,
        status: this.expenseForm.status || 'Pending',
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (this.isEditMode && this.expenseForm.expenseId) {
        await this.firestoreService.updateExpense(this.expenseForm.expenseId, expenseData);
      } else {
        await this.firestoreService.createExpense(expenseData);
      }

      this.closeExpenseModal();
      await this.loadData();
    } catch (error: any) {
      this.error = error.message || 'Failed to save expense';
      console.error('Error saving expense:', error);
    } finally {
      this.loading = false;
    }
  }

  async deleteExpense(expense: Expense) {
    if (confirm('Are you sure you want to delete this expense entry?')) {
      try {
        this.loading = true;
        await this.firestoreService.deleteExpense(expense.expenseId);
        await this.loadData();
      } catch (error: any) {
        this.error = error.message || 'Failed to delete expense';
        console.error('Error deleting expense:', error);
      } finally {
        this.loading = false;
      }
    }
  }

  // Helper methods
  resetIncomeForm(): Partial<Income> {
    return {
      source: '',
      amount: 0,
      currency: 'USD',
      incomeDate: new Date(),
      category: '',
      description: '',
      reference: ''
    };
  }

  resetExpenseForm(): Partial<Expense> {
    return {
      category: '',
      amount: 0,
      currency: 'USD',
      expenseDate: new Date(),
      description: '',
      payee: '',
      receiptRef: '',
      status: 'Pending'
    };
  }

  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  }

  getPendingExpensesCount(): number {
    return this.expenses.filter(e => e.status === 'Pending').length;
  }

  getApprovedExpensesCount(): number {
    return this.expenses.filter(e => e.status === 'Approved').length;
  }

  goBack() {
    this.router.navigate(['/financial']);
  }
}