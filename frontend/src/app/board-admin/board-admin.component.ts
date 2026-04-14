import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoteService } from '../services/lote';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FraccionamientoService } from '../services/fraccionamiento';
import { ReporteService } from '../services/reporte';
import { VentaService } from '../services/venta';
import { ClienteService } from '../services/cliente';
import { PagoService } from '../services/pago';
import { UserService } from '../services/user.service';
import { FraccionamientoListComponent } from '../components/fraccionamientos/fraccionamiento-list/fraccionamiento-list.component';
import { LoteListComponent } from '../components/lotes/lote-list/lote-list.component';
import { PolygonEditorComponent } from './polygon-editor/polygon-editor.component';
import { StorageService } from '../services/storage';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-board-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, PolygonEditorComponent, FraccionamientoListComponent, LoteListComponent],
    templateUrl: './board-admin.component.html',
    styleUrl: './board-admin.component.css'
})
export class BoardAdminComponent implements OnInit {
    getClientNameForPayment(): string {
        const client = this.clientes.find(c => c.id === this.paymentData.clienteId);
        return client ? client.nombre + ' ' + client.apellidos : '';
    }

    getLoteInfoForPayment(): string {
        const contract = this.todosLosContratos.find((c: any) => c.id === this.paymentData.contratoId);
        return contract ? 'Lote ' + contract.lote?.numeroLote + ' (' + contract.lote?.fraccionamiento?.nombre + ')' : '';
    }

    content?: string;
    lotes: any[] = [];
    fraccionamientos: any[] = [];
    newLote: any = {
        numeroLote: '',
        manzana: '',
        precioTotal: 0,
        areaMetrosCuadrados: 0,
        coordenadasGeo: '',
        fraccionamiento: null,
        estatus: 'DISPONIBLE'
    };
    isCreating = false;

    // Fraccionamiento Management
    isCreatingFracc = false;
    showFraccDetailModal = false;
    selectedFracc: any = null;
    fraccLotes: any[] = [];
    newFracc: any = {
        nombre: '',
        ubicacion: '',
        descripcion: '',
        logoUrl: '',
        coordenadasGeo: ''
    };
    stats: any = null;

    // Sales & Payments Modules
    showContractModal = false;
    showPaymentModal = false;

    vendedores: any[] = [];
    boardTitle = 'Panel de Administración';

    // View Management
    currentView: 'dashboard' | 'contracts' | 'payments' = 'dashboard';
    showPolygonEditor = false;


    // Data Loading
    clientes: any[] = [];
    todosLosContratos: any[] = [];
    contratosFiltradosPago: any[] = [];

    // Contract Form

    // Contract Form
    contractData: any = {
        clienteId: null,
        loteId: null,
        montoTotal: 0,
        enganche: 0,
        plazoMeses: 12,
        tasaAnual: 10,
        vendedorId: ''
    };

    // New Client on-the-fly
    showNewClientForm = false;
    newClientData = {
        nombre: '',
        apellidos: '',
        email: '',
        telefono: '',
        direccion: '',
        ine: ''
    };



    get estimatedMonthlyPayment(): number {
        const principal = this.contractData.montoTotal - this.contractData.enganche;
        if (principal <= 0 || this.contractData.plazoMeses <= 0) return 0;

        const rate = this.contractData.tasaAnual / 100 / 12;
        if (rate === 0) return principal / this.contractData.plazoMeses;

        const n = this.contractData.plazoMeses;
        return (principal * rate) / (1 - Math.pow(1 + rate, -n));
    }

    registerDownPayment = false;


    downPaymentReference = '';
    loteSelectedForContract: any = null;

    // Payment Form
    paymentData = {
        clienteId: null,
        contratoId: null,
        monto: 0,
        referencia: '',
        concepto: 'Mensualidad'
    };
    paymentFile: File | null = null;
    pagosActuales: any[] = []; // History List
    paymentSuccessMsg = '';
    paymentErrorMsg = '';
    contractSuccessMsg = '';
    contractErrorMsg = '';

    // History Logic
    showHistoryModal = false;
    historyContract: any = null;

    // Lote Edit & Upload
    selectedFile: File | null = null;
    isEditingLote = false;
    isUploading = false;
    currentLoteId: number | null = null;
    isSubmittingContract = false;

    // Payment Search
    showPaymentSearchModal = false;
    paymentSearchTerm = '';
    foundPayments: any[] = [];
    allPayments: any[] = [];
    filteredPayments: any[] = [];

