package com.hanghai.kchtg.gis.layer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMapViewRequest {

    private String name;
    private Double centerLon;
    private Double centerLat;
    private Integer zoom;
    private String visibleLayers;
    private String layerOrder;
    private String styleConfigs;
}