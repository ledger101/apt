import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { InvoiceConfig } from '../models';

@Injectable({
  providedIn: 'root'
})
export class InvoiceConfigService {

  constructor(private firestoreService: FirestoreService) {}

  /**
   * Get default invoice configuration
   */
  getDefaultConfig(): InvoiceConfig {
    return {
      configId: 'default',
      orgId: 'default-org',
      chargeRate: 20, // Default: $20 per hour
      currency: 'USD',
      invoicePrefix: 'INV',
      nextInvoiceNumber: 1,
      taxRate: 0,
      notes: '',
      updatedAt: new Date(),
      updatedBy: 'system'
    };
  }

  /**
   * Get invoice configuration for an organization
   */
  async getConfig(orgId: string): Promise<InvoiceConfig> {
    const config = await this.firestoreService.getInvoiceConfig(orgId);

    if (!config) {
      // Return default config if none exists
      const defaultConfig = this.getDefaultConfig();
      defaultConfig.orgId = orgId;
      return defaultConfig;
    }

    return config;
  }

  /**
   * Save invoice configuration
   */
  async saveConfig(config: InvoiceConfig): Promise<void> {
    await this.firestoreService.saveInvoiceConfig(config);
  }

  /**
   * Increment invoice number for next invoice
   */
  async incrementInvoiceNumber(orgId: string): Promise<number> {
    const config = await this.getConfig(orgId);
    const nextNumber = config.nextInvoiceNumber + 1;
    config.nextInvoiceNumber = nextNumber;
    config.updatedAt = new Date();
    await this.saveConfig(config);
    return nextNumber;
  }
}
