package com.hanghai.kchtg.nhatram.dto.phao;

import com.hanghai.kchtg.nhatram.entity.BuoyType;
import com.hanghai.kchtg.nhatram.entity.NhaTramApprovalStatus;
import com.hanghai.kchtg.nhatram.entity.NhaTramStatus;
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
public class NhaTramPhaoResponse {

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
    private NhaTramStatus status;
    private NhaTramApprovalStatus approvalStatus;
    private Integer approvalLevel;
    private Long approvedBy;
    private LocalDateTime approvedDate;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
