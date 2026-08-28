package com.hanghai.kchtg.port.dto.anchorage;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class MooringWaterAreaRequest {

    private String description;

    private String geometryType;

    private UUID mapSymbolId;

    private Integer coordinateSystem;

    private String displayRule;

    private List<MooringWaterAreaAnchorPointRequest> anchorPoints;
}
