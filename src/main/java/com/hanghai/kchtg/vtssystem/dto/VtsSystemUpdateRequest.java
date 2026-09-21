package com.hanghai.kchtg.vtssystem.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
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
    @JsonIgnore
    private boolean operatingOrgIdPresent;
    private UUID portId;
    @JsonIgnore
    private boolean portIdPresent;
    private List<VtsZoneDto> zones;
    @jakarta.validation.constraints.Size(max = 50, message = "Mã hệ thống VTS tối đa 50 ký tự")
    private String code;
    private Integer provinceId;
    @JsonIgnore
    private boolean provinceIdPresent;
    private String address;
    @JsonIgnore
    private boolean addressPresent;
    private String maritimeNotice;
    @JsonIgnore
    private boolean maritimeNoticePresent;
    private LocalDate operationStartDate;
    @JsonIgnore
    private boolean operationStartDatePresent;
    private String scope;
    @JsonIgnore
    private boolean scopePresent;
    private String note;
    @JsonIgnore
    private boolean notePresent;

    private GisGeometryType geometryType;
    private String coordinates;

    private List<String> addedAttachmentNames;
    private List<String> removedAttachmentNames;

    public void setPortId(UUID portId) {
        this.portId = portId;
        this.portIdPresent = true;
    }

    public void setOperatingOrgId(UUID operatingOrgId) {
        this.operatingOrgId = operatingOrgId;
        this.operatingOrgIdPresent = true;
    }

    public void setProvinceId(Integer provinceId) {
        this.provinceId = provinceId;
        this.provinceIdPresent = true;
    }

    public void setAddress(String address) {
        this.address = address;
        this.addressPresent = true;
    }

    public void setMaritimeNotice(String maritimeNotice) {
        this.maritimeNotice = maritimeNotice;
        this.maritimeNoticePresent = true;
    }

    public void setOperationStartDate(LocalDate operationStartDate) {
        this.operationStartDate = operationStartDate;
        this.operationStartDatePresent = true;
    }

    public void setScope(String scope) {
        this.scope = scope;
        this.scopePresent = true;
    }

    public void setNote(String note) {
        this.note = note;
        this.notePresent = true;
    }
}
