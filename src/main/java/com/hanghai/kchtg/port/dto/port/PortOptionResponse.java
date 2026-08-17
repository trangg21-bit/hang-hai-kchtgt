package com.hanghai.kchtg.port.dto.port;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class PortOptionResponse {
    private UUID id;
    private String portCode;
    private String portName;
    private UUID orgUnitId;
}
