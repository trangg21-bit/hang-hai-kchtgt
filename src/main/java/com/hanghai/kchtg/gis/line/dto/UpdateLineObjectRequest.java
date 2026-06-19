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
public class UpdateLineObjectRequest {

    private String name;
    private String code;
    private ObjectType objectType;
    private Long categoryId;
    private Long lineSymbolId;
    private String coordinates;
    private String description;
    private Status status;
    private Long unitId;
    private Double length;
    private String material;
    private Integer yearBuilt;
}
