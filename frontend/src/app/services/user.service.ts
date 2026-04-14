import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    constructor(private http: HttpClient) { }

    getVendedores(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/users/vendedores`);
    }

    changePassword(request: any): Observable<any> {
        return this.http.post(`${environment.apiUrl}/users/change-password`, request);
    }
}
