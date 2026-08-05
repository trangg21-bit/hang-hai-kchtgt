package com.hanghai.kchtg.vtssystem.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VtsSystemCreateRequest {
    @NotBlank(message = "Tên hệ thống không được để trống")
    private String systemName;

    @NotBlank(message = "Vị trí không được để trống")
    private String location;

    private ConditionStatus conditionStatus;
    private String responsibilityLevel;
    private String source;
    private String partner;
    private UUID orgUnitId;
    private String scope;

    private GisGeometryType geometryType;
    private String coordinates;
}
