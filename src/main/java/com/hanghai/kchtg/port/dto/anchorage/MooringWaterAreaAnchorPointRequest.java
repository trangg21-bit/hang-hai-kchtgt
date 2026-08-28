package com.hanghai.kchtg.port.dto.anchorage;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class MooringWaterAreaAnchorPointRequest {

    private String name;

    private BigDecimal latitude;

    private BigDecimal longitude;
}
