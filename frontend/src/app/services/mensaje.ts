import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Mensaje {
  id?: number;
  // CRM fields
  targetId?: number;
  tipo?: 'WA' | 'EMAIL' | 'INTERNO';
  direccion?: 'ENVIADO' | 'RECIBIDO';
  contenido: string;
  fecha?: Date | string;
  remitente?: string; // string name (CRM / fallback)
  adjunto?: string;
  // Internal messaging fields
  remitenteUser?: { id: number; username: string; email: string };
  destinatarioUser?: { id: number; username: string; email: string };
  // Legacy alias for template compatibility
  destinatario?: any;
  asunto?: string;
  fechaEnvio?: Date | string;
  leido?: boolean;
}

/**
 * Servicio unificado de comunicación.
 * Soporta tanto la mensajería CRM (WA/Email con Leads) como la mensajería
 * interna entre usuarios del sistema.
 *
 * @see CommunicationModalComponent (CRM)
 * @see MensajesComponent (Internal)
 * @since EIU-03 / EIU-04
 */
@Injectable({
  providedIn: 'root'
})
export class MensajeService {

  private apiUrl = `${environment.apiUrl}/mensajes`;
  private http = inject(HttpClient);

  // ═══════════════════════════════════════════════
  //  CRM Communication (WhatsApp / Email)
  // ═══════════════════════════════════════════════

  /**
   * Obtiene el historial completo de comunicaciones de un target (Lead/Oportunidad).
   */
  getHistory(targetId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/${targetId}`);
  }

  /**
   * Obtiene el historial filtrado por canal (WA o EMAIL).
   */
  getHistoryByType(targetId: number, tipo: string): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/${targetId}/${tipo}`);
  }

  /**
   * Envía un mensaje de WhatsApp (lo registra en la BD).
   */
  sendWhatsApp(targetId: number, content: string): Observable<Mensaje> {
    const msg: any = {
      targetId: targetId,
      tipo: 'WA',
      direccion: 'ENVIADO',
      contenido: content,
      fecha: new Date().toISOString(),
      remitente: 'Vendedor'
    };
    return this.http.post<Mensaje>(this.apiUrl, msg);
  }

  /**
   * Envía un correo electrónico (lo registra en la BD).
   */
  sendEmail(targetId: number, subject: string, body: string, hasAttachment: boolean = false): Observable<Mensaje> {
    const msg: any = {
      targetId: targetId,
      tipo: 'EMAIL',
      direccion: 'ENVIADO',
      contenido: `ASUNTO: ${subject}\n\n${body}`,
      fecha: new Date().toISOString(),
      remitente: 'Vendedor',
      adjunto: hasAttachment ? 'Cotizacion.pdf' : undefined
    };
    return this.http.post<Mensaje>(this.apiUrl, msg);
  }

  // ═══════════════════════════════════════════════
  //  Internal Messaging (User-to-User)
  // ═══════════════════════════════════════════════

  /**
   * Obtiene los mensajes recibidos del usuario autenticado.
   */
  getRecibidos(): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/recibidos`);
  }

  /**
   * Obtiene los mensajes enviados por el usuario autenticado.
   */
  getEnviados(): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/enviados`);
  }

  /**
   * Envía un mensaje interno a otro usuario del sistema.
   */
  enviarMensaje(asunto: string, contenido: string, destinatarioId: number): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.apiUrl}/enviar`, { asunto, contenido, destinatarioId });
  }

  /**
   * Marca un mensaje como leído.
   */
  marcarComoLeido(id: number | undefined): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/leido`, {});
  }

  /**
   * Obtiene el número de mensajes no leídos.
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/no-leidos/count`);
  }
}
