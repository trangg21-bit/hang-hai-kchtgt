package com.hanghai.kchtg.port.dto.document;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Yêu cầu tạo mới giấy tờ / tài liệu đính kèm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDocumentRequest {

    @NotBlank(message = "entityType không được để trống")
    private String entityType;

    @NotBlank(message = "entityId không được để trống")
    private String entityId;

    @NotBlank(message = "uploadedBy không được để trống")
    private String uploadedBy;
}
