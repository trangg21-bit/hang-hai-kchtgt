package com.hanghai.kchtg.beacon.dto.buoy;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for Buoy detail view (F-078).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuoyResponse {

    private UUID id;
    private RecordSecurityLevel securityLevel;
    private String code;
    private String name;
    private String type;
    private String color;
    private String shape;
    private String lightCharacteristic;
    private Double range;
    private String description;
    private UUID unitId;
    private String unitName;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private Boolean isActive;
    private String status;
    private String approvalStatus;
    private ApprovalLevel approvalLevel;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private UUID submittedForApprovalBy;
    private LocalDateTime submittedForApprovalAt;
    private UUID level1ApprovedBy;
    private LocalDateTime level1ApprovedDate;
    private UUID level2ApprovedBy;
    private LocalDateTime level2ApprovedDate;
    private Double latitude;
    private Double longitude;
    private String geometryType;
    private java.util.UUID mapSymbolId;
    private Integer coordinateSystem;
    private String displayRule;
    private String coordinates;
    private UUID buoyStationId;
    private String buoyStationName;
    private String classification;
    private String classificationBuoy;
    private String classificationMark;
    private Integer provinceId;
    private String locationDetail;
    private String condition;
    private String structure;
    private Double area;
    private Double bodyHeight;
    private Double diameter;
    private String beaconLight;
    private Double towerHeight;
    private Double lightHeight;
    private String lightModel;
    private String towerColor;
    private String powerSupply;
    private LocalDate commissionedDate;
    private LocalDate lastRepairDate;
    private String lightColor;
    private String flashType;
    private String period;
    private String level1ApprovalContent;
    private String level2ApprovalContent;
    private String operationPlanCode;
    private String operationPlanName;
    private String operationStartDate;
    private String operationEndDate;
    private String maintenancePlanCode;
    private String maintenancePlanName;
    private String maintenanceStartTime;
    private String maintenanceEndTime;
    private String incidentCode;
    private String incidentType;
    private String incidentLocation;
    private String incidentTime;
    private String rejectionReason;
    private UUID createdBy;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
