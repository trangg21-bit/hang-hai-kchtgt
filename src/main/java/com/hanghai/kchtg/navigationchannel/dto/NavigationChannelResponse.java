package com.hanghai.kchtg.navigationchannel.dto;

import com.hanghai.kchtg.navigationchannel.entity.NavigationChannelApprovalStatus;
import lombok.*;
import java.time.*;
import java.util.List;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NavigationChannelResponse {
    private java.util.UUID id;
    private String channelName;
    private Integer stationAmountt;
    private LocalDate latestStationRepairDate;
    private java.math.BigDecimal stationArea;
    private String note;
    private String channelCode;
    private java.util.UUID seaportId;
    private java.util.UUID operatingUnitId;
    private String location;
    private String detailedLocation;
    private String channelManagementStation;
    private Integer stationStaffAmount;
    private Integer latestMaintenanceYear;
    private java.math.BigDecimal dredgingVolume;
    private Integer buoyAmount;
    private Integer beaconAmount;
    private Integer status;
    private java.util.UUID orgUnitId;
    private String orgUnitName;
    private NavigationChannelApprovalStatus approvalStatus;
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
    private String createdBy;
    private String updatedBy;
    private List<NavigationChannelAttachmentResponse> attachments;
    private List<ApprovalResponse> approvalHistory;
    private List<HistoryEntry> history;
    private String clearanceHeight;
    private List<ChiTietTuyenLuongResponse> chiTietTuyenLuongList;
    private java.util.UUID spatialId;
    private GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;

    // New fields
    private String registeredArea;
    private String operatingHours;
    private LocalDate recordedDate;
    private Integer quantity;
    private String loadCapacity;
    private LocalDateTime deletedAt;
    private String deletedBy;
}
