package com.hanghai.kchtg.port.dto.pier;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.PierType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreatePierRequest {

    @NotBlank(message = "Mã cầu không được để trống")
    @Size(max = 50)
    private String pierCode;

    @NotBlank(message = "Tên cầu không được để trống")
    @Size(max = 255)
    private String pierName;

    @NotNull(message = "Bến cảng chủ không được để trống")
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
