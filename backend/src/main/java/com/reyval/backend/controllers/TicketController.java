package com.reyval.backend.controllers;

import com.reyval.backend.entity.EEstatusTicket;
import com.reyval.backend.entity.EPrioridadTicket;
import com.reyval.backend.entity.Ticket;
import com.reyval.backend.entity.User;
import com.reyval.backend.payload.response.MessageResponse;
import com.reyval.backend.repository.TicketRepository;
import com.reyval.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TicketController {

    @Autowired
    TicketRepository ticketRepository;

    @Autowired
    UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SOPORTE', 'DIRECTIVO')")
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    @GetMapping("/mis-tickets")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION', 'CONTABILIDAD', 'DIRECTIVO')")
    public List<Ticket> getMyTickets(Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado."));
        return ticketRepository.findByReportadoPor(user);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION', 'CONTABILIDAD', 'DIRECTIVO')")
    public ResponseEntity<?> createTicket(
            @RequestParam("titulo") String titulo,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("prioridad") String prioridad,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Principal principal) {

        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado."));

        Ticket ticket = new Ticket();
        ticket.setTitulo(titulo);
        ticket.setDescripcion(descripcion);
        ticket.setPrioridad(EPrioridadTicket.valueOf(prioridad));
        ticket.setReportadoPor(user);

        if (file != null && !file.isEmpty()) {
            try {
                ticket.setEvidencia(file.getBytes());
                ticket.setEvidenciaContentType(file.getContentType());
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(new MessageResponse("Error al procesar la imagen."));
            }
        }

        ticketRepository.save(ticket);
        return ResponseEntity.ok(new MessageResponse("Ticket creado exitosamente."));
    }

    @GetMapping("/{id}/evidencia")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOPORTE', 'DIRECTIVO', 'VENDEDOR', 'RECEPCION', 'CONTABILIDAD')")
    public ResponseEntity<byte[]> getEvidencia(@PathVariable Long id) {
        Ticket ticket = ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket no encontrado."));
        if (ticket.getEvidencia() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, ticket.getEvidenciaContentType())
                .body(ticket.getEvidencia());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOPORTE', 'DIRECTIVO')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Ticket ticket = ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket no encontrado."));
        String status = request.get("status");
        ticket.setEstatus(EEstatusTicket.valueOf(status));
        ticketRepository.save(ticket);
        return ResponseEntity.ok(new MessageResponse("Estatus actualizado a " + status));
    }

    @PostMapping("/{id}/comentario")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOPORTE', 'DIRECTIVO', 'VENDEDOR', 'RECEPCION', 'CONTABILIDAD')")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody Map<String, String> request, Principal principal) {
        Ticket ticket = ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket no encontrado."));
        String comment = request.get("comment");
        String author = principal.getName();
        
        String newComment = author + ": " + comment;
        if (ticket.getComentarios() != null) {
            ticket.setComentarios(ticket.getComentarios() + "\n---\n" + newComment);
        } else {
            ticket.setComentarios(newComment);
        }
        
        ticketRepository.save(ticket);
        return ResponseEntity.ok(new MessageResponse("Comentario agregado."));
    }
}
