import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl + '/clientes/';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private http = inject(HttpClient);

  constructor() { }

  getAllClientes(): Observable<any> {
    return this.http.get(API_URL + 'all');
  }

  getClienteById(id: number): Observable<any> {
    return this.http.get(API_URL + id);
  }

  getContratosByCliente(id: number): Observable<any> {
    return this.http.get(API_URL + id + '/contratos');
  }

  createCliente(cliente: any): Observable<any> {
    return this.http.post(API_URL + 'create', cliente);
  }

  updateCliente(id: number, cliente: any): Observable<any> {
    return this.http.put(API_URL + id, cliente);
  }

  registerLead(lead: any): Observable<any> {
    return this.http.post(API_URL + 'public/lead', lead);
  }
}
