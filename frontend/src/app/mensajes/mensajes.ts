import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MensajeService, Mensaje } from '../services/mensaje';
import { StorageService } from '../services/storage';
import { AdminService } from '../services/admin';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mensajes.html'
})
export class MensajesComponent implements OnInit {
  activeTab: 'recibidos' | 'enviados' | 'nuevo' = 'recibidos';
  mensajes: Mensaje[] = [];
  usuarios: any[] = [];
  isLoading = false;
  
  // New Message Form
  newMessage = {
    destinatarioId: 0,
    asunto: '',
    contenido: ''
  };

  private mensajeService = inject(MensajeService);
  private storageService = inject(StorageService);
  private adminService = inject(AdminService);

  ngOnInit(): void {
    this.loadRecibidos();
    this.loadUsuarios();
  }

  loadRecibidos(): void {
    this.isLoading = true;
    this.mensajeService.getRecibidos().subscribe({
      next: data => {
        this.mensajes = data;
        this.isLoading = false;
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadEnviados(): void {
    this.isLoading = true;
    this.mensajeService.getEnviados().subscribe({
      next: data => {
        this.mensajes = data;
        this.isLoading = false;
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadUsuarios(): void {
    // For now, only show users if admin or similar. 
    // Ideally, we need a public endpoint for names, but let's use admin for now.
    this.adminService.getUsers().subscribe({
      next: data => this.usuarios = data,
      error: err => console.error('Limitación de acceso a lista de usuarios', err)
    });
  }

  switchTab(tab: 'recibidos' | 'enviados' | 'nuevo'): void {
    this.activeTab = tab;
    if (tab === 'recibidos') this.loadRecibidos();
    if (tab === 'enviados') this.loadEnviados();
  }

  enviar(): void {
    if (!this.newMessage.destinatarioId || !this.newMessage.asunto || !this.newMessage.contenido) {
      alert('Por favor complete todos los campos');
      return;
    }

    this.mensajeService.enviarMensaje(
      this.newMessage.asunto,
      this.newMessage.contenido,
      Number(this.newMessage.destinatarioId)
    ).subscribe({
      next: () => {
        alert('Mensaje enviado');
        this.newMessage = { destinatarioId: 0, asunto: '', contenido: '' };
        this.switchTab('enviados');
      },
      error: err => alert('Error al enviar: ' + (err.error.message || err.message))
    });
  }

  marcarLeido(msg: Mensaje): void {
    if (!msg.leido) {
      this.mensajeService.marcarComoLeido(msg.id).subscribe({
        next: () => msg.leido = true,
        error: err => console.error(err)
      });
    }
  }
}
