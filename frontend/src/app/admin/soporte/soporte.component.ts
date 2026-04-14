import { Component, OnInit } from '@angular/core';
import { TicketService, Ticket } from '../../services/ticket.service';
import { StorageService } from '../../services/storage';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-soporte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './soporte.component.html',
  styleUrls: ['./soporte.component.css']
})
export class SoporteComponent implements OnInit {
  tickets: Ticket[] = [];
  isAdmin = false;
  isSoporte = false;
  isDirectivo = false;
  isRecepcion = false;
  canSeeAll = false;
  canRequestChange = false;
  currentUser: any = null;
  
  // Filtering
  activeTypeFilter: 'TODOS' | 'INCIDENCIA' | 'CAMBIO' = 'TODOS';
  filteredTickets: Ticket[] = [];
  newTicket: any = {
    titulo: '',
    descripcion: '',
    prioridad: 'MEDIA',
    tipo: 'INCIDENCIA'
  };
  selectedFile: File | null = null;
  
  selectedTicket: Ticket | null = null;
  newComment = '';
  
  // New structured fields
  rolesDisponibles = ['ADMIN', 'VENDEDOR', 'RECEPCION', 'CONTABILIDAD', 'DIRECTIVO', 'SOPORTE'];
  selectedRoles: string[] = [];
  
  incidentCategories = [
    { id: 'GENERAL', label: 'General / Otros' },
    { id: 'CLIENTE', label: 'Cliente (Nombre/ID)' },
    { id: 'CONTRATO', label: 'Contrato (Cliente + Lote)' },
    { id: 'LEAD', label: 'Lead (Interesado)' },
    { id: 'LOTE', label: 'Lote (Ubicación/Mz/Lt)' }
  ];
  selectedCategory = 'GENERAL';
  dynamicContext: any = {};
  pasosReplicacion = '';

  loading = false;
  message = '';

  constructor(
    private ticketService: TicketService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    const user = this.storageService.getUser();
    this.currentUser = user;
    const role = user.role || '';
    this.isAdmin = role === 'ROLE_ADMIN';
    this.isSoporte = role === 'ROLE_SOPORTE';
    this.isDirectivo = role === 'ROLE_DIRECTIVO';
    this.isRecepcion = role === 'ROLE_RECEPCION';
    
    // Support, Directivo and Admin (if configured) see all
    this.canSeeAll = this.isSoporte || this.isDirectivo || this.isAdmin;

    // Specific permission for Change Requests
    this.canRequestChange = this.isAdmin || this.isSoporte || this.isDirectivo || this.isRecepcion;
    
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    const request = this.canSeeAll 
      ? this.ticketService.getAllTickets() 
      : this.ticketService.getMyTickets();
      
    request.subscribe({
      next: data => {
        this.tickets = data;
        this.applyFilters();
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    if (this.activeTypeFilter === 'TODOS') {
      this.filteredTickets = this.tickets;
    } else {
      this.filteredTickets = this.tickets.filter(t => t.tipo === this.activeTypeFilter);
    }
  }

  setFilter(type: 'TODOS' | 'INCIDENCIA' | 'CAMBIO'): void {
    this.activeTypeFilter = type;
    this.applyFilters();
  }

  // Pre-set type and scroll/open form if needed
  prepNewTicket(type: 'INCIDENCIA' | 'CAMBIO'): void {
    this.newTicket.tipo = type;
    this.selectedRoles = [];
    this.selectedCategory = 'GENERAL';
    this.dynamicContext = {};
    this.pasosReplicacion = '';
    // Optionally focus the title input or scroll to the form
    document.getElementById('ticketForm')?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleRole(role: string): void {
    const idx = this.selectedRoles.indexOf(role);
    if (idx > -1) this.selectedRoles.splice(idx, 1);
    else this.selectedRoles.push(role);
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  onSubmit(): void {
    if (!this.newTicket.titulo || !this.newTicket.descripcion) return;
    
    const formData = new FormData();
    formData.append('titulo', this.newTicket.titulo);
    formData.append('descripcion', this.newTicket.descripcion);
    formData.append('prioridad', this.newTicket.prioridad);
    formData.append('tipo', this.newTicket.tipo);
    formData.append('userId', this.storageService.getUser().id); 

    if (this.newTicket.tipo === 'CAMBIO') {
      // No roles for change, just description
    } else {
      formData.append('rolesDestino', this.selectedRoles.join(', '));
      formData.append('pasosReplicacion', this.pasosReplicacion);
      // Construct dynamic record info
      let contexto = `[${this.selectedCategory}] `;
      if (this.selectedCategory === 'CONTRATO') {
        contexto += `Cliente: ${this.dynamicContext.cliente || 'N/A'}, Lote: ${this.dynamicContext.lote || 'N/A'}`;
      } else if (this.selectedCategory === 'CLIENTE') {
        contexto += `Nombre/ID: ${this.dynamicContext.identificador || 'N/A'}`;
      } else if (this.selectedCategory === 'LEAD') {
        contexto += `Interesado: ${this.dynamicContext.interesado || 'N/A'}`;
      } else if (this.selectedCategory === 'LOTE') {
        contexto += `Ref: ${this.dynamicContext.referencia || 'N/A'}`;
      } else {
        contexto += this.dynamicContext.detalle || 'General';
      }
      formData.append('registroAfectado', contexto);
    }

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.loading = true;
    this.ticketService.createTicket(formData).subscribe({
      next: res => {
        this.message = 'Ticket enviado correctamente.';
        this.newTicket = { titulo: '', descripcion: '', prioridad: 'MEDIA', tipo: 'INCIDENCIA' };
        this.selectedFile = null;
        this.loadTickets();
      },
      error: err => {
        this.message = 'Error al enviar el ticket.';
        this.loading = false;
      }
    });
  }

  selectTicket(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.newComment = '';
  }

  updateStatus(status: string): void {
    if (!this.selectedTicket?.id) return;
    
    this.ticketService.updateStatus(this.selectedTicket.id, status).subscribe({
      next: res => {
        this.selectedTicket!.estatus = status as any;
        // Optionally add a system message or refresh
        this.loadTickets();
      },
      error: err => console.error(err)
    });
  }

  addComment(): void {
    if (!this.selectedTicket?.id || !this.newComment) return;
    
    this.ticketService.addComment(this.selectedTicket.id, this.newComment).subscribe({
      next: res => {
        // Refresh local ticket data to show the new message in the modern array
        this.loadTickets();
        this.newComment = '';
      },
      error: err => console.error(err)
    });
  }

  getEvidenciaUrl(ticket: Ticket): string {
    if (ticket.evidenciaUrl) {
      // Resolve using the path stored in the DB (managed by ImagesController)
      const apiUrl = environment?.apiUrl || '';
      const baseUrl = apiUrl.split('/api')[0] || '';
      return `${baseUrl}${ticket.evidenciaUrl}`;
    }
    return '';
  }

  getCreatorInfo(ticket: Ticket): string {
    if (!ticket.user) return 'Usuario Desconocido';
    const name = ticket.user.username;
    const role = ticket.user.role?.name ? `(${ticket.user.role.name.replace('ROLE_', '')})` : '';
    return `${name} ${role}`;
  }
}
