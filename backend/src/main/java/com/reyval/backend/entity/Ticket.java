package com.reyval.backend.entity;

import java.time.LocalDateTime;
import javax.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tickets")
@Data
@NoArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EPrioridadTicket prioridad;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private EEstatusTicket estatus;

    @Lob
    private byte[] evidencia;

    private String evidenciaContentType;

    @Column(columnDefinition = "TEXT")
    private String comentarios;

    @ManyToOne
    @JoinColumn(name = "reportado_por_id")
    private User reportadoPor;

    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
        if (estatus == null) estatus = EEstatusTicket.ABIERTO;
    }

    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
}
