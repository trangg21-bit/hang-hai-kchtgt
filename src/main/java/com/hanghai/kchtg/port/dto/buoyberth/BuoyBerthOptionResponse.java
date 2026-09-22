package com.hanghai.kchtg.port.dto.buoyberth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuoyBerthOptionResponse {
    private UUID id;
    private String buoyBerthCode;
    private String buoyBerthName;
    private UUID portId;
    private UUID orgUnitId;
}
