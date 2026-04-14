import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService, Pago } from '../services/pago';
import { RouterModule } from '@angular/router';
import { PermissionService } from '../services/permission';
import { SafePipe } from '../helpers/safe.pipe';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-board-recepcion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SafePipe],
  templateUrl: './board-recepcion.component.html',
  styleUrls: ['./board-recepcion.component.css']
})
export class BoardRecepcionComponent implements OnInit {
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
