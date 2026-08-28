package com.hanghai.kchtg.port.dto.daittdh;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateDaiTtdhRequest {

    private RecordSecurityLevel securityLevel;

    @Size(max = 50)
    private String daiTtdhCode;

    @NotBlank(message = "Tên đài không được để trống")
    @Size(max = 255)
    private String daiTtdhName;

    @NotNull(message = "Đơn vị quản lý không được để trống")
    private UUID orgUnitId;

    private UUID operatingUnitId;

    @NotNull(message = "Phân loại đài không được để trống")
    private Integer stationLevel;

    @NotNull(message = "Địa điểm (Tỉnh/Thành phố) không được để trống")
    private Integer provinceId;

    @NotBlank(message = "Địa điểm chi tiết không được để trống")
    @Size(max = 500)
    private String detailedLocation;

    @NotNull(message = "Tình trạng không được để trống")
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

    private String saveAction; // DRAFT, SUBMIT, SAVE_AND_APPROVE
}
