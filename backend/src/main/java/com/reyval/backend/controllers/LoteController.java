package com.reyval.backend.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.reyval.backend.entity.EStatusLote;
import com.reyval.backend.entity.Lote;
import com.reyval.backend.payload.response.MessageResponse;
import com.reyval.backend.repository.LoteRepository;

/**
 * CONTROLADOR DE INVENTARIO DE LOTES (CU02)
 * <p>
 * Gestiona la disponibilidad, precios y estatus de las unidades individuales (Lotes).
 * Incluye funcionalidades de filtrado por fraccionamiento y actualización masiva
 * de estatus operativos (Disponible, Apartado, Vendido).
 *
 * <h3>Módulos del frontend que consumen este controller:</h3>
 * <ul>
 *   <li><b>Service Angular:</b> {@code frontend/src/app/services/lote.ts} (LoteService)</li>
 *   <li><b>Catálogo público:</b> {@code home.html} — Tarjetas de lotes disponibles</li>
 *   <li><b>Inventario Admin:</b> {@code lote-list/lote-list.component.html} — Tabla con edición inline</li>
 *   <li><b>Detalle de Lote:</b> {@code lote-detail/lote-detail.html} — Ficha individual con galería y mapa</li>
 *   <li><b>Editor de Polígonos:</b> {@code polygon-editor/polygon-editor.component.html} — Editor Leaflet</li>
 *   <li><b>CRM Leads:</b> {@code crm-leads.component.html} — Dropdown para asignar lote al convertir Lead</li>
 * </ul>
 *
 * @author Reyval Systems
 * @version 1.1
 * @see com.reyval.backend.entity.Lote
 * @see com.reyval.backend.entity.EStatusLote
 */
@RestController
@RequestMapping("/api/lotes")
public class LoteController {

    public LoteController() {
        System.out.println("--- LoteController INSTANTIATED ---");
    }

    /** Health check — verifica que el controller esté activo. */
    @GetMapping("/ping")
    public String ping() {
        return "LoteController is UP";
    }

    @Autowired
    LoteRepository loteRepository;

    /**
     * Lista lotes disponibles/apartados para el catálogo público.
     * Soporta filtrado por fraccionamiento, ubicación y ordenamiento por precio.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code home.html} — Tarjetas de lotes en la página principal</li>
     *   <li>{@code cotizacion.html} — Selector de lote para cotizar</li>
     *   <li>{@code lote.ts → getAllLotesPublic()}</li>
     * </ul>
     *
     * @param fraccionamientoId (Opcional) Filtra por fraccionamiento
     * @param ubicacion         (Opcional) Filtra por ubicación
     * @param sortDir           Ordenamiento por precio: "asc" o "desc"
     * @return Lista de lotes con estatus DISPONIBLE o APARTADO
     */
    @GetMapping("/public")
    public List<Lote> getAvailableLotes(
            @RequestParam(required = false) Long fraccionamientoId,
            @RequestParam(required = false) String ubicacion,
            @RequestParam(defaultValue = "asc") String sortDir) {
        org.springframework.data.domain.Sort sort = sortDir.equalsIgnoreCase("desc")
                ? org.springframework.data.domain.Sort.by("precioTotal").descending()
                : org.springframework.data.domain.Sort.by("precioTotal").ascending();

        return loteRepository.searchLotes(java.util.Arrays.asList(EStatusLote.DISPONIBLE, EStatusLote.APARTADO), fraccionamientoId, ubicacion, sort);
    }

