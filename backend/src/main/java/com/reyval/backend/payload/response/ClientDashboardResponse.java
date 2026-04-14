package com.reyval.backend.payload.response;

import java.util.List;

public class ClientDashboardResponse {
    private String clienteNombre;
    private String clienteEmail;
    private List<ContratoSummary> contratos;

    public ClientDashboardResponse(String clienteNombre, String clienteEmail, List<ContratoSummary> contratos) {
        this.clienteNombre = clienteNombre;
        this.clienteEmail = clienteEmail;
        this.contratos = contratos;
    }

    // Getters and Setters
    public String getClienteNombre() {
        return clienteNombre;
    }

    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }

    public String getClienteEmail() {
        return clienteEmail;
    }

    public void setClienteEmail(String clienteEmail) {
        this.clienteEmail = clienteEmail;
    }

    public List<ContratoSummary> getContratos() {
        return contratos;
    }

    public void setContratos(List<ContratoSummary> contratos) {
        this.contratos = contratos;
    }

    // Inner DTO for Contract Summary
    public static class ContratoSummary {
        private Long id;
        private String loteNumero;
        private String fraccionamiento;
        private String fechaContrato;
        private String estatus;
        private Double montoTotal;
        private Double totalPagado;
        private Double progresoPagos;

        public ContratoSummary(Long id, String loteNumero, String fraccionamiento, String fechaContrato,
                String estatus, Double montoTotal, Double totalPagado) {
            this.id = id;
            this.loteNumero = loteNumero;
            this.fraccionamiento = fraccionamiento;
            this.fechaContrato = fechaContrato;
            this.estatus = estatus;
            this.montoTotal = montoTotal;
            this.totalPagado = totalPagado;
            this.progresoPagos = (montoTotal != null && montoTotal > 0) ? (totalPagado / montoTotal) * 100 : 0.0;
        }

        public Long getId() {
            return id;
        }

        public String getLoteNumero() {
            return loteNumero;
        }

        public String getFraccionamiento() {
            return fraccionamiento;
        }

        public String getFechaContrato() {
            return fechaContrato;
        }

        public String getEstatus() { return estatus; }
        public Double getMontoTotal() { return montoTotal; }
        public Double getTotalPagado() { return totalPagado; }
        public Double getProgresoPagos() { return progresoPagos; }
    }
}
