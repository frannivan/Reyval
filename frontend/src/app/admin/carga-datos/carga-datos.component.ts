import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-carga-datos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carga-datos.component.html'
})
export class CargaDatosComponent {
  selectedType = 'lotes';
  filesToUpload: { file: File, type: string }[] = [];
  
  isUploading = false;
  results: string[] = [];
  errorMsg = '';

  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/carga-masiva';

  addFile(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (this.filesToUpload.some(f => f.type === this.selectedType)) {
        this.errorMsg = `Ya hay un archivo seleccionado para ${this.selectedType}.`;
        return;
      }
      this.filesToUpload.push({ file, type: this.selectedType });
      this.errorMsg = '';
      event.target.value = ''; 
    }
  }

  removeFile(index: number): void {
    this.filesToUpload.splice(index, 1);
  }

  downloadTemplate(type: string): void {
    const url = `${this.apiUrl}/template/${type}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = `plantilla_${type}.xlsx`;
        a.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: (err) => {
        this.errorMsg = 'Error al descargar plantilla: ' + err.message;
      }
    });
  }

  downloadMasterTemplate(): void {
    const url = `${this.apiUrl}/template/master`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = `plantilla_maestra_reyval.xlsx`;
        a.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: (err) => {
        this.errorMsg = 'Error al descargar plantilla maestra: ' + err.message;
      }
    });
  }

  uploadFiles(): void {
    if (this.filesToUpload.length === 0) return;

    this.isUploading = true;
    this.results = [];
    this.errorMsg = '';

    const observables = this.filesToUpload.map(item => {
      const formData = new FormData();
      formData.append('file', item.file);
      return this.http.post<any>(`${this.apiUrl}/upload/${item.type}`, formData);
    });

    forkJoin(observables).subscribe({
      next: (responses: any[]) => {
        responses.forEach((res, index) => {
          const type = this.filesToUpload[index].type;
          this.results.push(`${type.toUpperCase()}: ${res.message || 'Carga exitosa'}`);
        });
        this.filesToUpload = [];
        this.isUploading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error en la carga: ' + (err.message || 'Error desconocido');
        this.isUploading = false;
      }
    });
  }
}
