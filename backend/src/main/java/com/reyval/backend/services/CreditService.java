package com.reyval.backend.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

/**
 * ECU-05: Motor de Crédito y Simulación Financiera.
 * <p>
 * Esta clase representa el "Cerebro" financiero del sistema Reyval ERP.
 * Se encarga de realizar los cálculos actuariales para generar tablas de amortización
 * basadas en el sistema de amortización francés (cuota fija).
 * 
 * @author Reyval Systems
 * @version 1.0
 * @see <a href="SRS_Reyval_ERP.md#cu05-simulación-y-cotización-multi-canal">CU05: Simulación Financiera</a>
 */
@Service
public class CreditService {

    /**
     * Representa una fila individual en la tabla de amortización.
     * Contiene el desglose de capital, intereses y saldos por periodo.
     */
    public static class AmortizationRow {
        private int numeroPago;
        private LocalDate fechaPago;
        private BigDecimal saldoInicial;
        private BigDecimal cuota;
        private BigDecimal interes;
        private BigDecimal capital;
        private BigDecimal saldoFinal;

        public AmortizationRow(int numeroPago, LocalDate fechaPago, BigDecimal saldoInicial, BigDecimal cuota,
                BigDecimal interes, BigDecimal capital, BigDecimal saldoFinal) {
            this.numeroPago = numeroPago;
            this.fechaPago = fechaPago;
            this.saldoInicial = saldoInicial;
            this.cuota = cuota;
            this.interes = interes;
            this.capital = capital;
            this.saldoFinal = saldoFinal;
        }

        public int getNumeroPago() {
            return numeroPago;
        }

        public void setNumeroPago(int numeroPago) {
            this.numeroPago = numeroPago;
        }

        public LocalDate getFechaPago() {
            return fechaPago;
        }

        public void setFechaPago(LocalDate fechaPago) {
            this.fechaPago = fechaPago;
        }

        public BigDecimal getSaldoInicial() {
            return saldoInicial;
        }

        public void setSaldoInicial(BigDecimal saldoInicial) {
            this.saldoInicial = saldoInicial;
        }

        public BigDecimal getCuota() {
            return cuota;
        }

        public void setCuota(BigDecimal cuota) {
            this.cuota = cuota;
        }

        public BigDecimal getInteres() {
            return interes;
        }

        public void setInteres(BigDecimal interes) {
            this.interes = interes;
        }

        public BigDecimal getCapital() {
            return capital;
        }

        public void setCapital(BigDecimal capital) {
            this.capital = capital;
        }

        public BigDecimal getSaldoFinal() {
            return saldoFinal;
        }

        public void setSaldoFinal(BigDecimal saldoFinal) {
            this.saldoFinal = saldoFinal;
        }
    }

    /**
     * Calcula la tabla de amortización completa para un préstamo hipotecario/lote.
     * Utiliza el método francés donde la cuota mensual es constante.
     * 
     * @param montoPrestamo El capital inicial a financiar (Monto Total - Enganche).
     * @param plazoMeses El número total de periodos mensuales.
     * @param tasaAnual La tasa de interés anual nominal (ej: 12.0 para 12%).
     * @return Una lista de {@link AmortizationRow} con el desglose cronológico de los pagos.
     * @throws ArithmeticException si el cálculo de la cuota resulta en una división por cero (plazo 0).
     */
    public List<AmortizationRow> calculateAmortization(BigDecimal montoPrestamo, int plazoMeses, BigDecimal tasaAnual) {
        List<AmortizationRow> tabla = new ArrayList<>();

        // Tasa mensual = Tasa Anual / 12 / 100
        BigDecimal tasaMensual = tasaAnual.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);

        // Cuota Fija (Método Francés)
        // C = P * (i * (1+i)^n) / ((1+i)^n - 1)
        BigDecimal onePlusI = BigDecimal.ONE.add(tasaMensual);
        BigDecimal pow = onePlusI.pow(plazoMeses);

        BigDecimal numerator = montoPrestamo.multiply(tasaMensual).multiply(pow);
        BigDecimal denominator = pow.subtract(BigDecimal.ONE);

        BigDecimal cuotaMensual = numerator.divide(denominator, 2, RoundingMode.HALF_UP);

        BigDecimal saldo = montoPrestamo;
        LocalDate fecha = LocalDate.now().plusMonths(1); // Primer pago el siguiente mes

        for (int i = 1; i <= plazoMeses; i++) {
            BigDecimal interes = saldo.multiply(tasaMensual).setScale(2, RoundingMode.HALF_UP);
            BigDecimal capital = cuotaMensual.subtract(interes);

            // Ajuste en el último pago si el capital excede el saldo
            if (i == plazoMeses || capital.compareTo(saldo) > 0) {
                capital = saldo;
                cuotaMensual = capital.add(interes);
            }

            BigDecimal saldoFinal = saldo.subtract(capital);

            tabla.add(new AmortizationRow(i, fecha, saldo, cuotaMensual, interes, capital, saldoFinal));

            saldo = saldoFinal;
            fecha = fecha.plusMonths(1);
        }

        return tabla;
    }
}
