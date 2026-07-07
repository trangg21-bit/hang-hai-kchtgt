package com.hanghai.kchtg.cangben.dto.giayto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Yêu cầu tạo mới giấy tờ / tài liệu đính kèm.
 *
 * @param entityType loại entity (cang-bien, ben-cang, cau-cang, cang-can, vung-nuoc)
 * @param entityId   ID của entity cần đính kèm
 * @param uploadedBy ID người upload
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGiayToRequest {

    /**
     * Loại entity mà giấy tờ này đính kèm.
     * Allowed: cang-bien, ben-cang, cau-cang, cang-can, vung-nuoc
     */
    @NotBlank(message = "entityType không được để trống")
    private String entityType;

    /**
     * ID của entity mẹ.
     */
    @NotBlank(message = "entityId không được để trống")
    private String entityId;

    /**
     * ID người upload file.
     */
    @NotBlank(message = "uploadedBy không được để trống")
    private String uploadedBy;
}
