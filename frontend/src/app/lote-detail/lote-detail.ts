import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoteService } from '../services/lote';
import { ClienteService } from '../services/cliente';
import { CRMService } from '../services/crm.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StorageService } from '../services/storage';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-lote-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lote-detail.html',
  styleUrls: ['./lote-detail.css']
})
export class LoteDetail implements OnInit {
  lote: any;
  isLoading = true;
  errorMessage = '';
  isAdmin = false;
  isUploading = false;
  isEditing = false;

  // Quote Form
  showModal = false;
  quoteData = {
    nombre: '',
    email: '',
    telefono: '',
    mensaje: '',
    interes: 'COTIZACION'
  };
  quoteSuccess = '';
  quoteError = '';

  // Payment Simulator
  simEnganche: number = 0;
  simPlazo: number = 12; // Meses
  simTasaAnual: number = 18; // %
  simMensualidad: number = 0;

  simTotalFinanciar: number = 0;

  showCalculation = false;
  showQuoteForm = false;

  private loteService = inject(LoteService);
  private clienteService = inject(ClienteService);
  private crmService = inject(CRMService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storageService = inject(StorageService);

  constructor() { }

  ngOnInit(): void {
    const user = this.storageService.getUser();
    if (user && user.role && ['ROLE_ADMIN', 'ROLE_DIRECTIVO', 'ROLE_CONTABILIDAD'].includes(user.role)) {
      this.isAdmin = true;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.getLote(Number(id));
    } else {
      this.errorMessage = 'ID de lote inválido';
      this.isLoading = false;
    }
  }

  getLote(id: number): void {
    this.loteService.getLoteById(id).subscribe({
      next: (data) => {
        this.lote = data;
        // Robustness & Demo: Force distinct images as requested by user to verify carousel
        // Gallery matches Backend


        this.isLoading = false;

        // Init Simulator Defaults
        this.simEnganche = this.lote.precioTotal * 0.10; // 10% default
        this.calculatePayment();
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar el lote: ' + err.message;
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }



  openQuoteModal(): void {
    this.showModal = true;
    this.quoteSuccess = '';
    this.quoteError = '';
    this.quoteData.mensaje = 'Hola, estoy interesado en el Lote ' + this.lote.numeroLote;
  }

  closeQuoteModal(): void {
    this.showModal = false;
  }

  // Gallery Modal
  showGalleryModal = false;
  selectedImageIndex = 0;
  displayIndex = 0;

  openGallery(index: number): void {
    this.selectedImageIndex = index;
    this.showGalleryModal = true;
  }

  closeGalleryModal(): void {
    this.showGalleryModal = false;
  }

  nextImage(): void {
    // alert('Siguiente imagen'); // DEBUG
    if (this.lote && this.lote.galeriaImagenes) {
      this.selectedImageIndex = (this.selectedImageIndex + 1) % this.lote.galeriaImagenes.length;
    }
  }

  prevImage(): void {
    if (this.lote && this.lote.galeriaImagenes) {
      this.selectedImageIndex = (this.selectedImageIndex - 1 + this.lote.galeriaImagenes.length) % this.lote.galeriaImagenes.length;
    }
  }

  submitQuote(): void {
    if (!this.quoteData.nombre || !this.quoteData.email || !this.quoteData.telefono) {
      this.quoteError = 'Por favor completa todos los campos requeridos.';
      return;
    }

    const lead = {
      nombre: this.quoteData.nombre,
      email: this.quoteData.email,
      telefono: this.quoteData.telefono,
      mensaje: this.quoteData.mensaje,
      interes: this.quoteData.interes,
      source: 'LOTE_DETAIL: ' + this.lote.numeroLote
    };

    this.crmService.createLead(lead).subscribe({
      next: (res: any) => {
        this.quoteSuccess = '¡Solicitud enviada con éxito! Un asesor te contactará pronto.';
        this.quoteError = '';
        this.quoteData = { nombre: '', email: '', telefono: '', mensaje: '', interes: 'COTIZACION' };
      },
      error: (err: any) => {
        this.quoteError = err.message || 'Error al enviar solicitud.';
        console.error(err);
      }
    });
  }
  getImageUrl(url: string): string {
    if (!url) return 'https://placehold.co/600x400?text=Sin+Imagen';
    if (url.startsWith('http')) return url;
    if (url.includes('via.placeholder.com')) {
      return url.replace('via.placeholder.com', 'placehold.co');
    }
    
    let path = url;
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

  calculatePayment(): void {
    if (!this.lote) return;

    this.simTotalFinanciar = this.lote.precioTotal - this.simEnganche;

    if (this.simTotalFinanciar <= 0) {
      this.simMensualidad = 0;
      return;
    }

    if (this.simTasaAnual === 0) {
      this.simMensualidad = this.simTotalFinanciar / this.simPlazo;
    } else {
      const r = (this.simTasaAnual / 100) / 12;
      const n = this.simPlazo;
      this.simMensualidad = (this.simTotalFinanciar * r) / (1 - Math.pow(1 + r, -n));
    }
    this.showCalculation = true;
  }

  revealQuoteForm(): void {
    this.showQuoteForm = true;
    // Optional: scroll to form
    setTimeout(() => {
      const element = document.getElementById('quoteFormCard');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  requestQuoteWithSimulation(): void {
    this.openQuoteModal();
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    this.quoteData.mensaje = `Hola, me interesa el Lote ${this.lote.numeroLote}. 
Solicito cotización detallada con:
- Enganche propuesto: ${formatter.format(this.simEnganche)}
- Plazo deseado: ${this.simPlazo} meses`;
  }

  // --- Admin Gallery Logic ---

  uploadGalleryImage(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleImageUpload(file, (url) => {
        if (!this.lote.galeriaImagenes) {
          this.lote.galeriaImagenes = [];
        }
        this.lote.galeriaImagenes.push(url);
        this.saveLote('Imagen agregada a la galería.');
      });
    }
  }

  deleteGalleryImage(index: number): void {
    if (confirm('¿Eliminar imagen de la galería?')) {
      this.lote.galeriaImagenes.splice(index, 1);
      this.saveLote('Imagen eliminada.');
    }
  }

  setMainImage(url: string): void {
    this.lote.imagenUrl = url;
    this.saveLote('Imagen principal actualizada.');
  }

  private handleImageUpload(file: File, callback: (url: string) => void): void {
    this.isUploading = true;
    this.loteService.uploadImage(file).subscribe({ // Assuming LoteService has uploadImage exposed or inherited
      next: (res: any) => {
        callback(res.url || res.message);
        this.isUploading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isUploading = false;
        const msg = err.error && err.error.message ? err.error.message : 'Error al subir imagen.';
        alert(msg);
      }
    });
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
  }

  saveChanges(): void {
    this.saveLote('Lote actualizado exitosamente.');
    this.isEditing = false;
  }

  setCoverImage(url: string): void {
    this.lote.imagenUrl = url;
    this.saveLote('Imagen de portada actualizada.');
  }

  private saveLote(msg: string): void {
    this.loteService.updateLote(this.lote.id, this.lote).subscribe({
      next: () => alert(msg),
      error: err => console.error(err)
    });
  }
}
