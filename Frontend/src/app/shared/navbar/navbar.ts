// src/app/shared/navbar/navbar.component.ts

import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { AuthService } from '../../services/auth.service'; 

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink], 
   templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'] 
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.authService.logout();

    this.router.navigateByUrl('', { replaceUrl: true });
  }
}