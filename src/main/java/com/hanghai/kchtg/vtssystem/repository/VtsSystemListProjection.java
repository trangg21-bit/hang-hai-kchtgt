package com.hanghai.kchtg.vtssystem.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Database projection for the VTS list. Detail-only collections are not selected.
 */
public interface VtsSystemListProjection {
    UUID getId();

    String getCode();

    String getSystemName();

    String getAddress();

    ConditionStatus getConditionStatus();

    UUID getOrgUnitId();

    ApprovalStatus getApprovalStatus();

    String getRejectionReason();

    UUID getApproverLevel1();

    UUID getCreatedBy();

    LocalDateTime getUpdatedDate();

    UUID getUpdatedBy();

    UUID getOwningOrgId();

    UUID getOperatingOrgId();

    String getOperatingOrgName();

    UUID getPortId();

    Integer getProvinceId();

    LocalDate getOperationStartDate();
}
