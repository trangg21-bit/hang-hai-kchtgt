package com.hanghai.kchtg.integration.dto;

import com.hanghai.kchtg.gis.point.entity.PointObject;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO for Buoy marker (Phao tiêu) — mapped to PointObject with ObjectType=BUOY.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class BuoyMarkerDto extends GeoPointDto {

    public static BuoyMarkerDto from(PointObject p) {
        BuoyMarkerDto dto = new BuoyMarkerDto();
        dto.copyFrom(p);
        return dto;
    }
}
