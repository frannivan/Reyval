package com.reyval.backend.controllers;

import com.reyval.backend.dto.UserDTO;
import com.reyval.backend.services.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDTO> getAllUsers() {
        return adminService.getAllUsers();
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody UserDTO request) {
        adminService.createUser(request);
        return ResponseEntity.ok(new com.reyval.backend.payload.response.MessageResponse("Usuario creado exitosamente"));
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserDTO request) {
        adminService.updateUser(id, request);
        return ResponseEntity.ok(new com.reyval.backend.payload.response.MessageResponse("Usuario actualizado exitosamente"));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(new com.reyval.backend.payload.response.MessageResponse("Usuario eliminado exitosamente"));
    }

}
