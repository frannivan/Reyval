package com.reyval.backend.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AppStatusController {

    @GetMapping("/api/welcome")
    public String welcome() {
        return "Reyval Backend is ALIVE on Render/Railway! (Status: OK)";
    }

    @GetMapping("/api/status") // Renamed from 'health' to avoid conflict
    public String status() {
        return "{\"status\":\"UP\", \"source\":\"AppStatusController\"}";
    }

}
