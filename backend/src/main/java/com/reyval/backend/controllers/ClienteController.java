package com.reyval.backend.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reyval.backend.entity.Cliente;
import com.reyval.backend.payload.response.MessageResponse;
import com.reyval.backend.repository.ClienteRepository;
import com.reyval.backend.repository.RoleRepository;
import com.reyval.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * CONTROLADOR DE EXPEDIENTE DE CLIENTE (CU04)
 * <p>
 * Gestiona el repositorio central de clientes validados. Permite la consulta
 * de información personal, historial de interacciones y es el punto de partida
 * para la emisión de contratos legales.
 * 
 * @author Reyval Systems
 * @version 1.0
 * @see <a href="SRS_Reyval_ERP.md#cu04-gestión-de-expediente-de-cliente">CU04: Expediente de Cliente</a>
 */
@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    @Autowired
    ClienteRepository clienteRepository;

    @Autowired
    com.reyval.backend.repository.ContratoRepository contratoRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @GetMapping("/{id}/contratos")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION')")
    public List<com.reyval.backend.entity.Contrato> getContratosByCliente(@PathVariable Long id) {
        return contratoRepository.findByClienteId(id);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION')")
    public List<Cliente> getAllClientes() {
        return clienteRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION')")
    public ResponseEntity<?> getClienteById(@PathVariable Long id) {
        return clienteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION')")
    public ResponseEntity<?> createCliente(@RequestBody Cliente cliente) {
        if (clienteRepository.existsByEmail(cliente.getEmail())) {
            throw new IllegalArgumentException("Error: El email ya está registrado en otro cliente.");
        }

        // Listener (Trigger) will handle automatic User creation
        clienteRepository.save(cliente);
        return ResponseEntity.ok(new MessageResponse("Cliente y cuenta de usuario registrados exitosamente."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCliente(@PathVariable Long id, @RequestBody Cliente clienteDetails) {
        return clienteRepository.findById(id).map(cliente -> {
            cliente.setNombre(clienteDetails.getNombre());
            cliente.setApellidos(clienteDetails.getApellidos());
            cliente.setTelefono(clienteDetails.getTelefono());
            cliente.setDireccion(clienteDetails.getDireccion());
            cliente.setIne(clienteDetails.getIne());
            clienteRepository.save(cliente);
            return ResponseEntity.ok(new MessageResponse("Cliente actualizado exitosamente."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/public/lead")
    public ResponseEntity<?> registerLead(@RequestBody Cliente cliente) {
        if (clienteRepository.existsByEmail(cliente.getEmail())) {
            return ResponseEntity
                    .ok(new MessageResponse("Gracias. Ya tenemos tus datos, un asesor te contactará pronto."));
        }

        // Basic validation or defaults
        if (cliente.getNombre() == null || cliente.getEmail() == null || cliente.getTelefono() == null) {
            throw new IllegalArgumentException("Error: Faltan datos requeridos.");
        }

        // Allow public leads to bypass strict checks or fill dummy data if needed
        if (cliente.getApellidos() == null)
            cliente.setApellidos("-"); // Placeholder if not provided

        // Listener (Trigger) will handle automatic User creation
        clienteRepository.save(cliente);
        return ResponseEntity.ok(new MessageResponse("Solicitud recibida. Se ha creado tu cuenta con tu correo y tu teléfono/INE como contraseña."));
    }
}
