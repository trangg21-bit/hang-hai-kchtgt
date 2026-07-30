package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response DTO for OperationDetail.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationDetailResponse {

    private UUID id;
    private String description;
    private BigDecimal estimatedVolume;
    private BigDecimal actualVolume;
    private String notes;
}
