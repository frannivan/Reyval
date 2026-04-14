package com.reyval.backend.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "contratos")
public class Contrato {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "lote_id", nullable = false)
    private Lote lote;

    @Column(name = "fecha_contrato")
    private LocalDate fechaContrato;

    private BigDecimal montoTotal;

    private BigDecimal enganche;

    private Integer plazoMeses;

    private Double tasaInteresAnual;

    private BigDecimal mensualidad;

    @Enumerated(EnumType.STRING)
    private EStatusContrato estatus; // ACTIVO, PAGADO, CANCELADO

    @ManyToOne
    @JoinColumn(name = "vendedor_id")
    private User vendedor;

    @OneToMany(mappedBy = "contrato", cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("contrato")
    private List<Pago> pagos;

    public Contrato() {
    }

    public Contrato(Long id, Cliente cliente, Lote lote, LocalDate fechaContrato, BigDecimal montoTotal,
            BigDecimal enganche, Integer plazoMeses, Double tasaInteresAnual, BigDecimal mensualidad,
            EStatusContrato estatus) {
        this.id = id;
        this.cliente = cliente;
        this.lote = lote;
        this.fechaContrato = fechaContrato;
        this.montoTotal = montoTotal;
        this.enganche = enganche;
        this.plazoMeses = plazoMeses;
        this.tasaInteresAnual = tasaInteresAnual;
        this.mensualidad = mensualidad;
        this.estatus = estatus;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Lote getLote() {
        return lote;
    }

    public void setLote(Lote lote) {
        this.lote = lote;
    }

    public LocalDate getFechaContrato() {
        return fechaContrato;
    }

    public void setFechaContrato(LocalDate fechaContrato) {
        this.fechaContrato = fechaContrato;
    }

    public BigDecimal getMontoTotal() {
        return montoTotal;
    }

    public void setMontoTotal(BigDecimal montoTotal) {
        this.montoTotal = montoTotal;
    }

    public BigDecimal getEnganche() {
        return enganche;
    }

    public void setEnganche(BigDecimal enganche) {
        this.enganche = enganche;
    }

    public Integer getPlazoMeses() {
        return plazoMeses;
    }

    public void setPlazoMeses(Integer plazoMeses) {
        this.plazoMeses = plazoMeses;
    }

    public Double getTasaInteresAnual() {
        return tasaInteresAnual;
    }

    public void setTasaInteresAnual(Double tasaInteresAnual) {
        this.tasaInteresAnual = tasaInteresAnual;
    }

    public BigDecimal getMensualidad() {
        return mensualidad;
    }

    public void setMensualidad(BigDecimal mensualidad) {
        this.mensualidad = mensualidad;
    }

    public EStatusContrato getEstatus() {
        return estatus;
    }

    public void setEstatus(EStatusContrato estatus) {
        this.estatus = estatus;
    }

    public List<Pago> getPagos() {
        return pagos;
    }

    public void setPagos(List<Pago> pagos) {
        this.pagos = pagos;
    }

    public User getVendedor() {
        return vendedor;
    }

    public void setVendedor(User vendedor) {
        this.vendedor = vendedor;
    }
}
