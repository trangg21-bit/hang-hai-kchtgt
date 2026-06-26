package com.hanghai.kchtg.nhatram.dto.den;

import com.hanghai.kchtg.nhatram.entity.BeaconLightType;
import com.hanghai.kchtg.nhatram.entity.NhaTramApprovalStatus;
import com.hanghai.kchtg.nhatram.entity.NhaTramStatus;
import lombok.*;

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
public class NhaTramDenResponse {

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
    private NhaTramStatus status;
    private NhaTramApprovalStatus approvalStatus;
    private Integer approvalLevel;
    private Long approvedBy;
    private LocalDateTime approvedDate;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
