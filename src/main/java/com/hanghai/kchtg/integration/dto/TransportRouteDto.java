package com.hanghai.kchtg.integration.dto;

import com.hanghai.kchtg.gis.line.entity.LineObject;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO for Transport route (Chuyển tải) — mapped to LineObject with ObjectType=SHIPPING_ROUTE.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class TransportRouteDto extends GeoSpatialDto {

    private LineObject.Status status;

    public static TransportRouteDto from(LineObject l) {
        TransportRouteDto dto = new TransportRouteDto();
        dto.copyFromSpatial(l.getCode(), l.getName(), l.getObjectType().name(), l.getCoordinates(), l.getDescription());
        dto.setStatus(l.getStatus());
        return dto;
    }
}
