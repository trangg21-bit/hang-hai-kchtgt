package com.hanghai.kchtg.gis.polygon.dto;

import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ApprovalStatus;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ObjectType;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolygonObjectResponse {

    private UUID id;
    private String name;
    private String code;
    private ObjectType objectType;
    private Long categoryId;
    private Long fillSymbolId;
    private String coordinates;
    private String description;
    private Status status;
    private Long unitId;
    private Double area;
    private String purpose;
    private String restrictionLevel;
    private ApprovalStatus approvalStatus;
    private Long approvedBy;
    private LocalDateTime approvedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
