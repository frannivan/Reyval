import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl + '/pagos/';

export interface Pago {
    id: number;
    fechaPago: string;
    monto: number;
    referencia: string;
    concepto: string;
    hasComprobante?: boolean;
    estatus?: string;
    validado?: boolean;
    fechaValidacion?: string;
    validadoPor?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PagoService {
    private http = inject(HttpClient);

    constructor() { }

    getPagosByContrato(contratoId: number): Observable<Pago[]> {
        return this.http.get<Pago[]>(API_URL + 'contrato/' + contratoId);
    }

    getAllPagos(): Observable<Pago[]> {
        return this.http.get<Pago[]>(API_URL + 'all');
    }

    registrarPago(pago: any): Observable<any> {
        return this.http.post(API_URL + 'registrar', pago);
    }

    validatePago(id: number, status?: string): Observable<any> {
        return this.http.post(API_URL + id + '/validate', { status });
    }

    getPagosPendientes(): Observable<any[]> {
        return this.http.get<any[]>(API_URL + 'pendientes');
    }

    getMisPagos(): Observable<any[]> {
        return this.http.get<any[]>(API_URL + 'mis-pagos');
    }
}
