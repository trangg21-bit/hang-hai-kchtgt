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
import lombok.experimental.FieldNameConstants;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class VtsSystemCreateRequest {
    @NotBlank(message = "Tên hệ thống không được để trống")
    private String systemName;

    private ApprovalStatus approvalStatus;

    @NotNull(message = "Tình trạng không được để trống")
    private ConditionStatus conditionStatus;

    @NotNull(message = "Đơn vị quản lý không được để trống")
    private UUID orgUnitId;
    private String scope;

    @NotNull(message = "Đơn vị chủ quản không được để trống")
    private UUID owningOrgId;

    @NotNull(message = "Đơn vị vận hành không được để trống")
    private UUID operatingOrgId;
    private UUID portId;

    private List<VtsZoneDto> zones;

    @jakarta.validation.constraints.Size(max = 50, message = "Mã hệ thống VTS tối đa 50 ký tự")
    private String code;

    @NotNull(message = "Địa điểm (Tỉnh/TP) không được để trống")
    private Integer provinceId;

    private String address;

    @NotBlank(message = "Thông báo hàng hải không được để trống")
    private String maritimeNotice;

    private LocalDate operationStartDate;

    private String note;

    private GisGeometryType geometryType;
    private String coordinates;
}
