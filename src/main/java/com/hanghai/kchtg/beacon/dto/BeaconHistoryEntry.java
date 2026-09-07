package com.hanghai.kchtg.beacon.dto;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Một dòng nhật ký thay đổi/phê duyệt của Đèn biển — đọc từ bảng dùng chung
 * infrastructure_history (giống HistoryEntry của /vts-operation-center).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeaconHistoryEntry {
    private UUID id;
    private ApprovalLevel approvalLevel;
    private String status;
    private String approvedBy;
    private String orgUnitName;
    private LocalDateTime approvedDate;
    private String reason;
    private String changedField;
    private String previousValue;
    private String newValue;
}
