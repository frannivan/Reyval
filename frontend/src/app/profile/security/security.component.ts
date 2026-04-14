import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './security.component.html',
  styleUrl: './security.component.css'
})
export class SecurityComponent {
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordMessage = '';
  passwordError = '';
  isPasswordChanging = false;

  private userService = inject(UserService);
  private storageService = inject(StorageService);

  onChangePassword(): void {
    this.passwordMessage = '';
    this.passwordError = '';

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'Las contraseñas nuevas no coinciden.';
      return;
    }

    this.isPasswordChanging = true;
    this.userService.changePassword({
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: res => {
        this.passwordMessage = res.message;
        this.isPasswordChanging = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: err => {
        this.passwordError = err.error.message || 'Error al cambiar contraseña';
        this.isPasswordChanging = false;
      }
    });
  }
}
