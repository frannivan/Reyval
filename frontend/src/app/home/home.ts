import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoteService } from '../services/lote';
import { FraccionamientoService } from '../services/fraccionamiento';
import { StorageService } from '../services/storage';
import { environment } from '../../environments/environment';

import { MapComponent } from '../map/map';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MapComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  lotes: any[] = [];
  allFraccionamientos: any[] = []; // Master list
  fraccionamientos: any[] = []; // Display list
  ubicaciones: string[] = [];
  isLoading = true;
  isLoggedIn = false;
  isStaff = false;

  // Filter Models
  searchFraccionamiento = '';
  searchUbicacion = '';
  sortDir = 'asc';
  showMap = false; // Collapsible by default as requested

  constructor(
    private loteService: LoteService,
    private fraccionamientoService: FraccionamientoService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    const user = this.storageService.getUser();
    this.isLoggedIn = this.storageService.isLoggedIn();
    if (this.isLoggedIn && user && user.role) {
      this.isStaff = ['ROLE_ADMIN', 'ROLE_VENDEDOR', 'ROLE_RECEPCION', 'ROLE_CONTABILIDAD', 'ROLE_DIRECTIVO', 'ROLE_SOPORTE'].includes(user.role);
    }
    this.loadFraccionamientos();
    this.search();
  }

  loadFraccionamientos(): void {
    this.fraccionamientoService.getAllFraccionamientos().subscribe({
      next: data => {
        this.allFraccionamientos = data;
        this.fraccionamientos = data;
        // Extract unique locations
        this.ubicaciones = [...new Set(data.map((f: any) => f.ubicacion))].filter(Boolean) as string[];
        
        // If we opened home with a search pending or search() was called already, 
        // re-run filtering now that allFraccionamientos is ready.
        if (this.searchFraccionamiento || this.searchUbicacion) {
          this.applyLocalFiltering();
        }
      },
      error: err => console.error(err)
    });
  }


  getImageUrl(url: string): string {
    if (!url) return 'https://placehold.co/300x200?text=Sin+Imagen';
    if (url.includes('via.placeholder.com')) {
      return url.replace('via.placeholder.com', 'placehold.co');
    }
    
    if (url.startsWith('http')) return url;

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

  onFraccionamientoSelect(event: any): void {
    this.searchFraccionamiento = event;
    this.search();
    // Optional: Scroll to results
    const grid = document.querySelector('.grid-container');
    if (grid) grid.scrollIntoView({ behavior: 'smooth' });
  }

  private applyLocalFiltering(): void {
    const fracId = this.searchFraccionamiento ? Number(this.searchFraccionamiento) : null;
    const ubicacion = this.searchUbicacion || undefined;

    if (fracId) {
        this.fraccionamientos = this.allFraccionamientos.filter(f => Number(f.id) === fracId);
    } else if (ubicacion) {
        this.fraccionamientos = this.allFraccionamientos.filter(f => f.ubicacion === ubicacion);
    } else {
        this.fraccionamientos = this.allFraccionamientos;
    }
  }

  search(): void {
    this.isLoading = true;
    const fracId = this.searchFraccionamiento ? Number(this.searchFraccionamiento) : null;
    const ubicacion = this.searchUbicacion || undefined;

    this.applyLocalFiltering();

    this.loteService.getPublicLotes(fracId, ubicacion, this.sortDir).subscribe({
      next: data => {
        this.lotes = data;
        this.isLoading = false;
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }
}
