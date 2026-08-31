package com.hanghai.kchtg.vtssystem.dto;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import lombok.experimental.FieldNameConstants;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class VtsSystemUpdateRequest {
    private String systemName;
    private ApprovalStatus approvalStatus;
    private ConditionStatus conditionStatus;
    private UUID orgUnitId;
    @NotNull(message = "Đơn vị chủ quản không được để trống")
    private UUID owningOrgId;
    private UUID operatingOrgId;
    private UUID portId;
    private List<VtsZoneDto> zones;
    @jakarta.validation.constraints.Size(max = 50, message = "Mã hệ thống VTS tối đa 50 ký tự")
    private String code;
    private Integer provinceId;
    private String address;
    private String maritimeNotice;
    private LocalDate operationStartDate;
    private String scope;
    private String note;

    private GisGeometryType geometryType;
    private String coordinates;

    private List<String> addedAttachmentNames;
    private List<String> removedAttachmentNames;
}
