package com.reyval.backend.controllers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reyval.backend.entity.Cliente;
import com.reyval.backend.entity.Contrato;
import com.reyval.backend.entity.EStatusContrato;
import com.reyval.backend.entity.EStatusLote;
import com.reyval.backend.entity.Lote;
// Conceptually useful, but logic handled in Contrato creation
import com.reyval.backend.payload.response.MessageResponse;
import com.reyval.backend.repository.ClienteRepository;
import com.reyval.backend.repository.ContratoRepository;
import com.reyval.backend.repository.LoteRepository;
import com.reyval.backend.repository.UserRepository;
import com.reyval.backend.entity.User;
import com.reyval.backend.services.CreditService;
import com.reyval.backend.services.CreditService.AmortizationRow;

/**
 * CONTROLADOR DE VENTAS Y CONTRATACIÓN (CU05, CU06, CU09)
 * <p>
 * Orquestador principal del flujo comercial. Maneja la cotización de lotes
 * (Cálculo de amortización), la formalización de contratos legales y el 
 * seguimiento operativo de las ventas para Vendedores y Administradores.
 * 
 * @author Reyval Systems
 * @version 1.0
 * @see <a href="SRS_Reyval_ERP.md#cu05-simulación-y-cotización-multi-canal">CU05: Simulación Financiera</a>
 * @see <a href="SRS_Reyval_ERP.md#cu06-emisión-de-contrato-legal">CU06: Emisión de Contrato</a>
 * @see <a href="SRS_Reyval_ERP.md#cu09-seguimiento-e-historial-de-pagos">CU09: Seguimiento de Pagos</a>
 */
@RestController
@RequestMapping("/api/ventas")
@org.springframework.transaction.annotation.Transactional
public class VentaController {

    @Autowired
    CreditService creditService;

    @Autowired
    ContratoRepository contratoRepository;

    @Autowired
    LoteRepository loteRepository;

    @Autowired
    ClienteRepository clienteRepository;

    @Autowired
    UserRepository userRepository;

    public static class CotizacionRequest {
        private BigDecimal montoTotal;
        private BigDecimal enganche;
        private int plazoMeses;
        private BigDecimal tasaAnual;

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

        public int getPlazoMeses() {
            return plazoMeses;
        }

        public void setPlazoMeses(int plazoMeses) {
            this.plazoMeses = plazoMeses;
        }

        public BigDecimal getTasaAnual() {
            return tasaAnual;
        }

        public void setTasaAnual(BigDecimal tasaAnual) {
            this.tasaAnual = tasaAnual;
        }
    }

    public static class ContratoRequest {
        private Long clienteId;
        private Long loteId;
        private BigDecimal montoTotal;
        private BigDecimal enganche;
        private int plazoMeses;
        private BigDecimal tasaAnual;
        private Long vendedorId;

        // New Client fields (Optional)
        private String nombre;
        private String apellidos;
        private String email;
        private String telefono;
        private String direccion;
        private String ine;

        public Long getClienteId() {
            return clienteId;
        }

        public void setClienteId(Long clienteId) {
            this.clienteId = clienteId;
        }

        public Long getLoteId() {
            return loteId;
        }

