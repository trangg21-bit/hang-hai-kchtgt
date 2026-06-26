package com.hanghai.kchtg.beacon.dto.beacon_light;

import com.hanghai.kchtg.beacon.entity.BeaconApprovalStatus;
import com.hanghai.kchtg.beacon.entity.BeaconLightType;
import com.hanghai.kchtg.beacon.entity.BeaconStatus;
import lombok.*;

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
    private String code;
    private String name;
    private BeaconLightType type;
    private Double latitude;
    private Double longitude;
    private Double lightRange;
    private String lightColor;
    private String lightCharacteristic;
    private Double range;
    private String description;
    private Long unitId;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    private Boolean isActive;
    private BeaconStatus status;
    private BeaconApprovalStatus approvalStatus;
    private Integer approvalLevel;
    private Long approvedBy;
    private LocalDateTime approvedDate;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
