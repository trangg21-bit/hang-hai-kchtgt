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

    @NotBlank(message = "Ten doi tuong khong duoc de trong")
    private String name;

    @NotBlank(message = "Ma doi tuong khong duoc de trong")
    private String code;

    @NotNull(message = "Loai doi tuong khong duoc de trong")
    private ObjectType objectType;

    private Long categoryId;
    private Long lineSymbolId;

    @NotBlank(message = "Toa do WKT/GeoJSON khong duoc de trong")
    private String coordinates;

    private String description;

    @Builder.Default
    private Status status = Status.DRAFT;

    private Long unitId;
    private Double length;
    private String material;
    private Integer yearBuilt;
}
