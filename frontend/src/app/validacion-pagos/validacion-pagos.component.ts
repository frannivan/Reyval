import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService } from '../services/pago';
import { RouterModule } from '@angular/router';
import { PermissionService } from '../services/permission';
import { SafePipe } from '../helpers/safe.pipe';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-validacion-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SafePipe],
  templateUrl: './validacion-pagos.component.html',
  styles: [`
    .table-responsive {
        border-radius: 8px;
        overflow: hidden;
    }
    .badge {
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.5px;
    }
    .hover-lift {
        transition: transform 0.2s ease-in-out;
    }
    .hover-lift:hover {
        transform: translateY(-2px);
    }
    .font-monospace {
        font-family: 'Courier New', Courier, monospace;
    }
  `]
})
export class ValidacionPagosComponent implements OnInit {
  pagos: any[] = [];
  filteredPagos: any[] = [];
  searchTerm: string = '';
  statusFilter: string = 'PENDIENTE';
  message: string = '';
  pendingCount: number = 0;
  
  // Modal for evidence preview
  showModal: boolean = false;
  selectedComprobante: string = '';
  
  private pagoService = inject(PagoService);
  public permissionService = inject(PermissionService);

  ngOnInit(): void {
    this.loadPagos();
  }

  loadPagos(): void {
    this.pagoService.getAllPagos().subscribe({
      next: (data: any[]) => {
        this.pagos = data;
        this.pendingCount = data.filter(p => p.estatus === 'PENDIENTE').length;
        this.filterPagos();
      },
      error: (err: any) => {
        console.error('Error loading payments', err);
        this.message = 'Error al cargar pagos.';
      }
    });
  }

  filterPagos(): void {
    let temp = this.pagos;

    if (this.statusFilter !== 'ALL') {
      temp = temp.filter(p => (p.estatus || 'PENDIENTE') === this.statusFilter);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      temp = temp.filter(p => 
        (p.referencia?.toLowerCase() || '').includes(term) ||
        (p.concepto?.toLowerCase() || '').includes(term) ||
        (String(p.monto) || '').includes(term)
      );
    }

    this.filteredPagos = temp;
  }

  validatePayment(id: number): void {
    if (confirm('¿Confirmar validación de este pago?')) {
      this.pagoService.validatePago(id, 'VALIDADO').subscribe({
        next: (res: any) => {
          this.message = 'Pago validado correctamente.';
          this.loadPagos();
          setTimeout(() => this.message = '', 3000);
        },
        error: (err: any) => {
          this.message = 'Error al validar pago: ' + (err.message || 'Error desconocido');
        }
      });
    }
  }

  rejectPayment(id: number): void {
    if (confirm('¿Rechazar este pago?')) {
      this.pagoService.validatePago(id, 'RECHAZADO').subscribe({
        next: (res: any) => {
          this.message = 'Pago rechazado.';
          this.loadPagos();
          setTimeout(() => this.message = '', 3000);
        },
        error: (err: any) => {
          this.message = 'Error al rechazar pago: ' + (err.message || 'Error desconocido');
        }
      });
    }
  }

  openModal(url: string): void {
    this.selectedComprobante = url;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedComprobante = '';
  }

  getImageUrl(imgUrl: string): string {
    if (!imgUrl) return '';
    if (imgUrl.startsWith('http')) return imgUrl;

    let path = imgUrl;
    path = path.replace(/^\/(casavida|reyval)\/api\//, '/api/');

    if (path.startsWith('/api/images/')) {
        const baseUrl = environment.apiUrl.split('/api')[0];
        return `${baseUrl}${path}?cb=${new Date().getTime()}`;
    }

    const cleanPath = path.startsWith('/') ? path : `/images/${path}`;
    return `${environment.apiUrl}${cleanPath}?cb=${new Date().getTime()}`;
  }
}
