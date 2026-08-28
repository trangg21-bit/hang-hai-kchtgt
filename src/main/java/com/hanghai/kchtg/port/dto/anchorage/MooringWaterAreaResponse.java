package com.hanghai.kchtg.port.dto.anchorage;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class MooringWaterAreaResponse {

    private UUID id;

    private String description;

    private String geometryType;

    private UUID mapSymbolId;

    private Integer coordinateSystem;

    private String displayRule;

    private List<MooringWaterAreaAnchorPointResponse> anchorPoints;
}
