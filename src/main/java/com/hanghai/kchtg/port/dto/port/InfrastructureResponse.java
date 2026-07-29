package com.hanghai.kchtg.port.dto.port;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Response DTO for PortInfrastructure entity.
 */
@Data
@Builder
public class InfrastructureResponse {

    private UUID id;
    private Integer sequenceNumber;
    private String infrastructureName;
    private Integer quantity;
}
