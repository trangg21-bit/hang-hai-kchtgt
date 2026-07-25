package com.hanghai.kchtg.cangben.dto.cangcan;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DryPortResponse {
    private UUID id;
    private String dryPortCode;
    private String dryPortName;
    private String province;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal area;
    private BigDecimal teuCapacity;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong operationalStatus;
    private com.hanghai.kchtg.common.entity.ApprovalStatus approvalStatus;
    private UUID orgUnitId;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID mapSymbolId;
    private java.util.UUID spatialId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geometryType;
    private String coordinates;
}