        public void setLoteId(Long loteId) {
            this.loteId = loteId;
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

        public int getPlazoMeses() {
            return plazoMeses;
        }

        public void setPlazoMeses(int plazoMeses) {
            this.plazoMeses = plazoMeses;
        }

        public BigDecimal getTasaAnual() {
            return tasaAnual;
        }

        public void setTasaAnual(BigDecimal tasaAnual) {
            this.tasaAnual = tasaAnual;
        }

        public Long getVendedorId() {
            return vendedorId;
        }

        public void setVendedorId(Long vendedorId) {
            this.vendedorId = vendedorId;
        }

        public String getNombre() {
            return nombre;
        }

        public void setNombre(String nombre) {
            this.nombre = nombre;
        }

        public String getApellidos() {
            return apellidos;
        }

        public void setApellidos(String apellidos) {
            this.apellidos = apellidos;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getTelefono() {
            return telefono;
        }

        public void setTelefono(String telefono) {
            this.telefono = telefono;
        }

        public String getDireccion() {
            return direccion;
        }

        public void setDireccion(String direccion) {
            this.direccion = direccion;
        }

        public String getIne() {
            return ine;
        }

        public void setIne(String ine) {
            this.ine = ine;
        }
    }

    @PostMapping("/cotizar")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> cotizar(@RequestBody CotizacionRequest request) {
        BigDecimal montoPrestamo = request.getMontoTotal().subtract(request.getEnganche());
        if (montoPrestamo.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.ok("Venta de Contado - Sin tabla de amortización.");
        }

        List<AmortizationRow> tabla = creditService.calculateAmortization(montoPrestamo, request.getPlazoMeses(),
                request.getTasaAnual());
        return ResponseEntity.ok(tabla);
    }

    @PostMapping("/contratar")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VENDEDOR') or hasRole('RECEPCION')")
    public ResponseEntity<?> crearContrato(@RequestBody ContratoRequest request) {
        Lote lote = loteRepository.findById(request.getLoteId())
                .orElseThrow(() -> new RuntimeException("Error: Lote no encontrado."));

        if (lote.getEstatus() != EStatusLote.DISPONIBLE) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: El lote no está disponible."));
        }

        Cliente cliente;
        if (request.getClienteId() != null) {
            cliente = clienteRepository.findById(request.getClienteId())
                    .orElseThrow(() -> new RuntimeException("Error: Cliente no encontrado."));
        } else {
            // Create New Client on-the-fly
            if (request.getEmail() == null || request.getNombre() == null) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Se requiere ID de cliente o datos completos para crear uno nuevo."));
            }
            if (clienteRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: El email ya existe registrado en otro cliente."));
            }
            
            cliente = new Cliente();
            cliente.setNombre(request.getNombre());
            cliente.setApellidos(request.getApellidos());
            cliente.setEmail(request.getEmail());
            cliente.setTelefono(request.getTelefono());
            cliente.setDireccion(request.getDireccion());
            cliente.setIne(request.getIne());
            
            // Note: ClienteListener will handle User creation
            cliente = clienteRepository.save(cliente);
        }

        Contrato contrato = new Contrato();
        contrato.setCliente(cliente);
        contrato.setLote(lote);
        contrato.setFechaContrato(LocalDate.now());
        contrato.setMontoTotal(request.getMontoTotal());
        contrato.setEnganche(request.getEnganche());
        contrato.setPlazoMeses(request.getPlazoMeses());

        // Convert BigDecimal to Double for this specific field if entity requires
        // Double,
        // or check if Entity should use BigDecimal. Contrato.java uses Double for
        // tasaInteresAnual.
        if (request.getTasaAnual() != null) {
            contrato.setTasaInteresAnual(request.getTasaAnual().doubleValue());
        }

        // Calcular cuota mensual promedio (referencial)
        if (request.getPlazoMeses() > 0) {
            // Placeholder logic
            contrato.setMensualidad(BigDecimal.ZERO);
        } else {
            contrato.setMensualidad(BigDecimal.ZERO);
        }

        contrato.setEstatus(EStatusContrato.ACTIVO);

        // Asignar vendedor si se proporciona, o auto-asignar si el creador es VENDEDOR
        if (request.getVendedorId() != null) {
            userRepository.findById(request.getVendedorId()).ifPresent(vendedor -> {
                contrato.setVendedor(vendedor);
            });
        } else {
            // Check if current user is VENDEDOR
            String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            userRepository.findByUsername(username).ifPresent(currentUser -> {
                if (currentUser.getRole() != null && currentUser.getRole().getName() == com.reyval.backend.entity.ERole.ROLE_VENDEDOR) {
                    contrato.setVendedor(currentUser);
                }
            });
        }

        contratoRepository.save(contrato);

        // Actualizar estatus del lote
        lote.setEstatus(EStatusLote.CONTRATADO);
        loteRepository.save(lote);

        // Return Map with ID
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("message", "Contrato generado exitosamente.");
        response.put("id", contrato.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mis-contratos")
    @PreAuthorize("hasRole('VENDEDOR') or hasRole('ADMIN')")
    public List<Contrato> getMisContratos() {
        // Get current authenticated user
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado."));

        if (currentUser.getRole() != null && currentUser.getRole().getName() == com.reyval.backend.entity.ERole.ROLE_ADMIN) {
            return contratoRepository.findAll();
        } else {
            // Filter by seller ID
            return contratoRepository.findByVendedor(currentUser);
        }
    }

    @GetMapping("/contratos")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPCION')")
    public List<Contrato> getAllContratos() {
        return contratoRepository.findAll();
    }
}
