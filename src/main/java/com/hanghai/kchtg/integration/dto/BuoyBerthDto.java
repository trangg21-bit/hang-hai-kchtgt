package com.hanghai.kchtg.integration.dto;

import com.hanghai.kchtg.gis.point.entity.PointObject;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO for Buoy berth (Bến phao) — mapped to PointObject with ObjectType=BUOY.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class BuoyBerthDto extends GeoPointDto {

    public static BuoyBerthDto from(PointObject p) {
        BuoyBerthDto dto = new BuoyBerthDto();
        dto.copyFrom(p);
        return dto;
    }
}
