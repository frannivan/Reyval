import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl + '/ventas/';

export interface CotizacionRequest {
  montoTotal: number;
  enganche: number;
  plazoMeses: number;
  tasaAnual: number;
}

export interface ContratoRequest {
  clienteId: number;
  loteId: number;
  montoTotal: number;
  enganche: number;
  plazoMeses: number;
  tasaAnual: number;
}

/**
 * EIU-05/06: Servicio de Gestión de Ventas y Cotizaciones.
 * <p>
 * Este servicio conecta la interfaz de usuario con el motor financiero del backend.
 * Permite realizar simulaciones de crédito en tiempo real y formalizar contratos
 * para los roles de Vendedor y Administrador.
 */
@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private http = inject(HttpClient);

  constructor() { }

  cotizar(request: CotizacionRequest): Observable<any> {
    return this.http.post(API_URL + 'cotizar', request);
  }

  crearContrato(contrato: ContratoRequest): Observable<any> {
    return this.http.post(API_URL + 'contratar', contrato);
  }

  getAllContratos(): Observable<any[]> {
    return this.http.get<any[]>(API_URL + 'contratos');
  }

  getMisContratos(): Observable<any[]> {
    return this.http.get<any[]>(API_URL + 'mis-contratos');
  }

  downloadEstadoCuenta(contratoId: number): Observable<Blob> {
    return this.http.get(environment.apiUrl + '/reportes/estado-cuenta/' + contratoId, { responseType: 'blob' });
  }
}
