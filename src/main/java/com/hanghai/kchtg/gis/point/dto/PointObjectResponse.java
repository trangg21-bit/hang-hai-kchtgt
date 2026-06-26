package com.hanghai.kchtg.gis.point.dto;

import com.hanghai.kchtg.gis.point.entity.PointObject.ApprovalStatus;
import com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType;
import com.hanghai.kchtg.gis.point.entity.PointObject.Status;
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
public class PointObjectResponse {

    private UUID id;
    private String name;
    private String code;
    private ObjectType objectType;
    private Long categoryId;
    private Long iconId;
    private Double longitude;
    private Double latitude;
    private String description;
    private Status status;
    private Long unitId;
    private ApprovalStatus approvalStatus;
    private Long approvedBy;
    private LocalDateTime approvedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
