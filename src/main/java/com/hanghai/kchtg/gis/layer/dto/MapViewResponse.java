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
public class MapViewResponse {

    private UUID id;
    private String name;
    private Long userId;
    private Double centerLon;
    private Double centerLat;
    private Integer zoom;
    private String visibleLayers;
    private String layerOrder;
    private String styleConfigs;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
