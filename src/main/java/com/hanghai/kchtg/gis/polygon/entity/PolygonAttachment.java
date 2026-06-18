package com.hanghai.kchtg.gis.polygon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "polygon_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolygonAttachment extends BaseEntity {

    @Column(name = "object_id", nullable = false)
    private String objectId;

    @jakarta.validation.constraints.NotBlank(message = "Ten file khong duoc de trong")
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(length = 100)
    private String mimeType;
}
