import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin';
import { StorageService } from '../services/storage';
import { ExportService } from '../services/export.service';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
    isAdmin = false;
    isDirectivo = false;
    users: any[] = [];
    filteredUsers: any[] = [];
    searchTerm = '';
    roleFilter = '';
    showModal = false;
    isEditing = false;
    errorMessage = '';
    isLoading = false;

    currentUser: any = {
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        role: ''  // Default empty, per request
    };

    roles = ['ADMIN', 'VENDEDOR', 'RECEPCION', 'CONTABILIDAD', 'DIRECTIVO', 'CLIENTE'];

    private adminService = inject(AdminService);
    private exportService = inject(ExportService);
    private cdr = inject(ChangeDetectorRef);
    private storageService = inject(StorageService);

    constructor() { }

    ngOnInit(): void {
        console.log('AdminUsersComponent: ngOnInit triggered');
        try {
            const user = this.storageService.getUser();
            console.log('Current logged user:', user);
            this.isAdmin = user && user.role === 'ROLE_ADMIN';
            this.isDirectivo = user && user.role === 'ROLE_DIRECTIVO';
            console.log('isAdmin check:', this.isAdmin, 'isDirectivo check:', this.isDirectivo);
            this.loadUsers();
        } catch (e) {
            console.error('Crash in ngOnInit:', e);
            this.errorMessage = 'Error de inicialización del componente.';
        }
    }

    loadUsers(): void {
        console.log('loadUsers() called');
        this.isLoading = true;
        this.errorMessage = '';
        this.adminService.getUsers().subscribe({
            next: (data) => {
                console.log('API Users Response type:', typeof data);
                console.log('API Users Response content:', data);
                
                if (!data) {
                    console.error('Data is null or undefined');
                    this.errorMessage = 'La API retornó una respuesta vacía.';
                } else {
                    this.users = Array.isArray(data) ? data : (data.content || []);
                    console.log('Final users list:', this.users);
                    this.filteredUsers = [...this.users];
                }
                
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Detailed Error loading users:', err);
                this.errorMessage = err.message || 'Error desconocido al cargar usuarios.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    filterUsers(): void {
        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !this.searchTerm || 
                (user.username?.toLowerCase().includes(this.searchTerm.toLowerCase()) || false) ||
                (user.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) || false) ||
                (user.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) || false);
            
            const matchesRole = !this.roleFilter || 
                user.role === this.roleFilter;
            
            return matchesSearch && matchesRole;
        });
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.roleFilter = '';
        this.filteredUsers = this.users;
    }


    openCreateModal(): void {
        this.isEditing = false;
        this.currentUser = { name: '', username: '', email: '', phone: '', password: '', role: '' };
        this.showModal = true;
    }

    openEditModal(user: any): void {
        // Only Directivos can edit Admins
        if (user.role === 'ADMIN' && !this.isDirectivo) {
            alert('Solo un Directivo puede editar a un Administrador.');
            return;
        }
        this.isEditing = true;
        this.currentUser = { ...user, password: '' };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
    }

    saveUser(): void {
        if (this.isEditing) {
            this.adminService.updateUser(this.currentUser.id, this.currentUser).subscribe({
                next: () => {
                    this.loadUsers();
                    this.closeModal();
                },
                error: (err) => alert('Error actualizando: ' + (err.error?.message || err.message))
            });
        } else {
            this.adminService.createUser(this.currentUser).subscribe({
                next: () => {
                    this.loadUsers();
                    this.closeModal();
                },
                error: (err) => alert('Error creando: ' + (err.error?.message || err.message))
            });
        }
    }

    deleteUser(id: number): void {
        const userToDelete = this.users.find(u => u.id === id);
        if (userToDelete && userToDelete.role === 'ADMIN' && !this.isDirectivo) {
            alert('Solo un Directivo puede eliminar a un Administrador.');
            return;
        }

        if (confirm('¿Eliminar usuario?')) {
            this.adminService.deleteUser(id).subscribe({
                next: () => this.loadUsers(),
                error: (err) => alert('Error eliminando: ' + (err.error?.message || err.message))
            });
        }
    }

    exportExcel(): void {
        this.exportService.exportToExcel('/reportes/usuarios', {}, 'lista_usuarios.xlsx');
    }
}
