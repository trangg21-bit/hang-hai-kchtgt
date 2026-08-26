package com.hanghai.kchtg.aissystem.dto;

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
public class AisSystemOptionResponse {
    private UUID id;
    private String code;
    private String name;
    private UUID orgUnitId;
    private UUID vtsOperationCenterId;

    public AisSystemOptionResponse(UUID id, String code, String name, UUID orgUnitId) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.orgUnitId = orgUnitId;
    }
}
