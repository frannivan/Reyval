import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl + '/crm/';

/**
 * EIU-03: Servicio de Gestión de Relaciones con el Cliente (CRM).
 * <p>
 * Proporciona las herramientas para el seguimiento de prospectos (Leads) y 
 * la gestión de Oportunidades. Facilita la conversión de interesados en
 * clientes formales mediante flujos de trabajo validados.
 */
@Injectable({
    providedIn: 'root'
})
export class CRMService {
    private http = inject(HttpClient);

    constructor() { }

    getAllLeads(): Observable<any> {
        return this.http.get(API_URL + 'leads');
    }

    createLead(lead: any): Observable<any> {
        return this.http.post(API_URL + 'leads', lead);
    }

    updateLead(id: number, lead: any): Observable<any> {
        return this.http.put(API_URL + 'leads/' + id, lead);
    }

    convertLeadToOpportunity(leadId: number, loteId: number): Observable<any> {
        return this.http.post(`${API_URL}leads/${leadId}/convert?loteId=${loteId}`, {});
    }

    getAllOpportunities(): Observable<any> {
        return this.http.get(API_URL + 'opportunities');
    }

    updateOpportunity(id: number, opportunity: any): Observable<any> {
        return this.http.put(API_URL + 'opportunities/' + id, opportunity);
    }

    convertOpportunityToClient(id: number): Observable<any> {
        return this.http.post(`${API_URL}opportunities/${id}/convert`, {});
    }

    sendPriceList(leadId: number, fraccionamientoIds: number[]): Observable<any> {
        return this.http.post(`${API_URL}leads/${leadId}/send-price-list`, fraccionamientoIds);
    }

    sendBudget(leadId: number, details: string): Observable<any> {
        return this.http.post(`${API_URL}leads/${leadId}/send-budget`, { details });
    }

    // --- INTERACCIONES (Fase 2) ---
    getLeadInteractions(leadId: number): Observable<any> {
        return this.http.get(`${API_URL}leads/${leadId}/interactions`);
    }

    getClientInteractions(clienteId: number): Observable<any> {
        return this.http.get(`${API_URL}clientes/${clienteId}/interactions`);
    }

    createInteraction(interaction: any): Observable<any> {
        return this.http.post(`${API_URL}interactions`, interaction);
    }
}
