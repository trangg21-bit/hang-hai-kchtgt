package com.hanghai.kchtg.navigationchannel.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Create request for NavigationChannel (F-038) — input fields #1-#46 only.
 * Read-only fields #47-#71 are excluded (BR-038-06); channelCode (#4) and routeCode (#23)
 * are system-generated and not accepted from the client (BR-038-03).
 * Required fields: orgUnitId (#1), channelName (#5), conditionStatus (#8) — BR-038-02.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class NavigationChannelCreateRequest {

    /** Infra field (not part of the 71 Excel fields) — security level of the record. */
    private RecordSecurityLevel securityLevel;

    @NotNull(message = "Đơn vị quản lý là bắt buộc")
    private UUID orgUnitId;

    private UUID seaportId;

    private UUID operatingUnitId;

    @NotNull(message = "Tên luồng hàng hải là bắt buộc")
    private String channelName;

    private Integer provinceId;

    private String detailedLocation;

    @NotNull(message = "Tình trạng là bắt buộc")
    private ConditionStatus conditionStatus;

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

    /** Tuyến luồng con (#22-#38). */
    private List<ChannelRouteDetailRequest> routeDetails;

    private BigDecimal protectionScopeMeters;

    private String protectionNotes;

    private GisGeometryType geometryType;

    private UUID mapIconId;

    private String coordinateReferenceSystem;

    private String displayRule;

    /** GIS WKT (bản đồ KCHT) — giữ luồng GisSpatialObject/spatial_id hiện có. */
    private String coordinates;

    /** Bảng con Kinh độ/Vĩ độ (#45). */
    private List<NavigationChannelCoordinateRequest> coordinateList;

    /** File đính kèm (#46) — lưu vào infrastructure_attachments (ref_type = NAVIGATION_CHANNEL). */
    private List<NavigationChannelAttachmentRequest> attachments;
}
