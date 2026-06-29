package com.hanghai.kchtg.vanban.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for updating TienDoXuLy progress.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TienDoXuLyRequest {

    @NotNull(message = "suCoId không được để trống")
    private Long suCoId;

    private LocalDateTime thoiGianCapNhat;
    private String moTaTienDo;

    @NotBlank(message = "Người cập nhật không được để trống")
    private String nguoiCapNhat;
}
