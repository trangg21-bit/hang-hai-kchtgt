package com.hanghai.kchtg.dikerevetment.dto;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemAttachmentResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for DikeRevetment (F-044 to F-049).
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DikeRevetmentResponse {
    private UUID id;
    private DikeRevetmentType dikeRevetmentType;
    private String location;
    private String locationDetail;
    private String dikeRevetmentName;
    private String code;
    private UUID seaportId;
    private String seaportName;
    private UUID operatingUnitId;
    private BigDecimal length;
    private BigDecimal crestElevation;
    private LocalDate commissioningDate;
    private BigDecimal height;
    private String surfaceMaterial;
    private String status;
    private String note;
    private UUID orgUnitId;
    private String orgUnitName;
    private ApprovalStatus approvalStatus;
    private Boolean isApprovedLevel1;
    private UUID approverLevel1;
    private LocalDate approvedDateLevel1;
    private Boolean isApprovedLevel2;
    private UUID approverLevel2;
    private LocalDate approvedDateLevel2;
    private String rejectionReason;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private String updatedByName;
    private UUID submittedBy;
    private String submittedByName;
    private LocalDateTime submittedAt;
    private String approvedByNameLevel1;
    private String approvedByNameLevel2;
    private String approvalContentLevel1;
    private String approvalContentLevel2;
    private LocalDateTime deletedAt;
    private UUID deletedBy;
    private List<VtsSystemAttachmentResponse> attachments;
    private List<ApprovalResponse> approvalHistory;
    private List<HistoryEntry> history;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID symbolId;
}
