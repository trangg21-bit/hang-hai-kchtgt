package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Bao Cao Kiem Ke.
 */
@Data
@Builder
public class InventoryReportResponse {

    private UUID id;
    private UUID planId;
    private String tenBaoCao;
    private int tongSoLuong;
    private int soLuongChenhLech;
    private String result;
    private String description;
    private String createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
