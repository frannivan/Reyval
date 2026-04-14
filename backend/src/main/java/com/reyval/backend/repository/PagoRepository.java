package com.reyval.backend.repository;

import com.reyval.backend.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PagoRepository extends JpaRepository<Pago, Long> {
    List<Pago> findByContratoId(Long contratoId);
    
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Pago p WHERE p.contrato.lote.fraccionamiento.id = :fraccionamientoId")
    List<Pago> findByFraccionamientoId(@org.springframework.data.repository.query.Param("fraccionamientoId") Long fraccionamientoId);
}
