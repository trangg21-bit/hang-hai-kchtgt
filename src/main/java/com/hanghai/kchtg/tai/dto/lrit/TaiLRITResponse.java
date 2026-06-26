package com.hanghai.kchtg.tai.dto.lrit;

import com.hanghai.kchtg.tai.entity.TaiApprovalStatus;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.entity.TaiType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO cho chi tiết đài LRIT (F-097).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiLRITResponse {

    private UUID id;
    private String code;
    private String name;
    private TaiType type;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer range;
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
