package com.hanghai.kchtg.integration.dto;

import com.hanghai.kchtg.gis.point.entity.PointObject;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO for Repair facility (Cơ sở sửa chữa) — mapped to PointObject with ObjectType=OTHER.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class RepairFacilityDto extends GeoPointDto {

    public static RepairFacilityDto from(PointObject p) {
        RepairFacilityDto dto = new RepairFacilityDto();
        dto.copyFrom(p);
        return dto;
    }
}
