package com.hanghai.kchtg.cangben.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Entity đại diện cho Giấy tờ / tài liệu đính kèm (GiayTo).
 * Lưu trữ metadata của file đính kèm cho mọi entity loại trong module CangBen.
 * <p>
 * Corresponds to table: giay_to (Flyway migration).
 * Uses BaseEntity for UUID PK, soft-delete, and JPA auditing.
 * </p>
 *
 * Entity types supported: cang-bien, ben-cang, cau-cang, cang-can, vung-nuoc
 */
@Entity
@Table(name = "giay_to",
        indexes = {
            @Index(name = "idx_giay_to_entity", columnList = "entity_type, entity_id"),
            @Index(name = "idx_giay_to_uploaded_by", columnList = "uploaded_by")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class GiayTo extends BaseEntity {

    /**
     * Loại entity mà giấy tờ này đính kèm.
     * Allowed values: cang-bien, ben-cang, cau-cang, cang-can, vung-nuoc
     */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /**
     * ID của entity mẹ (UUID as string for flexibility).
     */
    @Column(name = "entity_id", nullable = false, length = 36)
    private String entityId;

    /**
     * Tên file gốc (do người dùng upload).
     */
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /**
     * Kích thước file (bytes).
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * MIME type của file (vd: application/pdf, image/jpeg).
     */
    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    /**
     * Key của file trên MinIO storage.
     * Format: {entityType}/{entityId}/{timestamp}_{originalFilename}
     */
    @Column(name = "minio_key", nullable = false, length = 500)
    private String minioKey;

    /**
     * ID người upload file.
     */
    @Column(name = "uploaded_by", nullable = false, length = 36)
    private String uploadedBy;
}
