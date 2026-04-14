package com.reyval.backend.controllers;

import com.reyval.backend.entity.Contrato;
import com.reyval.backend.entity.Pago;
import com.reyval.backend.entity.User;
import com.reyval.backend.entity.Lote;
import com.reyval.backend.entity.Fraccionamiento;
import com.reyval.backend.repository.ContratoRepository;
import com.reyval.backend.repository.PagoRepository;
import com.reyval.backend.services.PdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

/**
 * CONTROLADOR DE REPORTES E INTELIGENCIA DE NEGOCIO (CU10)
 * <p>
 * Centraliza la generación de métricas para el Dashboard y la exportación de reportes
 * ejecutivos en formatos PDF y Excel. Proporciona visibilidad en tiempo real
 * sobre la salud financiera y el inventario del sistema.
 * 
 * @author Reyval Systems
 * @version 1.0
 * @see <a href="SRS_Reyval_ERP.md#cu10-reportes-e-inteligencia-de-negocio">CU10: Reportes BI</a>
 */
@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

        @Autowired
        ContratoRepository contratoRepository;

        @Autowired
        PagoRepository pagoRepository;

        @Autowired
        PdfService pdfService;

        @Autowired
        com.reyval.backend.repository.LoteRepository loteRepository;

        @Autowired
        com.reyval.backend.repository.ClienteRepository clienteRepository;

        @Autowired
        com.reyval.backend.repository.LeadRepository leadRepository;

        @Autowired
        com.reyval.backend.repository.OpportunityRepository opportunityRepository;

        @Autowired
        com.reyval.backend.repository.UserRepository userRepository;

        @Autowired
        com.reyval.backend.repository.FraccionamientoRepository fraccionamientoRepository;

        @GetMapping("/dashboard")
        @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPCION')")
        public ResponseEntity<?> getDashboardStats() {
                long totalLotes = loteRepository.count();
                
                List<Lote> disponibles = loteRepository.findByEstatus(com.reyval.backend.entity.EStatusLote.DISPONIBLE);
                int lotesDisponibles = disponibles != null ? disponibles.size() : 0;
                
                List<Lote> vendidos = loteRepository.findByEstatus(com.reyval.backend.entity.EStatusLote.VENDIDO);
                int lotesVendidos = vendidos != null ? vendidos.size() : 0;
                
                long totalClientes = clienteRepository.count();
                long totalContratos = contratoRepository.count();
                long totalLeads = leadRepository.count();
                long totalOpportunities = opportunityRepository.count();

                // Financial Metrics - Null safe reduction
                java.math.BigDecimal ingresosTotales = java.math.BigDecimal.ZERO;
                List<Pago> allPagos = pagoRepository.findAll();
                if (allPagos != null) {
                        ingresosTotales = allPagos.stream()
                                .map(Pago::getMonto)
                                .filter(m -> m != null)
                                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                }

                java.math.BigDecimal totalContratosMonto = java.math.BigDecimal.ZERO;
                List<Contrato> allContratos = contratoRepository.findAll();
                if (allContratos != null) {
                        totalContratosMonto = allContratos.stream()
                                .map(Contrato::getMontoTotal)
                                .filter(m -> m != null)
                                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                }

                java.math.BigDecimal saldoPendienteTotal = totalContratosMonto.subtract(ingresosTotales);

                // Recent Sales (Last 5 contracts)
                List<VentaRecienteDTO> ventasRecientes = new ArrayList<>();
                List<Contrato> recentContratos = contratoRepository.findAll(org.springframework.data.domain.Sort.by(
                                        org.springframework.data.domain.Sort.Direction.DESC,
                                        "fechaContrato"));
                if (recentContratos != null) {
                        ventasRecientes = recentContratos.stream()
                                .limit(5)
                                .map(c -> {
                                        String loteNum = "Sin Lote";
                                        if (c.getLote() != null) {
                                                loteNum = c.getLote().getNumeroLote();
                                        }
                                        
                                        String clienteNom = "Sin Cliente";
                                        if (c.getCliente() != null) {
                                                String nom = c.getCliente().getNombre() != null ? c.getCliente().getNombre() : "";
                                                String ape = c.getCliente().getApellidos() != null ? c.getCliente().getApellidos() : "";
                                                clienteNom = (nom + " " + ape).trim();
                                                if (clienteNom.isEmpty()) clienteNom = "Sin Nombre";
                                        }
                                        
                                        return new VentaRecienteDTO(
                                                loteNum,
                                                clienteNom,
                                                c.getFechaContrato(),
                                                c.getMontoTotal() != null ? c.getMontoTotal() : java.math.BigDecimal.ZERO);
                                })
                                .collect(java.util.stream.Collectors.toList());
                }

                return ResponseEntity.ok(new DashboardStats(
                                totalLotes,
                                lotesDisponibles,
                                lotesVendidos,
                                totalClientes,
                                totalContratos,
                                totalLeads,
                                totalOpportunities,
                                ingresosTotales,
                                saldoPendienteTotal,
                                ventasRecientes));
        }

        @GetMapping("/estado-cuenta/{contratoId}")
        @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
        public ResponseEntity<InputStreamResource> reporteEstadoCuenta(@PathVariable Long contratoId) {
                Contrato contrato = contratoRepository.findById(contratoId)
                                .orElseThrow(() -> new RuntimeException("Contrato no encontrado"));

                List<Pago> pagos = pagoRepository.findByContratoId(contratoId);

                ByteArrayInputStream bis = pdfService.generateEstadoCuenta(contrato, pagos);

                HttpHeaders headers = new HttpHeaders();
                headers.add("Content-Disposition", "inline; filename=estado_cuenta_" + contratoId + ".pdf");

                return ResponseEntity
                                .ok()
                                .headers(headers)
                                .contentType(MediaType.APPLICATION_PDF)
                                .body(new InputStreamResource(bis));
        }

        // Inner DTO Class
        static class DashboardStats {
                private long totalLotes;
                private int lotesDisponibles;
                private int lotesVendidos;
                private long totalClientes;
                private long totalContratos;
                private long totalLeads;
                private long totalOpportunities;
                private java.math.BigDecimal ingresosTotales;
                private java.math.BigDecimal saldoPendienteTotal;
                private List<VentaRecienteDTO> ventasRecientes;

                public DashboardStats(long totalLotes, int lotesDisponibles, int lotesVendidos, long totalClientes,
                                long totalContratos, long totalLeads, long totalOpportunities,
                                java.math.BigDecimal ingresosTotales, java.math.BigDecimal saldoPendienteTotal,
                                List<VentaRecienteDTO> ventasRecientes) {
                        this.totalLotes = totalLotes;
                        this.lotesDisponibles = lotesDisponibles;
                        this.lotesVendidos = lotesVendidos;
                        this.totalClientes = totalClientes;
                        this.totalContratos = totalContratos;
                        this.totalLeads = totalLeads;
                        this.totalOpportunities = totalOpportunities;
                        this.ingresosTotales = ingresosTotales;
                        this.saldoPendienteTotal = saldoPendienteTotal;
                        this.ventasRecientes = ventasRecientes;
                }

                public long getTotalLotes() {
                        return totalLotes;
                }

                public int getLotesDisponibles() {
                        return lotesDisponibles;
                }

                public int getLotesVendidos() {
                        return lotesVendidos;
                }

                public long getTotalClientes() {
                        return totalClientes;
                }

                public long getTotalContratos() {
                        return totalContratos;
                }

                public long getTotalLeads() {
                        return totalLeads;
                }

                public long getTotalOpportunities() {
                        return totalOpportunities;
                }

                public java.math.BigDecimal getIngresosTotales() {
                        return ingresosTotales;
                }

                public java.math.BigDecimal getSaldoPendienteTotal() {
                        return saldoPendienteTotal;
                }

                public List<VentaRecienteDTO> getVentasRecientes() {
                        return ventasRecientes;
                }
        }

        static class VentaRecienteDTO {
                private String lote;
                private String cliente;
                private java.time.LocalDate fecha;
                private java.math.BigDecimal monto;

                public VentaRecienteDTO(String lote, String cliente, java.time.LocalDate fecha, java.math.BigDecimal monto) {
                        this.lote = lote;
                        this.cliente = cliente;
                        this.fecha = fecha;
                        this.monto = monto;
                }

                public String getLote() {
                        return lote;
                }

                public String getCliente() {
                        return cliente;
                }

                public java.time.LocalDate getFecha() {
                        return fecha;
                }

                public java.math.BigDecimal getMonto() {
                        return monto;
                }
        }

    // New Report Endpoints
    @Autowired
    com.reyval.backend.services.ExcelService excelService;

    @GetMapping("/usuarios")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUsuariosReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false, defaultValue = "json") String format) {
        
        List<User> users;
        
        if (startDate != null && endDate != null) {
            java.time.LocalDateTime start = java.time.LocalDate.parse(startDate).atStartOfDay();
            java.time.LocalDateTime end = java.time.LocalDate.parse(endDate).atTime(23, 59, 59);
            users = userRepository.findByCreatedAtBetween(start, end);
        } else {
            users = userRepository.findAll();
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (User user : users) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            userMap.put("email", user.getEmail());
            userMap.put("role", user.getRole() != null ? user.getRole().getName().name() : "ROLE_USER");
            userMap.put("createdAt", user.getCreatedAt());
            result.add(userMap);
        }

        if ("excel".equalsIgnoreCase(format)) {
            try {
                ByteArrayInputStream bis = excelService.generateUsersReport(result);
                HttpHeaders headers = new HttpHeaders();
                headers.add("Content-Disposition", "attachment; filename=reporte_usuarios.xlsx");
                return ResponseEntity.ok()
                        .headers(headers)
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(new InputStreamResource(bis));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error al generar Excel: " + e.getMessage());
            }
        } else if ("pdf".equalsIgnoreCase(format)) {
            try {
                ByteArrayInputStream bis = pdfService.generateUsersReport(result);
                HttpHeaders headers = new HttpHeaders();
                headers.add("Content-Disposition", "attachment; filename=reporte_usuarios.pdf");
                return ResponseEntity.ok()
                        .headers(headers)
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(new InputStreamResource(bis));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error al generar PDF: " + e.getMessage());
            }
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/pagos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPagosReport(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false, defaultValue = "json") String format) {
        
        List<Pago> pagos;
        
        if ("usuario".equals(type) && id != null) {
            // Get payments by user (via contracts)
            List<Contrato> contratos = contratoRepository.findByClienteId(id);
            pagos = new ArrayList<>();
            for (Contrato c : contratos) {
                pagos.addAll(pagoRepository.findByContratoId(c.getId()));
            }
        } else if ("lote".equals(type) && id != null) {
            // Get payments by lote
            List<Contrato> contratos = contratoRepository.findByLoteId(id);
            pagos = new ArrayList<>();
            for (Contrato c : contratos) {
                pagos.addAll(pagoRepository.findByContratoId(c.getId()));
            }
        } else if ("fraccionamiento".equals(type) && id != null) {
            // Get payments by fraccionamiento
            pagos = pagoRepository.findByFraccionamientoId(id);
        } else if ("vendedor".equals(type) && id != null) {
            // Get payments by vendedor
            User vendedor = userRepository.findById(id).orElse(null);
            if (vendedor != null) {
                List<Contrato> contratos = contratoRepository.findByVendedor(vendedor);
                pagos = new ArrayList<>();
                for (Contrato c : contratos) {
                    pagos.addAll(pagoRepository.findByContratoId(c.getId()));
                }
            } else {
                pagos = new ArrayList<>();
            }
        } else {
            pagos = pagoRepository.findAll();
        }
        
        // Filter by date if provided
        if (startDate != null && endDate != null) {
            java.time.LocalDate start = java.time.LocalDate.parse(startDate);
            java.time.LocalDate end = java.time.LocalDate.parse(endDate);
            pagos = pagos.stream()
                .filter(p -> !p.getFechaPago().isBefore(start) && !p.getFechaPago().isAfter(end))
                .collect(java.util.stream.Collectors.toList());
        }

        if ("excel".equalsIgnoreCase(format)) {
            try {
                ByteArrayInputStream bis = excelService.generatePagosReport(pagos);
                HttpHeaders headers = new HttpHeaders();
                headers.add("Content-Disposition", "attachment; filename=reporte_pagos.xlsx");
                return ResponseEntity.ok()
                        .headers(headers)
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(new InputStreamResource(bis));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error al generar Excel: " + e.getMessage());
            }
        } else if ("pdf".equalsIgnoreCase(format)) {
            try {
                ByteArrayInputStream bis = pdfService.generatePagosReport(pagos);
                HttpHeaders headers = new HttpHeaders();
                headers.add("Content-Disposition", "attachment; filename=reporte_pagos.pdf");
                return ResponseEntity.ok()
                        .headers(headers)
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(new InputStreamResource(bis));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error al generar PDF: " + e.getMessage());
            }
        }
        
        return ResponseEntity.ok(pagos);
    }

    @GetMapping("/inventario")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getInventarioReport(
            @RequestParam(required = false, defaultValue = "json") String format) {
        
        List<Lote> lotesDisponibles = loteRepository.findByEstatus(com.reyval.backend.entity.EStatusLote.DISPONIBLE);

        if ("excel".equalsIgnoreCase(format)) {
            try {
                ByteArrayInputStream bis = excelService.generateInventarioReport(lotesDisponibles);
                HttpHeaders headers = new HttpHeaders();
                headers.add("Content-Disposition", "attachment; filename=reporte_inventario.xlsx");
                return ResponseEntity.ok()
                        .headers(headers)
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(new InputStreamResource(bis));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error al generar Excel: " + e.getMessage());
            }
        } else if ("pdf".equalsIgnoreCase(format)) {
            try {
                ByteArrayInputStream bis = pdfService.generateInventarioReport(lotesDisponibles);
                HttpHeaders headers = new HttpHeaders();
                headers.add("Content-Disposition", "attachment; filename=reporte_inventario.pdf");
                return ResponseEntity.ok()
                        .headers(headers)
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(new InputStreamResource(bis));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error al generar PDF: " + e.getMessage());
            }
        }

        Map<String, Object> report = new HashMap<>();
        List<Fraccionamiento> fraccionamientos = fraccionamientoRepository.findAll();
        
        report.put("lotesDisponibles", lotesDisponibles);
        report.put("totalLotesDisponibles", lotesDisponibles.size());
        report.put("fraccionamientos", fraccionamientos);
        report.put("totalFraccionamientos", fraccionamientos.size());
        
        return ResponseEntity.ok(report);
    }

    @GetMapping("/leads")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VENDEDOR')")
    public ResponseEntity<?> getLeadsReport(
            @RequestParam(required = false, defaultValue = "json") String format) {
        
        List<com.reyval.backend.entity.Lead> leads = leadRepository.findAll();

        if ("excel".equalsIgnoreCase(format)) {
            try {
                ByteArrayInputStream bis = excelService.generateLeadsReport(leads);
                HttpHeaders headers = new HttpHeaders();
                headers.add("Content-Disposition", "attachment; filename=reporte_leads.xlsx");
                return ResponseEntity.ok()
                        .headers(headers)
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(new InputStreamResource(bis));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error al generar Excel: " + e.getMessage());
            }
        }
        
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/opportunities")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VENDEDOR')")
    public ResponseEntity<?> getOpportunitiesReport(
            @RequestParam(required = false, defaultValue = "json") String format) {
        
        List<com.reyval.backend.entity.Opportunity> opps = opportunityRepository.findAll();

        if ("excel".equalsIgnoreCase(format)) {
            try {
                ByteArrayInputStream bis = excelService.generateOpportunitiesReport(opps);
                HttpHeaders headers = new HttpHeaders();
                headers.add("Content-Disposition", "attachment; filename=reporte_oportunidades.xlsx");
                return ResponseEntity.ok()
                        .headers(headers)
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(new InputStreamResource(bis));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error al generar Excel: " + e.getMessage());
            }
        }
        
        return ResponseEntity.ok(opps);
    }
}
