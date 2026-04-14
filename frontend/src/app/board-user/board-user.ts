import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientService } from '../services/client';
import { PagoService, Pago } from '../services/pago';
import { VentaService } from '../services/venta';

@Component({
  selector: 'app-board-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-user.html',
  styleUrl: './board-user.css',
})
export class BoardUser implements OnInit {
  dashboardData: any = null;
  errorMessage: string = '';

  // Account Statement Modal
  showModal = false;
  selectedContrato: any = null;
  pagosList: Pago[] = [];
  totalPagado = 0;
  saldoPendiente = 0;
  isLoadingPagos = false;

  constructor(
    @Inject(ClientService) private clientService: ClientService,
    private pagoService: PagoService,
    private ventaService: VentaService
  ) { }

  ngOnInit(): void {
    this.clientService.getDashboard().subscribe({
      next: data => {
        this.dashboardData = data;
      },
      error: err => {
        console.error(err);
        if (err.status === 400 || err.status === 404) {
          this.errorMessage = typeof err.error === 'string' ? err.error : (err.error?.message || 'No se encontró información de cliente asociada a tu cuenta.');
        } else {
          this.errorMessage = 'Ocurrió un error al obtener tus datos financieros.';
        }
      }
    });
  }

  verEstadoCuenta(contrato: any): void {
    this.selectedContrato = contrato;
    this.showModal = true;
    this.isLoadingPagos = true;
    this.pagosList = [];
    this.totalPagado = 0;
    this.saldoPendiente = 0;

    this.pagoService.getPagosByContrato(contrato.id).subscribe({
      next: data => {
        this.pagosList = data;
        this.calculateTotals();
        this.isLoadingPagos = false;
      },
      error: err => {
        console.error('Error fetching payments', err);
        this.isLoadingPagos = false;
      }
    });
  }

  calculateTotals(): void {
    this.totalPagado = this.pagosList.reduce((acc, pago) => acc + Number(pago.monto), 0);
    // Assuming we have the Total Contract Value or we just show what is paid.
    // In dashboardData we don't have contract total yet unless we update ClientPortalController or fetch it.
    // ClientPortalController returns ContratoSummary which currently DOES NOT have montoTotal.
    // Let's check ContratoSummary definition.
    // If not available, we can't calculate pending accurately without updating backend.
    // For now, let's display Total Pagado.
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedContrato = null;
  }

  downloadPDF(): void {
    if (this.selectedContrato) {
      this.ventaService.downloadEstadoCuenta(this.selectedContrato.id).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `estado_cuenta_${this.selectedContrato.id}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: err => console.error('Error downloading PDF', err)
      });
    }
  }
}