    private loteService = inject(LoteService);
    private fraccionamientoService = inject(FraccionamientoService);
    private reporteService = inject(ReporteService);
    private venteService = inject(VentaService);
    private clienteService = inject(ClienteService);
    private pagoService = inject(PagoService);
    private userService = inject(UserService);
    private storageService = inject(StorageService);
    private route = inject(ActivatedRoute);

    isAdmin = false;
    isRecepcion = false;
    isVendedor = false;
    isContabilidad = false;
    isDirectivo = false;

    constructor() { }

    ngOnInit(): void {
        const user = this.storageService.getUser();
        const role = user.role || '';
        this.isAdmin = role === 'ROLE_ADMIN';
        this.isRecepcion = role === 'ROLE_RECEPCION';
        this.isVendedor = role === 'ROLE_VENDEDOR';
        this.isContabilidad = role === 'ROLE_CONTABILIDAD';
        this.isDirectivo = role === 'ROLE_DIRECTIVO';

        if (this.isVendedor) {
            this.boardTitle = 'Panel de Vendedor';
        } else if (this.isRecepcion) {
            this.boardTitle = 'Panel de Recepción';
        } else if (this.isContabilidad) {
            this.boardTitle = 'Panel de Contabilidad';
        } else if (this.isDirectivo) {
            this.boardTitle = 'Panel Directivo';
        } else {
            this.boardTitle = 'Panel de Administración';
        }

        this.route.queryParams.subscribe(params => {
            if (params['view']) {
                this.setView(params['view']);
            } else if (this.isRecepcion) {
                this.setView('payments');
            } else {
                this.setView('dashboard');
            }
        });

        if (this.isAdmin || this.isDirectivo || this.isContabilidad) {
            this.loadStats();
        }
        
        this.loadFraccionamientos();
        this.loadLotes();
        this.loadClientes();
        this.loadVendedores();
    }

    setView(view: 'dashboard' | 'contracts' | 'payments'): void {
        this.currentView = view;
        if (view === 'contracts') this.loadAllContratos();
        if (view === 'payments') {
            this.loadAllPagos();
            this.contratosFiltradosPago = []; // Clear per-client filter when entering payments view
        }
    }

    loadVendedores(): void {
        this.userService.getVendedores().subscribe({
            next: (data: any[]) => {
                this.vendedores = data;
                console.log('Vendedores cargados:', this.vendedores.length);
            },
            error: (err: any) => console.error('Error loading vendedores', err)
        });
    }

    loadStats(): void {
        console.log('Fetching Stats...');
        this.reporteService.getDashboardStats().subscribe({
            next: data => {
                console.log('Stats Loaded:', data);
                this.stats = data;
            },
            error: err => {
                console.error('Error fetching stats', err);
                this.content = "Error loading stats: " + (err.message || 'Error desconocido');
            }
        });
    }

    loadLotes(): void {
        this.loteService.getAllLotes().subscribe({
            next: data => this.lotes = data,
            error: err => {
                console.error(err);
                if (err.error) {
                    try {
                        this.content = JSON.parse(err.error).message;
                    } catch (e) {
                        this.content = "Error accessing admin content.";
                    }
                }
            }
        });
    }

    loadFraccionamientos(): void {
        this.fraccionamientoService.getAllFraccionamientos().subscribe({
            next: data => this.fraccionamientos = data,
            error: err => console.error(err)
        });
    }

    loadClientes(): void {
        this.clienteService.getAllClientes().subscribe({
            next: data => this.clientes = data,
            error: err => console.error('Error loading clients', err)
        });
    }

    // Contracts Map: LoteId -> Contrato Info
    loteContratoMap: { [key: number]: any } = {};

    loadAllContratos(): void {
        const obs = (this.isVendedor && !this.isAdmin) 
            ? this.venteService.getMisContratos() 
            : this.venteService.getAllContratos();

        obs.subscribe({
            next: data => {
                console.log('Contratos cargados:', data); // DEBUG
                // Sort by ID descending to show most recent first
                this.todosLosContratos = data.sort((a: any, b: any) => b.id - a.id);
                if (data && data.length > 0) {
                    data.forEach((c: any) => {
                        if (c.lote) {
                            this.loteContratoMap[c.lote.id] = c;
                        }
                    });
                }
            },
            error: err => console.error(err)
        });
    }

    // --- Contract Logic ---
    openContractModal(): void {
        this.showContractModal = true;
        this.contractSuccessMsg = '';
        this.contractErrorMsg = '';
        this.registerDownPayment = false;
        this.downPaymentReference = '';
        this.showNewClientForm = false; // Reset
        this.newClientData = { nombre: '', apellidos: '', email: '', telefono: '', direccion: '', ine: '' };

        // Auto-assign current seller if applicable
        const currentUser = this.storageService.getUser();
        if (currentUser && currentUser.role === 'ROLE_VENDEDOR') {
            this.contractData.vendedorId = currentUser.id;
        } else {
            this.contractData.vendedorId = '';
        }
    }

