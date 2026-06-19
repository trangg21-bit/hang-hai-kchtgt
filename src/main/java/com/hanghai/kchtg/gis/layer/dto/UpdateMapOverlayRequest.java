package com.hanghai.kchtg.gis.layer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMapOverlayRequest {

    private String name;
    private String url;
    private String layerName;
    private String format;
    private Boolean visible;
    private Double opacity;
    private Integer zIndex;
}
