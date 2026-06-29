package com.hanghai.kchtg.station.dto.coastal;
import lombok.*;

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
public class CoastalStationVTSHistoryResponse {

    private UUID id;
    private String stationCode;
    private StationHistoryActionType actionType;
    private String previousValue;
    private String newValue;
    private String changedBy;
    private LocalDateTime changedAt;
}
