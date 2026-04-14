package com.reyval.backend.repository;

import com.reyval.backend.entity.Role;
import com.reyval.backend.entity.ERole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(ERole name);
}
