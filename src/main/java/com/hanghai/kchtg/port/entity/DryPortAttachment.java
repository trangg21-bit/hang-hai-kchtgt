package com.hanghai.kchtg.port.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity storing file attachments for a DryPort (Cảng cạn).
 * Each dry port can have multiple attachments (files) uploaded by users.
 * <p>
 * Uses its own UUID PK (not BaseEntity) because this is
 * a lightweight child table managed entirely through the parent's cascade.
 * </p>
 */
@Entity
@Table(name = "dry_port_attachments")
@Getter
@Setter
@NoArgsConstructor
public class DryPortAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dry_port_id", nullable = false)
    @JsonIgnore
    private DryPort dryPort;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (uploadedAt == null) uploadedAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }
}
