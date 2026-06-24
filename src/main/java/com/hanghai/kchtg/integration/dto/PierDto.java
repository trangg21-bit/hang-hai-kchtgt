package com.hanghai.kchtg.integration.dto;

import com.hanghai.kchtg.gis.point.entity.PointObject;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO for Pier/Dock (Bến cảng) - mapped to PointObject with ObjectType=PORT.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class PierDto extends GeoPointDto {

    public static PierDto from(PointObject p) {
        PierDto dto = new PierDto();
        dto.copyFrom(p);
        return dto;
    }
}