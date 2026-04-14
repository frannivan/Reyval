import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { StorageService } from '../../services/storage';
import { AuthService } from '../../services/auth';
import { PermissionService } from '../../services/permission';

/**
 * Componente de barra lateral (Sidebar) que gestiona el menú de navegación principal.
 * Filtra las opciones visibles según los roles del usuario autenticado.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Output() navItemClicked = new EventEmitter<void>();
  role: string = '';
  
  // Estados booleanos para simplificar las condiciones en el HTML
  isAdmin = false;
  isRecepcion = false;
  isVendedor = false;
  isContabilidad = false;
  isDirectivo = false;
  isUser = false;
  isSoporte = false;
  
  private permissionSubscription: any;
  private storageService = inject(StorageService);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    const user = this.storageService.getUser();
    this.role = user?.role || '';
    this.isAdmin = this.role === 'ROLE_ADMIN';
    this.isRecepcion = this.role === 'ROLE_RECEPCION';
    this.isVendedor = this.role === 'ROLE_VENDEDOR';
    this.isContabilidad = this.role === 'ROLE_CONTABILIDAD';
    this.isDirectivo = this.role === 'ROLE_DIRECTIVO';
    this.isUser = this.role === 'ROLE_CLIENTE';
    this.isSoporte = this.role === 'ROLE_SOPORTE';
  }

  ngOnInit(): void {
    // Subscribe to permission changes to trigger change detection
    this.permissionSubscription = this.permissionService.permissions$.subscribe(() => {
      // Force change detection to re-evaluate template methods like canAccess()
      this.cdr.detectChanges();
    });
    // Load initial permissions for the current user
    this.permissionService.loadUserPermissions().subscribe();
  }

  ngOnDestroy(): void {
    if (this.permissionSubscription) {
      this.permissionSubscription.unsubscribe();
    }
  }

  canAccess(key: string): boolean {
    if (key.includes(':')) {
      return this.permissionService.hasPermission(key);
    }
    return this.permissionService.canAccessMenu(key);
  }

  /**
   * Notifica que se ha hecho clic en un elemento de navegación.
   * Útil para cerrar el sidebar en dispositivos móviles.
   */
  onNavClick(): void {
    this.navItemClicked.emit();
  }

  /**
   * Cierra la sesión del usuario, limpia el almacenamiento local y redirige al login.
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.storageService.clean();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.storageService.clean();
        window.location.href = '/reyval/login';
      }
    });
  }
}
