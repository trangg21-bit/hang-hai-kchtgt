package com.hanghai.kchtg.integration.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

/**
 * Base DTO containing shared fields for spatial line/polygon GIS entities.
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeoSpatialDto {

    private String code;
    private String name;
    private String objectType;
    private String coordinates;
    private String description;

    protected void copyFromSpatial(String code, String name, String objectType, String coordinates, String description) {
        this.code = code;
        this.name = name;
        this.objectType = objectType;
        this.coordinates = coordinates;
        this.description = description;
    }
}
