package com.hanghai.kchtg.cangben.dto.cangbien;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for CangBien entity.
 */
@Data
@Builder
public class CangBienResponse {

    private UUID id;
    private String maCang;
    private String tenCang;
    private String tinhThanhPho;
    private BigDecimal viDo;
    private BigDecimal kinhDo;
    private BigDecimal dienTich;
    private BigDecimal khaNangTiepNhan;
    private String trangThaiHoatDong;
    private String trangThaiPheDuyet;
    private UUID orgUnitId;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
