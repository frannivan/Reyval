import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private http = inject(HttpClient);

  exportToExcel(endpoint: string, params: any = {}, fileName: string = 'reporte.xlsx'): void {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    httpParams = httpParams.set('format', 'excel');

    const url = `${environment.apiUrl}${endpoint}`;

    this.http.get(url, {
      params: httpParams,
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download failed', err);
        alert('Error al descargar el archivo. Asegúrese de tener permisos suficientes.');
      }
    });
  }

  exportToPdf(endpoint: string, params: any = {}, fileName: string = 'reporte.pdf'): void {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    httpParams = httpParams.set('format', 'pdf');

    const url = `${environment.apiUrl}${endpoint}`;

    this.http.get(url, {
      params: httpParams,
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download failed', err);
        alert('Error al descargar el PDF. Esté seguro de haber iniciado sesión y tener permisos de administrador.');
      }
    });
  }
}
