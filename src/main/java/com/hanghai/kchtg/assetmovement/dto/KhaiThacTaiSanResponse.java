package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Khai Thac Tai San.
 */
@Data
@Builder
public class KhaiThacTaiSanResponse {

    private UUID id;
    private UUID taiSanId;
    private String tenTaiSan;
    private Integer namKhaiThac;
    private BigDecimal doanhThu;
    private BigDecimal haoMon;
    private String moTa;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
