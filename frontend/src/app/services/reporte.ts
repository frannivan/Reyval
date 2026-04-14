import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl + '/reportes/';

export interface DashboardStats {
    totalLotes: number;
    lotesDisponibles: number;
    lotesVendidos: number;
    totalClientes: number;
    totalContratos: number;
    totalLeads: number;
    totalOpportunities: number;
    ingresosTotales: number;
    saldoPendienteTotal: number;
    ventasRecientes: any[];
}

/**
 * EIU-10: Servicio de Reportes e Inteligencia de Negocio.
 * <p>
 * Proporciona acceso a las métricas del Dashboard y facilita la descarga
 * de reportes consolidados. Actúa como el puente de visualización para 
 * los roles Directivo y Administrativo.
 */
@Injectable({
    providedIn: 'root'
})
export class ReporteService {
    constructor(private http: HttpClient) { }

    getDashboardStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(API_URL + 'dashboard');
    }
}
