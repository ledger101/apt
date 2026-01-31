import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceConfigComponent } from './invoice-config.component';
import { InvoiceConfigService } from '../../../services/invoice-config.service';

const routes: Routes = [
  { path: '', component: InvoiceConfigComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  providers: [InvoiceConfigService]
})
export class InvoiceConfigModule { }
