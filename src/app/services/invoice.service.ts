import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Report, Shift, Invoice, InvoiceActivity, InvoiceShift, InvoiceConfig } from '../models';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  constructor(private firestoreService: FirestoreService) {}

  /**
   * Parse hours from "H:MM" format to decimal hours
   * Example: "3:50" -> 3.833 hours
   */
  parseHoursToDecimal(hoursString: string): number {
    if (!hoursString) return 0;

    const parts = hoursString.split(':');
    if (parts.length !== 2) return 0;

    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    return hours + (minutes / 60);
  }

  /**
   * Calculate chargeable hours from a shift
   */
  calculateChargeableHours(shift: Shift): number {
    if (!shift || !shift.activities) return 0;

    return shift.activities
      .filter(activity => activity.chargeable === true)
      .reduce((total, activity) => {
        return total + this.parseHoursToDecimal(activity.total);
      }, 0);
  }

  /**
   * Calculate total hours from a shift (all activities)
   */
  calculateTotalHours(shift: Shift): number {
    if (!shift || !shift.activities) return 0;

    return shift.activities.reduce((total, activity) => {
      return total + this.parseHoursToDecimal(activity.total);
    }, 0);
  }

  /**
   * Generate invoice number from prefix and number
   * Example: "INV", 1 -> "INV-2024-001"
   */
  generateInvoiceNumber(prefix: string, nextNumber: number): string {
    const year = new Date().getFullYear();
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}-${year}-${paddedNumber}`;
  }

  /**
   * Convert a Shift to InvoiceShift with calculated amounts
   */
  convertShiftToInvoiceShift(shift: Shift, chargeRate: number): InvoiceShift {
    if (!shift) {
      return {
        totalHours: 0,
        chargeableHours: 0,
        activities: [],
        amount: 0
      };
    }

    const activities: InvoiceActivity[] = (shift.activities || []).map(activity => {
      const totalHours = this.parseHoursToDecimal(activity.total);
      const amount = activity.chargeable ? totalHours * chargeRate : 0;

      return {
        order: activity.order,
        activity: activity.activity,
        from: activity.from,
        to: activity.to,
        total: activity.total,
        totalHours: totalHours,
        chargeable: activity.chargeable || false,
        amount: amount
      };
    });

    const totalHours = this.calculateTotalHours(shift);
    const chargeableHours = this.calculateChargeableHours(shift);
    const amount = chargeableHours * chargeRate;

    return {
      totalHours,
      chargeableHours,
      activities,
      amount
    };
  }

  /**
   * Generate an invoice from a progress report
   */
  async generateInvoiceFromReport(report: Report, config: InvoiceConfig): Promise<Invoice> {
    const invoiceNumber = this.generateInvoiceNumber(config.invoicePrefix, config.nextInvoiceNumber);

    const dayShift = this.convertShiftToInvoiceShift(report.dayShift, config.chargeRate);
    const nightShift = this.convertShiftToInvoiceShift(report.nightShift, config.chargeRate);

    const totalChargeableHours = dayShift.chargeableHours + nightShift.chargeableHours;
    const totalAmount = dayShift.amount + nightShift.amount;

    const invoice: Invoice = {
      invoiceId: '', // Will be set by Firestore
      reportId: report.reportId,
      orgId: report.orgId,
      projectId: report.projectId,
      siteId: report.siteId,
      client: report.client,
      projectSiteArea: report.projectSiteArea,
      reportDate: report.reportDate,
      rigNumber: report.rigNumber,
      invoiceNumber: invoiceNumber,
      invoiceDate: new Date(),
      status: 'Draft',
      chargeRate: config.chargeRate,
      totalAmount: totalAmount,
      dayShift: dayShift,
      nightShift: nightShift,
      totalChargeableHours: totalChargeableHours,
      createdBy: report.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return invoice;
  }

  /**
   * Save an invoice to Firestore
   */
  async saveInvoice(invoice: Invoice): Promise<string> {
    return await this.firestoreService.saveInvoice(invoice);
  }

  /**
   * Get all invoices for an organization
   */
  async getInvoices(orgId?: string): Promise<Invoice[]> {
    return await this.firestoreService.getInvoices(orgId);
  }

  /**
   * Get a specific invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    return await this.firestoreService.getInvoice(invoiceId);
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: Invoice['status']): Promise<void> {
    await this.firestoreService.updateInvoice(invoiceId, { status });
  }

  /**
   * Check if an invoice already exists for a report
   */
  async invoiceExistsForReport(reportId: string): Promise<boolean> {
    const invoices = await this.firestoreService.getInvoices();
    return invoices.some(invoice => invoice.reportId === reportId);
  }
}
