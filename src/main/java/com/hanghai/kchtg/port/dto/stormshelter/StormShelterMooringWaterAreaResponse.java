package com.hanghai.kchtg.port.dto.stormshelter;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class StormShelterMooringWaterAreaResponse {

    private UUID id;

    private String description;

    private String geometryType;

    private UUID mapSymbolId;

    private Integer coordinateSystem;

    private String displayRule;

    private List<StormShelterMooringWaterAreaAnchorPointResponse> anchorPoints;
}
