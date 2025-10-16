import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { HomeComponent } from './components/home/home';
import { AuthGuard } from './guards/auth.guard';
import { TeamComponent } from './components/team/team';
import { FavoritesComponent } from './components/favorites/favorites';


export const routes: Routes = [
  { path: '', component: LoginComponent }, 
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'favoritos', component: FavoritesComponent, canActivate: [AuthGuard] },
  { path: 'equipe', component: TeamComponent, canActivate: [AuthGuard] },
];
