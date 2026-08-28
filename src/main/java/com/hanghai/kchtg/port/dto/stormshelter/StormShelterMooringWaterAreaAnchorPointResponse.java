package com.hanghai.kchtg.port.dto.stormshelter;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class StormShelterMooringWaterAreaAnchorPointResponse {

    private UUID id;

    private String name;

    private BigDecimal latitude;

    private BigDecimal longitude;
}
