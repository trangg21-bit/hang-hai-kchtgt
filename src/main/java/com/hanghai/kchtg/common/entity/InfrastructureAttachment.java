package com.hanghai.kchtg.common.entity;

import com.hanghai.kchtg.common.enums.AttachmentFileType;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "infrastructure_attachments", indexes = {
        @Index(name = "idx_infra_attachment_ref", columnList = "ref_type, ref_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InfrastructureAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ref_id", nullable = false)
    private UUID refId;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "ref_type", nullable = false, columnDefinition = "SMALLINT")
    private InfrastructureType refType;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "file_type", columnDefinition = "SMALLINT")
    private AttachmentFileType fileType;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @CreatedDate
    @Column(name = "uploaded_date", nullable = false, updatable = false)
    private LocalDateTime uploadedDate;
}
