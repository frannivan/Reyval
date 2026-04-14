package com.reyval.backend.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reyval.backend.entity.ERole;
import com.reyval.backend.entity.Role;
import com.reyval.backend.entity.User;
import com.reyval.backend.repository.UserRepository;

/**
 * CONTROLADOR DE GESTIÓN DE SEGURIDAD Y USUARIOS (CU08)
 * <p>
 * Maneja las operaciones de perfil de usuario, cambios de contraseña y
 * servicios de directorio para la asignación de vendedores en los flujos
 * de negociación y contrato.
 * 
 * @author Reyval Systems
 * @version 1.0
 * @see <a href="SRS_Reyval_ERP.md#cu08-gestión-de-usuarios-y-permisos">CU08: Gestión de Usuarios</a>
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder encoder;

    @org.springframework.web.bind.annotation.PostMapping("/change-password")
    @PreAuthorize("hasRole('USER') or hasRole('VENDEDOR') or hasRole('ADMIN') or hasRole('RECEPCION')")
    public org.springframework.http.ResponseEntity<?> changePassword(@org.springframework.web.bind.annotation.RequestBody ChangePasswordRequest request) {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado."));

        if (!encoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return org.springframework.http.ResponseEntity.badRequest().body(new com.reyval.backend.payload.response.MessageResponse("Error: La contraseña actual es incorrecta."));
        }

        user.setPassword(encoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return org.springframework.http.ResponseEntity.ok(new com.reyval.backend.payload.response.MessageResponse("Contraseña actualizada exitosamente!"));
    }

    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;

        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    @GetMapping("/vendedores")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VENDEDOR') or hasRole('RECEPCION')")
    public List<UserSummary> getVendedores() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() != null && user.getRole().getName() == ERole.ROLE_VENDEDOR)
                .map(user -> new UserSummary(user.getId(), user.getUsername(), user.getEmail()))
                .collect(Collectors.toList());
    }

    public static class UserSummary {
        private Long id;
        private String username;
        private String email;

        public UserSummary(Long id, String username, String email) {
            this.id = id;
            this.username = username;
            this.email = email;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }
}
