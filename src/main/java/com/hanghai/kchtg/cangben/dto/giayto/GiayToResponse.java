package com.hanghai.kchtg.cangben.dto.giayto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response trả về thông tin giấy tờ / tài liệu đính kèm.
 *
 * @param id        UUID của bản ghi
 * @param entityType loại entity (cang-bien, ben-cang, cau-cang, cang-can, vung-nuoc)
 * @param entityId  ID của entity mẹ
 * @param fileName  Tên file gốc
 * @param fileSize  Kích thước file (bytes)
 * @param mimeType  MIME type (application/pdf, image/jpeg, ...)
 * @param minioKey  Key của file trên MinIO storage
 * @param uploadedBy ID người upload
 * @param createdAt Thời gian tạo
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiayToResponse {

    private UUID id;

    private String entityType;

    private String entityId;

    private String fileName;

    private Long fileSize;

    private String mimeType;

    private String minioKey;

    private String uploadedBy;

    private LocalDateTime createdAt;
}
