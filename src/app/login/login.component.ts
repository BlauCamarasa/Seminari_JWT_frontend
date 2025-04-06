import { CommonModule } from '@angular/common';
import { Component, inject, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: true
})
export class LoginComponent implements OnInit {

  isLoading: boolean = true;
  date: Date = new Date("2025-08-14");
  Prova: string = "Este texto deberia estar en mayusculas";
  formularioLogin: FormGroup;
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  @Output() loggedin = new EventEmitter<string>();
  @Output() exportLoggedIn = new EventEmitter<boolean>();

  constructor(private form: FormBuilder) {
    this.formularioLogin = this.form.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      console.log("esto" +token);
      if (token) {
        console.log("Token rebut:", token);
        this.authService.handleGoogleCallback(token).subscribe(() => {
          this.isLoading = false; 
          this.exportLoggedIn.emit(true); 
        });// Avisa de que l'usuari està
      }
      else{
        this.isLoading = false;
      }
      
    });
    this.formularioLogin = this.form.group({
      email: ['mar@gmail.com', [Validators.required, Validators.email]], // Valor predeterminado para el email
      password: ['12345678', [Validators.required, Validators.minLength(8)]] // Valor predeterminado para la contraseña
    });
  };

  hasError(controlName: string, errorType: string) {
    return this.formularioLogin.get(controlName)?.hasError(errorType) && this.formularioLogin.get(controlName)?.touched;
  }

  login() {
    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    const loginData = this.formularioLogin.value;

    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        localStorage.setItem('access_token', response.accesstoken);
        this.exportLoggedIn.emit(true);
      },
      error: (error) => {
        console.error('Error en el login:', error);
        alert('Error en el login, verifica tus credenciales');
      }
    });
  }
  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
}
