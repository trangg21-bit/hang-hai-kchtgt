package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;

import java.util.UUID;

import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request DTO cho Tai San KCHT (create/update).
 */
@Data
public class InfraAssetRequest {

    private String assetCode;
    private InfraAssetType assetType;
    private UUID assetTypeId;
    private String assetName;
    private String description;
    private BigDecimal value;
    private String status;
    private String location;
    private String technicalSpecs;
    private String fundingSource;
    private BigDecimal originalValue;
}
