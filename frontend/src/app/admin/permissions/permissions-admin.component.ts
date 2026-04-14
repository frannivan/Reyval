import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService, RolePermission } from '../../services/permission';
import { StorageService } from '../../services/storage';

@Component({
  selector: 'app-permissions-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permissions-admin.component.html',
  styleUrls: ['./permissions-admin.component.css']
})
export class PermissionsAdminComponent implements OnInit {
  private permissionService = inject(PermissionService);
  private storageService = inject(StorageService);

  currentUserRole: string = '';

  roles = [
    'ROLE_ADMIN', 'ROLE_DIRECTIVO', 'ROLE_VENDEDOR', 
    'ROLE_RECEPCION', 'ROLE_CONTABILIDAD', 'ROLE_SOPORTE', 'ROLE_CLIENTE'
  ];

  selectedRole = 'ROLE_VENDEDOR';
  
  // Estructura jerárquica para el acordeón
  permissionGroups = [
    {
      title: 'General y Dashboards',
      icon: 'fas fa-th-large',
      expanded: true,
      items: [
        { key: 'menu:home', label: 'Inicio / Home', icon: 'fas fa-home' },
        { key: 'menu:admin_dashboard', label: 'Dashboard Principal (Admin)', icon: 'fas fa-tachometer-alt' },
        { key: 'menu:panel_vendedor', label: 'Mi Panel (Vendedor)', icon: 'fas fa-user-tie' },
        { key: 'menu:panel_contabilidad', label: 'Panel Contabilidad', icon: 'fas fa-calculator' },
        { key: 'menu:panel_directivo', label: 'Panel Directivo', icon: 'fas fa-briefcase' }
      ]
    },
    {
      title: 'Gestión de Clientes y Leads',
      icon: 'fas fa-users',
      expanded: false,
      items: [
        { 
          key: 'menu:clientes', 
          label: 'Módulo de Clientes', 
          icon: 'fas fa-users',
          actions: [
            { key: 'action:cliente:create', label: 'Crear Nuevo Cliente' },
            { key: 'action:cliente:edit', label: 'Editar Información de Cliente' },
            { key: 'action:cliente:delete', label: 'Eliminar Cliente del Sistema' }
          ]
        },
        { 
          key: 'menu:leads', 
          label: 'Módulo de Prospectos (Leads)', 
          icon: 'fas fa-user-tag',
          actions: [
            { key: 'action:lead:create', label: 'Registrar Nuevo Prospecto' },
            { key: 'action:lead:edit', label: 'Actualizar Datos de Prospecto' },
            { key: 'action:lead:delete', label: 'Dar de Baja Prospecto' }
          ]
        },
        { key: 'menu:opportunities', label: 'Embudo de Oportunidades', icon: 'fas fa-chart-line' }
      ]
    },
    {
      title: 'Ventas y Contratos',
      icon: 'fas fa-file-signature',
      expanded: false,
      items: [
        { key: 'menu:contratos', label: 'Generación de Contratos', icon: 'fas fa-file-contract' },
        { key: 'menu:contracts_view', label: 'Ver Mis Contratos', icon: 'fas fa-file-invoice' },
        { key: 'menu:cotizaciones', label: 'Generar Cotización', icon: 'fas fa-calculator' },
        { 
          key: 'section:pagos', 
          label: 'Control de Pagos y Finanzas', 
          icon: 'fas fa-money-check-alt',
          actions: [
            { key: 'menu:payments_view', label: 'Ver Listado de Pagos' },
            { key: 'action:pago:create', label: 'Registrar Nuevo Pago' },
            { key: 'action:pago:validate', label: 'Validar Comprobantes de Pago' }
          ]
        }
      ]
    },
    {
      title: 'Inventario y Catálogos',
      icon: 'fas fa-boxes',
      expanded: false,
      items: [
        { 
          key: 'menu:fraccionamientos', 
          label: 'Gestión de Fraccionamientos', 
          icon: 'fas fa-city',
          actions: [
            { key: 'action:fraccionamiento:edit', label: 'Editar Datos de Fraccionamiento' },
            { key: 'action:fraccionamiento:delete', label: 'Eliminar Fraccionamiento' }
          ]
        },
        { 
          key: 'menu:lotes', 
          label: 'Inventario de Lotes', 
          icon: 'fas fa-map-marked-alt',
          actions: [
            { key: 'action:lote:edit', label: 'Modificar Estado / Disponibilidad' }
          ]
        }
      ]
    },
    {
      title: 'Administración y Herramientas',
      icon: 'fas fa-tools',
      expanded: false,
      items: [
        { key: 'menu:users', label: 'Usuarios y Cuentas', icon: 'fas fa-user-shield' },
        { key: 'menu:permissions', label: 'Configuración de Permisos', icon: 'fas fa-key' },
        { key: 'menu:reportes', label: 'Reportes y Estadísticas', icon: 'fas fa-chart-pie' },
        { key: 'menu:carga_datos', label: 'Carga Masiva (Excel)', icon: 'fas fa-file-excel' },
        { key: 'menu:polygon_editor', label: 'Editor de Polígonos de Mapa', icon: 'fas fa-draw-polygon' },
        { key: 'menu:documentacion', label: 'Manuales y Documentos', icon: 'fas fa-book-open' }
      ]
    },
     {
        title: 'Portal de Clientes',
        icon: 'fas fa-user-circle',
        expanded: false,
        items: [
          { key: 'menu:panel_cliente', label: 'Mi Portal (Cliente)', icon: 'fas fa-th-large' },
          { key: 'menu:profile', label: 'Mi Perfil', icon: 'fas fa-user' },
          { key: 'menu:payments_history', label: 'Historial de Pagos', icon: 'fas fa-history' },
          { key: 'menu:contract_details', label: 'Detalles de Contrato', icon: 'fas fa-file-import' },
          { key: 'menu:lot_details', label: 'Detalles de Lote', icon: 'fas fa-map-marker-alt' }
        ]
     },
     {
        title: 'Soporte y Sistema',
        icon: 'fas fa-headset',
        expanded: false,
        items: [
          { key: 'menu:soporte', label: 'Tickets de Soporte Técnico', icon: 'fas fa-life-ring' }
        ]
     }
  ];

