package com.hanghai.kchtg.port.dto.daittdh;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateDaiTtdhRequest {

    // private RecordSecurityLevel securityLevel;

    @NotNull(message = "ID không được để trống")
    private UUID id;

    @Size(max = 255)
    private String daiTtdhName;

    private UUID orgUnitId;

    private UUID operatingUnitId;

    private Integer stationLevel;

    private Integer provinceId;

    @Size(max = 500)
    private String detailedLocation;

    private OperationalStatus operationalStatus;

    private String coverageArea;

    @Size(max = 500)
    private String servicesProvided;

    @Size(max = 2000)
    private String remarks;

    // ── GIS fields ─────────────────────────────────────────────────────
    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
    private Integer coordinateSystem;
    private Integer displayRule;

    private String saveAction;
}
