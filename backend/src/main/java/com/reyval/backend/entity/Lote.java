package com.reyval.backend.entity;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "lotes")
public class Lote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String numeroLote;

    @Column(nullable = false)
    private String manzana;

    @Column(nullable = false)
    private BigDecimal precioTotal;

    @Column(nullable = false)
    private Double areaMetrosCuadrados;

    // Coordenadas para el mapa (JSON o String simple por ahora)
    @Column(columnDefinition = "TEXT")
    private String coordenadasGeo;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EStatusLote estatus; // DISPONIBLE, APARTADO, VENDIDO

    private String descripcion;

    // Imagen del plano o render
    private String imagenUrl;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(columnDefinition = "TEXT")
    private String planoCoordinates; // JSON Array of points relative to plan image

    // Relaciones
    @ManyToOne
    @JoinColumn(name = "fraccionamiento_id")
    private Fraccionamiento fraccionamiento;

    @ElementCollection
    @CollectionTable(name = "lote_imagenes", joinColumns = @JoinColumn(name = "lote_id"))
    @Column(name = "imagen_url")
    private java.util.List<String> galeriaImagenes = new java.util.ArrayList<>();

    public Lote() {
    }

    public Lote(Long id, String numeroLote, String manzana, BigDecimal precioTotal, Double areaMetrosCuadrados,
            String coordenadasGeo, EStatusLote estatus, String descripcion, String imagenUrl) {
        this.id = id;
        this.numeroLote = numeroLote;
        this.manzana = manzana;
        this.precioTotal = precioTotal;
        this.areaMetrosCuadrados = areaMetrosCuadrados;
        this.coordenadasGeo = coordenadasGeo;
        this.estatus = estatus;
        this.descripcion = descripcion;
        this.imagenUrl = imagenUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumeroLote() {
        return numeroLote;
    }

    public void setNumeroLote(String numeroLote) {
        this.numeroLote = numeroLote;
    }

    public String getManzana() {
        return manzana;
    }

    public void setManzana(String manzana) {
        this.manzana = manzana;
    }

    public BigDecimal getPrecioTotal() {
        return precioTotal;
    }

    public void setPrecioTotal(BigDecimal precioTotal) {
        this.precioTotal = precioTotal;
    }

    public Double getAreaMetrosCuadrados() {
        return areaMetrosCuadrados;
    }

    public void setAreaMetrosCuadrados(Double areaMetrosCuadrados) {
        this.areaMetrosCuadrados = areaMetrosCuadrados;
    }

    public String getCoordenadasGeo() {
        return coordenadasGeo;
    }

    public void setCoordenadasGeo(String coordenadasGeo) {
        this.coordenadasGeo = coordenadasGeo;
    }

    public EStatusLote getEstatus() {
        return estatus;
    }

    public void setEstatus(EStatusLote estatus) {
        this.estatus = estatus;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public String getPlanoCoordinates() {
        return planoCoordinates;
    }

    public void setPlanoCoordinates(String planoCoordinates) {
        this.planoCoordinates = planoCoordinates;
    }

    public Fraccionamiento getFraccionamiento() {
        return fraccionamiento;
    }

    public void setFraccionamiento(Fraccionamiento fraccionamiento) {
        this.fraccionamiento = fraccionamiento;
    }

    public java.util.List<String> getGaleriaImagenes() {
        return galeriaImagenes;
    }

    public void setGaleriaImagenes(java.util.List<String> galeriaImagenes) {
        this.galeriaImagenes = galeriaImagenes;
    }
}
