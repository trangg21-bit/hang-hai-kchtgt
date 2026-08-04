package com.hanghai.kchtg.navigationchannel.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannelApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NavigationChannelResponse {
    private UUID id;
    private String channelName;
    private Integer stationAmountt;
    private LocalDate latestStationRepairDate;
    private java.math.BigDecimal stationArea;
    private String note;
    private String channelCode;
    private UUID seaportId;
    private UUID operatingUnitId;
    private String location;
    private String detailedLocation;
    private String channelManagementStation;
    private Integer stationStaffAmount;
    private Integer latestMaintenanceYear;
    private java.math.BigDecimal dredgingVolume;
    private Integer buoyAmount;
    private Integer beaconAmount;
    private Integer status;
    private UUID orgUnitId;
    private String orgUnitName;
    private NavigationChannelApprovalStatus approvalStatus;
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
    private List<NavigationChannelAttachmentResponse> attachments;
    private List<ApprovalResponse> approvalHistory;
    private List<HistoryEntry> history;
    private String clearanceHeight;
    private List<ChannelRouteDetailResponse> channelRouteDetailList;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID symbolId;

    // New fields
    private String registeredArea;
    private String operatingHours;
    private LocalDate recordedDate;
    private Integer quantity;
    private String loadCapacity;
    private LocalDateTime deletedAt;
    private UUID deletedBy;
}
