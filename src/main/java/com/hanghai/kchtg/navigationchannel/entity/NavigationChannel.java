package com.hanghai.kchtg.navigationchannel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "navigation_channel")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NavigationChannel {
    @Column(name = "province_id")
    private Integer provinceId;

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;
    @Column(name = "channel_name", nullable = false, length = 100) private String channelName;
    @Column(name = "station_amountt") private Integer stationAmountt;
    @Column(name = "latest_station_repair_date") private LocalDate latestStationRepairDate;
    @Column(name = "station_area") private java.math.BigDecimal stationArea;
    @Column(name = "note", length = 500) private String note;
    @Column(name = "channel_code", length = 50) private String channelCode;
    @Column(name = "seaport_id") private UUID seaportId;
    @Column(name = "operating_unit_id") private UUID operatingUnitId;
    @Column(name = "location", length = 6) private String location;
    @Column(name = "detailed_location", length = 500) private String detailedLocation;
    @Column(name = "channel_management_station", length = 500) private String channelManagementStation;
    @Column(name = "station_staff_amount") @Builder.Default private Integer stationStaffAmount = 0;
    @Column(name = "latest_maintenance_year") private Integer latestMaintenanceYear;
    @Column(name = "dredging_volume") private java.math.BigDecimal dredgingVolume;
    @Column(name = "clearance_height", length = 20) private String clearanceHeight;
    @Column(name = "buoy_amount") @Builder.Default private Integer buoyAmount = 0;
    @Column(name = "beacon_amount") @Builder.Default private Integer beaconAmount = 0;
    @Column(name = "status") @Builder.Default private Integer status = 1;
    @Column(name = "org_unit_id") private UUID orgUnitId;
    @Column(name = "approval_status", nullable = false)
    @Convert(converter = NavigationChannelApprovalStatusConverter.class)
    private NavigationChannelApprovalStatus approvalStatus;
    @Column(name = "is_approved_level1", nullable = false) private Boolean isApprovedLevel1;
    @Column(name = "approver_level1") private UUID approverLevel1;
    @Column(name = "approved_date_level1") private LocalDate approvedDateLevel1;
    @Column(name = "is_approved_level2", nullable = false) private Boolean isApprovedLevel2;
    @Column(name = "approver_level2") private UUID approverLevel2;
    @Column(name = "approved_date_level2") private LocalDate approvedDateLevel2;
    @Column(name = "rejection_reason", length = 500) private String rejectionReason;
    @Column(name = "is_deleted", nullable = false) @Builder.Default private Boolean isDeleted = false;
    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "created_by") private UUID createdBy;
    @Column(name = "updated_by") private UUID updatedBy;
    @Column(name = "spatial_id") private UUID spatialId;
    @Column(name = "registered_area", length = 100) private String registeredArea;
    @Column(name = "operating_hours", length = 50) private String operatingHours;
    @Column(name = "recorded_date") private LocalDate recordedDate;
    @Column(name = "quantity") private Integer quantity;
    @Column(name = "load_capacity", length = 100) private String loadCapacity;
    @Column(name = "deleted_at") private LocalDateTime deletedAt;
    @Column(name = "deleted_by") private UUID deletedBy;
    @OneToMany(mappedBy = "navigationChannel", cascade = CascadeType.ALL, orphanRemoval = true) @Builder.Default private List<NavigationChannelAttachment> attachments = new ArrayList<>();
    @OneToMany(mappedBy = "navigationChannel", cascade = CascadeType.ALL, orphanRemoval = true) @Builder.Default private List<ChannelRouteDetail> channelRouteDetailList = new ArrayList<>();
    @PrePersist protected void onCreate() { this.createdAt = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
