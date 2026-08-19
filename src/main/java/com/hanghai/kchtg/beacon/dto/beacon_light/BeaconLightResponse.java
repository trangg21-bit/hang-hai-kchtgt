package com.hanghai.kchtg.beacon.dto.beacon_light;

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
 * Response DTO for BeaconLight detail view (F-072).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeaconLightResponse {

    private UUID id;
    private RecordSecurityLevel securityLevel;
    private String code;
    private String name;
    private String type;    private Double lightRange;
    private String towerColor;
    private String primaryLightModel;
    private Double area;
    private String location;
    private UUID unitId;
    private String unitName;
    private LocalDate lastRepairDate;
    private LocalDate commissionedDate;
    private Boolean isActive;
    private String status;
    private String approvalStatus;
    private ApprovalLevel approvalLevel;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String shape;
    private String structure;
    private Double towerHeight;
    private Double lightHeight;
    private String geographicRange;
    private String backupLightModel;
    private String powerSupply;
    private Integer staffCount;
    private Double stationArea;
}
