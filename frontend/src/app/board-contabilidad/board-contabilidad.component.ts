import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PagoService } from '../services/pago';
import { PermissionService } from '../services/permission';

@Component({
  selector: 'app-board-contabilidad',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './board-contabilidad.component.html',
  styles: [`
    .hover-lift {
        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }
    .hover-lift:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.12) !important;
    }
    .animate-pulse {
        animation: pulse-animation 2s infinite;
    }
    @keyframes pulse-animation {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class BoardContabilidadComponent implements OnInit {
  pendingCount: number = 0;
  
  private pagoService = inject(PagoService);
  public permissionService = inject(PermissionService);

  ngOnInit(): void {
    this.loadPendingCount();
  }

  loadPendingCount(): void {
    this.pagoService.getAllPagos().subscribe({
      next: (data: any[]) => {
        this.pendingCount = data.filter(p => p.estatus === 'PENDIENTE').length;
      },
      error: (err: any) => console.error('Error loading payments', err)
    });
  }
}
