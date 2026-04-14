package com.reyval.backend.controllers;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.reyval.backend.payload.response.MessageResponse;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * CONTROLADOR DE IMÁGENES (Soporte Transversal)
 * <p>
 * Gestiona la subida y descarga de imágenes del sistema. Soporta JPEG, PNG, WebP
 * y conversión automática de primera página de PDFs a PNG.
 * Tamaño máximo: 50MB (configurado en application.properties).
 *
 * <h3>Módulos del frontend que consumen este controller:</h3>
 * <ul>
 *   <li><b>Service Angular:</b> No tiene servicio dedicado — se consume vía URL directa</li>
 *   <li><b>Lotes:</b> {@code lote-list.component.html} — Subida de imagen principal y galería</li>
 *   <li><b>Fraccionamientos:</b> {@code fraccionamiento-list.component.html} — Imagen del desarrollo</li>
 *   <li><b>Detalle de Lote:</b> {@code lote-detail.html} — Carga de galería de imágenes</li>
 *   <li><b>Home Público:</b> {@code home.html} — Renderizado de imágenes en tarjetas de lotes</li>
 *   <li><b>Contratos:</b> {@code generar-contrato.html} — Imagen del plano del lote en el PDF</li>
 * </ul>
 *
 * @author Reyval Systems
 * @version 1.0
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final Path root = Paths.get("uploads");
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "pdf", "webp");

    public ImageController() {
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize folder for upload!");
        }
    }

    /**
     * Valida que el archivo tenga una extensión permitida (jpg, jpeg, png, pdf, webp).
     *
     * @param filename Nombre del archivo a validar
     * @return true si la extensión está permitida
     */
    private boolean isValidImageFormat(String filename) {
        if (filename == null || !filename.contains(".")) {
            return false;
        }
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        return ALLOWED_EXTENSIONS.contains(extension);
    }

    /**
     * Sube un archivo de imagen al servidor. Solo ADMIN.
     * Si el archivo es PDF, convierte la primera página a PNG automáticamente (150 DPI).
     * Para imágenes normales, las guarda con nombre UUID para evitar colisiones.
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code lote-list.component.html} — Input de imagen en modal de crear/editar lote</li>
     *   <li>{@code fraccionamiento-list.component.html} — Upload de imagen del fraccionamiento</li>
     *   <li>Cualquier formulario admin que permita subir imagen</li>
     * </ul>
     *
     * @param file Archivo MultipartFile (máx 50MB)
     * @return URL relativa de la imagen guardada (ej: /reyval/api/images/uuid_foto.png)
     * @throws IllegalArgumentException si el formato no es soportado
     */
    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        String originalFilename = file.getOriginalFilename();

        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("Nombre de archivo inválido");
        }

        if (!isValidImageFormat(originalFilename) && !"application/pdf".equals(file.getContentType())) {
            throw new IllegalArgumentException("Formato no soportado. Formatos permitidos: JPEG, PNG, PDF, WebP");
        }

        String filename = UUID.randomUUID().toString();
        String extension = "";

        if (originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        if ("application/pdf".equals(file.getContentType()) || extension.equalsIgnoreCase(".pdf")) {
            try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.pdmodel.PDDocument.load(file.getInputStream())) {
                org.apache.pdfbox.rendering.PDFRenderer pdfRenderer = new org.apache.pdfbox.rendering.PDFRenderer(document);
                java.awt.image.BufferedImage bim = pdfRenderer.renderImageWithDPI(0, 150, org.apache.pdfbox.rendering.ImageType.RGB);

                filename = filename + "_converted.png";
                javax.imageio.ImageIO.write(bim, "png", this.root.resolve(filename).toFile());

                String fileUrl = "/reyval/api/images/" + filename;
                return ResponseEntity.ok(new MessageResponse(fileUrl));
            } catch (IOException e) {
                throw new RuntimeException("Error al procesar PDF: " + e.getMessage(), e);
            }
        } else {
            filename = filename + "_" + originalFilename;
            try {
                Files.copy(file.getInputStream(), this.root.resolve(filename));
            } catch (IOException e) {
                throw new RuntimeException("Error al guardar archivo: " + e.getMessage(), e);
            }
            String fileUrl = "/reyval/api/images/" + filename;
            return ResponseEntity.ok(new MessageResponse(fileUrl));
        }
    }

    /**
     * Descarga/sirve una imagen por su nombre de archivo (acceso público).
     * Detecta el Content-Type automáticamente y sirve inline (no descarga).
     * <p>
     * <b>Consumido por:</b>
     * <ul>
     *   <li>{@code home.html} — {@code <img>} en tarjetas de lotes</li>
     *   <li>{@code lote-detail.html} — Galería de imágenes del lote</li>
     *   <li>{@code fraccionamiento-detail.html} — Imagen del fraccionamiento</li>
     *   <li>Cualquier {@code <img src="/api/images/...">} en el sistema</li>
     * </ul>
     *
     * @param filename Nombre del archivo (incluyendo extensión)
     * @return Recurso binario de la imagen con Content-Type apropiado, o 404
     */
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        Path file = root.resolve(filename);
        try {
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            throw new RuntimeException("Error al leer archivo: " + e.getMessage(), e);
        }
    }
}
