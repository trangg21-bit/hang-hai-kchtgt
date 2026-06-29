package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Ho So Xu Ly Tai San.
 */
@Data
@Builder
public class HoSoXuLyTaiSanResponse {

    private UUID id;
    private UUID taiSanId;
    private String tenTaiSan;
    private String loaiXuLy;
    private String moTa;
    private String trangThaiHoSo;
    private String createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
