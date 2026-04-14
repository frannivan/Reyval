package com.reyval.backend;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenPassTest {
    @Test
    public void generate() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("HASH_e74c:" + encoder.encode("password"));
    }
}
