import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./personnel-home/personnel-home.component').then(m => m.PersonnelHomeComponent)
  },
  {
    path: 'leave-tracking',
    loadComponent: () => import('./leave-tracking/leave-tracking.component').then(m => m.LeaveTrackingComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./onboarding/onboarding.component').then(m => m.OnboardingComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PersonnelRoutingModule { }