package com.reyval.backend.controllers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import com.reyval.backend.entity.Pago;
import com.reyval.backend.entity.Contrato;
import com.reyval.backend.entity.EPagoStatus;
import com.reyval.backend.repository.PagoRepository;
import com.reyval.backend.repository.ContratoRepository;
import com.reyval.backend.payload.response.MessageResponse;

@RestController
@RequestMapping("/api/pagos")
@org.springframework.transaction.annotation.Transactional
public class PagoController {

    @Autowired
    PagoRepository pagoRepository;

    @Autowired
    ContratoRepository contratoRepository;

    @GetMapping("/contrato/{contratoId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPCION') or hasRole('VENDEDOR') or hasRole('USER')")
    public List<Pago> getPagosByContrato(@PathVariable Long contratoId) {
        return pagoRepository.findByContratoId(contratoId);
    }

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(PagoController.class);

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPCION')")
    public List<Pago> getAllPagos() {
        List<Pago> pagos = pagoRepository.findAll(org.springframework.data.domain.Sort
                .by(org.springframework.data.domain.Sort.Direction.DESC, "fechaPago"));
        logger.info("Fetching ALL payments. Count: {}", pagos.size());
        return pagos;
    }

    // Serve Receipt Image
    @GetMapping("/{id}/comprobante")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<byte[]> getComprobante(@PathVariable Long id) {
        Pago pago = pagoRepository.findById(id).orElse(null);
        if (pago == null || pago.getComprobante() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, pago.getComprobanteContentType())
                .body(pago.getComprobante());
    }

    @PostMapping("/registrar")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VENDEDOR') or hasRole('RECEPCION')")
    public ResponseEntity<?> registrarPago(
            @RequestParam("contratoId") Long contratoId,
            @RequestParam("monto") BigDecimal monto,
            @RequestParam(value = "fechaPago", required = false) String fechaPagoStr,
            @RequestParam(value = "referencia", required = false) String referencia,
            @RequestParam(value = "concepto", required = false) String concepto,
            @RequestParam(value = "metodoPago", required = false, defaultValue = "Efectivo") String metodoPago,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        logger.info("Registering Payment - ContratoId: {}, Monto: {}, Fecha: {}, Metodo: {}", contratoId, monto, fechaPagoStr, metodoPago);

        Contrato contrato = contratoRepository.findById(contratoId)
                .orElseThrow(() -> new RuntimeException("Error: Contrato no encontrado."));

        Pago pago = new Pago();
        pago.setContrato(contrato);
        pago.setMonto(monto);
        pago.setReferencia(referencia);
        pago.setConcepto(concepto);
        pago.setMetodoPago(metodoPago);

        if (fechaPagoStr != null && !fechaPagoStr.isEmpty()) {
            pago.setFechaPago(LocalDate.parse(fechaPagoStr));
        } else {
            pago.setFechaPago(LocalDate.now());
        }

        if (file != null && !file.isEmpty()) {
            try {
                pago.setComprobante(file.getBytes());
                pago.setComprobanteContentType(file.getContentType());
            } catch (IOException e) {
                throw new RuntimeException("Error al leer el archivo del comprobante", e);
            }
        }

        pagoRepository.save(pago);
        return ResponseEntity.ok(new MessageResponse("Pago registrado exitosamente."));
    }

    @PostMapping("/{id}/validate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPCION')")
    public ResponseEntity<?> validatePago(
            @PathVariable Long id, 
            @RequestBody java.util.Map<String, String> request,
            java.security.Principal principal) {
        
        Pago pago = pagoRepository.findById(id).orElse(null);
        if (pago == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Pago no encontrado."));
        }

        String newStatus = request.get("status");
        if (newStatus != null) {
             pago.setEstatus(EPagoStatus.valueOf(newStatus));
        } else {
             pago.setEstatus(EPagoStatus.VALIDADO);
        }

        // Tracking validation details
        if (pago.getEstatus() == EPagoStatus.VALIDADO) {
            pago.setValidado(true);
            pago.setFechaValidacion(java.time.LocalDateTime.now());
            pago.setValidadoPor(principal != null ? principal.getName() : "SISTEMA");
            logger.info("Payment Validated by {}: ID {}", pago.getValidadoPor(), id);
        } else {
            pago.setValidado(false);
            pago.setFechaValidacion(null);
            pago.setValidadoPor(null);
        }

        pagoRepository.save(pago);
        return ResponseEntity.ok(new MessageResponse("Estatus de pago actualizado a " + pago.getEstatus()));
    }
}
