package com.reyval.backend.controllers;

import com.reyval.backend.entity.RolePermission;
import com.reyval.backend.repository.RolePermissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Controller for managing role-based permissions in the system.
 * This controller handles the dynamic visibility of sidebar menus and component-level actions.
 * 
 * <p>Frontend Consumers:</p>
 * <ul>
 *   <li>{@link PermissionService} (Angular Service)</li>
 *   <li>{@link PermissionsAdminComponent} (Admin Panel)</li>
 *   <li>{@link SidebarComponent} (Navigation)</li>
 * </ul>
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    @Autowired
    RolePermissionRepository rolePermissionRepository;

    @Autowired
    com.reyval.backend.repository.RolePermissionDefaultRepository rolePermissionDefaultRepository;

    /**
     * Retrieves all role-permission mappings.
     * Used by the Permissions Admin panel to display the management grid.
     * 
     * @return List of all RolePermission entities.
     */
    @GetMapping
    public List<RolePermission> getAllPermissions() {
        return rolePermissionRepository.findAll();
    }

    /**
     * Retrieves permissions for a specific role.
     * 
     * @param roleName The name of the role (e.g., ROLE_VENDEDOR).
     * @return List of permissions associated with the role.
     */
    @GetMapping("/{roleName}")
    public List<RolePermission> getPermissionsByRole(@PathVariable String roleName) {
        return rolePermissionRepository.findByRoleName(roleName);
    }

    /**
     * Updates or creates a single permission record.
     * Triggered when toggling a switch in the Permissions Admin panel.
     * 
     * @param permissionRequest The permission data to save.
     * @return The updated RolePermission entity.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTIVO')")
    public ResponseEntity<?> updatePermission(@RequestBody RolePermission permissionRequest) {
        Optional<RolePermission> existingPermission = rolePermissionRepository
                .findByRoleNameAndPermissionKey(permissionRequest.getRoleName(), permissionRequest.getPermissionKey());

        RolePermission permission;
        if (existingPermission.isPresent()) {
            permission = existingPermission.get();
            permission.setEnabled(permissionRequest.isEnabled());
        } else {
            permission = new RolePermission(
                    permissionRequest.getRoleName(),
                    permissionRequest.getPermissionKey(),
                    permissionRequest.isEnabled()
            );
        }

        rolePermissionRepository.save(permission);
        return ResponseEntity.ok(permission);
    }

    /**
     * Updates multiple permissions in a single request.
     * Useful for performing bulk updates or synchronizing states.
     * 
     * @param permissions List of permissions to update.
     * @return Confirmation message.
     */
    @PostMapping("/batch")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTIVO')")
    public ResponseEntity<?> updatePermissionsBatch(@RequestBody List<RolePermission> permissions) {
        for (RolePermission p : permissions) {
            Optional<RolePermission> existing = rolePermissionRepository
                    .findByRoleNameAndPermissionKey(p.getRoleName(), p.getPermissionKey());
            
            if (existing.isPresent()) {
                RolePermission entity = existing.get();
                entity.setEnabled(p.isEnabled());
                rolePermissionRepository.save(entity);
            } else {
                rolePermissionRepository.save(p);
            }
        }
        return ResponseEntity.ok("Permissions updated successfully");
    }

    /**
     * Resets all permissions to system defaults.
     * Clears the role_permissions table and re-seeds it with the values
     * from the role_permissions_default table.
     * 
     * @return List of permissions created.
     */
    @Transactional
    @PostMapping("/reset")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTIVO')")
    public ResponseEntity<?> resetPermissions() {
        // Clear all current permissions
        rolePermissionRepository.deleteAll();
        rolePermissionRepository.flush(); // Ensure deletion is committed before re-insertion

        // Fetch defaults from the new dedicated table
        List<com.reyval.backend.entity.RolePermissionDefault> defaults = rolePermissionDefaultRepository.findAll();
        
        List<RolePermission> newPermissions = new ArrayList<>();
        for (com.reyval.backend.entity.RolePermissionDefault def : defaults) {
            newPermissions.add(new RolePermission(def.getRoleName(), def.getPermissionKey(), def.isEnabled()));
        }

        rolePermissionRepository.saveAll(newPermissions);
        return ResponseEntity.ok(newPermissions);
    }

    /**
     * Resets permissions for a specific role to system defaults.
     * 
     * @param roleName The name of the role to reset.
     * @return List of permissions created for that role.
     */
    @Transactional
    @PostMapping("/reset/{roleName}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTIVO')")
    public ResponseEntity<?> resetPermissionsByRole(@PathVariable String roleName) {
        // Clear current permissions for this role
        List<RolePermission> existing = rolePermissionRepository.findByRoleName(roleName);
        rolePermissionRepository.deleteAll(existing);
        rolePermissionRepository.flush();

        // Fetch defaults for this specific role
        List<com.reyval.backend.entity.RolePermissionDefault> defaults = rolePermissionDefaultRepository.findByRoleName(roleName);
        
        List<RolePermission> newPermissions = new ArrayList<>();
        for (com.reyval.backend.entity.RolePermissionDefault def : defaults) {
            newPermissions.add(new RolePermission(def.getRoleName(), def.getPermissionKey(), def.isEnabled()));
        }

        rolePermissionRepository.saveAll(newPermissions);
        return ResponseEntity.ok(newPermissions);
    }
}
