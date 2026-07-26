package com.hanghai.kchtg.gis.line.dto;

import java.util.UUID;

import com.hanghai.kchtg.gis.line.entity.LineObject.ObjectType;
import com.hanghai.kchtg.gis.line.entity.LineObject.Status;
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
    private UUID lineSymbolId;
    private String coordinates;
    private String description;
    private Status status;
    private UUID unitId;
    private Double length;
    private String material;
    private Integer yearBuilt;
    private UUID refId;
    private Integer refType;
    private String purpose;
    private String restrictionLevel;
}
