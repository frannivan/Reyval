package com.reyval.backend.repository;

import com.reyval.backend.entity.Mensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio para la entidad Mensaje.
 * Provee consultas para:
 * 1. CRM Communication (por targetId y tipo de canal)
 * 2. Mensajería Interna (por usuario remitente/destinatario)
 */
@Repository
public interface MensajeRepository extends JpaRepository<Mensaje, Long> {

    // ═══════════════════════════════════════════════
    //  CRM Queries
    // ═══════════════════════════════════════════════

    List<Mensaje> findByTargetIdOrderByFechaAsc(Long targetId);

    List<Mensaje> findByTargetIdAndTipoOrderByFechaAsc(Long targetId, String tipo);

    // ═══════════════════════════════════════════════
    //  Internal Messaging Queries
    // ═══════════════════════════════════════════════

    /** Mensajes recibidos por un usuario, ordenados por fecha (más reciente primero) */
    List<Mensaje> findByDestinatarioUserIdOrderByFechaDesc(Long userId);

    /** Mensajes enviados por un usuario, ordenados por fecha (más reciente primero) */
    List<Mensaje> findByRemitenteUserIdOrderByFechaDesc(Long userId);

    /** Conteo de mensajes no leídos para un usuario */
    long countByDestinatarioUserIdAndLeidoFalse(Long userId);
}
