package com.hanghai.kchtg.integration.dto;

import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO for Anchorage area (Khu neo đậu) — mapped to PolygonObject with ObjectType=ANCHORAGE.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AnchorageDto extends GeoSpatialDto {

    private PolygonObject.Status status;

    public static AnchorageDto from(PolygonObject p) {
        AnchorageDto dto = new AnchorageDto();
        dto.copyFromSpatial(p.getCode(), p.getName(), p.getObjectType().name(), p.getCoordinates(), p.getDescription());
        dto.setStatus(p.getStatus());
        return dto;
    }
}
