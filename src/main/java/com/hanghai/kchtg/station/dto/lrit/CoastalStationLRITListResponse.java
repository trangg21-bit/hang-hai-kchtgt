package com.hanghai.kchtg.station.dto.lrit;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Payload tối thiểu cho bảng danh sách LRIT.
 * Dữ liệu chi tiết được tải riêng qua GET /{id} khi mở drawer.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoastalStationLRITListResponse {

    private UUID id;
    private String code;
    private String name;

    private UUID orgUnitId;
    private String orgUnitName;
    private UUID operatingOrgId;
    private String operatingOrgName;
    private Integer provinceId;
    private String provinceName;

    private ConditionStatus conditionStatus;
    private ApprovalStatus approvalStatus;
    private String rejectionReason;

    private UUID approverLevel1;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private String updatedByName;
    private LocalDateTime updatedAt;
}
