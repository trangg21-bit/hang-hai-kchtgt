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
public class MapOverlayResponse {

    private UUID id;
    private String name;
    private String url;
    private String layerName;
    private String format;
    private Boolean visible;
    private Double opacity;
    private Integer zIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}