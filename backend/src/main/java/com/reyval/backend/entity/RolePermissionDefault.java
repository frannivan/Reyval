package com.reyval.backend.entity;

import javax.persistence.*;

/**
 * Entity representing the system's default permissions.
 * Used as a reference to restore permissions to their "factory" state.
 */
@Entity
@Table(name = "role_permissions_default", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"role_name", "permission_key"})
})
public class RolePermissionDefault {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "role_name", nullable = false)
    private String roleName;

    @Column(name = "permission_key", nullable = false)
    private String permissionKey;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled;

    public RolePermissionDefault() {
    }

    public RolePermissionDefault(String roleName, String permissionKey, boolean enabled) {
        this.roleName = roleName;
        this.permissionKey = permissionKey;
        this.enabled = enabled;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
    public String getPermissionKey() { return permissionKey; }
    public void setPermissionKey(String permissionKey) { this.permissionKey = permissionKey; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
