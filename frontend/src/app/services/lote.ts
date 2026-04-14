import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl + '/lotes/';

/**
 * EIU-02: Servicio de Inventario y Disponibilidad de Lotes.
 * <p>
 * Centraliza la comunicación para la gestión de unidades individuales.
 * Soporta el filtrado dinámico por estatus (Disponible, Apartado, Vendido)
 * y la actualización de coordenadas para el renderizado interactivo.
 */
@Injectable({
  providedIn: 'root'
})
export class LoteService {

  private http = inject(HttpClient);

  constructor() { }

  getPublicLotes(fraccionamientoId?: any, ubicacion?: string, sortDir: string = 'asc'): Observable<any> {
    let params: any = { sortDir };
    if (fraccionamientoId) params['fraccionamientoId'] = fraccionamientoId;
    if (ubicacion) params['ubicacion'] = ubicacion;

    return this.http.get(API_URL + 'public', { params });
  }

  getLoteById(id: number): Observable<any> {
    return this.http.get(API_URL + 'public/' + id);
  }

  getPublicLotesByFraccionamiento(fraccionamientoId: number): Observable<any> {
    return this.http.get(API_URL + 'public/by-fraccionamiento/' + fraccionamientoId);
  }

  getAllLotes(): Observable<any> {
    return this.http.get(API_URL + 'all');
  }

  getLotesByFraccionamiento(fraccionamientoId: number): Observable<any> {
    return this.http.get(API_URL + 'adm/by-fraccionamiento/' + fraccionamientoId);
  }

  createLote(lote: any): Observable<any> {
    return this.http.post(API_URL + 'create', lote);
  }

  updateLote(id: number, lote: any): Observable<any> {
    return this.http.put(API_URL + id, lote);
  }

  deleteLote(id: number): Observable<any> {
    return this.http.delete(API_URL + id);
  }

  uploadImage(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.http.post(environment.apiUrl + '/images/upload', formData);
  }
}