    onLoteSelectForContract(lote: any): void {
        this.loteSelectedForContract = lote;
        this.contractData.loteId = lote.id;
        this.contractData.montoTotal = lote.precioTotal;
        this.contractData.enganche = lote.precioTotal * 0.10; // Default 10%
    }

    submitContract(): void {
        if (this.showNewClientForm) {
            // Validate client
            if (!this.newClientData.nombre || !this.newClientData.email) {
                this.contractErrorMsg = 'Nombre y Email son obligatorios para el nuevo cliente.';
                return;
            }
            // 1. Create client first
            this.clienteService.createCliente(this.newClientData).subscribe({
                next: (client: any) => {
                    this.contractData.clienteId = client.id;
                    this.loadClientes(); // Refresh list for future use
                    this.executeContractCreation();
                },
                error: (err: any) => {
                    this.contractErrorMsg = 'Error al crear el cliente: ' + (err.error?.message || err.message);
                }
            });
        } else {
            if (!this.contractData.clienteId || !this.contractData.loteId) {
                this.contractErrorMsg = 'Selecciona Cliente y Lote.';
                return;
            }
            this.executeContractCreation();
        }
    }

    private executeContractCreation(): void {
        this.isSubmittingContract = true;
        this.venteService.crearContrato(this.contractData).subscribe({
            next: (res: any) => {
                this.isSubmittingContract = false;
                this.contractSuccessMsg = res.message;
                this.loadStats(); // Update counters
                this.loadLotes(); // Update lote estatus

                if (this.registerDownPayment && res.id) {
                    // Auto-register Down Payment
                    this.registerImmediateDownPayment(res.id);
                } else {
                    setTimeout(() => this.showContractModal = false, 2000);
                }
            },
            error: err => {
                this.isSubmittingContract = false;
                this.contractErrorMsg = err.error?.message || err.message || 'Error al crear contrato.';
            }
        });
    }

    registerImmediateDownPayment(contratoId: number): void {
        const paymentPayload = {
            contratoId: contratoId,
            monto: this.contractData.enganche,
            referencia: this.downPaymentReference || 'Enganche Inicial',
            concepto: 'Enganche',
            fechaPago: new Date().toISOString()
        };

        this.pagoService.registrarPago(paymentPayload).subscribe({
            next: res => {
                this.contractSuccessMsg += ' Y Enganche registrado exitosamente.';
                this.downPaymentReference = ''; // Reset
                setTimeout(() => this.showContractModal = false, 2500);
            },
            error: err => {
                console.error(err);
                this.contractErrorMsg = 'Contrato Creado, pero Error al registrar Enganche.';
            }
        });
    }

    // --- Payment Logic ---
    openPaymentModal(): void {
        this.showPaymentModal = true;
        this.paymentSuccessMsg = '';
        this.paymentErrorMsg = '';
        this.paymentData = {
            clienteId: null,
            contratoId: null,
            monto: 0,
            referencia: '',
            concepto: 'Mensualidad'
        };
        this.paymentFile = null;
        this.contratosFiltradosPago = [];
        this.pagosActuales = [];
    }

    onPaymentContractSelect(): void {
        if (this.paymentData.contratoId) {
            this.pagoService.getPagosByContrato(this.paymentData.contratoId).subscribe({
                next: data => this.pagosActuales = data,
                error: err => console.error(err)
            });
        } else {
            this.pagosActuales = [];
        }
    }

    onPaymentClientSelect(): void {
        this.contratosFiltradosPago = [];
        this.paymentData.contratoId = null;
        this.pagosActuales = [];

        if (this.paymentData.clienteId) {
            this.clienteService.getContratosByCliente(this.paymentData.clienteId).subscribe({
                next: data => {
                    this.contratosFiltradosPago = data;
                },
                error: err => console.error('Error fetching client contracts', err)
            });
        }
    }

    onPaymentFileSelected(event: any): void {
        const f = event.target.files?.[0];
        if (f) this.paymentFile = f;
    }

