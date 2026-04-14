import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StorageService } from './services/storage';
import { AuthService } from './services/auth';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MensajeService } from './services/mensaje';

/**
 * Componente principal de la aplicación que gestiona la estructura de layout,
 * la autenticación global y las notificaciones de mensajes.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, ChatbotComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  // Role and session state
  role: string = '';
  isLoggedIn = false;
  isSidebarToggled = false; // Estado para la barra lateral móvil
  
  // Flags for role-based boards
  showAdminBoard = false;
  showModeratorBoard = false;
  showRecepcionBoard = false;
  showVendedorBoard = false;
  showClienteBoard = false;
  showContabilidadBoard = false;
  showDirectivoBoard = false;
  
  username?: string;
  unreadMessagesCount = 0; // Contador global de mensajes no leídos

  private storageService = inject(StorageService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private mensajeService = inject(MensajeService);

  constructor() { }

  ngOnInit(): void {
    // Escucha cambios de ruta para limpiar residuos de modales (Bootstrap backdrops)
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
      }
    });

    // Verifica si el usuario tiene una sesión activa
    this.isLoggedIn = this.storageService.isLoggedIn();

    if (this.isLoggedIn) {
      const user = this.storageService.getUser();
      if (user) {
        this.username = user.username;
        
        // Robust role extraction (handles release-1.1 and release-1.2 schemas)
        if (user.role) {
          this.role = user.role;
        } else if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
          this.role = user.roles[0];
        } else {
          this.role = '';
        }

        // Visibility based on single role
        this.showAdminBoard = this.role === 'ROLE_ADMIN';
        this.showRecepcionBoard = this.role === 'ROLE_RECEPCION';
        this.showVendedorBoard = this.role === 'ROLE_VENDEDOR';
        this.showClienteBoard = this.role === 'ROLE_CLIENTE';
        this.showContabilidadBoard = this.role === 'ROLE_CONTABILIDAD';
        this.showDirectivoBoard = this.role === 'ROLE_DIRECTIVO';

        // Carga inicial de notificaciones
        this.loadUnreadCount();
      }
    }
  }

  /**
   * Consulta al backend el número de mensajes sin leer del usuario.
   */
  loadUnreadCount(): void {
    if (this.isLoggedIn) {
      this.mensajeService.getUnreadCount().subscribe({
        next: count => this.unreadMessagesCount = count,
        error: err => console.error('Error fetching unread count', err)
      });
    }
  }

  /**
   * Retorna una etiqueta legible para el rol principal del usuario.
   */
  get userRoleDisplay(): string {
    if (this.showAdminBoard) return 'Administrador';
    if (this.showRecepcionBoard) return 'Recepción';
    if (this.showVendedorBoard) return 'Vendedor';
    if (this.showContabilidadBoard) return 'Contabilidad';
    if (this.showDirectivoBoard) return 'Directivo';
    if (this.showClienteBoard) return 'Cliente';
    return 'Usuario';
  }

  /**
   * Alterna la visibilidad de la barra lateral en dispositivos móviles.
   */
  toggleSidebar(): void {
    this.isSidebarToggled = !this.isSidebarToggled;
  }

  /**
   * Finaliza la sesión del usuario y limpia el estado local.
   * Redirección absoluta para evitar problemas con Nginx y dominios externos.
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: res => {
        this.storageService.clean();
        this.router.navigate(['/login']);
      },
      error: err => {
        console.log(err);
        this.storageService.clean();
        window.location.href = '/reyval/login';
      }
    });
  }
}
