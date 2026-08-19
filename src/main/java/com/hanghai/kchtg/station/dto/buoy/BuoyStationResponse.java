package com.hanghai.kchtg.station.dto.buoy;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho chi tiết nhà trạm phao tiêu (F-085).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuoyStationResponse {

    private UUID id;
    private RecordSecurityLevel securityLevel;
    private String code;
    private String name;
    private String type;    private String color;
    private String shape;
    private String lightCharacteristic;
    private Double range;
    private String description;
    private UUID unitId;
    private UUID operatingOrgId;
    private UUID portId;
    private UUID waterwayId;
    private UUID waterwayRouteId;
    private String province;
    private String address;
    private LocalDate constructionDate;
    private Double totalArea;
    private Double usableArea;
    private Integer staffCount;
    private Integer lastMaintenanceYear;
    private String note;
    private String objectType;
    private String icon;
    private String coordinateSystem;
    private String displayFormat;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private Double latitude;
    private Double longitude;

    private Boolean isActive;
    private String status;
    private String approvalStatus;
    private ApprovalLevel approvalLevel;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
}

