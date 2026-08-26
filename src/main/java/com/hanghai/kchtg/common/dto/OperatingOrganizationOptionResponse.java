package com.hanghai.kchtg.common.dto;

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
public class OperatingOrganizationOptionResponse {
    private UUID id;
    private String code;
    private String name;
    private String parentCode;
}
