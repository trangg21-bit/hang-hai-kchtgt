package com.hanghai.kchtg.port.dto.waterzone;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.WaterZoneType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateWaterZoneRequest {

    @NotBlank(message = "Mã vùng nước không được để trống")
    @Size(max = 50)
    private String waterZoneCode;

    @NotBlank(message = "Tên vùng nước không được để trống")
    @Size(max = 255)
    private String waterZoneName;

    @NotNull(message = "Cảng biển chủ không được để trống")
    private UUID portId;

    private BigDecimal area;
    private BigDecimal maxDepth;
    private BigDecimal avgDepth;
    private WaterZoneType waterZoneType;
    private OperationalStatus operationalStatus;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
}
