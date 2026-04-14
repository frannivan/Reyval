package com.reyval.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.reyval.backend.entity.ERole;
import com.reyval.backend.entity.Role;
import com.reyval.backend.entity.RolePermission;
import com.reyval.backend.repository.RolePermissionRepository;
import com.reyval.backend.repository.RoleRepository;

@Component
@org.springframework.transaction.annotation.Transactional
public class DataInitializer implements CommandLineRunner {

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    com.reyval.backend.repository.UserRepository userRepository;

    @Autowired
    com.reyval.backend.repository.LoteRepository loteRepository;

    @Autowired
    org.springframework.security.crypto.password.PasswordEncoder encoder;

    @Autowired
    com.reyval.backend.repository.FraccionamientoRepository fraccionamientoRepository;

    @Autowired
    com.reyval.backend.repository.ClienteRepository clienteRepo;

    @Autowired
    com.reyval.backend.repository.ContratoRepository contratoRepo;

    @Autowired
    com.reyval.backend.repository.PagoRepository pagoRepository;

    @Autowired
    RolePermissionRepository rolePermissionRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- STARTING FAIL-SAFE DATA SEEDING (release-1.1) ---");
        
        // 1. Roles seeding
        seedRole(ERole.ROLE_USER);
        seedRole(ERole.ROLE_ADMIN);
        seedRole(ERole.ROLE_VENDEDOR);
        seedRole(ERole.ROLE_RECEPCION);
        seedRole(ERole.ROLE_CONTABILIDAD);
        seedRole(ERole.ROLE_DIRECTIVO);
        seedRole(ERole.ROLE_SOPORTE);

        // 2. Admin User seeding (password: password123)
        if (!userRepository.existsByUsername("admin")) {
            System.out.println("Seeding Admin user...");
            com.reyval.backend.entity.User admin = new com.reyval.backend.entity.User();
            admin.setUsername("admin");
            admin.setEmail("admin@test.com");
            admin.setPassword(encoder.encode("password123"));
            
            Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Error: Role ADMIN not found"));
            admin.setRole(adminRole);
            
            userRepository.save(admin);
            System.out.println("Admin user seeded successfully.");
        } else {
            System.out.println("Admin user already exists.");
        }
        System.out.println("--- FAIL-SAFE DATA SEEDING COMPLETED ---");
        
        // 3. Permissions seeding (Fail-safe)
        if (rolePermissionRepository.count() == 0) {
            System.out.println("Seeding default permissions...");
            seedDefaultPermissions();
        }
    }

    private void seedDefaultPermissions() {
        // This is a minimal set to ensure the UI is functional even if data.sql fails
        String[] adminMenus = {"menu:home", "menu:admin_dashboard", "menu:clientes", "menu:users", "menu:leads", "menu:opportunities", "menu:fraccionamientos", "menu:lotes", "menu:reportes", "menu:carga_datos", "menu:documentacion", "menu:soporte", "menu:permissions", "menu:contratos"};
        for (String m : adminMenus) {
            rolePermissionRepository.save(new RolePermission("ROLE_ADMIN", m, true));
        }
        System.out.println("Default admin permissions seeded.");
    }

    private void seedRole(ERole roleName) {
        if (!roleRepository.findByName(roleName).isPresent()) {
            Role role = new Role();
            role.setName(roleName);
            roleRepository.save(role);
            System.out.println("Role " + roleName + " seeded.");
        }
    }

    private void createLote(String numero, String manzana, Double area, Double precio, String img, String coords,
            com.reyval.backend.entity.Fraccionamiento fraccionamiento) {
        com.reyval.backend.entity.Lote lote = new com.reyval.backend.entity.Lote();
        lote.setNumeroLote(numero);
        lote.setManzana(manzana);
        lote.setAreaMetrosCuadrados(area);
        lote.setPrecioTotal(java.math.BigDecimal.valueOf(precio));
        lote.setCoordenadasGeo(coords);
        lote.setEstatus(com.reyval.backend.entity.EStatusLote.DISPONIBLE);
        lote.setImagenUrl(img);
        lote.setDescripcion(
                "Este lote cuenta con una excelente ubicación dentro del fraccionamiento, ideal para construir la casa de tus sueños. Cuenta con todos los servicios a pie de lote y acceso a las áreas comunes.");
        lote.setFraccionamiento(fraccionamiento);
        // Add implicit gallery
        lote.getGaleriaImagenes().add(img);
        lote.getGaleriaImagenes().add("https://placehold.co/600x400/2ecc71/FFF?text=Area+Verde");
        lote.getGaleriaImagenes().add("https://placehold.co/600x400/e74c3c/FFF?text=Acceso+Principal");
        loteRepository.save(lote);
    }
}
