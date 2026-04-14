package com.reyval.backend.entity;

import javax.persistence.*;

@Entity
@Table(name = "fraccionamientos")
public class Fraccionamiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String ubicacion;
    private String descripcion;
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String coordenadasGeo;

    private String imagenPlanoUrl;

    @ElementCollection
    @CollectionTable(name = "fraccionamiento_imagenes", joinColumns = @JoinColumn(name = "fraccionamiento_id"))
    @Column(name = "imagen_url")
    private java.util.List<String> galeriaImagenes = new java.util.ArrayList<>();

    @Lob
    @Column(columnDefinition = "TEXT")
    private String planoSvg; // SVG content of the development floor plan

    @Column(columnDefinition = "TEXT")
    private String poligonoDelimitador; // JSON array of points for the boundary polygon

    public Fraccionamiento() {
    }

    public Fraccionamiento(String nombre, String ubicacion, String descripcion, String logoUrl, String coordenadasGeo) {
        this.nombre = nombre;
        this.ubicacion = ubicacion;
        this.descripcion = descripcion;
        this.logoUrl = logoUrl;
        this.coordenadasGeo = coordenadasGeo;
    }

    public String getCoordenadasGeo() {
        return coordenadasGeo;
    }

    public void setCoordenadasGeo(String coordenadasGeo) {
        this.coordenadasGeo = coordenadasGeo;
    }

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

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getImagenPlanoUrl() {
        return imagenPlanoUrl;
    }

    public void setImagenPlanoUrl(String imagenPlanoUrl) {
        this.imagenPlanoUrl = imagenPlanoUrl;
    }

    public java.util.List<String> getGaleriaImagenes() {
        return galeriaImagenes;
    }

    public void setGaleriaImagenes(java.util.List<String> galeriaImagenes) {
        this.galeriaImagenes = galeriaImagenes;
    }

    public String getPlanoSvg() {
        return planoSvg;
    }

    public void setPlanoSvg(String planoSvg) {
        this.planoSvg = planoSvg;
    }

    public String getPoligonoDelimitador() {
        return poligonoDelimitador;
    }

    public void setPoligonoDelimitador(String poligonoDelimitador) {
        this.poligonoDelimitador = poligonoDelimitador;
    }
}
