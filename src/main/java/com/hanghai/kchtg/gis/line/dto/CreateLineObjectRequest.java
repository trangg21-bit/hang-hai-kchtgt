package com.hanghai.kchtg.gis.line.dto;

import com.hanghai.kchtg.gis.line.entity.LineObject.ObjectType;
import com.hanghai.kchtg.gis.line.entity.LineObject.Status;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateLineObjectRequest {

    @NotBlank(message = "Tên đối tượng không được để trống")
    private String name;

    @NotBlank(message = "Mã đối tượng không được để trống")
    private String code;

    @NotNull(message = "Loại đối tượng không được để trống")
    private ObjectType objectType;

    private Long categoryId;
    private Long lineSymbolId;

    @NotBlank(message = "Tọa độ WKT/GeoJSON không được để trống")
    private String coordinates;

    private String description;

    @Builder.Default
    private Status status = Status.DRAFT;

    private Long unitId;
    private Double length;
    private String material;
    private Integer yearBuilt;
}