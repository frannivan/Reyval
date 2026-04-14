package com.reyval.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "opportunities")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Opportunity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "lead_id")
    private Lead lead;

    @ManyToOne
    @JoinColumn(name = "lote_id")
    private Lote lote;

    private BigDecimal montoEstimado;

    @Enumerated(EnumType.STRING)
    private EOpportunityStatus status = EOpportunityStatus.NEGOTIATION;

    @Column(columnDefinition = "TEXT")
    private String notas;

    private LocalDate fechaCierreEstimada;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Lead getLead() {
        return lead;
    }

    public void setLead(Lead lead) {
        this.lead = lead;
    }

    public Lote getLote() {
        return lote;
    }

    public void setLote(Lote lote) {
        this.lote = lote;
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

    public LocalDate getFechaCierreEstimada() {
        return fechaCierreEstimada;
    }

    public void setFechaCierreEstimada(LocalDate fechaCierreEstimada) {
        this.fechaCierreEstimada = fechaCierreEstimada;
    }
}
