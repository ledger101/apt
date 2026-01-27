import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'upload',
        loadComponent: () => import('../../components/upload/upload.component').then(m => m.UploadComponent),
        canActivate: [AuthGuard]
      },
      // Add more routes for OHS, aquifer test, etc.
      { path: '', redirectTo: 'upload', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperationsRoutingModule { }