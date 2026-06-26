package com.hanghai.kchtg.beacon.dto.buoy;

import com.hanghai.kchtg.beacon.entity.BeaconApprovalStatus;
import com.hanghai.kchtg.beacon.entity.BeaconStatus;
import com.hanghai.kchtg.beacon.entity.BuoyType;
import lombok.*;

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
    private String code;
    private String name;
    private BuoyType type;
    private Double latitude;
    private Double longitude;
    private String color;
    private String shape;
    private String lightCharacteristic;
    private Double range;
    private String description;
    private Long unitId;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
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
