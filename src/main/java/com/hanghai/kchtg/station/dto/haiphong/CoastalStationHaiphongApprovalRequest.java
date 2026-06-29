package com.hanghai.kchtg.station.dto.haiphong;
import lombok.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoastalStationHaiphongApprovalRequest {

    private String stationId;
    private Boolean approved;
    private String rejectionReason;
}
