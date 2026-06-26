package com.hanghai.kchtg.gis.point.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "point_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointAttachment extends BaseEntity {

    public enum FileType {
        PDF, DOC, DOCX, JPG, PNG
    }

    @Column(name = "object_id", nullable = false)
    private String objectId;

    @NotBlank(message = "Tên file không được để trống")
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(length = 100)
    private String mimeType;
}
