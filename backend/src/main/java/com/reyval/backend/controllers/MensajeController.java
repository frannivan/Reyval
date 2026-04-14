package com.reyval.backend.controllers;

import com.reyval.backend.entity.Mensaje;
import com.reyval.backend.entity.User;
import com.reyval.backend.repository.MensajeRepository;
import com.reyval.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * CONTROLADOR UNIFICADO DE MENSAJERÍA (CU03/CU04)
 * <p>
 * Soporta dos flujos de comunicación:
 * <ol>
 *   <li><b>CRM Communication:</b> WhatsApp y Email con Leads/Oportunidades</li>
 *   <li><b>Mensajería Interna:</b> Comunicación entre usuarios del sistema</li>
 * </ol>
 *
 * <h3>Módulos del frontend que consumen este controller:</h3>
 * <ul>
 *   <li><b>Service Angular:</b> {@code frontend/src/app/services/mensaje.ts} (MensajeService)</li>
 *   <li><b>CRM Modal:</b> {@code communication-modal.component.ts} — Modal WA/Email en Leads y Oportunidades</li>
 *   <li><b>CRM Leads:</b> {@code crm-leads.component.html} — Botón de comunicación por Lead</li>
 *   <li><b>CRM Oportunidades:</b> {@code crm-opportunities.component.html} — Botón de comunicación por Oportunidad</li>
 *   <li><b>Mensajes Internos:</b> {@code mensajes.html} — Bandeja de entrada/enviados (sidebar → Mensajes)</li>
 * </ul>
 *
 * @author Reyval Systems
 * @version 2.0
 * @see com.reyval.backend.entity.Mensaje
 */
@RestController
@RequestMapping("/api/mensajes")
@CrossOrigin(origins = "*")
public class MensajeController {

    @Autowired
    private MensajeRepository mensajeRepository;

    @Autowired
    private UserRepository userRepository;

    // ═══════════════════════════════════════════════════════
    //  Helper: Get current authenticated user
    // ═══════════════════════════════════════════════════════

