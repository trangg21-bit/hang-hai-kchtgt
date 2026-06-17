package com.hanghai.kchtg.mapicon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Thu vi?n bi?u tu?ng b?n d? — luu tr? metadata c?a các file bi?u tu?ng
 * (SVG, PNG, GeoServer SLD) du?c upload vào h? th?ng.
 */
@Entity
@Table(name = "symbol_library")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymbolLibrary extends BaseEntity {

    /** Tên hi?n th? c?a symbol (ví d?: "Phao bi?n lo?i A"). */
    @Column(nullable = false, length = 200)
    private String name;

    /** Mă code duy nh?t c?a symbol. */
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Đ?nh d?ng file (SVG, PNG, SLD). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SymbolFormat format;

    /** Tên file g?c (ví d?: buoy-a.svg). */
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /** Kích thu?c file (bytes). */
    @Column(name = "file_size", nullable = false)
    private long fileSize;

    /** Đu?ng d?n luu file trong h? th?ng. */
    @Column(name = "file_path", nullable = false, length = 1024)
    private String filePath;

    /** ID ngu?i upload symbol. */
    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    /** Ngày upload. */
    @Column(name = "uploaded_at", nullable = false)
    private java.time.LocalDateTime uploadedAt;

    /** Mô t? chi ti?t v? symbol. */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Đu?ng d?n SLD trong GeoServer (n?u d?nh d?ng là SLD). */
    @Column(name = "sld_path", length = 500)
    private String sldPath;

    /**
     * Đ?nh d?ng file bi?u tu?ng.
     */
    public enum SymbolFormat {
        SVG,
        PNG,
        SLD
    }
}