  allPermissions: RolePermission[] = [];
  loading = false;
  saving = false;
  message = '';

  ngOnInit(): void {
    this.loadPermissions();
    this.currentUserRole = this.storageService.getUser()?.role || '';
  }

  loadPermissions(): void {
    this.loading = true;
    this.permissionService.getAllPermissions().subscribe({
      next: (data: RolePermission[]) => {
        this.allPermissions = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading permissions', err);
        this.loading = false;
      }
    });
  }

  toggleGroup(group: any): void {
    group.expanded = !group.expanded;
  }

  resetPermissions(): void {
    const confirmed = confirm('¿Estás seguro de que deseas restablecer TODOS los permisos a su estado original?');
    if (!confirmed) return;

    this.saving = true;
    this.permissionService.resetToDefaults().subscribe({
      next: (data) => {
        this.allPermissions = data;
        this.saving = false;
        this.showToast('Todos los permisos restablecidos');
        this.permissionService.loadUserPermissions().subscribe();
      },
      error: (err) => {
        console.error('Error resetting all permissions', err);
        this.saving = false;
        this.showToast('Error al restablecer permisos', 'danger');
      }
    });
  }

  resetRolePermissions(role: string): void {
    const roleClean = role.replace('ROLE_', '');
    const confirmed = confirm(`¿Restablecer permisos para el rol ${roleClean} a la configuración de fábrica?`);
    if (!confirmed) return;

    this.saving = true;
    this.permissionService.resetByRole(role).subscribe({
      next: (data) => {
        // Update local list with new role permissions
        const otherRoles = this.allPermissions.filter(p => p.roleName !== role);
        this.allPermissions = [...otherRoles, ...data];
        
        this.saving = false;
        this.showToast(`Permisos de ${roleClean} restablecidos`);
        
        // Refresh current user's active permissions if they have this role
        if (this.currentUserRole === role) {
          this.permissionService.loadUserPermissions().subscribe();
        }
      },
      error: (err) => {
        console.error('Error resetting role permissions', err);
        this.saving = false;
        this.showToast('Error al restablecer rol', 'danger');
      }
    });
  }

  isPermissionEnabled(role: string, key: string): boolean {
    const perm = this.allPermissions.find(p => p.roleName === role && p.permissionKey === key);
    // Default to false if not configured, to be consistent with PermissionService
    return perm ? perm.enabled : false;
  }

  togglePermission(role: string, key: string): void {
    // SECURITY CHECK: Only Directivos can edit ROLE_ADMIN
    if (role === 'ROLE_ADMIN' && this.currentUserRole !== 'ROLE_DIRECTIVO') {
      this.showToast('Solo un Directivo puede modificar permisos de Administrador', 'danger');
      return;
    }

    const perm = this.allPermissions.find(p => p.roleName === role && p.permissionKey === key);
    
    let updatedPerm: RolePermission;
    if (perm) {
      updatedPerm = { ...perm, enabled: !perm.enabled };
    } else {
      updatedPerm = { roleName: role, permissionKey: key, enabled: true }; // If not found, it means it's currently false (off), so we turn it true (on)
    }

    this.saving = true;
    this.permissionService.updatePermission(updatedPerm).subscribe({
      next: (res: any) => {
        const index = this.allPermissions.findIndex(p => p.roleName === role && p.permissionKey === key);
        if (index > -1) {
          this.allPermissions[index] = res;
        } else {
          this.allPermissions.push(res);
        }
        this.saving = false;
        this.showToast('Permiso actualizado correctamente');
      },
      error: (err) => {
        console.error('Error updating permission', err);
        this.saving = false;
        this.showToast('Error al actualizar permiso', 'danger');
      }
    });
  }

  showToast(msg: string, type: 'success' | 'danger' = 'success'): void {
    this.message = msg;
    setTimeout(() => this.message = '', 3000);
  }
}