    private Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return Optional.empty();
        }
        return userRepository.findByUsername(auth.getName());
    }

    // ═══════════════════════════════════════════════════════
    //  Internal Messaging Endpoints (static routes FIRST)
    // ═══════════════════════════════════════════════════════

    /**
     * Obtiene los mensajes recibidos del usuario autenticado.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code mensajes.html} — Pestaña "Recibidos" de la bandeja de mensajes</li>
     *   <li>{@code mensaje.ts → getRecibidos()}</li>
     * </ul>
     *
     * @return Lista de mensajes recibidos ordenados por fecha descendente
     */
    @GetMapping("/recibidos")
    public ResponseEntity<List<Mensaje>> getRecibidos() {
        Optional<User> currentUser = getCurrentUser();
        if (currentUser.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<Mensaje> mensajes = mensajeRepository.findByDestinatarioUserIdOrderByFechaDesc(currentUser.get().getId());
        return ResponseEntity.ok(mensajes);
    }

    /**
     * Obtiene los mensajes enviados por el usuario autenticado.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code mensajes.html} — Pestaña "Enviados" de la bandeja de mensajes</li>
     *   <li>{@code mensaje.ts → getEnviados()}</li>
     * </ul>
     *
     * @return Lista de mensajes enviados ordenados por fecha descendente
     */
    @GetMapping("/enviados")
    public ResponseEntity<List<Mensaje>> getEnviados() {
        Optional<User> currentUser = getCurrentUser();
        if (currentUser.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<Mensaje> mensajes = mensajeRepository.findByRemitenteUserIdOrderByFechaDesc(currentUser.get().getId());
        return ResponseEntity.ok(mensajes);
    }

    /**
     * Obtiene el conteo de mensajes no leídos para el badge del sidebar.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code sidebar.component.html} — Badge numérico junto a "Mensajes"</li>
     *   <li>{@code mensaje.ts → getUnreadCount()}</li>
     * </ul>
     *
     * @return Número de mensajes no leídos
     */
    @GetMapping("/no-leidos/count")
    public ResponseEntity<Long> getUnreadCount() {
        Optional<User> currentUser = getCurrentUser();
        if (currentUser.isEmpty()) {
            return ResponseEntity.ok(0L);
        }
        long count = mensajeRepository.countByDestinatarioUserIdAndLeidoFalse(currentUser.get().getId());
        return ResponseEntity.ok(count);
    }

    /**
     * Envía un mensaje interno a otro usuario del sistema.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code mensajes.html} — Formulario "Nuevo Mensaje" en la bandeja</li>
     *   <li>{@code mensaje.ts → enviarMensaje(asunto, contenido, destinatarioId)}</li>
     * </ul>
     *
     * @param payload Map con claves: asunto, contenido, destinatarioId
     * @return Mensaje creado y guardado
     */
    @PostMapping("/enviar")
    public ResponseEntity<?> enviarMensaje(@RequestBody Map<String, Object> payload) {
        Optional<User> currentUser = getCurrentUser();

        String asunto = (String) payload.getOrDefault("asunto", "Sin asunto");
        String contenido = (String) payload.getOrDefault("contenido", "");
        Number destinatarioIdNum = (Number) payload.get("destinatarioId");

        if (destinatarioIdNum == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Destinatario es requerido"));
        }

        Long destinatarioId = destinatarioIdNum.longValue();
        Optional<User> destinatario = userRepository.findById(destinatarioId);

        if (destinatario.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Destinatario no encontrado"));
        }

        Mensaje m = new Mensaje();
        m.setTipo("INTERNO");
        m.setDireccion("ENVIADO");
        m.setContenido(contenido);
        m.setAsunto(asunto);
        m.setLeido(false);
        m.setFecha(LocalDateTime.now());
        m.setDestinatarioUser(destinatario.get());

        // Set remitente from authenticated user, or 'Sistema' as fallback
        if (currentUser.isPresent()) {
            m.setRemitenteUser(currentUser.get());
            m.setRemitente(currentUser.get().getUsername());
        } else {
            m.setRemitente("Sistema");
        }

        Mensaje saved = mensajeRepository.save(m);
        return ResponseEntity.ok(saved);
    }

    /**
     * Marca un mensaje como leído.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code mensajes.html} — Al abrir/leer un mensaje en la bandeja</li>
     *   <li>{@code mensaje.ts → marcarComoLeido(id)}</li>
     * </ul>
     *
     * @param id ID del mensaje a marcar
     * @return 200 OK con el mensaje actualizado
     */
    @PutMapping("/{id}/leido")
    public ResponseEntity<?> marcarComoLeido(@PathVariable Long id) {
        Optional<Mensaje> opt = mensajeRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Mensaje m = opt.get();
        m.setLeido(true);
        mensajeRepository.save(m);
        return ResponseEntity.ok().build();
    }

    // ═══════════════════════════════════════════════════════
    //  CRM Communication Endpoints (dynamic routes AFTER)
    // ═══════════════════════════════════════════════════════

    /**
     * Obtiene historial completo de comunicaciones de un Lead/Oportunidad.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code communication-modal.component.ts} — Chat de historial WA/Email</li>
     *   <li>{@code mensaje.ts → getHistory(targetId)}</li>
     * </ul>
     *
     * @param targetId ID del Lead u Oportunidad
     * @return Lista de mensajes ordenados por fecha ascendente
     */
    @GetMapping("/{targetId}")
    public ResponseEntity<List<Mensaje>> getHistory(@PathVariable Long targetId) {
        List<Mensaje> history = mensajeRepository.findByTargetIdOrderByFechaAsc(targetId);
        return ResponseEntity.ok(history);
    }

    /**
     * Obtiene historial filtrado por canal (WA o EMAIL) de un Lead/Oportunidad.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code communication-modal.component.ts} — Pestañas WA/Email del modal</li>
     *   <li>{@code mensaje.ts → getHistoryByType(targetId, tipo)}</li>
     * </ul>
     *
     * @param targetId ID del Lead u Oportunidad
     * @param tipo     Canal: "WA" o "EMAIL"
     * @return Lista filtrada de mensajes
     */
    @GetMapping("/{targetId}/{tipo}")
    public ResponseEntity<List<Mensaje>> getHistoryByType(
            @PathVariable Long targetId,
            @PathVariable String tipo) {
        List<Mensaje> history = mensajeRepository.findByTargetIdAndTipoOrderByFechaAsc(targetId, tipo.toUpperCase());
        return ResponseEntity.ok(history);
    }

    /**
     * Crea un nuevo mensaje CRM (WhatsApp o Email). Registra en la BD.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code communication-modal.component.ts} — Envío de WA o formulario de Email</li>
     *   <li>{@code mensaje.ts → sendWhatsApp(targetId, content)}</li>
     *   <li>{@code mensaje.ts → sendEmail(targetId, subject, body, hasAttachment)}</li>
     * </ul>
     *
     * @param mensaje Objeto Mensaje con tipo, contenido, targetId, etc.
     * @return Mensaje guardado con ID generado
     */
    @PostMapping
    public ResponseEntity<Mensaje> createMessage(@RequestBody Mensaje mensaje) {
        if (mensaje.getLeido() == null) {
            mensaje.setLeido(false);
        }
        Mensaje saved = mensajeRepository.save(mensaje);
        return ResponseEntity.ok(saved);
    }
}
