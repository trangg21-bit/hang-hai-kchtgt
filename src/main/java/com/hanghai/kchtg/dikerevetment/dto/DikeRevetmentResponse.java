package com.hanghai.kchtg.dikerevetment.dto;

import java.util.UUID;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentApprovalStatus;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for DikeRevetment (F-044 to F-049).
 */
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DikeRevetmentResponse {
    private UUID id;
    private DikeRevetmentType dikeRevetmentType;
    private String location;
    private String dikeRevetmentName;
    private Double length;
    private Double crestElevation;
    private LocalDate commissioningDate;
    private Double height;
    private String surfaceMaterial;
    private String status;
    private String note;
    private UUID orgUnitId;
    private DikeRevetmentApprovalStatus approvalStatus;
    private Boolean isApprovedLevel1;
    private String approverLevel1;
    private LocalDate approvedDateLevel1;
    private Boolean isApprovedLevel2;
    private String approverLevel2;
    private LocalDate approvedDateLevel2;
    private String rejectionReason;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime deletedAt;
    private UUID deletedBy;
    private List<DikeRevetmentAttachmentResponse> attachments;
    private List<ApprovalResponse> approvalHistory;
    private List<HistoryEntry> history;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID bieuTuongId;
}
