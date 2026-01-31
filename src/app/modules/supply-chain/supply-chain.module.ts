import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    { path: '', redirectTo: 'material-master', pathMatch: 'full' },
    {
        path: 'material-master',
        loadComponent: () => import('./material-master/material-master.component').then(m => m.MaterialMasterComponent)
    },
    {
        path: 'requisition-workflow',
        loadComponent: () => import('./requisition-workflow/requisition-workflow.component').then(m => m.RequisitionWorkflowComponent)
    },
];

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        RouterModule.forChild(routes)
    ]
})
export class SupplyChainModule { }
