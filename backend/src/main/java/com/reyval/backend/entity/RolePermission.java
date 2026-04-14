package com.reyval.backend.entity;

import javax.persistence.*;

/**
 * Entity representing a specific permission granted to a role.
 * Maps a permission key (from frontend components/menus) to a system role.
 */
@Entity
@Table(name = "role_permissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"role_name", "permission_key"})
})
public class RolePermission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "role_name", nullable = false)
    private String roleName;

    @Column(name = "permission_key", nullable = false)
    private String permissionKey;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled;

    public RolePermission() {
    }

    public RolePermission(String roleName, String permissionKey, boolean enabled) {
        this.roleName = roleName;
        this.permissionKey = permissionKey;
        this.enabled = enabled;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getPermissionKey() {
        return permissionKey;
    }

    public void setPermissionKey(String permissionKey) {
        this.permissionKey = permissionKey;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
