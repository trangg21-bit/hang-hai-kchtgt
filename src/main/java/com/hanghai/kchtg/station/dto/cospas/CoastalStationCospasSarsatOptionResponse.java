package com.hanghai.kchtg.station.dto.cospas;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class CoastalStationCospasSarsatOptionResponse {
    private UUID id;
    private String code;
    private String name;
    private UUID orgUnitId;
}
