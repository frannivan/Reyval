package com.reyval.backend.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reyval.backend.entity.Fraccionamiento;
import com.reyval.backend.repository.FraccionamientoRepository;

/**
 * CONTROLADOR DE FRACCIONAMIENTOS (CU01)
 * <p>
 * Este controlador gestiona el ciclo de vida de los proyectos inmobiliarios (Fraccionamientos).
 * Proporciona endpoints para la gestión de metadatos, planos SVG y delimitación 
 * geográfica mediante polígonos para su visualización en mapas.
 * 
 * @author Reyval Systems
 * @version 1.0
 * @see <a href="SRS_Reyval_ERP.md#cu01-configuración-de-fraccionamiento-y-desarrollo">CU01: Configuración de Fraccionamiento</a>
 */
@RestController
@RequestMapping("/api/fraccionamientos")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FraccionamientoController {

    public FraccionamientoController() {
        System.out.println("--- FraccionamientoController INSTANTIATED ---");
    }

    @GetMapping("/ping")
    public String ping() {
        return "FraccionamientoController is UP";
    }

    @Autowired
    FraccionamientoRepository fraccionamientoRepository;

    @GetMapping("/public")
    public List<Fraccionamiento> getAllFraccionamientos() {
        return fraccionamientoRepository.findAll();
    }

    @GetMapping("/public/{id}")
    public org.springframework.http.ResponseEntity<?> getFraccionamientoById(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        java.util.Optional<Fraccionamiento> fraccionamiento = fraccionamientoRepository.findById(id);
        if (fraccionamiento.isPresent()) {
            return org.springframework.http.ResponseEntity.ok(fraccionamiento.get());
        } else {
            return org.springframework.http.ResponseEntity.notFound().build();
        }
    }

    @org.springframework.web.bind.annotation.PostMapping("/create")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public org.springframework.http.ResponseEntity<?> createFraccionamiento(
            @org.springframework.web.bind.annotation.RequestBody Fraccionamiento fraccionamiento) {
        fraccionamientoRepository.save(fraccionamiento);
        return org.springframework.http.ResponseEntity
                .ok(new com.reyval.backend.payload.response.MessageResponse("Fraccionamiento creado exitosamente."));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public org.springframework.http.ResponseEntity<?> updateFraccionamiento(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody Fraccionamiento details) {
        return fraccionamientoRepository.findById(id).map(fraccionamiento -> {
            fraccionamiento.setNombre(details.getNombre());
            fraccionamiento.setUbicacion(details.getUbicacion());
            fraccionamiento.setDescripcion(details.getDescripcion());
            fraccionamiento.setLogoUrl(details.getLogoUrl());
            fraccionamiento.setCoordenadasGeo(details.getCoordenadasGeo());
            fraccionamiento.setImagenPlanoUrl(details.getImagenPlanoUrl());
            if (details.getGaleriaImagenes() != null) {
                fraccionamiento.getGaleriaImagenes().clear();
                fraccionamiento.getGaleriaImagenes().addAll(details.getGaleriaImagenes());
            }
            fraccionamientoRepository.save(fraccionamiento);
            return org.springframework.http.ResponseEntity.ok(new com.reyval.backend.payload.response.MessageResponse(
                    "Fraccionamiento actualizado exitosamente."));
        }).orElse(org.springframework.http.ResponseEntity.notFound().build());
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public org.springframework.http.ResponseEntity<?> deleteFraccionamiento(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        if (fraccionamientoRepository.existsById(id)) {
            fraccionamientoRepository.deleteById(id);
            return org.springframework.http.ResponseEntity
                    .ok(new com.reyval.backend.payload.response.MessageResponse("Fraccionamiento eliminado."));
        } else {
            return org.springframework.http.ResponseEntity.notFound().build();
        }
    }

    @org.springframework.web.bind.annotation.PutMapping("/adm/{id}/plano-svg")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public org.springframework.http.ResponseEntity<?> uploadPlanoSvg(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody String svgContent) {
        return fraccionamientoRepository.findById(id).map(fraccionamiento -> {
            // Basic SVG validation
            if (svgContent == null || !svgContent.trim().startsWith("<svg")) {
                return org.springframework.http.ResponseEntity.badRequest()
                        .body(new com.reyval.backend.payload.response.MessageResponse("Contenido SVG inválido"));
            }

            fraccionamiento.setPlanoSvg(svgContent);
            fraccionamientoRepository.save(fraccionamiento);
            return org.springframework.http.ResponseEntity.ok(
                    new com.reyval.backend.payload.response.MessageResponse("Plano SVG subido exitosamente"));
        }).orElse(org.springframework.http.ResponseEntity.notFound().build());
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/adm/{id}/plano-svg")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public org.springframework.http.ResponseEntity<?> deletePlanoSvg(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        return fraccionamientoRepository.findById(id).map(fraccionamiento -> {
            fraccionamiento.setPlanoSvg(null);
            fraccionamientoRepository.save(fraccionamiento);
            return org.springframework.http.ResponseEntity.ok(
                    new com.reyval.backend.payload.response.MessageResponse("Plano SVG eliminado"));
        }).orElse(org.springframework.http.ResponseEntity.notFound().build());
    }

    @org.springframework.web.bind.annotation.PutMapping("/adm/{id}/poligono")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public org.springframework.http.ResponseEntity<?> updatePoligonoDelimitador(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody String poligono) {
        return fraccionamientoRepository.findById(id).map(fracc -> {
            fracc.setPoligonoDelimitador(poligono);
            fraccionamientoRepository.save(fracc);
            return org.springframework.http.ResponseEntity.ok(
                    new com.reyval.backend.payload.response.MessageResponse("Polígono actualizado"));
        }).orElse(org.springframework.http.ResponseEntity.notFound().build());
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/adm/{id}/poligono")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public org.springframework.http.ResponseEntity<?> deletePoligonoDelimitador(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        return fraccionamientoRepository.findById(id).map(fracc -> {
            fracc.setPoligonoDelimitador(null);
            fraccionamientoRepository.save(fracc);
            return org.springframework.http.ResponseEntity.ok(
                    new com.reyval.backend.payload.response.MessageResponse("Polígono eliminado"));
        }).orElse(org.springframework.http.ResponseEntity.notFound().build());
    }
}
