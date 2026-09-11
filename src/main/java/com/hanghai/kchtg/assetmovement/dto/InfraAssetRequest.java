package com.hanghai.kchtg.assetmovement.dto;

import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

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
    private UUID parentOrgUnitId;
    private UUID orgUnitId;
    private UUID usingOrgUnitId;
    private UUID berthId;
    private UUID anchorageId;
    private UUID beaconStationId;
    private UUID dikeRevetmentId;
    private UUID buoyId;
    private UUID buoyStationId;
    private UUID navigationChannelId;
    private String barcode;
    private String assetCondition;
    private String usageStatus;
    private String assetGroup;
    private String assetSubgroup;
    private String address;
    private String origin;
    private BigDecimal quantity;
    private String quantityUnit;
    private String model;
    private String serialNumber;
    private String countryOfOrigin;
    private String manufacturer;
    private Integer constructionYear;
    private LocalDate useDate;
    private BigDecimal landArea;
    private BigDecimal floorArea;
    private String assetLocation;
    private String attachmentName;
    private LocalDate declarationDate;
    private BigDecimal depreciationRate;
    private BigDecimal accumulatedDepreciation;
    private String assignmentDecisionNumber;
    private LocalDate depreciationStartDate;
    private Integer depreciationMonths;
    private LocalDate depreciationEndDate;
    private BigDecimal monthlyDepreciation;
    private String disposalMethod;
    private String approvalStatus;
}
