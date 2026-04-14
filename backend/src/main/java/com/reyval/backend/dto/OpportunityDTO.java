package com.reyval.backend.dto;

import com.reyval.backend.entity.EOpportunityStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OpportunityDTO {
    private Long id;
    private Long leadId;
    private String leadNombre;
    private Long loteId;
    private String loteNumero;
    private BigDecimal montoEstimado;
    private EOpportunityStatus status;
    private String notas;
    private LocalDateTime fechaCierreEstimada;
    private LocalDateTime fechaRegistro;

    public OpportunityDTO() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public String getLeadNombre() {
        return leadNombre;
    }

    public void setLeadNombre(String leadNombre) {
        this.leadNombre = leadNombre;
    }

    public Long getLoteId() {
        return loteId;
    }

    public void setLoteId(Long loteId) {
        this.loteId = loteId;
    }

    public String getLoteNumero() {
        return loteNumero;
    }

    public void setLoteNumero(String loteNumero) {
        this.loteNumero = loteNumero;
    }

    public BigDecimal getMontoEstimado() {
        return montoEstimado;
    }

    public void setMontoEstimado(BigDecimal montoEstimado) {
        this.montoEstimado = montoEstimado;
    }

    public EOpportunityStatus getStatus() {
        return status;
    }

    public void setStatus(EOpportunityStatus status) {
        this.status = status;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public LocalDateTime getFechaCierreEstimada() {
        return fechaCierreEstimada;
    }

    public void setFechaCierreEstimada(LocalDateTime fechaCierreEstimada) {
        this.fechaCierreEstimada = fechaCierreEstimada;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
}
