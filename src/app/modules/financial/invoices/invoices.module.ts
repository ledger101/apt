import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { InvoicesComponent } from './invoices.component'; // Standalone component

const routes: Routes = [
  { path: '', component: InvoicesComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class InvoicesModule { }