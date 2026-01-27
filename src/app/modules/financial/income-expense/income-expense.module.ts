import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IncomeExpenseComponent } from './income-expense.component';

const routes: Routes = [
  { path: '', component: IncomeExpenseComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    IncomeExpenseComponent
  ]
})
export class IncomeExpenseModule { }