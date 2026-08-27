package com.hanghai.kchtg.port.dto.stormshelter;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class StormShelterMooringWaterAreaAnchorPointRequest {

    private String name;

    private BigDecimal latitude;

    private BigDecimal longitude;
}
