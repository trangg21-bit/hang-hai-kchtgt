package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Luu Phe Duyet.
 */
@Data
@Builder
public class LuuPheDuyetResponse {

    private UUID id;
    private UUID yeuCauId;
    private String loaiYeuCau;
    private String ketQua;
    private String nguoiPheDuyet;
    private String ghiChu;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
