package com.reyval.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional; // Added import for Optional
import com.reyval.backend.entity.Fraccionamiento;

@Repository
public interface FraccionamientoRepository extends JpaRepository<Fraccionamiento, Long> {
    Optional<Fraccionamiento> findByNombre(String nombre); // Added new method
}
