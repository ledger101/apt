import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayrollRoutingModule } from './payroll-routing.module';
import { PayrollComponent } from './payroll.component';

@NgModule({
  imports: [
    CommonModule,
    PayrollRoutingModule,
    PayrollComponent
  ]
})
export class PayrollModule { }
