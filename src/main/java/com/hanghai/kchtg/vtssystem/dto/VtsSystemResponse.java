package com.hanghai.kchtg.vtssystem.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VtsSystemResponse {
    private UUID id;
    private String systemName;
    private String location;
    private String conditionStatus;
    private String responsibilityLevel;
    private String source;
    private String partner;
    private UUID orgUnitId;
    private String scope;
    private String approvalStatus;
    private Boolean approvedLevel1;
    private UUID approverLevel1;
    private LocalDateTime approvedDateLevel1;
    private Boolean approvedLevel2;
    private String approverLevel2;
    private LocalDateTime approvedDateLevel2;
    private String rejectionReason;
    private UUID createdBy;
    private LocalDateTime createdDate;
    private UUID updatedBy;
    private LocalDateTime updatedDate;
    private List<VtsSystemAttachmentResponse> attachments;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
}
