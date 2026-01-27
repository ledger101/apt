import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./fleet-home/fleet-home.component').then(m => m.FleetHomeComponent)
  },
  {
    path: 'asset-register',
    loadComponent: () => import('./asset-register/asset-register.component').then(m => m.AssetRegisterComponent)
  },
  {
    path: 'maintenance-alerts',
    loadComponent: () => import('./maintenance-alerts/maintenance-alerts.component').then(m => m.MaintenanceAlertsComponent)
  },
  {
    path: 'pre-start-check',
    loadComponent: () => import('./pre-start-check/pre-start-check.component').then(m => m.PreStartCheckComponent)
  },
  {
    path: 'logistics',
    loadComponent: () => import('./logistics/logistics.component').then(m => m.LogisticsComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FleetRoutingModule { }