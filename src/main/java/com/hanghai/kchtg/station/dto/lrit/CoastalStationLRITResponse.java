package com.hanghai.kchtg.station.dto.lrit;
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
public class CoastalStationLRITResponse {

    private UUID id;
    private String stationCode;
    private String stationName;
    private String terminalId;
    private String imoNumber;
    private Integer reportingInterval;
    private Double antennaHeight;
    private Double powerOutput;
    private String antennaType;
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
    private String dataFormat;
    private String communicationChannel;
    private String coverageArea;
    private StationStatus status;
    private StationApprovalStatus approvalStatus;
    private Integer approvalLevel;
    private Long approvedBy;
    private LocalDateTime approvedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
}
