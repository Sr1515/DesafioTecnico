import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,  
  templateUrl: './login.html',
  styleUrls: ['./login.css']

})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      login: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {

    if(this.loginForm.valid) {
      const {login, password } = this.loginForm.value;
      console.log(login, password)
      this.authService.login(login, password).subscribe({
        next: (res) => {
          this.authService.setToken(res.access);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.errorMessage = 'Usuário ou senha inválidos';
        }
      });
    }

  }

}
