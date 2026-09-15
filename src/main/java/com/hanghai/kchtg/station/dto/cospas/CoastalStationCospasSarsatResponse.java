package com.hanghai.kchtg.station.dto.cospas;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class CoastalStationCospasSarsatResponse {

    private UUID id;
    private String code;
    private String stationCode;
    private String name;
    private String stationName;

    private UUID orgUnitId;
    private UUID unitId;
    private String orgUnitName;

    private UUID operatingOrgId;
    private String operatingOrgName;

    private UUID owningOrgId;
    private String owningOrgName;

    private Integer provinceId;
    private String provinceName;

    private ConditionStatus conditionStatus;
    private String conditionStatusLabel;

    private String frequency;
    private String coverageArea;
    private String beaconProtocol;
    private String emergencyChannel;
    private String antennaType;
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
    private Double signalRange;
    private String operatingMode;

    private String description;
    private String note;

    private UUID spatialId;
    private UUID symbolId;
    private String symbolName;
    private String coordinateReferenceSystem;

    private StationStatus status;
    private ApprovalStatus approvalStatus;
    private String approvalStatusLabel;
    private ApprovalLevel approvalLevel;

    private UUID approvedBy;
    private String approvedByName;
    private LocalDateTime approvedDate;

    private LocalDateTime submittedAt;
    private UUID submittedBy;
    private String submittedByName;

    private UUID approverLevel1;
    private String approverLevel1Name;
    private LocalDateTime approvedDateLevel1;
    private String level1ApprovalContent;

    private UUID approverLevel2;
    private String approverLevel2Name;
    private LocalDateTime approvedDateLevel2;
    private String level2ApprovalContent;

    private String rejectionReason;

    private LocalDateTime createdAt;
    private UUID createdBy;
    private String createdByName;

    private LocalDateTime updatedAt;
    private UUID updatedBy;
    private String updatedByName;

    private LocalDateTime deletedAt;
    private UUID deletedBy;

    // Helper getters for compatibility
    public String getStationCode() {
        return stationCode != null ? stationCode : code;
    }

    public String getStationName() {
        return stationName != null ? stationName : name;
    }

    public String getCode() {
        return code != null ? code : stationCode;
    }

    public String getName() {
        return name != null ? name : stationName;
    }

    public UUID getUnitId() {
        return unitId != null ? unitId : orgUnitId;
    }

    public UUID getOrgUnitId() {
        return orgUnitId != null ? orgUnitId : unitId;
    }

    public String getDescription() {
        return description != null ? description : note;
    }

    public String getNote() {
        return note != null ? note : description;
    }
}
