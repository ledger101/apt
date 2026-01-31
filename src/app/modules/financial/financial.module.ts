import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FinancialComponent } from './financial.component';

const routes: Routes = [
  { path: '', component: FinancialComponent },
  { path: 'requisitions', loadChildren: () => import('./requisitions/requisitions.module').then(m => m.RequisitionsModule) },
  { path: 'invoices', loadChildren: () => import('./invoices/invoices.module').then(m => m.InvoicesModule) },
  { path: 'invoice-config', loadChildren: () => import('./invoice-config/invoice-config.module').then(m => m.InvoiceConfigModule) },
  { path: 'income-expense', loadChildren: () => import('./income-expense/income-expense.module').then(m => m.IncomeExpenseModule) },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FinancialComponent
  ]
})
export class FinancialModule { }