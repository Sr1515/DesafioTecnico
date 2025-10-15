import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { HomeComponent } from './components/home/home';
import { AuthGuard } from './guards/auth.guard';


export const routes: Routes = [
  { path: '', component: LoginComponent }, 
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
];
