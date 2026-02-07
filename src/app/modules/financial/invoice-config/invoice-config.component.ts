import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InvoiceConfigService } from '../../../services/invoice-config.service';
import { AuthService } from '../../../services/auth.service';
import { InvoiceConfig } from '../../../models';

@Component({
  selector: 'app-invoice-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-config.component.html',
  styleUrls: ['./invoice-config.component.scss']
})
export class InvoiceConfigComponent implements OnInit {
  config: InvoiceConfig | null = null;
  loading = false;
  error: string | null = null;
  success = false;
  isAdmin = false;

  constructor(
    private invoiceConfigService: InvoiceConfigService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadConfig();
  }

  async loadConfig() {
    this.loading = true;
    this.error = null;
    try {
      // Get orgId from user profile (default to 'default-org' for now)
      const userProfile = this.authService.getCurrentUserProfile();
      const orgId = userProfile?.orgId || 'default-org';

      this.config = await this.invoiceConfigService.getConfig(orgId);
    } catch (error: any) {
      this.error = error.message || 'Failed to load invoice configuration';
      console.error('Error loading invoice config:', error);
    } finally {
      this.loading = false;
    }
  }

  async saveConfig() {
    if (!this.config) return;

    this.loading = true;
    this.error = null;
    this.success = false;

    try {
      // Validate charge rate
      if (this.config.chargeRate <= 0) {
        this.error = 'Charge rate must be greater than 0';
        this.loading = false;
        return;
      }

      // Validate invoice prefix
      if (!this.config.invoicePrefix || this.config.invoicePrefix.trim() === '') {
        this.error = 'Invoice prefix cannot be empty';
        this.loading = false;
        return;
      }

      // Update timestamp and user
      const userProfile = this.authService.getCurrentUserProfile();
      this.config.updatedAt = new Date();
      this.config.updatedBy = userProfile?.uid || 'unknown';

      await this.invoiceConfigService.saveConfig(this.config);
      this.success = true;

      // Clear success message after 3 seconds
      setTimeout(() => {
        this.success = false;
      }, 3000);
    } catch (error: any) {
      this.error = error.message || 'Failed to save invoice configuration';
      console.error('Error saving invoice config:', error);
    } finally {
      this.loading = false;
    }
  }

  cancel() {
    this.router.navigate(['/finance']);
  }

  goBack() {
    this.router.navigate(['/finance']);
  }
}
