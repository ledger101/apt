import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { RequisitionsComponent } from './requisitions.component';

const routes: Routes = [
  { path: '', component: RequisitionsComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    RequisitionsComponent
  ]
})
export class RequisitionsModule { }