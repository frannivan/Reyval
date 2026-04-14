import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VentaService } from '../services/venta';
import { StorageService } from '../services/storage';

@Component({
  selector: 'app-board-vendedor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-vendedor.component.html'
})
export class BoardVendedorComponent implements OnInit {
  contratos: any[] = [];
  currentUser: any;

  activeSales = 0;
  paidSales = 0;
  pendingSales = 0;

  private ventaService = inject(VentaService);
  private storageService = inject(StorageService);

  ngOnInit(): void {
    this.currentUser = this.storageService.getUser();
    this.reloadContratos();
  }

  reloadContratos(): void {
    // Reusing getMisContratos which returns contracts for the logged-in seller
    this.ventaService.getMisContratos().subscribe({
      next: data => {
        this.contratos = data;
        this.calculateStats();
      },
      error: err => console.error(err)
    });
  }

  calculateStats(): void {
    this.activeSales = this.contratos.filter(c => c.estatus === 'ACTIVO').length;
    this.paidSales = this.contratos.filter(c => c.estatus === 'PAGADO').length;
    this.pendingSales = this.contratos.filter(c => c.estatus === 'PENDIENTE').length;
  }
}
