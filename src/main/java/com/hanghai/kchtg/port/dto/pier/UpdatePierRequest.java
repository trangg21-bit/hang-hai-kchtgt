package com.hanghai.kchtg.port.dto.pier;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.PierType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class UpdatePierRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String pierName;
    private UUID berthId;
    private BigDecimal length;
    private BigDecimal designLoad;
    private PierType pierType;
    private String operationalFunction;
    private OperationalStatus operationalStatus;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID mapSymbolId;
}
