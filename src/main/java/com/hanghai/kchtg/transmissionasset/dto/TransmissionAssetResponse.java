package com.hanghai.kchtg.transmissionasset.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TransmissionAssetResponse {
    private UUID id;
    private String assetCode;
    private String assetName;
    private UUID parentOrgUnitId;
    private UUID orgUnitId;
    private UUID usingOrgUnitId;
    private UUID transmissionId;
    private String transmissionCode;
    private String transmissionName;
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
    private String assignmentDecisionNumber;
    private LocalDate depreciationStartDate;
    private Integer depreciationMonths;
    private LocalDate depreciationEndDate;
    private BigDecimal monthlyDepreciation;
    private String disposalMethod;
    private String status;
    private String approvalStatus;
    private UUID submittedBy;
    private String submittedByName;
    private Instant submittedAt;
    private UUID portAuthorityApprovedBy;
    private String portAuthorityApprovedByName;
    private Instant portAuthorityApprovedAt;
    private String portAuthorityApprovalContent;
    private UUID departmentApprovedBy;
    private String departmentApprovedByName;
    private Instant departmentApprovedAt;
    private String departmentApprovalContent;
    private String rejectionReason;
    private UUID updatedBy;
    private String updatedByName;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
