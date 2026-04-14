package com.reyval.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidad unificada de comunicación.
 * Soporta dos flujos:
 * <ol>
 *   <li><b>CRM Communication:</b> WhatsApp/Email con Leads/Oportunidades (usa targetId, tipo, direccion)</li>
 *   <li><b>Mensajería Interna:</b> User-to-User (usa remitenteUser, destinatarioUser, asunto, leido)</li>
 * </ol>
 *
 * @see Lead
 * @since CU03 – Gestión de Leads / CU04 – Gestión de Oportunidades
 */
@Entity
@Table(name = "mensajes")
@Data
@NoArgsConstructor
public class Mensaje {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID del Lead u Oportunidad asociado (CRM flow) */
    @Column(name = "target_id")
    private Long targetId;

    /** Tipo de canal: WA (WhatsApp), EMAIL, o INTERNO */
    @Column(length = 10)
    private String tipo;

    /** Dirección del mensaje: ENVIADO o RECIBIDO */
    @Column(length = 10)
    private String direccion;

    /** Contenido del mensaje o cuerpo del email */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenido;

    /** Nombre del remitente (vendedor, cliente, etc.) — para CRM */
    private String remitente;

    /** Archivo adjunto (ej. "Cotizacion.pdf"), nullable */
    private String adjunto;

    /** Fecha de envío o recepción */
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    // ═══════════════════════════════════════════════
    //  Internal Messaging Fields
    // ═══════════════════════════════════════════════

    /** Asunto del mensaje interno */
    private String asunto;

    /** ¿Mensaje leído? (para bandeja de entrada) */
    @Column(nullable = false)
    private Boolean leido = false;

    /** Usuario que envía el mensaje (interno) */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "remitente_user_id")
    @JsonIgnoreProperties({"password", "roles", "createdAt"})
    private User remitenteUser;

    /** Usuario destinatario del mensaje (interno) */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destinatario_user_id")
    @JsonIgnoreProperties({"password", "roles", "createdAt"})
    private User destinatarioUser;

    @PrePersist
    protected void onCreate() {
        if (this.fecha == null) {
            this.fecha = LocalDateTime.now();
        }
        if (this.leido == null) {
            this.leido = false;
        }
    }

    /** Constructor para mensajes CRM (WhatsApp/Email) */
    public Mensaje(Long targetId, String tipo, String direccion, String contenido, String remitente) {
        this.targetId = targetId;
        this.tipo = tipo;
        this.direccion = direccion;
        this.contenido = contenido;
        this.remitente = remitente;
        this.fecha = LocalDateTime.now();
        this.leido = false;
    }
}
