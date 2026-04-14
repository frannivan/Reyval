import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService } from '../services/cliente';
import { LoteService } from '../services/lote';
import { VentaService } from '../services/venta';
import { PagoService } from '../services/pago';
import { UserService } from '../services/user.service';
import { StorageService } from '../services/storage';

@Component({
  selector: 'app-generar-contrato',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './generar-contrato.html'
})
export class GenerarContratoComponent implements OnInit {
  clientes: any[] = [];
  lotes: any[] = [];
  vendedores: any[] = [];
  
  // Form Data
  isNewClient = false;
  contractData: any = {
    clienteId: null,
    // New Client Details
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    ine: '',
    
    loteId: null,
    montoTotal: 0,
    enganche: 0,
    plazoMeses: 12,
    tasaAnual: 10,
    vendedorId: ''
  };

  loteSelected: any = null;
  registerDownPayment = false;
  downPaymentReference = '';
  
  successMsg = '';
  errorMsg = '';
  isSaving = false;

  private clienteService = inject(ClienteService);
  private loteService = inject(LoteService);
  private ventaService = inject(VentaService);
  private pagoService = inject(PagoService);
  private userService = inject(UserService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.clienteService.getAllClientes().subscribe({
      next: data => this.clientes = data,
      error: err => console.error('Error loading clients', err)
    });

    this.loteService.getAllLotes().subscribe({
      next: data => this.lotes = data.filter((l: any) => l.estatus === 'DISPONIBLE'),
      error: err => console.error('Error loading lots', err)
    });

    this.userService.getVendedores().subscribe({
      next: data => {
        this.vendedores = data;
        this.autoAssignVendedor();
      },
      error: err => console.error('Error loading sellers', err)
    });
  }

  autoAssignVendedor(): void {
    const currentUser = this.storageService.getUser();
    if (currentUser && currentUser.role === 'ROLE_VENDEDOR') {
      this.contractData.vendedorId = currentUser.id;
    }
  }

  onLoteSelect(lote: any): void {
    this.loteSelected = lote;
    if (lote) {
      this.contractData.loteId = lote.id;
      this.contractData.montoTotal = lote.precioTotal;
      this.contractData.enganche = lote.precioTotal * 0.10; // Default 10%
    }
  }

  get estimatedMonthlyPayment(): number {
    const principal = this.contractData.montoTotal - this.contractData.enganche;
    if (principal <= 0 || this.contractData.plazoMeses <= 0) return 0;

    const rate = this.contractData.tasaAnual / 100 / 12;
    if (rate === 0) return principal / this.contractData.plazoMeses;

    const n = this.contractData.plazoMeses;
    return (principal * rate) / (1 - Math.pow(1 + rate, -n));
  }

  get amortizationTable(): any[] {
    const table: any[] = [];
    const principal = this.contractData.montoTotal - this.contractData.enganche;
    if (principal <= 0 || this.contractData.plazoMeses <= 0) return [];

    const monthlyRate = this.contractData.tasaAnual / 100 / 12;
    const payment = this.estimatedMonthlyPayment;
    let balance = principal;

    for (let i = 1; i <= Math.min(this.contractData.plazoMeses, 12); i++) {
      const interest = balance * monthlyRate;
      const capital = payment - interest;
      balance -= capital;
      table.push({
        num: i,
        cuota: payment,
        interes: interest,
        capital: capital,
        saldo: Math.max(0, balance)
      });
    }
    return table;
  }

  submitContract(): void {
    if (!this.isNewClient && !this.contractData.clienteId) {
      this.errorMsg = 'Por favor selecciona un Cliente.';
      return;
    }

    if (this.isNewClient && (!this.contractData.nombre || !this.contractData.email || !this.contractData.telefono)) {
      this.errorMsg = 'Por favor completa los datos básicos del nuevo cliente (Nombre, Email, Teléfono).';
      return;
    }

    if (!this.contractData.loteId) {
      this.errorMsg = 'Por favor selecciona un Lote.';
      return;
    }

    // Clean up if not new client
    if (!this.isNewClient) {
      this.contractData.nombre = undefined;
      this.contractData.email = undefined;
      // ... etc, but backend handles it by checking clienteId
    } else {
      this.contractData.clienteId = null;
    }

    this.isSaving = true;
    this.ventaService.crearContrato(this.contractData).subscribe({
      next: (res: any) => {
        this.successMsg = 'Contrato generado exitosamente.';
        if (this.registerDownPayment && res.id) {
          this.registerImmediateDownPayment(res.id);
        } else {
          setTimeout(() => this.router.navigate(['/admin/lotes']), 2000);
        }
      },
      error: err => {
        this.errorMsg = err.message || 'Error al crear contrato.';
        this.isSaving = false;
      }
    });
  }

  registerImmediateDownPayment(contratoId: number): void {
    const formData: FormData = new FormData();
    formData.append('contratoId', String(contratoId));
    formData.append('monto', String(this.contractData.enganche));
    formData.append('referencia', this.downPaymentReference || 'Enganche Inicial');
    formData.append('concepto', 'Enganche');
    formData.append('fechaPago', new Date().toISOString().split('T')[0]);

    this.pagoService.registrarPago(formData).subscribe({
      next: res => {
        this.successMsg += ' Enganche registrado correctamente.';
        setTimeout(() => this.router.navigate(['/admin/lotes']), 2500);
      },
      error: err => {
        console.error(err);
        this.errorMsg = 'Contrato creado, pero error al registrar enganche.';
        this.isSaving = false;
      }
    });
  }
}
