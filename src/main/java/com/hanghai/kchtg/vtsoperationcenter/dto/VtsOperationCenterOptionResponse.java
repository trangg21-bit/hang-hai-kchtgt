package com.hanghai.kchtg.vtsoperationcenter.dto;

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
public class VtsOperationCenterOptionResponse {
    private UUID id;
    private String code;
    private String name;
    private UUID orgUnitId;
    private UUID vtsSystemId;
}
