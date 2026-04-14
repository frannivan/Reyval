package com.reyval.backend.repository;

import com.reyval.backend.entity.Contrato;
import com.reyval.backend.entity.EStatusContrato;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {
    List<Contrato> findByEstatus(EStatusContrato estatus);

    List<Contrato> findByClienteId(@org.springframework.web.bind.annotation.PathVariable("clienteId") Long clienteId);

    List<Contrato> findByLoteId(Long loteId);

    List<Contrato> findByVendedor(com.reyval.backend.entity.User vendedor);
}
