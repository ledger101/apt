import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
  { path: 'operations', loadChildren: () => import('./modules/operations/operations.module').then(m => m.OperationsModule) },
  { path: 'personnel', loadChildren: () => import('./modules/personnel/personnel.module').then(m => m.PersonnelModule) },
  { path: 'fleet', loadChildren: () => import('./modules/fleet/fleet.module').then(m => m.FleetModule) },
  { path: 'ohs', loadComponent: () => import('./modules/ohs/ohs.component').then(m => m.OhsComponent) },
  { path: 'pre-start-reports', loadComponent: () => import('./components/reports/pre-start-reports.component').then(m => m.PreStartReportsComponent), canActivate: [AuthGuard] },
  { path: 'finance', loadChildren: () => import('./modules/financial/financial.module').then(m => m.FinancialModule) },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
