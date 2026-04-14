import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';
import { StorageService } from '../services/storage';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  form: any = {
    username: 'admin',
    password: 'password123'
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  role: string = '';

  constructor(private authService: AuthService, private storageService: StorageService, private router: Router) { }

  ngOnInit(): void {
    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
      this.role = this.storageService.getUser().role;
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    const { username, password } = this.form;

    this.authService.login(username, password).subscribe({
      next: data => {
        this.storageService.saveUser(data);

        this.isLoginFailed = false;
        this.isLoggedIn = true;
        this.role = this.storageService.getUser().role;
        this.reloadPage();
      },
      error: err => {
        this.errorMessage = err.message || 'Error desconocido';
        this.isLoginFailed = true;
      }
    });
  }

  reloadPage(): void {
    const role = this.storageService.getUser().role;
    let target = '/home';
    
    // Clientes van directo a su portal personal
    if (role === 'ROLE_CLIENTE') {
      target = '/user';
    }

    // Recepción a su panel dedicado
    if (role === 'ROLE_RECEPCION') {
      target = '/recepcion';
    }

    // Contabilidad a su panel dedicado
    if (role === 'ROLE_CONTABILIDAD') {
      target = '/contabilidad';
    }

    // Si es SOLO soporte, mandar directo al panel de soporte
    if (role === 'ROLE_SOPORTE') {
      target = '/admin/soporte';
    }

    this.router.navigate([target]).then(() => {
      window.location.reload();
    });
  }
}
