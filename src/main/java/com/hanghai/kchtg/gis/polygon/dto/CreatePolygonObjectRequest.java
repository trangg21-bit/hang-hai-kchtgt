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

    @NotBlank(message = "Tên đối tượng không được để trống")
    private String name;

    @NotBlank(message = "Mã đối tượng không được để trống")
    private String code;

    @NotNull(message = "Loại đối tượng không được để trống")
    private ObjectType objectType;

    private Long categoryId;
    private Long fillSymbolId;

    @NotBlank(message = "Tọa độ WKT/GeoJSON không được để trống")
    private String coordinates;

    private String description;

    @Builder.Default
    private Status status = Status.DRAFT;

    private Long unitId;
    private Double area;
    private String purpose;
    private String restrictionLevel;
}