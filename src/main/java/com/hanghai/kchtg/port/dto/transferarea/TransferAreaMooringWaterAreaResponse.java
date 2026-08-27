package com.hanghai.kchtg.port.dto.transferarea;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TransferAreaMooringWaterAreaResponse {

    private UUID id;

    private String description;

    private String geometryType;

    private UUID mapSymbolId;

    private Integer coordinateSystem;

    private String displayRule;

    private List<TransferAreaMooringWaterAreaAnchorPointResponse> anchorPoints;
}
