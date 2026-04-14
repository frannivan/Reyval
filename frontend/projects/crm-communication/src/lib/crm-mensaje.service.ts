import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CRM_COMMUNICATION_CONFIG, CrmCommunicationConfig } from './crm-communication.config';

/**
 * Interfaz universal de mensaje CRM.
 * Soporta tanto WhatsApp como Email.
 */
export interface CrmMensaje {
  id?: number;
  targetId: number;
  tipo: 'WA' | 'EMAIL';
  direccion: 'ENVIADO' | 'RECIBIDO';
  contenido: string;
  fecha: Date | string;
  remitente: string;
  adjunto?: string;
}

/**
 * Servicio reutilizable de comunicación CRM.
 * Conecta con cualquier backend que implemente los endpoints:
 *   GET  /api/mensajes/{targetId}
 *   GET  /api/mensajes/{targetId}/{tipo}
 *   POST /api/mensajes
 *
 * @example
 * // Inject and use:
 * private crmService = inject(CrmMensajeService);
 * this.crmService.getHistory(leadId).subscribe(msgs => ...);
 */
@Injectable({
  providedIn: 'root'
})
export class CrmMensajeService {

  private apiUrl: string;
  private http = inject(HttpClient);

  constructor() {
    const config = inject(CRM_COMMUNICATION_CONFIG);
    this.apiUrl = `${config.apiUrl}/mensajes`;
  }

  /** Historial completo de un target (Lead/Oportunidad). */
  getHistory(targetId: number): Observable<CrmMensaje[]> {
    return this.http.get<CrmMensaje[]>(`${this.apiUrl}/${targetId}`);
  }

  /** Historial filtrado por canal (WA o EMAIL). */
  getHistoryByType(targetId: number, tipo: string): Observable<CrmMensaje[]> {
    return this.http.get<CrmMensaje[]>(`${this.apiUrl}/${targetId}/${tipo}`);
  }

  /** Envía un mensaje de WhatsApp. */
  sendWhatsApp(targetId: number, content: string): Observable<CrmMensaje> {
    const msg: any = {
      targetId, tipo: 'WA', direccion: 'ENVIADO',
      contenido: content,
      fecha: new Date().toISOString(),
      remitente: 'Vendedor'
    };
    return this.http.post<CrmMensaje>(this.apiUrl, msg);
  }

  /** Envía un correo electrónico. */
  sendEmail(targetId: number, subject: string, body: string, hasAttachment = false): Observable<CrmMensaje> {
    const msg: any = {
      targetId, tipo: 'EMAIL', direccion: 'ENVIADO',
      contenido: `ASUNTO: ${subject}\n\n${body}`,
      fecha: new Date().toISOString(),
      remitente: 'Vendedor',
      adjunto: hasAttachment ? 'Cotizacion.pdf' : undefined
    };
    return this.http.post<CrmMensaje>(this.apiUrl, msg);
  }
}
