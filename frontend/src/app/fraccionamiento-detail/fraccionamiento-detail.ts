import { Component, OnInit, inject, ViewChild, ElementRef, afterNextRender, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FraccionamientoService } from '../services/fraccionamiento';
import { LoteService } from '../services/lote';
import { MapComponent } from '../map/map';
import { StorageService } from '../services/storage';
import { PolygonEditorComponent } from '../board-admin/polygon-editor/polygon-editor.component';
import { environment } from '../../environments/environment';
import * as L from 'leaflet';

@Component({
    selector: 'app-fraccionamiento-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, MapComponent, FormsModule, PolygonEditorComponent],
    templateUrl: './fraccionamiento-detail.html',
    styleUrl: './fraccionamiento-detail.css'
})
export class FraccionamientoDetailComponent implements OnInit {
    public fraccionamiento: any = null;
    public lotes: any[] = [];
    public isLoading: boolean = true;
    public errorMsg: string = '';

    public isAdmin = false;
    public isEditing = false;
    public showPolygonEditor = false;
    public isUploading = false;

    // SVG Floor Plan
    @ViewChild('svgContainer') svgContainer!: ElementRef;
    public sanitizedPlanoSvg: SafeHtml = '';

    // Map instance
    private map: any = null;

    private route = inject(ActivatedRoute);
    private fraccionamientoService = inject(FraccionamientoService);
    private loteService = inject(LoteService);
    private storageService = inject(StorageService);
    private http = inject(HttpClient);
    private sanitizer = inject(DomSanitizer);
    private injector = inject(Injector);
    private router = inject(Router);

    // Image Plan & SVG Overlay
    // Image Plan (Leaflet)
    private planMap: any = null;
    private planImageOverlay: any = null;
    private planPolygonLayer: any = null;
    private planImageBounds: any = null;

