package com.reyval.backend.entity;

import com.reyval.backend.repository.RoleRepository;
import com.reyval.backend.util.BeanUtil;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.persistence.PrePersist;
import java.util.Collections;
import java.util.HashSet;

public class ClienteListener {

    @PrePersist
    public void prePersist(Cliente cliente) {
        System.out.println("DEBUG: ClienteListener triggered for email: " + cliente.getEmail());
        if (cliente.getUser() == null) {
            // Automated creation "Trigger"
            PasswordEncoder encoder = BeanUtil.getBean(PasswordEncoder.class);
            RoleRepository roleRepository = BeanUtil.getBean(RoleRepository.class);

            User user = new User();
            user.setUsername(cliente.getEmail());
            user.setEmail(cliente.getEmail());
            
            // Password logic: Strictly use Telephone as requested
            String rawPassword = cliente.getTelefono();
            
            // Basic validation for headless creation (fallback case)
            if (rawPassword == null || rawPassword.isEmpty()) {
                rawPassword = (cliente.getIne() != null && !cliente.getIne().isEmpty()) 
                        ? cliente.getIne() : "Reyval123";
            }
            
            user.setPassword(encoder.encode(rawPassword));

            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: Role no encontrado."));
            user.setRole(userRole);

            cliente.setUser(user);
        }
    }
}
