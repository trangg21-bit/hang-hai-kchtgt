package com.hanghai.kchtg.gis.spatial.dto;

import java.util.UUID;

import lombok.Data;

import java.util.UUID;

@Data
public class SpatialObjectCategoryDto {
    private UUID id;
    private String code;
    private String name;
    private Integer geometryType;
    private UUID iconId;
    private String iconUrl;
    private Integer status;
    private java.time.LocalDateTime createdAt;
    private UUID createdBy;
    private java.time.LocalDateTime updatedAt;
    private UUID updatedBy;
}
