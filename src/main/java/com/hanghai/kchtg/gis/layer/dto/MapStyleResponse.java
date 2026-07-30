package com.hanghai.kchtg.gis.layer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapStyleResponse {

    private UUID id;
    private String layerId;
    private String fillColor;
    private String strokeColor;
    private Double strokeWidth;
    private Double pointRadius;
    private Double iconSize;
    private Double opacity;
    private Integer minZoom;
    private Integer maxZoom;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
