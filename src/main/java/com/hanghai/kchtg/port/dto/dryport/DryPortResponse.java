package com.hanghai.kchtg.port.dto.dryport;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DryPortResponse {
    private UUID id;
    private RecordSecurityLevel securityLevel;
    private String dryPortCode;
    private String dryPortName;
    private Integer provinceId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal area;
    private BigDecimal teuCapacity;
    private OperationalStatus operationalStatus;
    private ApprovalStatus approvalStatus;
    private UUID orgUnitId;
    private String orgUnitName;
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID mapSymbolId;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;

    // ── Extended fields (V113 — from F-026 feature brief) ──────────────
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
