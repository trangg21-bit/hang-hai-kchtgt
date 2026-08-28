package com.hanghai.kchtg.port.dto.daittdh;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DaiTtdhResponse {
    private UUID id;
    private RecordSecurityLevel securityLevel;
    private String daiTtdhCode;
    private String daiTtdhName;
    private UUID orgUnitId;
    private String orgUnitName;
    private UUID operatingUnitId;
    private String operatingUnitName;
    private Integer stationLevel;
    private Integer provinceId;
    private String detailedLocation;
    private OperationalStatus operationalStatus;
    private ApprovalStatus approvalStatus;
    private String coverageArea;
    private String servicesProvided;
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
