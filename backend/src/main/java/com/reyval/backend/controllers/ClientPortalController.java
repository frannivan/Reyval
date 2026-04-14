package com.reyval.backend.controllers;

import com.reyval.backend.entity.Cliente;
import com.reyval.backend.entity.Contrato;
import com.reyval.backend.entity.User;
import com.reyval.backend.payload.response.ClientDashboardResponse;
import com.reyval.backend.payload.response.ClientDashboardResponse.ContratoSummary;
import com.reyval.backend.repository.ClienteRepository;
import com.reyval.backend.repository.ContratoRepository;
import com.reyval.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/client")
public class ClientPortalController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    ClienteRepository clienteRepository;

    @Autowired
    ContratoRepository contratoRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        // 1. Get logged-in user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Usuario no encontrado.");
        }
        User user = userOpt.get();

        // 2. Find Cliente by direct link
        Optional<Cliente> clienteOpt = clienteRepository.findByUserId(user.getId());
        if (clienteOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("No se encontró un perfil de cliente asociado a este usuario ("
                    + user.getUsername() + "). Contacte a administración.");
        }
        Cliente cliente = clienteOpt.get();

        // 3. Get Contracts
        List<Contrato> contratos = contratoRepository.findByClienteId(cliente.getId());

        // 4. Map to DTO
        List<ContratoSummary> contratoSummaries = contratos.stream().map(c -> {
            String fraccionamiento = c.getLote().getFraccionamiento() != null
                    ? c.getLote().getFraccionamiento().getNombre()
                    : "Lote Independiente";
            
            Double totalPagado = c.getPagos() != null ? c.getPagos().stream()
                    .filter(p -> p.getEstatus().toString().equals("VALIDADO"))
                    .mapToDouble(p -> p.getMonto() != null ? p.getMonto().doubleValue() : 0.0)
                    .sum() : 0.0;

            Double montoTotal = c.getMontoTotal() != null ? c.getMontoTotal().doubleValue() : 0.0;

            return new ContratoSummary(
                    c.getId(),
                    c.getLote().getNumeroLote(),
                    fraccionamiento,
                    c.getFechaContrato().toString(),
                    c.getEstatus().toString(),
                    montoTotal,
                    totalPagado);
        }).collect(Collectors.toList());

        ClientDashboardResponse response = new ClientDashboardResponse(
                cliente.getNombre() + " " + cliente.getApellidos(),
                cliente.getEmail(),
                contratoSummaries);

        return ResponseEntity.ok(response);
    }
}
