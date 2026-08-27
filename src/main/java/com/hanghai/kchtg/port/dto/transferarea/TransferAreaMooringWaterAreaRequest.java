package com.hanghai.kchtg.port.dto.transferarea;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class TransferAreaMooringWaterAreaRequest {

    private String description;

    private String geometryType;

    private UUID mapSymbolId;

    private Integer coordinateSystem;

    private String displayRule;

    private List<TransferAreaMooringWaterAreaAnchorPointRequest> anchorPoints;
}
