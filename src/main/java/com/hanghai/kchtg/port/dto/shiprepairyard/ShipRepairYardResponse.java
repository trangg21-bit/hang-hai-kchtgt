package com.hanghai.kchtg.port.dto.shiprepairyard;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ShipRepairYardResponse {
    private UUID id;
    // private RecordSecurityLevel securityLevel;
    private String shipRepairYardCode;
    private String shipRepairYardName;
    private UUID portId;
    private String portName;
    private UUID pierId;
    private String pierName;
    private UUID orgUnitId;
    private String orgUnitName;
    private Integer provinceId;
    private String detailedLocation;
    private OperationalStatus operationalStatus;
    private ApprovalStatus approvalStatus;

    // ── Thông tin đặc thù CSSCĐT ───────────────────────────────────────
    private String usageFunction;
    private BigDecimal workshopArea;
    private String vesselType;
    private String vesselDwt;
    private String businessType;
    private String activity;
    private Integer slipwayCount;
    private String remarks;

    // ── GIS fields ─────────────────────────────────────────────────────
    private UUID mapSymbolId;
    private Integer coordinateSystem;
    private Integer displayRule;
    private GisGeometryType geometryType;
    private String coordinates;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private UUID spatialId;

    // ── Two-level approval tracking fields ─────────────────────────────
    private LocalDateTime submittedForApprovalAt;
    private String submittedForApprovalBy;
    private LocalDateTime portAuthorityApprovedAt;
    private String portAuthorityApprovedBy;
    private LocalDateTime departmentApprovedAt;
    private String departmentApprovedBy;
    private String portAuthorityApprovalContent;
    private String departmentApprovalContent;
    private String rejectionReason;

    // ── Audit fields ───────────────────────────────────────────────────
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
