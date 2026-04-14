import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';

export interface AmortizationRow {
  numeroPago: number;
  fechaPago: Date;
  saldoInicial: string;
  cuota: string;
  interes: string;
  capital: string;
  saldoFinal: string;
}

@Injectable()
export class AmortizationService {
  /**
   * ECU-05: Motor de Crédito y Simulación Financiera.
   * Calcula la tabla de amortización completa usando el método francés (cuota fija).
   */
  calculateAmortization(
    montoPrestamo: number | Decimal | string,
    plazoMeses: number,
    tasaAnual: number | Decimal | string,
  ): AmortizationRow[] {
    const tabla: AmortizationRow[] = [];
    
    const P = new Decimal(montoPrestamo);
    const n = plazoMeses;
    // Tasa mensual = Tasa Anual / 12 / 100
    const i = new Decimal(tasaAnual).div(1200);

    // Cuota Figa (Método Francés)
    // C = P * (i * (1+i)^n) / ((1+i)^n - 1)
    const onePlusI = new Decimal(1).add(i);
    const pow = onePlusI.pow(n);
    
    const numerator = P.mul(i).mul(pow);
    const denominator = pow.sub(1);
    
    const cuotaMensual = numerator.div(denominator).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    let saldo = P;
    let fecha = new Date();
    fecha.setMonth(fecha.getMonth() + 1); // Primer pago el siguiente mes

    for (let k = 1; k <= n; k++) {
      const interes = saldo.mul(i).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      let capital = cuotaMensual.sub(interes);

      // Ajuste en el último pago
      if (k === n || capital.gt(saldo)) {
        capital = saldo;
      }

      const cuotaEfectiva = capital.add(interes);
      const saldoFinal = saldo.sub(capital);

      tabla.push({
        numeroPago: k,
        fechaPago: new Date(fecha),
        saldoInicial: saldo.toFixed(2),
        cuota: cuotaEfectiva.toFixed(2),
        interes: interes.toFixed(2),
        capital: capital.toFixed(2),
        saldoFinal: saldoFinal.toFixed(2),
      });

      saldo = saldoFinal;
      fecha.setMonth(fecha.getMonth() + 1);
    }

    return tabla;
  }
}
