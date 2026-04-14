package com.reyval.backend.services;

import com.reyval.backend.dto.UserDTO;
import com.reyval.backend.entity.ERole;
import com.reyval.backend.entity.Role;
import com.reyval.backend.entity.User;
import com.reyval.backend.repository.RoleRepository;
import com.reyval.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        if (users == null) return List.of();

        return users.stream().map(user -> {
            String roleName = "USER";
            if (user.getRole() != null && user.getRole().getName() != null) {
                roleName = user.getRole().getName().name().replace("ROLE_", "");
            }
            return new UserDTO(user.getId(), user.getUsername(), user.getEmail(), roleName);
        }).collect(Collectors.toList());
        
       }

    @Transactional
    public void createUser(UserDTO request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("El usuario ya existe");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El email ya existe");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Resolve role
        String rName = request.getRole();
        if (rName == null || rName.isEmpty()) rName = "USER";
        ERole roleEnum = ERole.valueOf("ROLE_" + rName.toUpperCase());
        Role role = roleRepository.findByName(roleEnum)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        user.setRole(role);

        userRepository.save(user);
    }

    @Transactional
    public void updateUser(Long id, UserDTO request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Resolve role
        String rName = request.getRole();
        if (rName != null && !rName.isEmpty()) {
            ERole roleEnum = ERole.valueOf("ROLE_" + rName.toUpperCase());
            Role role = roleRepository.findByName(roleEnum)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            user.setRole(role);
        }

        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
