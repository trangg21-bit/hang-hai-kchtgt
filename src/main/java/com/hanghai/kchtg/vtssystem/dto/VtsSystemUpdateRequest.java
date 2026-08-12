package com.hanghai.kchtg.vtssystem.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
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
    private ConditionStatus conditionStatus;
    private String responsibilityLevel;
    private String source;
    private String partner;
    private UUID orgUnitId;
    private UUID owningOrgId;
    private UUID operatingOrgId;
    private UUID portId;
    private List<VtsZoneDto> zones;
    private String code;
    private Integer provinceId;
    private String address;
    private String maritimeNotice;
    private LocalDate operationStartDate;
    private String scope;
    private String note;

    private GisGeometryType geometryType;
    private String coordinates;
}
