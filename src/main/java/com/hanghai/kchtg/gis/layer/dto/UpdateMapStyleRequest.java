package com.hanghai.kchtg.gis.layer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMapStyleRequest {

    private String layerId;
    private String fillColor;
    private String strokeColor;
    private Double strokeWidth;
    private Double pointRadius;
    private Double opacity;
    private Integer minZoom;
    private Integer maxZoom;
}