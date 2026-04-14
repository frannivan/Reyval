import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente';
import { PagoService } from '../../services/pago';

@Component({
    selector: 'app-client-dossier',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './client-dossier.component.html',
    styleUrls: ['../../lux-styles.css'] // Use global lux styles
})
export class ClientDossierComponent implements OnChanges {
    @Input() show = false;
    @Input() cliente: any = null;
    @Output() closeEvent = new EventEmitter<void>();
    @Output() editEvent = new EventEmitter<void>();

    contracts: any[] = [];
    allPayments: any[] = [];

    // Services
    private clienteService = inject(ClienteService);
    private pagoService = inject(PagoService);

    totalInvested = 0;
    totalPaid = 0;
    today = new Date();

    // UI State
    activeTab: 'properties' | 'payments' = 'properties';

    // Payment Form State
    showPaymentForm = false;
    isSubmittingPayment = false;
    paymentSuccessMsg = '';
    paymentErrorMsg = '';

    paymentData: any = {
        contratoId: null,
        monto: 0,
        referencia: '',
        concepto: 'Mensualidad'
    };

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['show'] && this.show && this.cliente) {
            this.loadDossierData();
            this.closePaymentForm(); // Reset form when opening dossier
        }
    }

    loadDossierData(): void {
        if (!this.cliente) return;

        // Reset display but keep contracts to avoid flicker if just refreshing
        // this.contracts = []; 
        this.allPayments = [];
        this.totalInvested = 0;
        this.totalPaid = 0;

        this.clienteService.getContratosByCliente(this.cliente.id).subscribe({
            next: (data: any[]) => {
                this.contracts = data;
                this.calculateStats();
                // Calculate amortization for the first active contract found
                const activeContract = this.contracts.find(c => c.estatus === 'ACTIVO') || this.contracts[0];
                if (activeContract) {
                    this.calculateAmortizationSchedule(activeContract);
                }
            },
            error: err => console.error('Error fetching contracts for dossier', err)
        });
    }

    calculateStats(): void {
        this.totalInvested = 0;
        this.totalPaid = 0;
        this.allPayments = [];

        this.contracts.forEach(c => {
            this.totalInvested += Number(c.montoTotal) || 0;

            if (c.pagos && Array.isArray(c.pagos)) {
                c.pagos.forEach((p: any) => {
                    const monto = Number(p.monto) || 0;
                    
                    // Solo sumar al total pagado si está VALIDADO o COMPLETADO
                    if (p.estatus === 'VALIDADO' || p.estatus === 'COMPLETADO') {
                        this.totalPaid += monto;
                    }

                    // Agregar contexto al pago para la lista (se muestran todos, pero el total solo cuenta los validados)
                    this.allPayments.push({
                        ...p,
                        monto: monto, // Asegurar que es número para el pipe currency
                        loteRef: c.lote?.numeroLote || 'N/A'
                    });
                });
            }
        });

        // Ordenar pagos por fecha desc
        this.allPayments.sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());
    }

    // Amortization State
    amortizationTable: any[] = [];

    getGlobalProgress(): number {
        if (this.totalInvested === 0) return 0;
        return (this.totalPaid / this.totalInvested) * 100;
    }

    calculateAmortizationSchedule(contract: any): void {
        if (!contract) return;
        
        const montoTotal = Number(contract.montoTotal) || 0;
        const enganche = Number(contract.enganche) || 0;
        const monto = montoTotal - enganche;
        const plazo = contract.plazoMeses || 12;
        // El backend usa tasaInteresAnual, el código anterior buscaba tasaAnual (que no existe)
        const tasaAnual = Number(contract.tasaInteresAnual) || 0;
        const tasaMensual = (tasaAnual / 100) / 12;
        
        this.amortizationTable = [];
        
        let saldo = monto;
        let cuota = 0;

        // Formula Cuota Fija (Método Francés)
        if (tasaMensual > 0) {
            cuota = (monto * tasaMensual * Math.pow(1 + tasaMensual, plazo)) / (Math.pow(1 + tasaMensual, plazo) - 1);
        } else {
            cuota = monto / plazo;
        }

        let fechaPago = new Date(contract.fechaContrato);
        // Start from next month
        fechaPago.setMonth(fechaPago.getMonth() + 1);

        for (let i = 1; i <= plazo; i++) {
            const interes = saldo * tasaMensual;
            let capital = cuota - interes;
            
            if (i === plazo || capital > saldo) {
                capital = saldo;
                cuota = capital + interes;
            }
            
            const saldoFinal = saldo - capital;
            
            this.amortizationTable.push({
                numero: i,
                fecha: new Date(fechaPago),
                saldoInicial: saldo,
                cuota: cuota,
                interes: interes,
                capital: capital,
                saldoFinal: saldoFinal < 0 ? 0 : saldoFinal // Avoid negative rounding errors
            });
            
            saldo = saldoFinal;
            fechaPago.setMonth(fechaPago.getMonth() + 1);
        }
    }

    getInitials(name: string, surname: string): string {
        return (name ? name.charAt(0) : '') + (surname ? surname.charAt(0) : '');
    }

    // File Upload State
    selectedFile: File | null = null;
    selectedFileName: string | null = null;

    close(): void {
        this.closeEvent.emit();
    }

    editClient(): void {
        this.editEvent.emit();
    }

    printHistory(): void {
        window.print();
    }

    // --- Payment Logic ---
    openPaymentForm(): void {
        this.showPaymentForm = true;
        this.activeTab = 'payments'; // Switch to history tab where form might be located or relevant
        this.paymentSuccessMsg = '';
        this.paymentErrorMsg = '';
        this.paymentData = {
            contratoId: this.contracts.length > 0 ? this.contracts[0].id : null,
            monto: 0,
            referencia: '',
            concepto: 'Mensualidad',
            metodoPago: 'Transferencia'
        };
        this.selectedFile = null;
        this.selectedFileName = null;
    }

    closePaymentForm(): void {
        this.showPaymentForm = false;
        this.selectedFile = null;
        this.selectedFileName = null;
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            this.selectedFileName = file.name;
        }
    }

    submitPayment(): void {
        if (!this.paymentData.contratoId || this.paymentData.monto <= 0) {
            this.paymentErrorMsg = 'Selecciona un contrato y un monto válido.';
            return;
        }

        this.isSubmittingPayment = true;

        const formData = new FormData();
        formData.append('contratoId', this.paymentData.contratoId);
        formData.append('monto', this.paymentData.monto);
        formData.append('fechaPago', new Date().toISOString().split('T')[0]);
        formData.append('referencia', this.paymentData.referencia || 'En Caja');
        formData.append('concepto', this.paymentData.concepto);
        formData.append('metodoPago', this.paymentData.metodoPago);

        if (this.selectedFile) {
            formData.append('file', this.selectedFile);
        }

        this.pagoService.registrarPago(formData).subscribe({
            next: (res) => {
                this.isSubmittingPayment = false;
                this.paymentSuccessMsg = 'Pago registrado exitosamente.';
                this.loadDossierData(); // Refresh stats and history

                setTimeout(() => {
                    this.closePaymentForm();
                }, 2000);
            },
            error: (err) => {
                this.isSubmittingPayment = false;
                this.paymentErrorMsg = err.message || 'Error al registrar el pago.';
                console.error(err);
            }
        });
    }
}
