import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InvoiceService } from '../../../services/invoice.service';
import { Invoice } from '../../../models';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss']
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  selectedInvoice: Invoice | null = null;
  loading = false;
  error: string | null = null;

  // Filters
  searchQuery = '';
  statusFilter = '';
  dateFrom: string = '';
  dateTo: string = '';

  constructor(
    private invoiceService: InvoiceService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadInvoices();
  }

  async loadInvoices() {
    this.loading = true;
    this.error = null;
    try {
      this.invoices = await this.invoiceService.getInvoices();
      this.applyFilters();
    } catch (error: any) {
      this.error = error.message || 'Failed to load invoices';
      console.error('Error loading invoices:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    this.filteredInvoices = this.invoices.filter(invoice => {
      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchesSearch =
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.client.toLowerCase().includes(query) ||
          invoice.projectSiteArea.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (this.statusFilter && invoice.status !== this.statusFilter) {
        return false;
      }

      // Date from filter
      if (this.dateFrom) {
        const fromDate = new Date(this.dateFrom);
        if (invoice.invoiceDate < fromDate) return false;
      }

      // Date to filter
      if (this.dateTo) {
        const toDate = new Date(this.dateTo);
        // Set to end of day
        toDate.setHours(23, 59, 59, 999);
        if (invoice.invoiceDate > toDate) return false;
      }

      return true;
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }

  viewInvoice(invoice: Invoice) {
    this.selectedInvoice = invoice;
  }

  backToList() {
    this.selectedInvoice = null;
  }

  async updateStatus() {
    if (!this.selectedInvoice) return;

    try {
      await this.invoiceService.updateInvoiceStatus(
        this.selectedInvoice.invoiceId,
        this.selectedInvoice.status
      );
      console.log('Invoice status updated:', this.selectedInvoice.status);
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      this.error = error.message || 'Failed to update invoice status';
    }
  }

  formatDate(date: Date): string {
    if (!date) return 'N/A';
    // Handle Firestore Timestamp
    if ((date as any).toDate && typeof (date as any).toDate === 'function') {
      date = (date as any).toDate();
    }
    // Handle string dates
    if (typeof date === 'string') {
      date = new Date(date);
    }
    // Now format the Date object
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return 'Invalid Date';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  goBack() {
    this.router.navigate(['/finance']);
  }
}
