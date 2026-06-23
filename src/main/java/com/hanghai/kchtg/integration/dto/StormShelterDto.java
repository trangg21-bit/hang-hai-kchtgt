package com.hanghai.kchtg.integration.dto;

import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO for Storm shelter zone (Khu tránh bão) — mapped to PolygonObject with ObjectType=STORM_SHELTER.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class StormShelterDto extends GeoSpatialDto {

    private PolygonObject.Status status;

    public static StormShelterDto from(PolygonObject p) {
        StormShelterDto dto = new StormShelterDto();
        dto.copyFromSpatial(p.getCode(), p.getName(), p.getObjectType().name(), p.getCoordinates(), p.getDescription());
        dto.setStatus(p.getStatus());
        return dto;
    }
}
