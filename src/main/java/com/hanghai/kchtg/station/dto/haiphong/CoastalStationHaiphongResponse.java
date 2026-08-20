package com.hanghai.kchtg.station.dto.haiphong;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.station.entity.StationStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CoastalStationHaiphongResponse {

    private UUID id;
    private RecordSecurityLevel securityLevel;
    private String stationCode;
    private String stationName;
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
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
    private StationStatus status;
    private ApprovalStatus approvalStatus;
    private ApprovalLevel approvalLevel;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
