package com.reyval.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

//@Configuration
public class DatabaseConfig {

    @Value("${app.datasource.url}")
    private String dbUrl;

    @Value("${app.datasource.username}")
    private String username;

    @Value("${app.datasource.password}")
    private String password;

    // @Bean
    // @Primary
    public DataSource dataSource() {
        System.out.println("--- DATABASE CONFIGURATION STARTING ---");
        if (dbUrl == null || dbUrl.isEmpty()) {
            System.err.println("ERROR: NEON_DATABASE_URL is NULL or EMPTY!");
            throw new RuntimeException("NEON_DATABASE_URL is not set!");
        }

        System.out.println("--- DB CONFIG START ---");

        String cleanUrl = dbUrl.trim();
        String finalJdbcUrl = "";
        String finalUser = username;
        String finalPass = password;

        try {
            // 0. Detectar H2 explícitamente y usar su driver
            if (cleanUrl.startsWith("jdbc:h2:")) {
                System.out.println("Using H2 Database Fallback");
                return DataSourceBuilder.create()
                        .url(cleanUrl)
                        .driverClassName("org.h2.Driver")
                        .username(finalUser)
                        .password(finalPass)
                        .build();
            }

            // 1. Quitar el prefijo jdbc: si existe para normalizar (Solo para Postgres
            // logic)
            String normalized = cleanUrl;
            if (normalized.startsWith("jdbc:")) {
                normalized = normalized.substring(5);
            }

            // 2. Manejar formato postgresql://user:pass@host/db o postgresql://host/db
            if (normalized.startsWith("postgresql://") || normalized.startsWith("postgres://")) {
                String uriPart = normalized.replaceFirst("postgres(ql)?://", "");

                if (uriPart.contains("@")) {
                    // Extraer credenciales
                    String credentials = uriPart.substring(0, uriPart.indexOf("@"));
                    String remainder = uriPart.substring(uriPart.indexOf("@") + 1);

                    if (credentials.contains(":")) {
                        finalUser = credentials.substring(0, credentials.indexOf(":"));
                        finalPass = credentials.substring(credentials.indexOf(":") + 1);
                    } else {
                        finalUser = credentials;
                    }
                    finalJdbcUrl = "jdbc:postgresql://" + remainder;
                } else {
                    finalJdbcUrl = "jdbc:postgresql://" + uriPart;
                }
            } else {
                // Si no tiene protocolo, asumimos que es el host
                finalJdbcUrl = "jdbc:postgresql://" + normalized;
            }

            // 3. Limpieza final de parámetros molestos de Neon
            if (finalJdbcUrl.contains("?")) {
                String[] parts = finalJdbcUrl.split("\\?");
                String baseUrl = parts[0];
                String query = parts[1];

                // Neon a veces manda channel_binding=require que el driver de Java no entiende
                query = query.replaceAll("channel_binding=[^&]*&?", "");
                if (query.endsWith("&"))
                    query = query.substring(0, query.length() - 1);

                finalJdbcUrl = baseUrl + (query.isEmpty() ? "" : "?" + query);
            }

            System.out.println("JDBC URL cleaned: " + finalJdbcUrl);
            System.out.println("Final User: " + finalUser);

            return DataSourceBuilder.create()
                    .url(finalJdbcUrl)
                    .driverClassName("org.postgresql.Driver")
                    .username(finalUser)
                    .password(finalPass)
                    .build();

        } catch (Exception e) {
            System.err.println("CRITICAL ERROR during DataSource creation: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException(e);
        }
    }
}
