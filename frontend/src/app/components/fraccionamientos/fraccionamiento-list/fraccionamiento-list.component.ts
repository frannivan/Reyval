import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FraccionamientoService } from '../../../services/fraccionamiento';
import { LoteService } from '../../../services/lote';
import { StorageService } from '../../../services/storage';
import { PermissionService } from '../../../services/permission';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-fraccionamiento-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fraccionamiento-list.component.html'
})
export class FraccionamientoListComponent implements OnInit {
  @Input() readOnly = false;
  
  fraccionamientos: any[] = [];
  
  // Create / Edit logic
  isCreatingFracc = false;
  isEditingFracc = false;
  editingId: number | null = null;
  newFracc: any = {
    nombre: '',
    ubicacion: '',
    descripcion: '',
    logoUrl: '',
    coordenadasGeo: ''
  };

  // Detail Modal
  showFraccDetailModal = false;
  selectedFracc: any = null;
  fraccLotes: any[] = [];
  
  private fraccionamientoService = inject(FraccionamientoService);
  private loteService = inject(LoteService);
  private storageService = inject(StorageService);
  public permissionService = inject(PermissionService);

  ngOnInit(): void {
    this.loadFraccionamientos();
  }

  canEdit(): boolean {
    return this.permissionService.canPerformAction('fraccionamiento:edit');
  }

  canDelete(): boolean {
    return this.permissionService.canPerformAction('fraccionamiento:delete');
  }

  loadFraccionamientos(): void {
    this.fraccionamientoService.getAllFraccionamientos().subscribe({
      next: data => this.fraccionamientos = data,
      error: err => console.error(err)
    });
  }

  onCreateFracc(): void {
    if (this.readOnly) return;
    
    if (this.isEditingFracc && this.editingId) {
        this.fraccionamientoService.updateFraccionamiento(this.editingId, this.newFracc).subscribe({
            next: res => {
                this.resetForm();
                this.loadFraccionamientos();
            },
            error: err => console.error(err)
        });
    } else {
        this.fraccionamientoService.createFraccionamiento(this.newFracc).subscribe({
          next: res => {
              this.resetForm();
              this.loadFraccionamientos();
          },
          error: err => console.error(err)
        });
    }
  }

  editFracc(fracc: any): void {
      if (this.readOnly) return;
      this.isEditingFracc = true;
      this.isCreatingFracc = true;
      this.editingId = fracc.id;
      this.newFracc = { ...fracc };
  }

  resetForm(): void {
      this.isCreatingFracc = false;
      this.isEditingFracc = false;
      this.editingId = null;
      this.newFracc = { nombre: '', ubicacion: '', descripcion: '', logoUrl: '', coordenadasGeo: '' };
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
      if (!this.canDelete()) return;
      if (confirm('¿Seguro de eliminar este fraccionamiento?')) {
          this.fraccionamientoService.deleteFraccionamiento(id).subscribe({
              next: () => this.loadFraccionamientos(),
              error: err => console.error(err)
          });
      }
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
