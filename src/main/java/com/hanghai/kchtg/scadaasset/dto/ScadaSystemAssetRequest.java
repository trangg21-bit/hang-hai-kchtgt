package com.hanghai.kchtg.scadaasset.dto;

import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScadaSystemAssetRequest {
    private String assetCode;

    @NotBlank(message = "Tên tài sản không được để trống")
    private String assetName;

    private UUID parentOrgUnitId;

    @NotNull(message = "Đơn vị quản lý không được để trống")
    private UUID orgUnitId;

    private UUID usingOrgUnitId;
    private UUID scadaId;
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
    private BigDecimal remainingValue;
    private String valueUnit;
    private String assignmentDecisionNumber;
    private LocalDate depreciationStartDate;
    private Integer depreciationMonths;
    private LocalDate depreciationEndDate;
    private BigDecimal accumulatedDepreciation;
    private BigDecimal monthlyDepreciation;
    private String disposalMethod;
    private AssetStatus status;
    private ApprovalStatus approvalStatus;
    private String portAuthorityApprovalContent;
    private String departmentApprovalContent;
    private String rejectionReason;
}
