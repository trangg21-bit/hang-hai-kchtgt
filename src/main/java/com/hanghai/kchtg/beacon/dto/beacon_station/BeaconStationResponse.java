package com.hanghai.kchtg.beacon.dto.beacon_station;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for BeaconStation detail view (F-072).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeaconStationResponse {

    private UUID id;
    private String code;
    private String name;
    private String type;    private Double lightRange;
    private String towerColor;
    private String primaryLightModel;
    private Double area;
    private String location;
    private UUID unitId;
    private String unitName;
    private Integer provinceId;
    private LocalDate lastRepairDate;
    private LocalDate commissionedDate;
    private Boolean isActive;
    private String status;
    private String approvalStatus;
    private ApprovalLevel approvalLevel;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private String rejectionReason;
    private UUID submittedBy;
    private LocalDateTime submittedAt;
    private String submittedByName;
    private UUID approverLevel1;
    private String approverLevel1Name;
    private LocalDateTime approvedDateLevel1;
    private String approvalContentLevel1;
    private UUID approverLevel2;
    private String approverLevel2Name;
    private LocalDateTime approvedDateLevel2;
    private String approvalContentLevel2;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID updatedBy;

    private String shape;
    private String structure;
    private Double towerHeight;
    private Double lightHeight;
    private String geographicRange;
    private String backupLightModel;
    private String powerSupply;
    private Integer staffCount;
    private Double stationArea;

    private UUID seaportId;
    private String operator;
    private String detailedLocation;
    private Integer operationalStatus;
    private String region;
    private String identifyingFeature;
    private String note;
    private String geometryType;
    private UUID mapSymbolId;
    private Integer coordinateSystem;
    private String displayRule;
}
