package com.hanghai.kchtg.navigationchannel.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response for NavigationChannel (F-038) — covers the full 71-field Excel view.
 * Fields #47-#57 (workflow/audit) are read-only, populated by the system.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class NavigationChannelResponse {

    private UUID id;
    private String channelName;
    private String channelCode;
    private UUID seaportId;
    private UUID operatingUnitId;
    private ConditionStatus conditionStatus;
    private String detailedLocation;
    private String managementStation;
    private Integer stationCount;
    private Integer stationStaffCount;
    private BigDecimal stationAreaSquareMeters;
    private LocalDate latestStationRepairMonth;
    private Integer latestMaintenanceYear;
    private BigDecimal latestDredgingVolumeCubicMeters;
    private Integer buoyCount;
    private Integer beaconCount;
    private String notes;
    private String announcementDecisionNumber;
    private LocalDate announcementDecisionDate;
    private String announcementDecisionIssuer;
    private BigDecimal protectionScopeMeters;
    private String protectionNotes;
    private GisGeometryType geometryType;
    private UUID mapIconId;
    private String coordinateReferenceSystem;
    private String displayRule;

    // ── #45 tọa độ (bảng con) + GIS ──
    private List<NavigationChannelCoordinateResponse> coordinateList;
    private UUID spatialId;
    private String coordinates;

    // ── #46 attachments ──
    private List<NavigationChannelAttachmentResponse> attachments;

    // ── #22-#38 route details ──
    private List<ChannelRouteDetailResponse> routeDetails;

    // ── Data scope + org unit ──
    private UUID orgUnitId;
    private String orgUnitName;
    private Integer provinceId;

    // ── #47-#57 workflow (read-only) ──
    private ApprovalStatus approvalStatus;
    private LocalDateTime submittedAt;
    private UUID submittedBy;
    private LocalDateTime approvedDateLevel1;
    private UUID approverLevel1;
    private String level1ApprovalContent;
    private LocalDateTime approvedDateLevel2;
    private UUID approverLevel2;
    private String level2ApprovalContent;
    private String rejectionReason;

    // ── Audit (BaseEntity) ──
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private UUID deletedBy;

    private List<ApprovalResponse> approvalHistory;
    private List<HistoryEntry> history;
}
