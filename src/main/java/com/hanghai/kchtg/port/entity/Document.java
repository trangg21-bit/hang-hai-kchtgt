package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Entity representing attached documents / files (Giấy tờ / tài liệu đính kèm).
 * Stores metadata of attached files for all entity types in the CangBen module.
 * <p>
 * Corresponds to table: documents (renamed from giay_to).
 * Uses BaseEntity for UUID PK, soft-delete, and JPA auditing.
 * </p>
 *
 * Entity types supported: ports, berths, piers, dry-ports, water-zones
 */
import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.Builder;
import lombok.experimental.FieldNameConstants;

@Entity
@Table(name = "documents",
        indexes = {
            @Index(name = "idx_documents_entity", columnList = "entity_type, entity_id"),
            @Index(name = "idx_documents_uploaded_by", columnList = "uploaded_by")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class Document extends BaseEntity {

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    /**
     * Entity type that this document is attached to.
     * Allowed values: ports, berths, piers, dry-ports, water-zones
     */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /**
     * ID of the parent entity (UUID as string for flexibility).
     */
    @Column(name = "entity_id", nullable = false, length = 36)
    private String entityId;

    /**
     * Original file name (as uploaded by user).
     */
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /**
     * File size (bytes).
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * MIME type (e.g. application/pdf, image/jpeg).
     */
    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    /**
     * MinIO storage key.
     * Format: {entityType}/{entityId}/{timestamp}_{originalFilename}
     */
    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    /**
     * ID of the user who uploaded the file.
     */
    @Column(name = "uploaded_by", nullable = false, length = 36)
    private String uploadedBy;
}
