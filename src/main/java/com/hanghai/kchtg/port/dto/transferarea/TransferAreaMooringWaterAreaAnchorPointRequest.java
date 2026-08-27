package com.hanghai.kchtg.port.dto.transferarea;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransferAreaMooringWaterAreaAnchorPointRequest {

    private String name;

    private BigDecimal latitude;

    private BigDecimal longitude;
}
