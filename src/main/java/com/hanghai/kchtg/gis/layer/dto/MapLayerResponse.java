package com.hanghai.kchtg.gis.layer.dto;

import com.hanghai.kchtg.gis.layer.entity.MapLayer.LayerType;
import com.hanghai.kchtg.gis.layer.entity.MapLayer.Status;
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
public class MapLayerResponse {

    private UUID id;
    private String name;
    private String code;
    private LayerType layerType;
    private String source;
    private Boolean visible;
    private Double opacity;
    private Integer order;
    private String styleConfig;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}