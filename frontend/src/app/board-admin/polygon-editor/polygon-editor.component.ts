import { Component, OnInit, Input, AfterViewInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import * as L from 'leaflet';

@Component({
    selector: 'app-polygon-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './polygon-editor.component.html',
    styleUrls: ['./polygon-editor.component.css']
})
export class PolygonEditorComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() fraccionamientoId: number | null = null;

    // State
    activeTab: 'fraccionamiento' | 'lotes' | 'plano' = 'fraccionamiento';

    // Data
    fraccionamientos: any[] = [];
    lotes: any[] = [];

    // Selected items
    selectedFraccionamientoId: any = '';
    selectedFraccionamiento: any = null;
    selectedLoteId: any = '';
    selectedLote: any = null;

    // Map related
    private map: L.Map | undefined;
    private markersLayer: L.LayerGroup = L.layerGroup();
    private polygonLayer: L.LayerGroup = L.layerGroup(); // For saved polygons
    private drawLayer: L.LayerGroup = L.layerGroup(); // For current drawing
    
    // Drawing State
    currentPoints: L.LatLng[] = [];
    tempPolyline: L.Polyline | undefined;
    tempPolygon: L.Polygon | undefined;

    // Plano (Image overlay) mode
    planoImageLoaded = false;
    isUploadingPlano = false;
    private planoImageOverlay: L.ImageOverlay | undefined;
    private planoImageBounds: L.LatLngBounds | undefined;

    constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) { }



    ngOnInit(): void {
        if (this.fraccionamientoId) {
            this.selectedFraccionamientoId = this.fraccionamientoId;
            this.loadFraccionamientoData();
        } else {
            this.loadFraccionamientos();
        }
    }

    ngAfterViewInit(): void {
        // Init map if tab is already active (e.g. reload)
        // Delay slightly to ensure container is ready
        setTimeout(() => {
            this.initMap();
        }, 100);
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }

    logout(): void {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        this.router.navigate(['/home']);
        setTimeout(() => window.location.reload(), 100);
    }

    onTabChange(tab: 'fraccionamiento' | 'lotes' | 'plano'): void {
        console.log("DEBUG: onTabChange called with:", tab);
        this.activeTab = tab;
        this.resetMap();
        
        if ((tab === 'lotes' || tab === 'plano') && this.selectedFraccionamientoId && this.lotes.length === 0) {
            this.loadLotesForFraccionamiento();
        }
    }

    resetMap(): void {
        // Destroy existing map and re-init for the new container
        if (this.map) {
            this.map.remove();
            this.map = undefined;
        }
        this.currentPoints = [];
        this.drawLayer.clearLayers();
        this.markersLayer.clearLayers();
        this.polygonLayer.clearLayers();
        
        setTimeout(() => {
            this.initMap();
        }, 100);
    }

    initMap(): void {
        if (this.activeTab === 'plano') {
            this.initPlanoMap();
            return;
        }

        const mapId = this.activeTab === 'fraccionamiento' ? 'map-fraccionamiento' : 'map-lotes';
        const element = document.getElementById(mapId);
        
        if (!element) return;

        this.map = L.map(mapId).setView([23.6345, -102.5528], 5); // Default Mexico

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.markersLayer.addTo(this.map);
        this.polygonLayer.addTo(this.map);
        this.drawLayer.addTo(this.map);

        // Map Click Handler for Drawing
        this.map.on('click', (e: L.LeafletMouseEvent) => {
            this.handleMapClick(e.latlng);
        });

        // Restore view if fraccionamiento selected
        if (this.selectedFraccionamiento) {
            this.centerMapOnFraccionamiento();
            this.displayExistingPolygons();
        }
    }

    initPlanoMap(): void {
        const element = document.getElementById('map-plano');
        if (!element) return;

        const imgUrl = this.selectedFraccionamiento?.imagenPlanoUrl;
        if (!imgUrl) {
            console.warn('Plano image URL is missing for this fraccionamiento');
            this.planoImageLoaded = false;
            return;
        }

        // Resolve the image URL
        let fullUrl = imgUrl;
        if (!fullUrl.startsWith('http')) {
             if (fullUrl.includes('/api/images/')) {
                 // Already has the full path part we need, but make sure it has the base /reyval if needed
                 if (fullUrl.startsWith('/reyval/')) {
                     // If we are in local (apiUrl is /api), strip /reyval and replace with /api
                     if (environment.apiUrl === '/api') {
                         fullUrl = fullUrl.replace('/reyval/api/', '/api/');
                     }
                 }
             } else {
                 // Component-only filename, append the full prefix
                 fullUrl = `${environment.apiUrl}/images/${imgUrl}`;
             }
        }
        
        // Clean up double slashes just in case
        fullUrl = fullUrl.replace(/([^:]\/)\/+/g, "$1");

        // Add a cache buster timestamp to ensure the browser fetches the latest image
        const cacheBuster = `?cb=${new Date().getTime()}`;
        const finalUrl = fullUrl + (fullUrl.includes('?') ? '&' : '') + cacheBuster;

        console.log(`DEBUG: initPlanoMap starting load from: ${finalUrl}`);

        // Load image to get natural dimensions
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;

            console.log(`DEBUG: Plano Image Loaded: ${w}x${h}`);

            // CRS.Simple: y goes up, so we use [0,0] bottom-left to [h, w] top-right
            this.planoImageBounds = L.latLngBounds([0, 0], [h, w]);

            this.map = L.map('map-plano', {
                crs: L.CRS.Simple,
                minZoom: -3,
                maxZoom: 3,
                zoomSnap: 0.1,
                attributionControl: false,
                zoomControl: false
            });

            this.planoImageOverlay = L.imageOverlay(finalUrl, this.planoImageBounds).addTo(this.map);
            this.map.fitBounds(this.planoImageBounds);

            // Re-calc size after a short delay to ensure container is fully rendered/visible
            setTimeout(() => {
                if (this.map) {
                    console.log("DEBUG: Invalidating map size for rendering fix");
                    this.map.invalidateSize();
                }
            }, 500);

            this.polygonLayer.addTo(this.map);
            this.drawLayer.addTo(this.map);

            this.map.on('click', (e: L.LeafletMouseEvent) => {
                console.log("DEBUG: Map click at", e.latlng);
                this.handlePlanoClick(e.latlng);
            });

            this.planoImageLoaded = true;
            this.displayPlanoPolygons();
            this.cdr.detectChanges();
        };
        img.onerror = () => {
            console.error('CRITICAL: Error loading plano image:', finalUrl);
            this.planoImageLoaded = false;
            // Fallback: try to initialize the map anyway with a generic size so they can at least Click?
            // No, Leaflet CRS.Simple really needs bounds. 
            this.cdr.detectChanges();
        };
        img.src = finalUrl;
    }

    handlePlanoClick(latlng: L.LatLng): void {
        if (!this.selectedLote) {
            alert('Primero selecciona un Lote para editar.');
            return;
        }
        if (this.selectedLote?.planoCoordinates && this.currentPoints.length === 0) {
            console.log('Click ignored: Existing lote polygon. Use Nuevo Polígono.');
            return;
        }

        this.currentPoints = [...this.currentPoints, latlng];
        this.updateDrawLayers();
        this.cdr.detectChanges();
    }

    displayPlanoPolygons(): void {
        if (!this.map) return;
        this.polygonLayer.clearLayers();

        this.lotes.forEach(lote => {
            if (lote.planoCoordinates) {
                try {
                    const points = JSON.parse(lote.planoCoordinates);
                    if (Array.isArray(points) && points.length > 0 && Array.isArray(points[0])) {
                        const isSelected = this.selectedLote && this.selectedLote.id === lote.id;
                        const color = this.getPlanoLoteColor(lote.estatus);
                        const poly = L.polygon(points as L.LatLngExpression[], {
                            color: isSelected ? '#fff' : color,
                            fillColor: color,
                            fillOpacity: isSelected ? 0.5 : 0.3,
                            weight: isSelected ? 3 : 1
                        }).addTo(this.polygonLayer);
                        poly.bindTooltip(`${lote.numeroLote || lote.numero} (${lote.estatus})`, { sticky: true });
                    }
                } catch (e) { }
            }
        });
    }

    getPlanoLoteColor(status: string): string {
        switch (status) {
            case 'DISPONIBLE': return '#28a745';
            case 'APARTADO': return '#007bff';
            case 'VENDIDO': return '#8B4513';
            case 'CONTRATADO': return '#ffc107';
            default: return '#999';
        }
    }



    startNewPlanoLoteDrawing(): void {
        this.selectedLote.planoCoordinates = null;
        this.currentPoints = [];
        this.updateDrawLayers();
        this.displayPlanoPolygons();
        this.cdr.detectChanges();
    }

    deletePlanoLotePolygon(): void {
        if (!this.selectedLote) return;
        if (!confirm('¿Eliminar el polígono de este lote del plano?')) return;

        this.http.put(
            `${environment.apiUrl}/lotes/adm/${this.selectedLote.id}/poligono`,
            '',
            { headers: { 'Content-Type': 'text/plain' } }
        ).subscribe(() => {
            alert('Polígono eliminado del plano');
            this.selectedLote.planoCoordinates = null;
            this.displayPlanoPolygons();
        });
    }

    onPlanoFraccionamientoChange(): void {
        this.loadFraccionamientoData();
    }

    onPlanoLoteChange(): void {
        this.currentPoints = [];
        this.drawLayer.clearLayers();
        this.selectedLote = this.lotes.find(l => l.id == this.selectedLoteId);
        if (this.map && this.activeTab === 'plano') {
            this.displayPlanoPolygons();
        }
    }

    uploadPlanoImage(event: any): void {
        const file = event.target.files[0];
        if (!file || !this.selectedFraccionamiento) return;

        this.isUploadingPlano = true;
        const formData = new FormData();
        formData.append('file', file);

        this.http.post<any>(`${environment.apiUrl}/images/upload`, formData).subscribe({
            next: (res) => {
                const imageUrl = res.url || res.message;
                this.selectedFraccionamiento.imagenPlanoUrl = imageUrl;

                // Save to fraccionamiento
                this.http.put(
                    `${environment.apiUrl}/fraccionamientos/adm/${this.selectedFraccionamiento.id}`,
                    this.selectedFraccionamiento
                ).subscribe({
                    next: () => {
                        this.isUploadingPlano = false;
                        alert('Imagen del plano subida correctamente');
                        // Reinitialize the plano map with the new image
                        this.resetMap();
                    },
                    error: (err) => {
                        console.error('Error saving fraccionamiento:', err);
                        this.isUploadingPlano = false;
                        alert('Imagen subida pero error al guardar en el fraccionamiento.');
                    }
                });
            },
            error: (err) => {
                console.error('Error uploading image:', err);
                this.isUploadingPlano = false;
                alert('Error al subir la imagen.');
            }
        });
    }

    handleMapClick(latlng: L.LatLng): void {
        // If we have a saved polygon and we are not explicitly clearing/editing, maybe prevent?
        // But user can "Clear Points" to start over.
        // If saved polygon exists, warn user?
        if (this.activeTab === 'fraccionamiento' && this.selectedFraccionamiento?.poligonoDelimitador && this.currentPoints.length === 0) {
           console.log("Map click ignored: Existing fracc polygon. Use 'Nuevo Polígono' button.");
           return;
        }
        
        if (this.activeTab === 'lotes' && this.selectedLote?.planoCoordinates && this.currentPoints.length === 0) {
             console.log("Map click ignored: Existing lote polygon. Use 'Nuevo Polígono' button.");
             return;
        }
        
        if (this.activeTab === 'lotes' && !this.selectedLote) {
            alert("Primero selecciona un Lote para editar.");
            return;
        }

        this.currentPoints = [...this.currentPoints, latlng];
        this.updateDrawLayers();
        this.cdr.detectChanges();
    }

    updateDrawLayers(): void {
        this.drawLayer.clearLayers();

        // Draw Markers (Points) - Using CircleMarker for "dots"
        this.currentPoints.forEach((p, index) => {
            const marker = L.circleMarker(p, { 
                radius: 6,
                fillColor: '#fff',
                color: '#3388ff',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).addTo(this.drawLayer);
            
            marker.on('click', () => {
                // Remove point on click
                this.currentPoints.splice(index, 1);
                this.updateDrawLayers();
            });
        });

        // Draw Polyline/Polygon
        if (this.currentPoints.length > 1) {
            L.polyline(this.currentPoints, { color: 'blue' }).addTo(this.drawLayer);
        }
        if (this.currentPoints.length > 2) {
             L.polygon(this.currentPoints, { color: 'blue', fillOpacity: 0.1, stroke: false }).addTo(this.drawLayer);
        }
    }
    
    clearPoints(): void {
        console.log("DEBUG: clearPoints called");
        this.currentPoints = [];
        this.updateDrawLayers();
        this.cdr.detectChanges();
    }

    startNewFraccionamientoDrawing(): void {
        console.log("DEBUG: startNewFraccionamientoDrawing called");
        this.selectedFraccionamiento.poligonoDelimitador = null;
        this.polygonLayer.clearLayers();
        this.currentPoints = [];
        this.updateDrawLayers();
        this.cdr.detectChanges();
    }

    startNewLoteDrawing(): void {
        console.log("DEBUG: startNewLoteDrawing called");
        this.selectedLote.planoCoordinates = null;
        this.polygonLayer.clearLayers();
        this.displayExistingPolygons(); // This will redraw others but NOT the current one as we cleared its coordinates
        this.currentPoints = [];
        this.updateDrawLayers();
        this.cdr.detectChanges();
    }

    // === DATA LOADING ===

    loadFraccionamientos(): void {
        this.http.get<any[]>(`${environment.apiUrl}/fraccionamientos/public`).subscribe(data => {
            this.fraccionamientos = data;
        });
    }

    loadFraccionamientoData(): void {
        if (!this.selectedFraccionamientoId) {
            this.selectedFraccionamiento = null;
            this.currentPoints = [];
            this.lotes = [];
            if(this.map) {
                 this.polygonLayer.clearLayers();
                 this.drawLayer.clearLayers();
            }
            return;
        }

        this.http.get(`${environment.apiUrl}/fraccionamientos/public/${this.selectedFraccionamientoId}`)
            .subscribe((fracc: any) => {
                this.selectedFraccionamiento = fracc;
                
                // Ensure map initializes after DOM update (since container depends on *ngIf=selectedFraccionamiento)
                setTimeout(() => {
                    if (!this.map) {
                        this.initMap();
                    }
                    this.centerMapOnFraccionamiento();
                    
                    // Display existing polygons after map is ready
                    this.displayExistingPolygons();
                }, 200);
                
                // Load lotes if needed
                if (this.activeTab === 'lotes' || this.fraccionamientoId) {
                    this.loadLotesForFraccionamiento();
                }
            });
    }

    loadLotesForFraccionamiento(): void {
        if (!this.selectedFraccionamientoId) {
            this.lotes = [];
            this.selectedLote = null;
            return;
        }

        this.http.get(`${environment.apiUrl}/lotes/adm/by-fraccionamiento/${this.selectedFraccionamientoId}`)
            .subscribe((lotes: any) => {
                this.lotes = lotes;
                this.displayExistingPolygons();
            });
    }

    loadLoteData(): void {
       this.currentPoints = [];
       this.drawLayer.clearLayers();
       this.selectedLote = this.lotes.find(l => l.id == this.selectedLoteId);
       
       if (this.selectedLote && this.selectedLote.planoCoordinates) {
           this.displayExistingPolygons();
       }
    }

    // === MAP HELPERS ===
    
    centerMapOnFraccionamiento(): void {
        if (!this.map || !this.selectedFraccionamiento) return;
        
        const bounds = L.latLngBounds([]);
        let hasData = false;

        // 1. Try Polygon
        if (this.selectedFraccionamiento.poligonoDelimitador) {
            try {
                const points = JSON.parse(this.selectedFraccionamiento.poligonoDelimitador);
                if (Array.isArray(points) && points.length > 0) {
                     bounds.extend(points);
                     hasData = true;
                }
            } catch (e) {}
        }
        
        // 2. Try Coords
        if (this.selectedFraccionamiento.coordenadasGeo) {
            const [lat, lng] = this.parseCoords(this.selectedFraccionamiento.coordenadasGeo);
            if (lat && lng) {
                bounds.extend([lat, lng]);
                hasData = true;
            }
        }

        // 3. Try Lotes if in lotes tab
        if (this.activeTab === 'lotes' && this.lotes.length > 0) {
            this.lotes.forEach(l => {
                if (l.planoCoordinates) {
                    try {
                        const points = JSON.parse(l.planoCoordinates);
                        bounds.extend(points);
                        hasData = true;
                    } catch(e) {}
                } else if (l.coordenadasGeo) {
                    const [lat, lng] = this.parseCoords(l.coordenadasGeo);
                    if (lat && lng) {
                        bounds.extend([lat, lng]);
                        hasData = true;
                    }
                }
            });
        }
        
        if (hasData) {
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            if (sw.lat === ne.lat && sw.lng === ne.lng) {
                this.map.setView(sw, 18);
            } else {
                this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
            }
        }
    }

    private parseCoords(coordStr: string): [number, number] | [null, null] {
        try {
            const parts = coordStr.split(',');
            if (parts.length === 2) {
                const lat = parseFloat(parts[0].trim());
                const lng = parseFloat(parts[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
            }
        } catch (e) { }
        return [null, null];
    }
    
    displayExistingPolygons(): void {
        if (!this.map) return;
        this.polygonLayer.clearLayers();
        
        // 1. Fraccionamiento Polygon
        if (this.selectedFraccionamiento && this.selectedFraccionamiento.poligonoDelimitador) {
            try {
                const points = JSON.parse(this.selectedFraccionamiento.poligonoDelimitador);
                // Check if it's the new format [[lat,lng],...] (Array of Arrays)
                // Old format was [{x,y}] (Array of Objects). If old format, ignore or warn.
                if (Array.isArray(points) && points.length > 0 && Array.isArray(points[0])) {
                    L.polygon(points as L.LatLngExpression[], { 
                        color: 'red', 
                        fillOpacity: 0.1, 
                        weight: 2 
                    }).addTo(this.polygonLayer);
                }
            } catch (e) { console.error("Error display fracc poly", e); }
        }
        
        // 2. Lotes Polygons (If in Lotes tab)
        if (this.activeTab === 'lotes') {
            this.lotes.forEach(lote => {
                if (lote.planoCoordinates) {
                     try {
                        const points = JSON.parse(lote.planoCoordinates);
                         if (Array.isArray(points) && points.length > 0 && Array.isArray(points[0])) {
                             const isSelected = this.selectedLote && this.selectedLote.id === lote.id;
                             L.polygon(points as L.LatLngExpression[], { 
                                color: isSelected ? 'blue' : 'gray', 
                                fillColor: isSelected ? 'cyan' : 'gray',
                                fillOpacity: isSelected ? 0.3 : 0.1, 
                                weight: 1
                            }).addTo(this.polygonLayer);
                         }
                    } catch (e) { }
                }
            });
        }
    }

    zoomToFraccionamiento(): void {
        this.centerMapOnFraccionamiento();
    }


    // === SAVING ===

    saveFraccionamientoPolygon(event?: any): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        console.log("DEBUG: saveFraccionamientoPolygon execution started. Points:", this.currentPoints.length);
        if (this.currentPoints.length < 3) {
            alert('❌ Se requieren al menos 3 puntos.');
            return;
        }

        // We'll remove confirm for now to test if it's the culprit
        console.log("DEBUG: Proceeding to HTTP PUT for fracc polygon");

        // Convert LatLng objects to Array of Arrays [[lat,lng], ...] to be JSON serializable
        const pointsArray = this.currentPoints.map(p => [p.lat, p.lng]);
        const polygonJson = JSON.stringify(pointsArray);

        this.http.put(
            `${environment.apiUrl}/fraccionamientos/adm/${this.selectedFraccionamiento.id}/poligono`,
            polygonJson,
            { headers: { 'Content-Type': 'text/plain' } }
        ).subscribe({
            next: () => {
                const newCentroid = this.calculateCentroid(this.currentPoints);
                if (newCentroid) {
                    this.selectedFraccionamiento.coordenadasGeo = newCentroid;
                    this.selectedFraccionamiento.poligonoDelimitador = polygonJson;
                    
                    this.http.put(
                        `${environment.apiUrl}/fraccionamientos/${this.selectedFraccionamiento.id}`,
                        this.selectedFraccionamiento
                    ).subscribe({
                        next: () => {
                            alert('✅ Polígono y ubicación del pin actualizados correctamente');
                            this.currentPoints = [];
                            this.updateDrawLayers();
                            this.displayExistingPolygons();
                            this.cdr.detectChanges();
                        },
                        error: (err) => {
                            console.error("Error updating fracc location:", err);
                            alert('Polígono guardado, pero error al actualizar ubicación del pin.');
                        }
                    });
                } else {
                    alert('✅ Polígono del fraccionamiento guardado exitosamente');
                    this.selectedFraccionamiento.poligonoDelimitador = polygonJson;
                    this.currentPoints = [];
                    this.updateDrawLayers();
                    this.displayExistingPolygons();
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                console.error("Error saving fracc polygon:", err);
                alert('No se pudo guardar el polígono.');
            }
        });
    }

    deleteFraccionamientoPolygon(): void {
        if (!confirm('¿Eliminar el polígono del fraccionamiento?')) return;

        this.http.delete(
            `${environment.apiUrl}/fraccionamientos/adm/${this.selectedFraccionamiento.id}/poligono`
        ).subscribe(() => {
            alert('Polígono eliminado');
            this.selectedFraccionamiento.poligonoDelimitador = null;
            this.displayExistingPolygons();
        });
    }
    
    // === LOTES SAVING ===
    
    calculateCentroid(points: L.LatLng[]): string {
        if (!points || points.length === 0) return '';
        let latSum = 0;
        let lngSum = 0;
        points.forEach(p => {
            latSum += p.lat;
            lngSum += p.lng;
        });
        const centerLat = latSum / points.length;
        const centerLng = lngSum / points.length;
        return `${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`;
    }
    
    saveLotePolygon(event?: any): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        console.log("DEBUG: saveLotePolygon execution started. Points:", this.currentPoints.length);
        if (!this.selectedLote) {
            alert('❌ No hay un lote seleccionado.');
            return;
        }
        if (this.currentPoints.length < 3) {
            alert('❌ Se requieren al menos 3 puntos.');
            return;
        }

        console.log("DEBUG: Proceeding to HTTP PUT for lote polygon");
        const pointsArray = this.currentPoints.map(p => [p.lat, p.lng]);
        const polygonJson = JSON.stringify(pointsArray);

        // 1. Save Polygon
        this.http.put(
            `${environment.apiUrl}/lotes/adm/${this.selectedLote.id}/poligono`,
            polygonJson,
            { headers: { 'Content-Type': 'text/plain' } }
        ).subscribe({
            next: () => {
                // 2. Update Location (Centroid) to fix "wrong pin"
                const newCentroid = this.calculateCentroid(this.currentPoints);
                if (newCentroid) {
                    this.selectedLote.coordenadasGeo = newCentroid;
                    this.selectedLote.planoCoordinates = polygonJson;
                    
                    this.http.put(
                        `${environment.apiUrl}/lotes/${this.selectedLote.id}`,
                        this.selectedLote
                    ).subscribe({
                        next: () => {
                            alert('✅ Polígono y Ubicación (Pin) actualizados correctamente');
                            this.currentPoints = [];
                            this.updateDrawLayers();
                            this.displayExistingPolygons();
                            this.cdr.detectChanges();
                        },
                        error: (err) => {
                            console.error("Error updating lote location:", err);
                            alert('Polígono guardado, pero error al actualizar ubicación del pin.');
                        }
                    });
                } else {
                    alert('✅ Polígono del lote guardado exitosamente');
                    this.selectedLote.planoCoordinates = polygonJson;
                    this.currentPoints = [];
                    this.updateDrawLayers();
                    this.displayExistingPolygons();
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                console.error("Error saving lote polygon:", err);
                alert('No se pudo guardar el polígono del lote.');
            }
        });
    }

    savePlanoLotePolygon(event?: any): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        console.log("DEBUG: savePlanoLotePolygon execution started. Points:", this.currentPoints.length);
        if (!this.selectedLote) {
            alert('❌ No hay un lote seleccionado.');
            return;
        }
        if (this.currentPoints.length < 3) {
            alert('❌ Se requieren al menos 3 puntos.');
            return;
        }

        console.log("DEBUG: Proceeding to HTTP PUT for plano polygon");
        const pointsArray = this.currentPoints.map(p => [p.lat, p.lng]);
        const polygonJson = JSON.stringify(pointsArray);

        this.http.put(
            `${environment.apiUrl}/lotes/adm/${this.selectedLote.id}/poligono`,
            polygonJson,
            { headers: { 'Content-Type': 'text/plain' } }
        ).subscribe({
            next: () => {
                alert('✅ Polígono en plano guardado correctamente.');
                this.selectedLote.planoCoordinates = polygonJson;
                this.currentPoints = [];
                this.updateDrawLayers();
                this.displayExistingPolygons();
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Error saving plano polygon:", err);
                alert('No se pudo guardar el polígono en plano.');
            }
        });
    }
    
    deleteLotePolygon(): void {
         if (!this.selectedLote) return;
         if (!confirm('¿Eliminar el polígono de este lote?')) return;
         
         this.http.put(
            `${environment.apiUrl}/lotes/adm/${this.selectedLote.id}/poligono`,
            '',
             { headers: { 'Content-Type': 'text/plain' } }
        ).subscribe(() => {
            alert('Polígono eliminado');
            this.selectedLote.planoCoordinates = null;
            this.displayExistingPolygons();
        });
    }
    
    updateLoteEstatus(): void {
        this.http.put(
            `${environment.apiUrl}/lotes/adm/${this.selectedLote.id}/estatus`,
            { estatus: this.selectedLote.estatus }
        ).subscribe(() => {
            alert('Estatus actualizado');
        });
    }
}
