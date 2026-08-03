package com.hanghai.kchtg.port.dto.pier;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.PierType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class UpdatePierRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String pierName;
    private UUID berthId;
    @Positive(message = "Chiều dài phải là số dương")
    @DecimalMax(value = "500.0", message = "Chiều dài không vượt quá 500m")
    private BigDecimal length;

    @Positive(message = "Tải trọng thiết kế phải là số dương")
    @DecimalMax(value = "20.0", message = "Tải trọng thiết kế không vượt quá 20 T/m²")
    private BigDecimal designLoad;
    private PierType pierType;
    private String operationalFunction;
    private OperationalStatus operationalStatus;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID mapSymbolId;
}