    submitPayment(): void {
        if (!this.paymentData.contratoId) {
            this.paymentErrorMsg = 'Por favor selecciona un contrato.';
            return;
        }

        const doRegister = (comprobanteUrl?: string) => {
            const paymentPayload = {
                contratoId: Number(this.paymentData.contratoId),
                monto: Number(this.paymentData.monto),
                referencia: this.paymentData.referencia || '',
                concepto: this.paymentData.concepto || 'Mensualidad',
                comprobanteUrl: comprobanteUrl || '',
                fechaPago: new Date().toISOString()
            };

            this.pagoService.registrarPago(paymentPayload).subscribe({
                next: res => {
                    this.paymentSuccessMsg = 'Pago registrado correctamente. Pendiente de validación.';
                    this.paymentFile = null;
                    this.loadStats();
                    setTimeout(() => {
                        this.showPaymentModal = false;
                        if (this.historyContract && this.paymentData.contratoId === this.historyContract.id) {
                            this.verHistorial(this.historyContract.lote);
                        }
                    }, 1500);
                },
                error: err => {
                    this.paymentErrorMsg = err.error?.message || 'Error al registrar pago.';
                }
            });
        };

        // If evidence file is selected, upload it first
        if (this.paymentFile) {
            this.loteService.uploadImage(this.paymentFile).subscribe({
                next: (res: any) => doRegister(res.url || res.message),
                error: err => {
                    console.error(err);
                    this.paymentErrorMsg = 'Error al subir el comprobante. Intenta de nuevo.';
                }
            });
        } else {
            this.paymentErrorMsg = 'Por favor adjunta un comprobante de pago.';
        }
    }





    onCreateLote(): void {
        const saveObservable = () => {
            if (this.isEditingLote && this.currentLoteId) {
                return this.loteService.updateLote(this.currentLoteId, this.newLote);
            } else {
                return this.loteService.createLote(this.newLote);
            }
        };

        const executeSave = () => {
            saveObservable().subscribe({
                next: data => {
                    console.log('Lote saved:', data);
                    this.isCreating = false;
                    this.isEditingLote = false;
                    this.currentLoteId = null;
                    this.selectedFile = null;
                    this.loadLotes();
                    this.newLote = { numeroLote: '', manzana: '', precioTotal: 0, areaMetrosCuadrados: 0, coordenadasGeo: '', fraccionamiento: null, estatus: 'DISPONIBLE', imagenUrl: '' };
                },
                error: err => console.error(err)
            });
        };

        if (this.selectedFile) {
            this.loteService.uploadImage(this.selectedFile).subscribe({
                next: (res: any) => {
                    // The backend returns the full URL in 'message' field or similar. 
                    // Let's assume the controller returns { message: '/api/images/uuid_filename' }
                    this.newLote.imagenUrl = res.message;
                    executeSave();
                },
                error: (err: any) => {
                    console.error('Upload failed', err);
                    alert('Error al subir imagen. Se guardará sin imagen nueva.');
                    executeSave();
                }
            });
        } else {
            executeSave();
        }
    }

    onFileSelected(event: any): void {
        const files: FileList = event.target.files;
        if (files && files.length > 0) {
            this.isUploading = true;
            // Iterate over all files
            Array.from(files).forEach((file) => {
                this.loteService.uploadImage(file).subscribe({
                    next: (res: any) => {
                        const uploadedUrl = res.url || res.message;
                        // If no main image, set first as main
                        if (!this.newLote.imagenUrl) {
                            this.newLote.imagenUrl = uploadedUrl;
                        }
                        // Add to gallery
                        if (!this.newLote.galeriaImagenes) {
                            this.newLote.galeriaImagenes = [];
                        }
                        this.newLote.galeriaImagenes.push(uploadedUrl);
                        this.isUploading = false;
                    },
                    error: (err) => {
                        console.error('Error uploading image', err);
                        this.isUploading = false;
                    }
                });
            });
        }
    }

    deleteImage(index: number): void {
        if (this.newLote.galeriaImagenes) {
            const deletedUrl = this.newLote.galeriaImagenes[index];
            this.newLote.galeriaImagenes.splice(index, 1);
            // If deleted image was cover, reset cover
            if (this.newLote.imagenUrl === deletedUrl) {
                this.newLote.imagenUrl = this.newLote.galeriaImagenes.length > 0 ? this.newLote.galeriaImagenes[0] : '';
            }
        }
    }

    setCover(url: string): void {
        this.newLote.imagenUrl = url;
    }

    editLote(lote: any): void {
        this.isEditingLote = true;
        this.currentLoteId = lote.id;
        this.newLote = { ...lote }; // Clone object
        this.isCreating = true; // Reuse form
        window.scrollTo(0, 0); // Scroll to top
    }

