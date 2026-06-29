package com.hanghai.kchtg.vanban.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for TienDoXuLy.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TienDoXuLyResponse {

    private Long id;
    private Long suCoId;
    private LocalDateTime thoiGianCapNhat;
    private String moTaTienDo;
    private String nguoiCapNhat;
}
