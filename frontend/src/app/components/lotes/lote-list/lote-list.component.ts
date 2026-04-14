import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoteService } from '../../../services/lote';
import { FraccionamientoService } from '../../../services/fraccionamiento';
import { VentaService } from '../../../services/venta';
import { PagoService } from '../../../services/pago';
import { LocationPickerComponent } from '../../location-picker/location-picker';
import { StorageService } from '../../../services/storage';
import { ExportService } from '../../../services/export.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-lote-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, LocationPickerComponent, RouterModule],
  templateUrl: './lote-list.component.html'
})
export class LoteListComponent implements OnInit {
  @Input() readOnly = false;
  
  lotes: any[] = [];
  filteredLotes: any[] = [];
  fraccionamientos: any[] = [];
  
  // Filters
  searchTerm = '';
  fraccionamientoFilter = '';
  estatusFilter = '';
  
  // Create / Edit Lote
  isCreating = false;
  isEditingLote = false;
  currentLoteId: number | null = null;
  selectedFile: File | null = null;
  isUploading = false;
  newLote: any = {
      numeroLote: '',
      manzana: '',
      precioTotal: 0,
      areaMetrosCuadrados: 0,
      coordenadasGeo: '',
      fraccionamiento: null,
      estatus: 'DISPONIBLE',
      imagenUrl: ''
  };

  // Contracts & History
  loteContratoMap: { [key: number]: any } = {};
  showHistoryModal = false;
  historyContract: any = null;
  pagosActuales: any[] = [];

  private loteService = inject(LoteService);
  private fraccionamientoService = inject(FraccionamientoService);
  private ventaService = inject(VentaService);
  private pagoService = inject(PagoService);
  private storageService = inject(StorageService);
  private exportService = inject(ExportService);
  private router = inject(Router);

  ngOnInit(): void {
    this.checkRoles();
    this.loadLotes();
    this.loadFraccionamientos();
    this.loadAllContratos();
  }

  checkRoles(): void {
    const user = this.storageService.getUser();
    if (user && user.role) {
      const isVendedor = user.role === 'ROLE_VENDEDOR';
      const isRecepcion = user.role === 'ROLE_RECEPCION';
      const isAdmin = user.role === 'ROLE_ADMIN';
      
      // If Vendedor or Recepcion and NOT Admin, enforce read-only
      if ((isVendedor || isRecepcion) && !isAdmin) {
        this.readOnly = true;
      }
    }
  }

  loadLotes(): void {
    this.loteService.getAllLotes().subscribe({
      next: data => {
        this.lotes = data;
        this.filterLotes(); // Initial filter
      },
      error: err => console.error(err)
    });
  }

  loadFraccionamientos(): void {
    this.fraccionamientoService.getAllFraccionamientos().subscribe({
      next: data => this.fraccionamientos = data,
      error: err => console.error(err)
    });
  }

  loadAllContratos(): void {
    this.ventaService.getAllContratos().subscribe({
      next: data => {
          if (data && data.length > 0) {
              data.forEach(c => {
                  if (c.lote) {
                      this.loteContratoMap[c.lote.id] = c;
                  }
              });
          }
      },
      error: err => console.error(err)
    });
  }

  // --- CRUD ---

  onCreateLote(): void {
      if (this.readOnly) return;
      
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
                  this.newLote.imagenUrl = res.url || res.message;
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

  editLote(lote: any): void {
      if (this.readOnly) return;
      this.isEditingLote = true;
      this.currentLoteId = lote.id;
      this.newLote = { ...lote };
      this.isCreating = true;
      window.scrollTo(0, 0);
  }

  cancelLoteEdit(): void {
      this.isCreating = false;
      this.isEditingLote = false;
      this.currentLoteId = null;
      this.selectedFile = null;
      this.newLote = { numeroLote: '', manzana: '', precioTotal: 0, areaMetrosCuadrados: 0, coordenadasGeo: '', fraccionamiento: null, estatus: 'DISPONIBLE' };
  }

  onFileSelected(event: any): void {
      const files: FileList = event.target.files;
      if (files && files.length > 0) {
          this.selectedFile = files[0]; // Simple single file upload for now in create flow?
          // Or multi upload logic if needed
          this.isUploading = true;
          Array.from(files).forEach((file) => {
               this.loteService.uploadImage(file).subscribe({
                   next: (res: any) => {
                       const uploadedUrl = res.url || res.message;
                       if (!this.newLote.imagenUrl) this.newLote.imagenUrl = uploadedUrl;
                       if (!this.newLote.galeriaImagenes) this.newLote.galeriaImagenes = [];
                       this.newLote.galeriaImagenes.push(uploadedUrl);
                       this.isUploading = false;
                   },
                   error: err => { console.error(err); this.isUploading = false; }
               });
          });
      }
  }

  updateLoteStatus(lote: any): void {
      if (this.readOnly) return;
      this.loteService.updateLote(lote.id, lote).subscribe({
          next: () => {
              console.log('Status updated successfully');
              this.filterLotes(); // Update filtered view if status changed
          },
          error: err => {
              console.error('Error updating status', err);
              this.loadLotes(); // Rollback UI if failed
          }
      });
  }

  // --- Filters & Export ---

  filterLotes(): void {
    this.filteredLotes = this.lotes.filter(l => {
        const clienteNom = this.loteContratoMap[l.id]?.cliente;
        const nombreCompleto = clienteNom ? `${clienteNom.nombre} ${clienteNom.apellidos}`.toLowerCase() : '';
        
        const matchesSearch = !this.searchTerm || 
            l.numeroLote?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            l.manzana?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            nombreCompleto.includes(this.searchTerm.toLowerCase());
        
        const matchesFracc = !this.fraccionamientoFilter || 
            l.fraccionamiento?.id?.toString() === this.fraccionamientoFilter;
            
        const matchesEstatus = !this.estatusFilter || 
            l.estatus === this.estatusFilter;
            
        return matchesSearch && matchesFracc && matchesEstatus;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.fraccionamientoFilter = '';
    this.estatusFilter = '';
    this.filteredLotes = [...this.lotes];
  }

  exportExcel(): void {
    const params: any = {};
    if (this.fraccionamientoFilter) params.fraccionamientoId = this.fraccionamientoFilter;
    if (this.estatusFilter) params.estatus = this.estatusFilter;
    
    this.exportService.exportToExcel('/reportes/inventario', params, 'inventario_lotes.xlsx');
  }

  // --- History ---

  verHistorial(lote: any): void {
      // Allow readOnly viewing of history? Maybe yes if Vendedor needs to check status.
      // Or maybe strictly forbid?
      // User requirement: "ver y solo ver Inventario". Vendedor should probably see status but maybe not full payment history?
      // I'll allow it for now as "Ver Detalle" often implies seeing info.
      
      const contrato = this.loteContratoMap[lote.id];
      if (contrato) {
          this.historyContract = contrato;
          this.showHistoryModal = true;
          this.pagosActuales = [];
          this.pagoService.getPagosByContrato(contrato.id).subscribe({
              next: data => this.pagosActuales = data,
              error: err => console.error(err)
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
