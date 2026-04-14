package com.reyval.backend.repository;

import com.reyval.backend.entity.RolePermissionDefault;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RolePermissionDefaultRepository extends JpaRepository<RolePermissionDefault, Long> {
    List<RolePermissionDefault> findAll();
    List<RolePermissionDefault> findByRoleName(String roleName);
}
