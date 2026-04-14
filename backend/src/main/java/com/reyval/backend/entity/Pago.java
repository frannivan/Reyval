package com.reyval.backend.entity;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "pagos")
public class Pago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "contrato_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("pagos")
    private Contrato contrato;

    private LocalDate fechaPago;

    private BigDecimal monto;

    private String referencia; // Numero de transferencia o cheque

    private String concepto; // Mensualidad X, Enganche, etc

    @Lob
    @JsonIgnore
    private byte[] comprobante;

    private String comprobanteContentType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EPagoStatus estatus = EPagoStatus.PENDIENTE;

    @Column(nullable = false)
    private boolean validado = false;

    private java.time.LocalDateTime fechaValidacion;

    private String validadoPor;

    public Pago() {
    }

    public Pago(Long id, Contrato contrato, LocalDate fechaPago, BigDecimal monto, String referencia, String concepto) {
        this.id = id;
        this.contrato = contrato;
        this.fechaPago = fechaPago;
        this.monto = monto;
        this.referencia = referencia;
        this.concepto = concepto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Contrato getContrato() {
        return contrato;
    }

    public void setContrato(Contrato contrato) {
        this.contrato = contrato;
    }

    public LocalDate getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDate fechaPago) {
        this.fechaPago = fechaPago;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public String getConcepto() {
        return concepto;
    }

    public void setConcepto(String concepto) {
        this.concepto = concepto;
    }

    public byte[] getComprobante() {
        return comprobante;
    }

    public void setComprobante(byte[] comprobante) {
        this.comprobante = comprobante;
    }

    public String getComprobanteContentType() {
        return comprobanteContentType;
    }

    public void setComprobanteContentType(String comprobanteContentType) {
        this.comprobanteContentType = comprobanteContentType;
    }

    public EPagoStatus getEstatus() {
        return estatus;
    }

    public void setEstatus(EPagoStatus estatus) {
        this.estatus = estatus;
    }

    // Virtual Property for JSON (lighter payload)
    @com.fasterxml.jackson.annotation.JsonProperty("hasComprobante")
    public boolean getHasComprobante() {
        return this.comprobante != null && this.comprobante.length > 0;
    }

    private String metodoPago;

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public boolean isValidado() {
        return validado;
    }

    public void setValidado(boolean validado) {
        this.validado = validado;
    }

    public java.time.LocalDateTime getFechaValidacion() {
        return fechaValidacion;
    }

    public void setFechaValidacion(java.time.LocalDateTime fechaValidacion) {
        this.fechaValidacion = fechaValidacion;
    }

    public String getValidadoPor() {
        return validadoPor;
    }

    public void setValidadoPor(String validadoPor) {
        this.validadoPor = validadoPor;
    }
}
