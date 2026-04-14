import { Component, EventEmitter, Input, Output, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-picker.html',
  styleUrl: './location-picker.css'
})
export class LocationPickerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() initialCoords: string | null = null;
  @Output() coordsSelected = new EventEmitter<string>();

  private map: any;
  private marker: any;
  private polygonLayer: any;
  private polygonPoints: [number, number][] = [];

  // Modes: 'POINT' | 'POLYGON'
  mode: 'POINT' | 'POLYGON' = 'POINT';

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialCoords'] && !changes['initialCoords'].firstChange) {
      // React to external changes if needed (e.g. form reset)
      // For now, complex re-init might be overkill, but we can clear if null
      if (!this.initialCoords) {
        this.clearMap();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  toggleMode(): void {
    this.mode = this.mode === 'POINT' ? 'POLYGON' : 'POINT';
    this.clearMap();
  }

  clearMap(): void {
    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
    if (this.polygonLayer) {
      this.map.removeLayer(this.polygonLayer);
      this.polygonLayer = null;
    }
    this.polygonPoints = [];
    this.coordsSelected.emit('');
  }

  private initMap(): void {
    // Default center (Mexico)
    let center: L.LatLngExpression = [23.6345, -102.5528];
    let initialZoom = 5;

    this.map = L.map('picker-map', {
      center: center,
      zoom: initialZoom
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Initial State handling
    if (this.initialCoords) {
      this.handleInitialCoords(this.initialCoords);
    }

    // Map Click Event
    this.map.on('click', (e: any) => {
      if (this.mode === 'POINT') {
        this.handlePointClick(e.latlng.lat, e.latlng.lng);
      } else {
        this.handlePolygonClick(e.latlng.lat, e.latlng.lng);
      }
    });
  }

  private handleInitialCoords(coords: string): void {
    // Check if JSON (Polygon) or String (Point)
    if (coords.trim().startsWith('[')) {
      try {
        const points = JSON.parse(coords);
        if (Array.isArray(points) && points.length > 0) {
          this.mode = 'POLYGON';
          this.polygonPoints = points;
          this.drawPolygon();
          // Center map on polygon
          if (this.polygonLayer) {
            this.map.fitBounds(this.polygonLayer.getBounds(), { padding: [20, 20], maxZoom: 18 });
          }
        }
      } catch (e) {
        console.error('Invalid polygon JSON', e);
      }
    } else {
      // Point
      const [lat, lng] = this.parseCoords(coords);
      if (lat && lng) {
        this.mode = 'POINT';
        this.placeMarker(lat, lng);
        this.map.setView([lat, lng], 18);
      }
    }
  }

  private handlePointClick(lat: number, lng: number): void {
    this.placeMarker(lat, lng);
    this.emitCoords(lat, lng);
  }

  private handlePolygonClick(lat: number, lng: number): void {
    this.polygonPoints.push([lat, lng]);
    this.drawPolygon();
    this.emitPolygon();
  }

  private drawPolygon(): void {
    if (this.polygonLayer) {
      this.map.removeLayer(this.polygonLayer);
    }
    if (this.polygonPoints.length > 0) {
      this.polygonLayer = L.polygon(this.polygonPoints, { color: 'blue' }).addTo(this.map);
    }
  }

  private placeMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', (event: any) => {
        const position = event.target.getLatLng();
        this.emitCoords(position.lat, position.lng);
      });
    }
  }

  private emitCoords(lat: number, lng: number): void {
    const coordString = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    this.coordsSelected.emit(coordString);
  }

  private emitPolygon(): void {
    this.coordsSelected.emit(JSON.stringify(this.polygonPoints));
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
}
