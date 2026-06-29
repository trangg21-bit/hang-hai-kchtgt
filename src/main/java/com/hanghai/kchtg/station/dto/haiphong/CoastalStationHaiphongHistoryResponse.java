package com.hanghai.kchtg.station.dto.haiphong;
import lombok.*;

import com.hanghai.kchtg.station.entity.StationHistoryActionType;

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
    private String previousValue;
    private String newValue;
    private String changedBy;
    private LocalDateTime changedAt;
}
