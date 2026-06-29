package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Ke Hoach Kiem Ke.
 */
@Data
@Builder
public class KeHoachKiemKeResponse {

    private UUID id;
    private String tenKeHoach;
    private String moTa;
    private String trangThai;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
