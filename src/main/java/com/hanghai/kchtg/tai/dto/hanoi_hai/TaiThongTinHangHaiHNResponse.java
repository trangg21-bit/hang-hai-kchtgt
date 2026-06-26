package com.hanghai.kchtg.tai.dto.hanoi_hai;

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
 * Response DTO cho chi tiết đài TT hàng hải Hà Nội (F-100).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiThongTinHangHaiHNResponse {

    private UUID id;
    private String code;
    private String name;
    private TaiType type;
    private BigDecimal frequency;
    private Integer range;
    private String department;
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
