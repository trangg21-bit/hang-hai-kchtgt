package com.hanghai.kchtg.port.dto.dryport;

import java.util.UUID;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;

@Data
public class UpdateDryPortRequest {

    private RecordSecurityLevel securityLevel;

    @NotNull(message = "ID không được để trống")
    private UUID id;

    /**
     * Action: submit (Gửi phê duyệt), approve (Lưu và phê duyệt).
     * Null = regular update, keeps current status.
     */
    private String saveAction;

    private String dryPortName;
    private Integer provinceId;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal longitude;

    private BigDecimal area;

    private BigDecimal teuCapacity;
    private com.hanghai.kchtg.common.entity.OperationalStatus operationalStatus;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;

    // ── Extended fields (V113 — from F-026 feature brief) ──────────────
    private UUID orgUnitId;
    private String operatingUnit;
    private String region;
    private String detailedLocation;
    private String transportCorridor;
    private BigDecimal warehouseArea;
    private BigDecimal yardArea;
    private String connectionMode;
    private Integer portStatus;
    private String remarks;
    private LocalDateTime announcementTime;
    private String announcementDecisionNumber;
    private LocalDate announcementDecisionDate;
    private String announcementOrg;
    private Integer coordinateSystem;
    private Integer displayRule;
}
