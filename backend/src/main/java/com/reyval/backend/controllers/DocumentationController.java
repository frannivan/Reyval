package com.reyval.backend.controllers;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/docs")
public class DocumentationController {

    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPCION') or hasRole('VENDEDOR')")
    public List<String> listDocs() {
        try {
            // Priority 1: Direct file system paths
            String[] possiblePaths = {
                "src/main/resources/docs",
                "backend/src/main/resources/docs",
                "resources/docs",
                "docs"
            };

            Path docsPath = null;
            for (String p : possiblePaths) {
                Path candidate = Paths.get(p);
                if (Files.exists(candidate)) {
                    docsPath = candidate;
                    break;
                }
            }
            
            if (docsPath != null) {
                try (Stream<Path> stream = Files.walk(docsPath, 5)) {
                    return stream
                            .filter(file -> !Files.isDirectory(file))
                            .map(docsPath::relativize)
                            .map(Path::toString)
                            .filter(name -> name.endsWith(".md") || name.endsWith(".html") || 
                                       name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg"))
                            .map(name -> name.replace("\\", "/")) // Normalize for cross-platform
                            .collect(Collectors.toList());
                }
            }
            
            // Fallback for JAR/Production
            return List.of("ECU_EIU_Editor_Poligonos.md", "ECU_EIU_Recepcion_Pagos.md", "ECU_EIU_Comunicacion_CRM.md");
            
        } catch (IOException e) {
            return Collections.emptyList();
        }
    }

    @GetMapping("/**")
    public ResponseEntity<Resource> getDoc(javax.servlet.http.HttpServletRequest request) {
        String fullPath = request.getRequestURI();
        // Extract the part after /api/docs/
        String path = fullPath.substring(fullPath.indexOf("/api/docs/") + 10);
        
        // Normalize: remove leading slashes and prevent traversal
        path = path.replace("\\", "/");
        while (path.startsWith("/")) path = path.substring(1);
        if (path.contains("..")) return ResponseEntity.badRequest().build();

        // 1. Security check for sensitive document content
        String lowerPath = path.toLowerCase();
        boolean isProtected = lowerPath.endsWith(".md") || lowerPath.endsWith(".html");
        
        if (isProtected) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) {
                return ResponseEntity.status(401).build();
            }
        }

        try {
            Resource resource = null;
            
            // Try different possible locations relative to CWD
            String[] locations = {
                "src/main/resources/docs/",
                "backend/src/main/resources/docs/",
                "resources/docs/",
                "docs/"
            };

            for (String loc : locations) {
                Path fPath = Paths.get(loc + path);
                if (Files.exists(fPath) && !Files.isDirectory(fPath)) {
                    resource = new UrlResource(fPath.toUri());
                    break;
                }
            }

            // Fallback to ClassPath (Standard for JAR deployments)
            if (resource == null) {
                resource = new ClassPathResource("docs/" + path);
                if (!resource.exists()) {
                    resource = new ClassPathResource("static/docs/" + path);
                }
            }

            if (resource != null && resource.exists()) {
                String contentType = "application/octet-stream";
                if (lowerPath.endsWith(".png")) contentType = "image/png";
                else if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) contentType = "image/jpeg";
                else if (lowerPath.endsWith(".gif")) contentType = "image/gif";
                else if (lowerPath.endsWith(".webp")) contentType = "image/webp";
                else if (lowerPath.endsWith(".svg")) contentType = "image/svg+xml";
                else if (lowerPath.endsWith(".md")) contentType = "text/markdown; charset=UTF-8";
                else if (lowerPath.endsWith(".html")) contentType = "text/html; charset=UTF-8";
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "max-age=3600")
                        .body(resource);
            }

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
        
        return ResponseEntity.notFound().build();
    }
}
