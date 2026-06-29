package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Yeu Cau Bien Dong.
 */
@Data
@Builder
public class YeuCauBienDongResponse {

    private UUID id;
    private UUID taiSanId;
    private String loaiBienDong;
    private String tenTaiSan;
    private int soLuong;
    private String trangThai;
    private String moTa;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
