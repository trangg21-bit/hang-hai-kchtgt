package com.hanghai.kchtg.cangben.dto.bencang;

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
    private com.hanghai.kchtg.cangben.entity.LoaiBen berthType;
    private BigDecimal channelDepth;
    private String operationalFunction;
    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong operationalStatus;
    private com.hanghai.kchtg.common.entity.TrangThaiPheDuyet approvalStatus;
    private UUID orgUnitId;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID mapSymbolId;
    private java.util.UUID spatialId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geometryType;
    private String coordinates;

    // ── Extended fields from hh.csdl legacy Qlkc038Dto ────────────────

    private String locationCode;
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
