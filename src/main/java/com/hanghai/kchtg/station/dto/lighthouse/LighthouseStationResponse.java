package com.hanghai.kchtg.station.dto.lighthouse;

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
 * Response DTO cho chi tiết nhà trạm đèn biển (F-091).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LighthouseStationResponse {

    private UUID id;
    private RecordSecurityLevel securityLevel;
    private String code;
    private String name;
    private String type;    private Double lightRange;
    private String lightColor;
    private String lightCharacteristic;
    private Double range;
    private String description;
    private UUID unitId;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
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
    private Double latitude;
    private Double longitude;

    private String coordinates;
}

