import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    const token = this.authService.getToken();

    if (token) {
      return true;
    } else {
      this.router.navigate(['']);
      return false;
    }
  }
}
