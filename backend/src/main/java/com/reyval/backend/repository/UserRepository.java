package com.reyval.backend.repository;

import com.reyval.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List; // Added this import

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    List<User> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end); // Added this method
}
