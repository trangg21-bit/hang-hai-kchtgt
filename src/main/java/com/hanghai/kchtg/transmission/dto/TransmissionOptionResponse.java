package com.hanghai.kchtg.transmission.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.util.UUID;

/**
 * Option response for transmission dropdowns.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class TransmissionOptionResponse {
    private UUID id;
    private String deviceCode;
    private String deviceName;
    private UUID orgUnitId;
}
