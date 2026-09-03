package com.hanghai.kchtg.vtssystem.dto;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lightweight representation used by the VTS list endpoint.
 * Detail-only collections and spatial data are deliberately excluded.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VtsSystemListItemResponse {
    private UUID id;
    private String code;
    private String systemName;
    private String address;
    private ConditionStatus conditionStatus;
    private UUID orgUnitId;
    private String orgUnitName;
    private ApprovalStatus approvalStatus;
    private String rejectionReason;

    private UUID approverLevel1;
    private UUID createdBy;
    private String createdByName;

    private LocalDateTime updatedDate;
    private String updatedByName;

    private UUID owningOrgId;
    private String owningOrgName;
    private UUID operatingOrgId;
    private String operatingOrgName;
    private UUID portId;
    private String portName;
    private Integer provinceId;
    private LocalDate operationStartDate;
}
