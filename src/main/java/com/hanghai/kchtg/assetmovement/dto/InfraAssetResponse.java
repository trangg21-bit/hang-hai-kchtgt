package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response DTO cho Tai San KCHT.
 */
@Data
@Builder
public class InfraAssetResponse {

    private UUID id;
    private String assetCode;
    private UUID loaiTaiSanId;
    private String assetType;
    private String assetName;
    private String description;
    private BigDecimal giaTri;
    private String status;
    private String location;
    private String technicalSpecs;
    private String fundingSource;
    private BigDecimal originalValue;
    private BigDecimal accumulatedDepreciation;
    private BigDecimal remainingValue;
    private String createdBy;
    private String createdByName;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}
