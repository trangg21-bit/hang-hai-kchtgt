package com.hanghai.kchtg.beacon.dto.buoy;

import java.util.UUID;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.hanghai.kchtg.common.enums.ApprovalLevel;

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
    private String code;
    private String name;
    private String type;    private String color;
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
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
