package com.hanghai.kchtg.port.dto.shiprepairyard;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class UpdateShipRepairYardRequest {

    // private RecordSecurityLevel securityLevel;

    @NotNull(message = "ID không được để trống")
    private UUID id;

    @Size(max = 255)
    private String shipRepairYardName;

    private UUID portId;

    private UUID pierId;

    private UUID orgUnitId;

    private Integer provinceId;

    @Size(max = 500)
    private String detailedLocation;

    private OperationalStatus operationalStatus;

    // ── Thông tin đặc thù CSSCĐT ───────────────────────────────────────

    @Size(max = 255)
    private String usageFunction;

    @DecimalMin("0")
    private BigDecimal workshopArea;

    @Size(max = 255)
    private String vesselType;

    @Size(max = 100)
    private String vesselDwt;

    @Size(max = 255)
    private String businessType;

    @Size(max = 255)
    private String activity;

    private Integer slipwayCount;

    private String remarks;

    // ── GIS fields ─────────────────────────────────────────────────────
    private BigDecimal latitude;
    private BigDecimal longitude;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
    private Integer coordinateSystem;
    private Integer displayRule;

    private String saveAction;
}
