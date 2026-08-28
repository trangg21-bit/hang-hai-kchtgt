package com.hanghai.kchtg.port.dto.buoyberth;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * History entry trả về cho màn Lịch sử thay đổi — cùng cấu trúc với
 * HistoryEntry của Hệ thống VTS CHK (vtssystem/dto/HistoryEntry).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryEntry {
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
