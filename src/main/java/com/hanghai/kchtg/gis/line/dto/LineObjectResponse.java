package com.hanghai.kchtg.gis.line.dto;

import com.hanghai.kchtg.gis.line.entity.LineObject.ApprovalStatus;
import com.hanghai.kchtg.gis.line.entity.LineObject.ObjectType;
import com.hanghai.kchtg.gis.line.entity.LineObject.Status;
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
public class LineObjectResponse {

    private UUID id;
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
    private ApprovalStatus approvalStatus;
    private Long approvedBy;
    private LocalDateTime approvedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
