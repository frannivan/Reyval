package com.reyval.backend.dto;

import com.reyval.backend.entity.ELeadStatus;
import java.time.LocalDateTime;

public class LeadDTO {
    private Long id;
    private String nombre;
    private String email;
    private String telefono;
    private String mensaje;
    private String source;
    private ELeadStatus status;
    private LocalDateTime fechaRegistro;

    public LeadDTO() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public ELeadStatus getStatus() {
        return status;
    }

    public void setStatus(ELeadStatus status) {
        this.status = status;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
}
