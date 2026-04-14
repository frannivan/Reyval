import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ClienteService } from '../services/cliente';

import { ClientDossierComponent } from './client-dossier/client-dossier.component';
import { HasPermissionDirective } from '../directives/has-permission';

@Component({
    selector: 'app-board-clients',
    standalone: true,
    imports: [CommonModule, FormsModule, ClientDossierComponent, HasPermissionDirective],
    templateUrl: './board-clients.component.html',
    styleUrl: './board-clients.component.css'
})
export class BoardClientsComponent implements OnInit {
    clientes: any[] = [];
    showClientModal = false;
    isEditingClient = false;
    editingClientId: number | null = null;
    clientData = {
        nombre: '',
        apellidos: '',
        email: '',
        telefono: '',
        direccion: '',
        ine: ''
    };
    clientSuccessMsg = '';
    clientErrorMsg = '';

    // Search
    searchTerm = '';

    // Dossier State
    showDossier = false;
    selectedClientForDossier: any = null;

    private route = inject(ActivatedRoute);

    constructor(private clienteService: ClienteService) { }

    ngOnInit(): void {
        this.loadClientes();
        
        // Subscribe to query params to react even if already on this component
        this.route.queryParamMap.subscribe(params => {
            const clientIdParam = params.get('clientId');
            const actionParam = params.get('action');

            if (clientIdParam && this.clientes.length > 0) {
                const client = this.clientes.find(c => c.id === Number(clientIdParam));
                if (client) {
                    this.openDossier(client);
                }
            }

            if (actionParam === 'new_client') {
                this.openClientModal();
            }
        });
    }

    loadClientes(): void {
        this.clienteService.getAllClientes().subscribe({
            next: data => {
                this.clientes = data;
                // Reactive params subscription will handle initial check
            },
            error: err => console.error('Error loading clients', err)
        });
    }

    // Removed checkQueryParams as it's now handled by the observable subscription in ngOnInit

    get filteredClientes() {
        if (!this.searchTerm) return this.clientes;
        return this.clientes.filter(c =>
            (c.nombre + ' ' + c.apellidos).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            c.telefono.includes(this.searchTerm)
        );
    }

    openClientModal(clientToEdit: any = null): void {
        this.showClientModal = true;
        this.clientSuccessMsg = '';
        this.clientErrorMsg = '';

        if (clientToEdit) {
            this.isEditingClient = true;
            this.editingClientId = clientToEdit.id;
            this.clientData = { ...clientToEdit };
        } else {
            this.isEditingClient = false;
            this.editingClientId = null;
            this.clientData = {
                nombre: '',
                apellidos: '',
                email: '',
                telefono: '',
                direccion: '',
                ine: ''
            };
        }
    }

    submitClient(): void {
        if (this.isEditingClient && this.editingClientId) {
            this.clienteService.updateCliente(this.editingClientId, this.clientData).subscribe({
                next: res => {
                    this.clientSuccessMsg = 'Cliente actualizado exitosamente.';
                    this.loadClientes();
                    setTimeout(() => this.showClientModal = false, 2000);
                },
                error: err => {
                    this.clientErrorMsg = err.message || 'Error al actualizar cliente.';
                }
            });
        } else {
            this.clienteService.createCliente(this.clientData).subscribe({
                next: res => {
                    this.clientSuccessMsg = 'Cliente registrado exitosamente.';
                    this.loadClientes();
                    setTimeout(() => this.showClientModal = false, 2000);
                },
                error: err => {
                    this.clientErrorMsg = err.message || 'Error al registrar cliente.';
                }
            });
        }
    }

    deleteClient(id: number): void {
        // Optional: Implement delete if needed later
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
            // Call service delete
        }
    }

    openDossier(client: any): void {
        this.selectedClientForDossier = client;
        this.showDossier = true;
    }

    closeDossier(): void {
        this.showDossier = false;
        this.selectedClientForDossier = null;
    }
}