    cancelLoteEdit(): void {
        this.isCreating = false;
        this.isEditingLote = false;
        this.currentLoteId = null;
        this.selectedFile = null;
        this.newLote = { numeroLote: '', manzana: '', precioTotal: 0, areaMetrosCuadrados: 0, coordenadasGeo: '', fraccionamiento: null, estatus: 'DISPONIBLE' };
    }

    // Payment Search Logic
    openPaymentSearch(): void {
        this.showPaymentSearchModal = true;
        this.pagoService.getAllPagos().subscribe({
            next: (data: any) => {
                this.allPayments = data;
                this.foundPayments = data; // Show all initially
            },
            error: (err: any) => console.error(err)
        });
    }

    loadAllPagos(): void {
        this.pagoService.getAllPagos().subscribe({
            next: (data: any) => {
                this.allPayments = data;
                this.filteredPayments = data;
                this.foundPayments = data; 
            },
            error: (err: any) => console.error(err)
        });
    }

    searchPayments(): void {
        const term = this.paymentSearchTerm.toLowerCase();
        if (!term) {
            this.foundPayments = this.allPayments;
            return;
        }
        this.foundPayments = this.allPayments.filter(p =>
            (p.referencia?.toLowerCase() || '').includes(term) ||
            (p.concepto?.toLowerCase() || '').includes(term) ||
            (p.contrato?.id?.toString() || '').includes(term) ||
            (p.monto?.toString() || '').includes(term) ||
            (p.contrato?.cliente?.nombre?.toLowerCase() || '').includes(term) ||
            (p.contrato?.cliente?.apellidos?.toLowerCase() || '').includes(term)
        );
    }

    addPaymentFromHistory(): void {
        if (this.historyContract) {
            this.showHistoryModal = false;
            this.openPaymentModal();
            // Pre-fill payment data
            this.paymentData.clienteId = this.historyContract.cliente?.id;
            this.onPaymentClientSelect(); // Load contracts

            // Wait a sec for contracts to load
            setTimeout(() => {
                this.paymentData.contratoId = this.historyContract.id;
                this.onPaymentContractSelect();
            }, 500);
        }
    }

    // --- FRACCIONAMIENTO Logic ---
    onCreateFracc(): void {
        this.fraccionamientoService.createFraccionamiento(this.newFracc).subscribe({
            next: res => {
                this.isCreatingFracc = false;
                this.loadFraccionamientos();
                this.newFracc = { nombre: '', ubicacion: '', descripcion: '', logoUrl: '', coordenadasGeo: '' };
            },
            error: err => console.error(err)
        });
    }

    viewFraccDetail(fracc: any): void {
        this.selectedFracc = fracc;
        this.showFraccDetailModal = true;
        this.loteService.getLotesByFraccionamiento(fracc.id).subscribe({
            next: data => this.fraccLotes = data,
            error: err => console.error(err)
        });
    }

    deleteFracc(id: number): void {
        if (confirm('¿Seguro de eliminar este fraccionamiento?')) {
            this.fraccionamientoService.deleteFraccionamiento(id).subscribe({
                next: () => this.loadFraccionamientos(),
                error: err => console.error(err)
            });
        }
    }

    verHistorial(lote: any): void {
        const contrato = this.loteContratoMap[lote.id];
        if (contrato) {
            this.historyContract = contrato;
            this.showHistoryModal = true;

            // Load payments
            this.pagosActuales = [];
            this.pagoService.getPagosByContrato(contrato.id).subscribe({
                next: data => this.pagosActuales = data,
                error: err => console.error(err)
            });
        }
    }

    downloadReport(): void {
        if (this.historyContract) {
            this.venteService.downloadEstadoCuenta(this.historyContract.id).subscribe({
                next: (blob: Blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `estado_cuenta_${this.historyContract.id}.pdf`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                },
                error: err => console.error('Error downloading PDF', err)
            });
        }
    }

    getImageUrl(imgUrl: string): string {
      if (!imgUrl) return '';
      if (imgUrl.startsWith('http')) return imgUrl;

      let path = imgUrl;
      // Strip legacy context paths if present
      path = path.replace(/^\/(casavida|reyval)\/api\//, '/api/');

      if (path.startsWith('/api/images/')) {
          // Resolve to the backend host (e.g., http://localhost:3001/api/images/...)
          const baseUrl = environment.apiUrl.split('/api')[0];
          return `${baseUrl}${path}?cb=${new Date().getTime()}`;
      }

      // Relative paths or simple filenames
      const cleanPath = path.startsWith('/') ? path : `/images/${path}`;
      return `${environment.apiUrl}${cleanPath}?cb=${new Date().getTime()}`;
    }
}
