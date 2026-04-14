import { Component } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cotizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, CurrencyPipe],
  templateUrl: './cotizacion.html',
  styleUrls: ['./cotizacion.css']
})
export class CotizacionComponent {
  cotizacion = {
    montoTotal: null,
    enganche: null,
    plazoMeses: 12,
    tasaAnual: 12.0
  };

  resultado: any = null;

  calcular(): void {
    const { montoTotal, enganche, plazoMeses, tasaAnual } = this.cotizacion;

    if (!montoTotal || !enganche || !plazoMeses) {
      alert('Por favor complete todos los datos para calcular.');
      return;
    }
    
    // Validate enganche
    if (enganche > montoTotal) {
      alert('El enganche no puede ser mayor al precio total.');
      return;
    }

    const montoFinanciar = montoTotal - enganche;
    const tasaMensual = (tasaAnual || 0) / 100 / 12;
    let mensualidad = 0;

    if (tasaMensual > 0) {
      // Amortization formula: P * r * (1+r)^n / ((1+r)^n - 1)
      const factor = Math.pow(1 + tasaMensual, plazoMeses);
      mensualidad = montoFinanciar * tasaMensual * factor / (factor - 1);
    } else {
      // Simple division if 0 interest
      mensualidad = montoFinanciar / plazoMeses;
    }

    this.resultado = {
      montoFinanciar: montoFinanciar,
      mensualidad: mensualidad
    };
  }
}
