package com.hanghai.kchtg.port.dto.berth;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.BerthType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BerthResponse {
    private UUID id;
    private String berthCode;
    private String berthName;
    private UUID portId;
    private String portName;
    private String waterway;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal length;
    private BigDecimal width;
    private BerthType berthType;
    private BigDecimal channelDepth;
    private String operationalFunction;
    private OperationalStatus operationalStatus;
    private ApprovalStatus approvalStatus;
    private UUID orgUnitId;
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID mapSymbolId;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;

    // ── Extended fields from hh.csdl legacy Qlkc038Dto ────────────────

    private Integer provinceId;
    private String detailedLocation;
    private Integer coordinateSystem;
    private Integer displayRule;
    private String operator;
    private BigDecimal totalArea;
    private BigDecimal designThroughput;
    private BigDecimal currentThroughput;
    private BigDecimal maxVesselSize;
    private BigDecimal plannedThroughput;
    private BigDecimal latestCargoVolume;
    private LocalDateTime openingAnnouncementDate;
    private String openingDecision;
    private String investmentAgreement;
    private Integer structureType;
}
