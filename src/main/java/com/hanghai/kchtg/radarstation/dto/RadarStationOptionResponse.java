package com.hanghai.kchtg.radarstation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RadarStationOptionResponse {
    private UUID id;
    private String code;
    private String stationName;
    private UUID orgUnitId;
}
