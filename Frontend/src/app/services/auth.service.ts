// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  user_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://127.0.0.1:8000/api/token/'; 

  constructor(private http: HttpClient) { }

  login(login: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, { login, password });
  }

  logout() {
    localStorage.removeItem('token'); 
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token'); 
  }
  
  getLoggedInUser(): { id: number } | null {
    const token = this.getToken();
    if (token) {
      try {
        const payload: JwtPayload = jwtDecode(token);
        return { id: payload.user_id }; 
      } catch (e) {
        console.error('Falha ao decodificar JWT:', e);
        return null;
      }
    }
    return null;
  }
}