    /**
     * Obtiene un lote específico por ID (acceso público).
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code lote-detail.html} — Vista detalle con galería, mapa y datos</li>
     *   <li>{@code lote.ts → getLoteById(id)}</li>
     * </ul>
     *
     * @param id Identificador del lote
     * @return Lote encontrado o 404
     */
    @GetMapping("/public/{id}")
    public ResponseEntity<?> getLoteById(@PathVariable Long id) {
        Optional<Lote> lote = loteRepository.findById(id);
        if (lote.isPresent()) {
            return ResponseEntity.ok(lote.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Lista TODOS los lotes del sistema (incluye vendidos). Requiere ADMIN/VENDEDOR/RECEPCIÓN.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code lote-list.component.html} — Tabla de inventario admin con edición inline</li>
     *   <li>{@code crm-leads.component.html} — Dropdown para convertir Lead → Oportunidad</li>
     *   <li>{@code lote.ts → getAllLotes()}</li>
     * </ul>
     *
     * @return Lista completa de lotes
     */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION')")
    public List<Lote> getAllLotes() {
        return loteRepository.findAll();
    }

    /**
     * Filtra lotes por fraccionamiento (vista admin).
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code lote-list.component.html} — Filtro por fraccionamiento en inventario</li>
     *   <li>{@code polygon-editor.component.html} — Carga lotes al seleccionar fraccionamiento</li>
     *   <li>{@code lote.ts → getLotesByFraccionamiento(id)}</li>
     * </ul>
     *
     * @param id ID del fraccionamiento padre
     * @return Lotes del fraccionamiento
     */
    @GetMapping("/adm/by-fraccionamiento/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION')")
    public List<Lote> getLotesByFraccionamiento(@PathVariable Long id) {
        return loteRepository.findByFraccionamientoId(id);
    }

    /**
     * Filtra lotes por fraccionamiento (vista pública).
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code fraccionamiento-detail.html} — Lista de lotes dentro de un fraccionamiento</li>
     *   <li>{@code lote.ts → getPublicLotesByFraccionamiento(id)}</li>
     * </ul>
     *
     * @param id ID del fraccionamiento
     * @return Lotes del fraccionamiento (públicos)
     */
    @GetMapping("/public/by-fraccionamiento/{id}")
    public List<Lote> getPublicLotesByFraccionamiento(@PathVariable Long id) {
        return loteRepository.findByFraccionamientoId(id);
    }

    /**
     * Crea un nuevo lote en el inventario. Solo ADMIN.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code lote-list.component.html} — Modal "Agregar Lote"</li>
     *   <li>{@code carga-datos.component.html} — Carga masiva desde Excel</li>
     *   <li>{@code lote.ts → createLote(lote)}</li>
     * </ul>
     *
     * @param lote Objeto Lote con datos del nuevo registro
     * @return Confirmación de creación
     */
    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public ResponseEntity<?> createLote(@RequestBody Lote lote) {
        loteRepository.save(lote);
        return ResponseEntity.ok(new MessageResponse("Lote creado exitosamente."));
    }

    /**
     * Actualiza datos completos de un lote. Solo ADMIN.
     * Campos: número, manzana, precio, área, coordenadas, estatus, descripción, imagen, galería.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code lote-list.component.html} — Modal de edición de lote</li>
     *   <li>{@code lote.ts → updateLote(id, lote)}</li>
     * </ul>
     *
     * @param id          ID del lote a actualizar
     * @param loteDetails Datos actualizados
     * @return Confirmación o 404
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public ResponseEntity<?> updateLote(@PathVariable Long id, @RequestBody Lote loteDetails) {
        return loteRepository.findById(id).map(lote -> {
            lote.setNumeroLote(loteDetails.getNumeroLote());
            lote.setManzana(loteDetails.getManzana());
            lote.setPrecioTotal(loteDetails.getPrecioTotal());
            lote.setAreaMetrosCuadrados(loteDetails.getAreaMetrosCuadrados());
            lote.setCoordenadasGeo(loteDetails.getCoordenadasGeo());
            lote.setPlanoCoordinates(loteDetails.getPlanoCoordinates());
            lote.setEstatus(loteDetails.getEstatus());
            lote.setDescripcion(loteDetails.getDescripcion());
            lote.setImagenUrl(loteDetails.getImagenUrl());
            if (loteDetails.getGaleriaImagenes() != null) {
                lote.getGaleriaImagenes().clear();
                lote.getGaleriaImagenes().addAll(loteDetails.getGaleriaImagenes());
            }
            if (loteDetails.getFraccionamiento() != null) {
                lote.setFraccionamiento(loteDetails.getFraccionamiento());
            } else {
                lote.setFraccionamiento(null);
            }
            loteRepository.save(lote);
            return ResponseEntity.ok(new MessageResponse("Lote actualizado exitosamente."));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Elimina un lote del inventario. Solo ADMIN.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code lote-list.component.html} — Botón "Eliminar" en tabla de inventario</li>
     *   <li>{@code lote.ts → deleteLote(id)}</li>
     * </ul>
     *
     * @param id ID del lote a eliminar
     * @return Confirmación o 404
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public ResponseEntity<?> deleteLote(@PathVariable Long id) {
        if (loteRepository.existsById(id)) {
            loteRepository.deleteById(id);
            return ResponseEntity.ok(new MessageResponse("Lote eliminado."));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Actualiza coordenadas del polígono de un lote en el editor geoespacial. Solo ADMIN.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code polygon-editor.component.html} — Editor Leaflet de polígonos</li>
     *   <li>{@code lote.ts → updateLotePoligono(id, coordinates)}</li>
     * </ul>
     *
     * @param id          ID del lote
     * @param coordinates JSON con coordenadas [[lat,lng],...]
     * @return Confirmación o 404
     */
    @PutMapping("/adm/{id}/poligono")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public ResponseEntity<?> updateLotePoligono(
            @PathVariable Long id,
            @RequestBody String coordinates) {
        return loteRepository.findById(id).map(lote -> {
            lote.setPlanoCoordinates(coordinates);
            loteRepository.save(lote);
            return ResponseEntity.ok(new MessageResponse("Polígono de lote actualizado"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cambia el estatus de un lote (DISPONIBLE/APARTADO/VENDIDO). Solo ADMIN.
     * Permite cambio rápido desde la tabla de inventario (edición inline).
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code lote-list.component.html} — Dropdown inline de estatus en cada fila</li>
     *   <li>{@code lote.ts → updateLoteEstatus(id, estatus)}</li>
     * </ul>
     *
     * @param id   ID del lote
     * @param body Map con clave "estatus" y valor del enum EStatusLote
     * @return Lote actualizado o 404
     */
    @PutMapping("/adm/{id}/estatus")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO', 'RECEPCION')")
    public ResponseEntity<?> updateLoteEstatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String estatus = body.get("estatus");
        return loteRepository.findById(id).map(lote -> {
            lote.setEstatus(EStatusLote.valueOf(estatus));
            loteRepository.save(lote);
            return ResponseEntity.ok(lote);
        }).orElse(ResponseEntity.notFound().build());
    }
}
