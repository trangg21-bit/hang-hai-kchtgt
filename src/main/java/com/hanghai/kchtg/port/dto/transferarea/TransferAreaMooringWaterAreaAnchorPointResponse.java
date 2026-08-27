package com.hanghai.kchtg.port.dto.transferarea;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class TransferAreaMooringWaterAreaAnchorPointResponse {

    private UUID id;

    private String name;

    private BigDecimal latitude;

    private BigDecimal longitude;
}
