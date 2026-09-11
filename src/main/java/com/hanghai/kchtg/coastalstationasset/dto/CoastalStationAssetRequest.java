package com.hanghai.kchtg.coastalstationasset.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CoastalStationAssetRequest {
    private String assetCode;
    private String assetName;
    private UUID parentOrgUnitId;
    private UUID orgUnitId;
    private UUID usingOrgUnitId;
    private UUID stationId;
    private UUID daiTtdhId;
    private UUID inmarsatId;
    private String assetType;
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
    private BigDecimal originalValue;
    private BigDecimal depreciationRate;
    private BigDecimal accumulatedDepreciation;
    private BigDecimal remainingValue;
    private String currency;
    private String assignmentDecisionNumber;
    private LocalDate depreciationStartDate;
    private Integer depreciationMonths;
    private LocalDate depreciationEndDate;
    private BigDecimal monthlyDepreciation;
    private String disposalMethod;
    private String status;
    private String approvalStatus;
    private String portAuthorityApprovalContent;
    private String departmentApprovalContent;
    private String rejectionReason;
}
