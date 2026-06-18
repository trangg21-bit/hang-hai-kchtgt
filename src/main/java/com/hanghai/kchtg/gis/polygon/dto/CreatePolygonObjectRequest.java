package com.hanghai.kchtg.gis.polygon.dto;

import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ObjectType;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.Status;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePolygonObjectRequest {

    @NotBlank(message = "Ten doi tuong khong duoc de trong")
    private String name;

    @NotBlank(message = "Ma doi tuong khong duoc de trong")
    private String code;

    @NotNull(message = "Loai doi tuong khong duoc de trong")
    private ObjectType objectType;

    private Long categoryId;
    private Long fillSymbolId;

    @NotBlank(message = "Toa do WKT/GeoJSON khong duoc de trong")
    private String coordinates;

    private String description;

    @Builder.Default
    private Status status = Status.DRAFT;

    private Long unitId;
    private Double area;
    private String purpose;
    private String restrictionLevel;
}
