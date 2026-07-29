package com.hanghai.kchtg.port.dto.port;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response DTO for PortCoordinate entity.
 */
@Data
@Builder
public class CoordinateResponse {

    private UUID id;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer sortOrder;
}
