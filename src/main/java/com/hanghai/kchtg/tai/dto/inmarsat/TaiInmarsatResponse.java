package com.hanghai.kchtg.tai.dto.inmarsat;

import com.hanghai.kchtg.tai.entity.TaiApprovalStatus;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.entity.TaiType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO cho chi tiết đài Inmarsat (F-091).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiInmarsatResponse {

    private UUID id;
    private String code;
    private String name;
    private TaiType type;
    private String satelliteId;
    private BigDecimal signalStrength;
    private String serviceType;
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
