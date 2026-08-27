package com.hanghai.kchtg.port.dto.shiprepairyard;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateShipRepairYardRequest {

    private RecordSecurityLevel securityLevel;

    @Size(max = 50)
    private String shipRepairYardCode;

    @NotBlank(message = "Tên cơ sở sửa chữa, đóng tàu không được để trống")
    @Size(max = 255)
    private String shipRepairYardName;

    @NotNull(message = "Cảng biển chủ không được để trống")
    private UUID portId;

    private UUID pierId;

    private UUID orgUnitId;

    @NotNull(message = "Địa điểm (Tỉnh/Thành phố) không được để trống")
    private Integer provinceId;

    @Size(max = 500)
    @NotBlank(message = "Địa điểm chi tiết không được để trống")
    private String detailedLocation;

    @NotNull(message = "Tình trạng không được để trống")
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

    private String saveAction; // DRAFT, SUBMIT, SAVE_AND_APPROVE
}
