package com.hanghai.kchtg.vtssystem.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Database projection for the VTS list. Detail-only columns are not selected.
 */
public interface VtsSystemListProjection {
    UUID getId();
    String getCode();
    String getSystemName();
    String getAddress();
    ConditionStatus getConditionStatus();
    String getResponsibilityLevel();
    String getPartner();
    UUID getOrgUnitId();
    ApprovalStatus getApprovalStatus();
    UUID getApproverLevel1();
    LocalDateTime getUpdatedDate();
}
