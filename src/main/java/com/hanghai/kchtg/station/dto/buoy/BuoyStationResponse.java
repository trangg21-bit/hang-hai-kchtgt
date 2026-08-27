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

    private String condition;
    private Boolean isActive;
    private String status;
    private String approvalStatus;
    private ApprovalLevel approvalLevel;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private UUID level1ApprovedBy;
    private LocalDateTime level1ApprovedDate;
    private UUID level2ApprovedBy;
    private LocalDateTime level2ApprovedDate;
    private String level1ApprovalContent;
    private String level2ApprovalContent;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Thông tin vận hành khai thác (read-only — CSV 39-42)
    private String operationPlanCode;
    private String operationPlanName;
    private String operationStartDate;
    private String operationEndDate;
    // Thông tin bảo trì (read-only — CSV 43-46)
    private String maintenancePlanCode;
    private String maintenancePlanName;
    private String maintenanceStartTime;
    private String maintenanceEndTime;
    // Thông tin sự cố (read-only — CSV 47-50)
    private String incidentCode;
    private String incidentType;
    private String incidentLocation;
    private String incidentTime;

    // Additional audit fields for list display
    private String createdBy;
    private String createdByName;
    private String updatedByName;
    private UUID sentApprovedBy;
    private LocalDateTime sentApprovedDate;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
}

