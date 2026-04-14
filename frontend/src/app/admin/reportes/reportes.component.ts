import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ClienteService } from '../../services/cliente';
import { FraccionamientoService } from '../../services/fraccionamiento';
import { UserService } from '../../services/user.service';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent implements OnInit {
  // Filters
  reportType = '';
  startDate = '';
  endDate = '';
  filterType = '';
  filterId: number | null = null;
  
  // Metadata for filters
  clientes: any[] = [];
  fraccionamientos: any[] = [];
  vendedores: any[] = [];

  // Results & UI
  reportData: any[] = [];
  filteredData: any[] = [];
  searchTerm = '';
  isLoading = false;
  errorMsg = '';

  // Sorting
  sortField = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  private http = inject(HttpClient);
  private clienteService = inject(ClienteService);
  private fraccService = inject(FraccionamientoService);
  private userService = inject(UserService);
  private exportService = inject(ExportService);
  private apiUrl = environment.apiUrl + '/reportes';

  ngOnInit(): void {
    this.loadMetadata();
  }

  loadMetadata(): void {
    this.clienteService.getAllClientes().subscribe(data => this.clientes = data);
    this.fraccService.getAllFraccionamientos().subscribe(data => this.fraccionamientos = data);
    this.userService.getVendedores().subscribe(data => this.vendedores = data);
  }

  onReportTypeChange(): void {
    this.reportData = [];
    this.filteredData = [];
    this.errorMsg = '';
    this.filterType = '';
    this.filterId = null;
  }

  generateReport(): void {
    this.isLoading = true;
    this.errorMsg = '';
    this.reportData = [];

    let params = new HttpParams();
    if (this.startDate) params = params.set('startDate', this.startDate);
    if (this.endDate) params = params.set('endDate', this.endDate);
    if (this.filterType) params = params.set('type', this.filterType);
    if (this.filterId) params = params.set('id', this.filterId.toString());

    const endpoint = `${this.apiUrl}/${this.reportType}`;

    this.http.get<any[]>(endpoint, { params }).subscribe({
      next: (data) => {
        // Special case for inventory which returns an object, not just an array
        if (this.reportType === 'inventario' && !Array.isArray(data)) {
           this.reportData = (data as any).lotesDisponibles || [];
        } else {
           this.reportData = data;
        }
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error generando reporte: ' + (err.message || 'Error desconocido');
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    if (!this.searchTerm) {
      this.filteredData = [...this.reportData];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredData = this.reportData.filter(item => {
        return JSON.stringify(item).toLowerCase().includes(term);
      });
    }
    this.sort(this.sortField); // Call the new sort method
  }

  // New sort method implementation
  sort(field: string): void {
    if (!field) return;

    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }

    this.filteredData.sort((a, b) => {
      let valA = this.resolveFieldValue(a, field);
      let valB = this.resolveFieldValue(b, field);

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();

      if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private resolveFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || '';
  }

  exportReport(format: 'excel' | 'pdf'): void {
    if (!this.reportType) return;

    if (format === 'pdf' && !this.reportType) {
        return;
    }

    const params: any = {
      startDate: this.startDate,
      endDate: this.endDate,
      type: this.filterType,
      id: this.filterId
    };

    if (format === 'excel') {
      this.exportService.exportToExcel(`/reportes/${this.reportType}`, params, `reporte_${this.reportType}.xlsx`);
    } else {
      this.exportService.exportToPdf(`/reportes/${this.reportType}`, params, `reporte_${this.reportType}.pdf`);
    }
  }
}
