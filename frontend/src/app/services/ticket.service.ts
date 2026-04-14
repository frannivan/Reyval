import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl + '/tickets';

export interface Ticket {
  id?: number;
  titulo: string;
  descripcion: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  tipo?: 'INCIDENCIA' | 'CAMBIO';
  evidenciaUrl?: string;
  rolesDestino?: string;
  pasosReplicacion?: string;
  registroAfectado?: string;
  estatus?: 'ABIERTO' | 'EN_PROCESO' | 'LISTO_PARA_PRUEBAS' | 'LISTO' | 'LIBERADO' | 'RECHAZADO';
  comentarios?: string;
  user?: {
    username: string;
    role?: {
      name: string;
    }
  };
  mensajes?: any[];
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {

  constructor(private http: HttpClient) { }

  getAllTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(API_URL);
  }

  getMyTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(API_URL + '/mis-tickets');
  }

  createTicket(formData: FormData): Observable<any> {
    return this.http.post(API_URL, formData);
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${API_URL}/${id}/status`, { status });
  }

  addComment(id: number, comment: string): Observable<any> {
    return this.http.post(`${API_URL}/${id}/comentario`, { comment });
  }

  getEvidenciaUrl(id: number): string {
    return `${API_URL}/${id}/evidencia`;
  }
}