    ngOnInit(): void {
        const user = this.storageService.getUser();
        if (user && user.role === 'ROLE_ADMIN') {
            this.isAdmin = true;
        }

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadFraccionamiento(+id);
            this.loadLotes(+id);
        } else {
            this.errorMsg = 'ID de fraccionamiento no válido.';
            this.isLoading = false;
        }
    }

    loadFraccionamiento(id: number): void {
        this.fraccionamientoService.getById(id).subscribe({
            next: data => {
                this.fraccionamiento = data;
                this.isLoading = false;

                // Initialize Map after data loads
                afterNextRender(() => {
                    // SVG Plan
                    if (this.fraccionamiento?.planoSvg) {
                        this.renderInteractivePlano();
                    }
                    // Image Plan
                    if (this.fraccionamiento?.imagenPlanoUrl) {
                        this.initPlanMap();
                    }
                }, { injector: this.injector });
            },
            error: err => {
                console.error(err);
                this.errorMsg = 'No se pudo cargar la información del fraccionamiento.';
                this.isLoading = false;
            }
        });
    }

    loadLotes(id: number): void {
        this.loteService.getPublicLotesByFraccionamiento(id).subscribe({
            next: data => {
                this.lotes = data;
                // Re-apply colors if SVG is already rendered
                if (this.fraccionamiento && this.fraccionamiento.planoSvg) {
                    setTimeout(() => this.applyLoteColors(), 200);
                }
                // Also update image plan polygons if map exists
                if (this.planMap) {
                    this.renderPlanPolygons();
                }
            },
            error: err => console.error(err)
        });
    }

    // Unified map handling via app-map component
    // Removed manual initMap to prevent duplication

    // === SVG FLOOR PLAN HANDLING ===
    renderInteractivePlano(): void {
        if (!this.fraccionamiento?.planoSvg) return;

        // Sanitize SVG for safe rendering
        this.sanitizedPlanoSvg = this.sanitizer.bypassSecurityTrustHtml(
            this.fraccionamiento.planoSvg
        );

        // Wait for DOM to update, then apply colors and click handlers
        setTimeout(() => {
            this.applyLoteColors();
            this.attachLoteClickHandlers();
        }, 150);
    }

    applyLoteColors(): void {
        if (!this.svgContainer) return;

        const svg = this.svgContainer.nativeElement.querySelector('svg');
        if (!svg) return;

        // Find all paths/rect elements with data-lote-id attribute
        const lotePaths = svg.querySelectorAll('[data-lote-id]');

        lotePaths.forEach((path: any) => {
            const loteNumero = path.getAttribute('data-lote-id');
            const lote = this.lotes.find(l => l.numero === loteNumero);

            if (lote) {
                // Apply color based on status
                switch (lote.estatus) {
                    case 'DISPONIBLE':
                        path.style.fill = '#28a745'; // Verde
                        path.style.cursor = 'pointer';
                        break;
                    case 'APARTADO':
                        path.style.fill = '#007bff'; // Azul
                        path.style.cursor = 'pointer';
                        break;
                    case 'VENDIDO':
                        path.style.fill = '#8B4513'; // Café/Marrón
                        path.style.cursor = 'default';
                        break;
                    default:
                        path.style.fill = '#6c757d'; // Gris por defecto
                }
                path.style.stroke = '#fff';
                path.style.strokeWidth = '2';
                path.style.transition = 'opacity 0.2s';
            }
        });
    }

    attachLoteClickHandlers(): void {
        if (!this.svgContainer) return;

        const svg = this.svgContainer.nativeElement.querySelector('svg');
        if (!svg) return;

        const lotePaths = svg.querySelectorAll('[data-lote-id]');
        const tooltip = document.getElementById('loteTooltip');
        const tLote = document.getElementById('tooltipLote');
        const tPrice = document.getElementById('tooltipPrice');
        const tArea = document.getElementById('tooltipArea');
        const tStatus = document.getElementById('tooltipStatusText');
        const tDot = document.getElementById('tooltipStatusDot');

        lotePaths.forEach((path: any) => {
            // Click handler
            path.addEventListener('click', () => {
                if (this.isEditing) return;

                const loteNumero = path.getAttribute('data-lote-id');
                const lote = this.lotes.find(l => l.numero === loteNumero || l.numeroLote === loteNumero);

                if (lote) {
                    this.router.navigate(['/lote', lote.id]);
                }
            });

            // Hover effects
            path.addEventListener('mouseenter', (event: MouseEvent) => {
                const loteNumero = path.getAttribute('data-lote-id');
                const lote = this.lotes.find(l => l.numero === loteNumero || l.numeroLote === loteNumero);
                
                if (lote && tooltip && tLote && tArea && tStatus && tDot) {
                    path.style.opacity = '0.7';
                    
                    // Update Tooltip Content
                    tLote.innerText = `Lote ${lote.numeroLote || lote.numero}`;
                    if (tPrice) {
                        tPrice.innerText = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(lote.precioTotal);
                    }
                    tArea.innerText = `${lote.areaMetrosCuadrados} m²`;
                    tStatus.innerText = lote.estatus;
                    
                    // Status Dot Color
                    let dotColor = '#28a745';
                    if (lote.estatus === 'APARTADO') dotColor = '#007bff';
                    if (lote.estatus === 'VENDIDO') dotColor = '#8B4513';
                    tDot.style.backgroundColor = dotColor;

                    // Show Tooltip
                    tooltip.style.display = 'block';
                    setTimeout(() => { tooltip.style.opacity = '1'; }, 10);
                }
            });

            path.addEventListener('mousemove', (event: MouseEvent) => {
                if (tooltip && tooltip.style.display === 'block') {
                    tooltip.style.left = (event.clientX + 15) + 'px';
                    tooltip.style.top = (event.clientY + 15) + 'px';
                }
            });

            path.addEventListener('mouseleave', () => {
                path.style.opacity = '1';
                if (tooltip) {
                    tooltip.style.opacity = '0';
                    setTimeout(() => { 
                        if (tooltip.style.opacity === '0') tooltip.style.display = 'none'; 
                    }, 150);
                }
            });
        });
    }

    uploadPlanoSvg(event: any): void {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'image/svg+xml') {
            alert('Solo se permiten archivos SVG');
            return;
        }

        this.isUploading = true;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const svgContent = e.target.result;

            // Upload to backend
            this.http.put(
                `${environment.apiUrl}/fraccionamientos/adm/${this.fraccionamiento.id}/plano-svg`,
                svgContent,
                { headers: { 'Content-Type': 'text/plain' }, responseType: 'text' }
            ).subscribe({
                next: () => {
                    this.fraccionamiento.planoSvg = svgContent;
                    this.renderInteractivePlano();
                    alert('Plano SVG subido correctamente');
                    this.isUploading = false;
                },
                error: err => {
                    console.error('Error uploading SVG:', err);
                    alert('Error al subir el plano SVG');
                    this.isUploading = false;
                }
            });
        };
        reader.readAsText(file);
    }

    deletePlanoSvg(): void {
        if (!confirm('¿Estás seguro de eliminar el plano SVG?')) return;

        this.http.delete(
            `${environment.apiUrl}/fraccionamientos/adm/${this.fraccionamiento.id}/plano-svg`,
            { responseType: 'text' }
        ).subscribe({
            next: () => {
                this.fraccionamiento.planoSvg = null;
                this.sanitizedPlanoSvg = '';
                alert('Plano SVG eliminado');
            },
            error: err => {
                console.error('Error deleting SVG:', err);
                alert('Error al eliminar el plano SVG');
            }
        });
    }

    toggleEditMode(): void {
        this.isEditing = !this.isEditing;
        // Invalidate map size to handle layout changes
        setTimeout(() => {
            if (this.planMap) {
                this.planMap.invalidateSize();
            }
        }, 300);
    }

    uploadGlobalImage(event: any, field: string, msg: string) {
        // ... (can be reused or keep original methods)
        // I will keep original methods for gallery/logo upload as they are distinct from polygon editing
    }

    // Keep uploadLogo, uploadGalleryImage etc. 
    // Wait, I am replacing the whole file content?
    // I should check if I missed methods.
    // The previous file had: uploadPlanImage, uploadLogo, uploadGalleryImage...
    // I should include them.
    // I'll copy them from previous view.

    uploadPlanImage(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.handleImageUpload(file, (url) => {
                this.fraccionamiento.imagenPlanoUrl = url;
                this.saveFraccionamiento('Plano actualizado.');
            });
        }
    }

    deletePlanImage(): void {
        if (confirm('¿Eliminar la imagen del plano principal?')) {
            this.fraccionamiento.imagenPlanoUrl = null;
            this.saveFraccionamiento('Imagen del plano eliminada.');
        }
    }

    uploadLogo(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.handleImageUpload(file, (url) => {
                this.fraccionamiento.logoUrl = url;
                this.saveFraccionamiento('Imagen de portada (Logo) actualizada.');
            });
        }
    }

    uploadGalleryImage(event: any): void {
        const files: FileList = event.target.files;
        if (files && files.length > 0) {
            this.isUploading = true;
            let completed = 0;
            const total = files.length;
            if (!this.fraccionamiento.galeriaImagenes) {
                this.fraccionamiento.galeriaImagenes = [];
            }
            Array.from(files).forEach((file: File) => {
                this.loteService.uploadImage(file).subscribe({
                    next: (res: any) => {
                        const url = res.url || res.message;
                        this.fraccionamiento.galeriaImagenes.push(url);
                        completed++;
                        if (completed === total) {
                            this.saveFraccionamiento('Imágenes agregadas a la galería.');
                            this.isUploading = false;
                        }
                    },
                    error: (err: any) => {
                        console.error('Error uploading file:', file.name, err);
                        completed++;
                        if (completed === total) {
                            this.saveFraccionamiento('Proceso finalizado (algunas imágenes pudieron fallar).');
                            this.isUploading = false;
                        }
                    }
                });
            });
        }
    }

    deleteGalleryImage(index: number): void {
        if (confirm('¿Eliminar imagen de la galería?')) {
            this.fraccionamiento.galeriaImagenes.splice(index, 1);
            this.saveFraccionamiento('Imagen eliminada.');
        }
    }

    setCoverImage(url: string): void {
        this.fraccionamiento.logoUrl = url;
        this.saveFraccionamiento('Imagen de portada actualizada.');
    }

    private handleImageUpload(file: File, callback: (url: string) => void): void {
        this.isUploading = true;
        this.loteService.uploadImage(file).subscribe({
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

    saveChangesManual(): void {
        this.saveFraccionamiento('Cambios guardados correctamente.');
    }

    private saveFraccionamiento(msg: string): void {
        this.fraccionamientoService.updateFraccionamiento(this.fraccionamiento.id, this.fraccionamiento).subscribe({
            next: () => alert(msg),
            error: err => console.error(err)
        });
    }

    getLoteColor(status: string): string {
        switch (status) {
            case 'DISPONIBLE': return 'rgba(40, 167, 69, 0.5)'; // Green
            case 'VENDIDO': return 'rgba(220, 53, 69, 0.5)'; // Red
            case 'APARTADO': return 'rgba(255, 193, 7, 0.5)'; // Orange/Yellow
            default: return 'rgba(108, 117, 125, 0.5)'; // Grey
        }
    }
    togglePolygonEditor(): void {
        this.showPolygonEditor = !this.showPolygonEditor;
        this.isEditing = false;
    }



    // === LIGHTBOX / CAROUSEL ===
    showLightbox = false;
    currentImageIndex = 0;

    openLightbox(index: number): void {
        this.currentImageIndex = index;
        this.showLightbox = true;
    }

    closeLightbox(): void {
        this.showLightbox = false;
    }

    nextImage(): void {
        if (!this.fraccionamiento.galeriaImagenes) return;
        this.currentImageIndex = (this.currentImageIndex + 1) % this.fraccionamiento.galeriaImagenes.length;
    }

    prevImage(): void {
        if (!this.fraccionamiento.galeriaImagenes) return;
        this.currentImageIndex = (this.currentImageIndex - 1 + this.fraccionamiento.galeriaImagenes.length) % this.fraccionamiento.galeriaImagenes.length;
    }

    navigateToLote(id: number): void {
        this.router.navigate(['/lote', id]);
    }

    // === IMAGE PLAN HELPERS ===

    // === LEAFLET MAP HANDLING (PLAN VIEW) ===

    initPlanMap(): void {
        if (!this.fraccionamiento?.imagenPlanoUrl || document.getElementById('map-plan') === null) return;

        // Clean up previous map instance if any
        if (this.planMap) {
            this.planMap.remove();
            this.planMap = null;
        }

        const imgUrl = this.getImageUrl(this.fraccionamiento.imagenPlanoUrl);
        
        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
             const w = img.naturalWidth;
             const h = img.naturalHeight;
             
             this.planImageBounds = L.latLngBounds([0, 0], [h, w]);

             this.planMap = L.map('map-plan', {
                 crs: L.CRS.Simple,
                 minZoom: -2,
                 maxZoom: 2,
                 zoomSnap: 0.1,
                 attributionControl: false,
                 zoomControl: true // User requested zoom is OK for public view now
             });

             this.planImageOverlay = L.imageOverlay(imgUrl, this.planImageBounds).addTo(this.planMap);
             this.planPolygonLayer = L.layerGroup().addTo(this.planMap);
             this.renderPlanPolygons(true);
             if (this.planPolygonLayer.getLayers().length === 0) {
                 this.planMap.fitBounds(this.planImageBounds);
             }


             
             // Handle resize
             setTimeout(() => { this.planMap.invalidateSize(); }, 500);
        };
        img.onerror = () => {
            console.error('Error loading public plan image:', imgUrl);
        };
        img.src = imgUrl;
    }

    renderPlanPolygons(shouldFitBounds: boolean = false): void {
        if (!this.planPolygonLayer || !this.planMap) return;
        this.planPolygonLayer.clearLayers();
        const bounds = L.latLngBounds([]);
        let hasPolygons = false;

        this.lotes.forEach(lote => {
            if (lote.planoCoordinates) {
                try {
                    const points = JSON.parse(lote.planoCoordinates);
                    if (Array.isArray(points) && points.length > 0) {
                         // Determine color based on status
                         let fillColor = '#6c757d'; // Default Grey
                         let color = '#fff';
                         
                         switch (lote.estatus) {
                            case 'DISPONIBLE': fillColor = '#28a745'; break; // Green
                            case 'APARTADO': fillColor = '#007bff'; break; // Blue (Aligned with SVG)
                            case 'VENDIDO': fillColor = '#8B4513'; break; // Brown/Coffee (Aligned with SVG)
                        }

                        // Create Polygon
                        const polygon = L.polygon(points, {
                            color: color,
                            weight: 1,
                            fillColor: fillColor,
                            fillOpacity: 0.4
                        });

                        // Interactions
                        polygon.on('click', () => {
                             if (!this.isEditing && lote.estatus !== 'VENDIDO') {
                                 this.navigateToLote(lote.id);
                             }
                        });

                        // Hover: Highlighting + Tooltip
                        polygon.bindTooltip(`
                            <div class="text-center">
                                <strong>Lote ${lote.numeroLote || lote.numero}</strong><br>
                                <span class="badge" style="background-color: ${fillColor}; color: white;">${lote.estatus}</span><br>
                                ${lote.areaMetrosCuadrados} m²<br>
                                $${lote.precioTotal}
                            </div>
                        `, { sticky: true, direction: 'top' });

                        polygon.on('mouseover', () => {
                            polygon.setStyle({ fillOpacity: 0.7, weight: 2 });
                        });
                        polygon.on('mouseout', () => {
                            polygon.setStyle({ fillOpacity: 0.4, weight: 1 });
                        });

                        polygon.addTo(this.planPolygonLayer);
                        bounds.extend(polygon.getBounds());
                        hasPolygons = true;
                    }
                } catch (e) { console.error('Error parsing coords for lote', lote.id, e); }
            }
        });

        if (shouldFitBounds && hasPolygons) {
            this.planMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 2 });
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
