package com.hanghai.kchtg.integration.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import lombok.Data;

/**
 * Base DTO containing shared fields for point-based GIS entities.
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeoPointDto {

    private String code;
    private String name;
    private String objectType;
    private Double latitude;
    private Double longitude;
    private String description;
    private PointObject.Status status;

    public void copyFrom(PointObject p) {
        this.code = p.getCode();
        this.name = p.getName();
        this.objectType = p.getObjectType().name();
        this.latitude = p.getLatitude();
        this.longitude = p.getLongitude();
        this.description = p.getDescription();
        this.status = p.getStatus();
    }
}
