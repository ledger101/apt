import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'onboarding',
        loadComponent: () => import('./onboarding/onboarding.component').then(m => m.OnboardingComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'leave-tracking',
        loadComponent: () => import('./leave-tracking/leave-tracking.component').then(m => m.LeaveTrackingComponent),
        canActivate: [AuthGuard]
      },
      { path: '', redirectTo: 'onboarding', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PersonnelRoutingModule { }