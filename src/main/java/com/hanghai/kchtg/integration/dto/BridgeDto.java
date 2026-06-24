package com.hanghai.kchtg.integration.dto;

import com.hanghai.kchtg.gis.line.entity.LineObject;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO for Bridge (Cầu cảng) - mapped to LineObject with ObjectType=WATERWAY.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class BridgeDto extends GeoSpatialDto {

    private LineObject.Status status;

    public static BridgeDto from(LineObject l) {
        BridgeDto dto = new BridgeDto();
        dto.copyFromSpatial(l.getCode(), l.getName(), l.getObjectType().name(), l.getCoordinates(), l.getDescription());
        dto.setStatus(l.getStatus());
        return dto;
    }
}