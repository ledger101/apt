import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.SupplyChainDashboardComponent)
    },
    {
        path: 'material-master',
        loadComponent: () => import('./material-master/material-master.component').then(m => m.MaterialMasterComponent)
    },
    {
        path: 'requisition-workflow',
        loadComponent: () => import('./requisition-workflow/requisition-workflow.component').then(m => m.RequisitionWorkflowComponent)
    },
    {
        path: 'suppliers',
        loadComponent: () => import('./suppliers/suppliers.component').then(m => m.SuppliersComponent)
    },
    {
        path: 'projects',
        loadComponent: () => import('./projects/projects.component').then(m => m.ProjectsComponent)
    },
    {
        path: 'purchase-orders',
        loadComponent: () => import('./purchase-orders/purchase-orders.component').then(m => m.PurchaseOrdersComponent)
    },
    {
        path: 'grn',
        loadComponent: () => import('./grn/grn.component').then(m => m.GrnComponent)
    },
    {
        path: 'disbursements',
        loadComponent: () => import('./disbursements/disbursements.component').then(m => m.DisbursementsComponent)
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

