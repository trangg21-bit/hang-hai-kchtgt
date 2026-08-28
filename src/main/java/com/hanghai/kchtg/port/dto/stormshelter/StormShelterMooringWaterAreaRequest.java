package com.hanghai.kchtg.port.dto.stormshelter;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class StormShelterMooringWaterAreaRequest {

    private String description;

    private String geometryType;

    private UUID mapSymbolId;

    private Integer coordinateSystem;

    private String displayRule;

    private List<StormShelterMooringWaterAreaAnchorPointRequest> anchorPoints;
}
