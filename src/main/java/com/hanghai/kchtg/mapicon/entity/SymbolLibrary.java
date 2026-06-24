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
 * Thư viện biểu tượng bản đồ - lưu trữ metadata của các file biểu tượng
 * (SVG, PNG, GeoServer SLD) được upload vào hệ thống.
 */
@Entity
@Table(name = "symbol_library")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymbolLibrary extends BaseEntity {

    /** Tên hiển thị của symbol (ví dụ: "Phao biển loại A"). */
    @Column(nullable = false, length = 200)
    private String name;

    /** Mã code duy nhất của symbol. */
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Định dạng file (SVG, PNG, SLD). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SymbolFormat format;

    /** Tên file gốc (ví dụ: buoy-a.svg). */
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /** Kích thước file (bytes). */
    @Column(name = "file_size", nullable = false)
    private long fileSize;

    /** Đường dẫn lưu file trong hệ thống. */
    @Column(name = "file_path", nullable = false, length = 1024)
    private String filePath;

    /** ID người upload symbol. */
    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    /** Ngày upload. */
    @Column(name = "uploaded_at", nullable = false)
    private java.time.LocalDateTime uploadedAt;

    /** Mô tả chi tiết vỏ symbol. */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Đường dẫn SLD trong GeoServer (nếu đểnh đểng là SLD). */
    @Column(name = "sld_path", length = 500)
    private String sldPath;

    /**
     * Định dạng file biểu tượng.
     */
    public enum SymbolFormat {
        SVG,
        PNG,
        SLD
    }
}