package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Bao Cao Kiem Ke.
 */
@Data
@Builder
public class BaoCaoKiemKeResponse {

    private UUID id;
    private UUID keHoachId;
    private String tenBaoCao;
    private int tongSoLuong;
    private int soLuongChenhLech;
    private String ketQua;
    private String moTa;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
