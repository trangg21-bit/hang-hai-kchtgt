package com.hanghai.kchtg.station.dto.haiphong;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.station.entity.StationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class CoastalStationHaiphongResponse {

    private UUID id;
    private UUID orgUnitId;
    private String orgUnitName;
    private UUID operatingOrgId;
    private String operatingOrgName;
    private Integer provinceId;
    private String provinceName;

    private String code;
    private String stationCode;
    private String name;
    private String stationName;

    private String locationAddress;
    private String conditionStatus;
    private StationStatus status;

    // --- Đặc thù TTXLTT Hà Nội / Hải Phòng ---
    private String portName;
    private String district;
    private String ward;
    private String operationalLicense;
    private String licenseExpiry;
    private String inspectorName;
    private String inspectorPhone;
    private String lastInspectionDate;
    private String nextInspectionDate;
    private String coverageArea;
    private String equipmentType;
    private String communicationFrequency;
    private String servicesProvided;
    private String description;
    private String contactPerson;
    private String contactPhone;

    // --- GIS ---
    private UUID spatialId;
    private String geometryType;
    private String symbol;
    private String coordinateSystem;
    private String displayRule;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String coordinates;

    // --- Phê duyệt & Kiểm toán ---
    private ApprovalStatus approvalStatus;
    private com.hanghai.kchtg.common.enums.ApprovalLevel approvalLevel;
    private LocalDateTime submittedAt;
    private UUID submittedBy;
    private String submittedByName;

    private UUID approverLevel1;
    private String approverLevel1Name;
    private LocalDateTime approvedDateLevel1;

    private UUID approverLevel2;
    private String approverLevel2Name;
    private LocalDateTime approvedDateLevel2;

    private String rejectionReason;

    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;

    private UUID updatedBy;
    private String updatedByName;
    private LocalDateTime updatedAt;
}
