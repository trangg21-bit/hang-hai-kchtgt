package com.hanghai.kchtg.integration.dto;

import com.hanghai.kchtg.gis.point.entity.PointObject;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO for Beacon (Đèn biển) — mapped to PointObject with ObjectType=BEACON.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class BeaconDto extends GeoPointDto {

    public static BeaconDto from(PointObject p) {
        BeaconDto dto = new BeaconDto();
        dto.copyFrom(p);
        return dto;
    }
}
