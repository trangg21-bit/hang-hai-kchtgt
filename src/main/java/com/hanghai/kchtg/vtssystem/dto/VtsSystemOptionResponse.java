package com.hanghai.kchtg.vtssystem.dto;

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
public class VtsSystemOptionResponse {
    private UUID id;
    private String code;
    private String name;
    private UUID orgUnitId;
}
