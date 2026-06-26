package com.hanghai.kchtg.tai.dto.cospassarsat;

import com.hanghai.kchtg.tai.entity.TaiApprovalStatus;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.entity.TaiType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO cho chi tiết đài Cospas-Sarsat (F-094).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiCospasSarsatResponse {

    private UUID id;
    private String code;
    private String name;
    private TaiType type;
    private BigDecimal frequency;
    private String protocol;
    private String country;
    private TaiStatus status;
    private TaiApprovalStatus approvalStatus;
    private UUID approvedBy;
    private Instant approvedAt;
    private String approvedRemarks;
    private UUID unapprovedBy;
    private Instant unapprovedAt;
    private String unapprovedRemarks;
    private Instant createdAt;
    private Instant updatedAt;
}
