package com.hanghai.kchtg.station.dto.haiphong;

import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoastalStationHaiphongHistoryResponse {

    private UUID id;
    private String stationCode;
    private StationHistoryActionType actionType;
    private String changedField;
    private String previousValue;
    private String newValue;
    private String reason;
    private String approvalLevel;
    private String changedBy;
    private LocalDateTime changedAt;
}

