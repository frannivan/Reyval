package com.reyval.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leads")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Lead {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String email;
    private String telefono;

    @Column(columnDefinition = "TEXT")
    private String mensaje;

    private String source; // e.g., 'WEB', 'CHATBOT'
    private String interes; // e.g., 'COTIZACION', 'REPRESENTANTE'

    @Enumerated(EnumType.STRING)
    private ELeadStatus status = ELeadStatus.NEW;

    private LocalDateTime fechaRegistro = LocalDateTime.now();

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

    public String getInteres() {
        return interes;
    }

    public void setInteres(String interes) {
        this.interes = interes;
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
