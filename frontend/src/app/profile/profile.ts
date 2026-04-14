import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StorageService } from '../services/storage';
import { VentaService } from '../services/venta';
import { UserService } from '../services/user.service';
import { PagoService } from '../services/pago';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  currentUser: any;
  contratos: any[] = [];
  pagos: any[] = [];
  activeTab: 'contratos' | 'pagos' | 'lotes' = 'contratos';

  private ventaService = inject(VentaService);
  private userService = inject(UserService);
  private pagoService = inject(PagoService);
  private route = inject(ActivatedRoute);

  constructor(private storageService: StorageService) { }

  ngOnInit(): void {
    this.currentUser = this.storageService.getUser();
    if (this.currentUser) {
      this.loadContratos();
      this.loadPagos();

      // Auto-switch tab based on query param
      this.route.queryParams.subscribe(params => {
        if (params['tab'] === 'pagos') {
          this.activeTab = 'pagos';
        } else if (params['tab'] === 'contratos') {
          this.activeTab = 'contratos';
        } else if (params['tab'] === 'lotes' || params['view'] === 'lot' || params['view'] === 'lote') {
          this.activeTab = 'lotes';
        }
      });
    }
  }

  loadContratos(): void {
    this.ventaService.getMisContratos().subscribe({
      next: data => {
        this.contratos = data;
      },
      error: err => console.error(err)
    });
  }

  loadPagos(): void {
    this.pagoService.getMisPagos().subscribe({
      next: data => {
        this.pagos = data;
      },
      error: err => console.error(err)
    });
  }

  get userRoleDisplay(): string {
    const role = this.currentUser?.role || '';
    if (role === 'ROLE_ADMIN') return 'Administrador';
    if (role === 'ROLE_VENDEDOR') return 'Vendedor';
    if (role === 'ROLE_RECEPCION') return 'Recepción';
    return 'Cliente';
  }

  getImageUrl(url: string): string {
    if (!url) return 'https://placehold.co/600x400?text=Lote+Reyval';
    if (url.startsWith('http')) return url;
    const baseUrl = environment.apiUrl.split('/api')[0];
    return `${baseUrl}${url}`;
  }
}
