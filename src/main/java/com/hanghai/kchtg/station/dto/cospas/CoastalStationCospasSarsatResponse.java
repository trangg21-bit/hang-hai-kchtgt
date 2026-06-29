package com.hanghai.kchtg.station.dto.cospas;
import lombok.*;

import com.hanghai.kchtg.station.entity.StationApprovalStatus;
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
public class CoastalStationCospasSarsatResponse {

    private UUID id;
    private String stationCode;
    private String stationName;
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
    private StationStatus status;
    private StationApprovalStatus approvalStatus;
    private Integer approvalLevel;
    private Long approvedBy;
    private LocalDateTime approvedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
