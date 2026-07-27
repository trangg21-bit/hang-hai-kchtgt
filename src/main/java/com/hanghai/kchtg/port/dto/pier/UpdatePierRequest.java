package com.hanghai.kchtg.port.dto.pier;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
public class UpdatePierRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String pierName;
    private UUID berthId;
    private BigDecimal length;
    private BigDecimal designLoad;
    private com.hanghai.kchtg.port.entity.PierType pierType;
    private String operationalFunction;
    private com.hanghai.kchtg.common.entity.OperationalStatus operationalStatus;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID mapSymbolId;
}
