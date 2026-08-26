package com.hanghai.kchtg.dikerevetment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DikeRevetmentOptionResponse {
    private UUID id;
    private String code;
    private String dikeRevetmentName;
    private UUID orgUnitId;
    private UUID seaportId;
}
