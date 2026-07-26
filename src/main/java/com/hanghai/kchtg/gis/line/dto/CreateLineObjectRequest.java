package com.hanghai.kchtg.gis.line.dto;

import java.util.UUID;

import com.hanghai.kchtg.gis.line.entity.LineObject.ObjectType;
import com.hanghai.kchtg.gis.line.entity.LineObject.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    private UUID lineSymbolId;

    @NotBlank(message = "Tọa độ WKT/GeoJSON không được để trống")
    private String coordinates;

    private String description;

    @Builder.Default
    private Status status = Status.DRAFT;

    private UUID unitId;
    private Double length;
    private String material;
    private Integer yearBuilt;
    private UUID refId;
    private Integer refType;
    private String purpose;
    private String restrictionLevel;
}
