package com.hanghai.kchtg.integration.dto;

import com.hanghai.kchtg.gis.point.entity.PointObject;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO for VTS system (Hệ thống VTS) - mapped to PointObject with ObjectType=PORT.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class VtsSystemDto extends GeoPointDto {

    public static VtsSystemDto from(PointObject p) {
        VtsSystemDto dto = new VtsSystemDto();
        dto.copyFrom(p);
        return dto;
    }
}