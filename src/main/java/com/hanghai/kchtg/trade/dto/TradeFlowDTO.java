package com.hanghai.kchtg.trade.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a single trade flow record between two ports.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeFlowDTO {

    private Long id;
    private String sourcePort;
    private String destPort;
    private String cargoType;
    private Double quantity;
    private String period;
}
