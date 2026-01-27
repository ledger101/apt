import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./fleet-navigation.component').then(m => m.FleetNavigationComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./asset-register/asset-register.component').then(m => m.AssetRegisterComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'maintenance',
    loadComponent: () => import('./maintenance-alerts/maintenance-alerts.component').then(m => m.MaintenanceAlertsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'logistics',
    loadComponent: () => import('./logistics/logistics.component').then(m => m.LogisticsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'pre-start-check',
    loadComponent: () => import('./pre-start-check/pre-start-check.component').then(m => m.PreStartCheckComponent),
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FleetRoutingModule { }