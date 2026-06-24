package com.hanghai.kchtg.gis.layer.dto;

import com.hanghai.kchtg.gis.layer.entity.MapLayer.LayerType;
import com.hanghai.kchtg.gis.layer.entity.MapLayer.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMapLayerRequest {

    private String name;
    private String code;
    private LayerType layerType;
    private String source;
    private Boolean visible;
    private Double opacity;
    private Integer order;
    private String styleConfig;
    private Status status;
}