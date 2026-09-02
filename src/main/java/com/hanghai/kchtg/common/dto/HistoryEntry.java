package com.hanghai.kchtg.common.dto;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO dùng chung cho nhật ký phê duyệt / thay đổi (Lịch sử) của mọi đối tượng
 * hạ tầng. Shape khớp {@code HistoryEntry} của vtssystem/aissystem/... và là
 * dữ liệu mà component FE {@code HistoryDrawer} tiêu thụ (đã phân giải tên
 * người thực hiện + đơn vị, thay cho UUID).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryEntry {
    private UUID id;
    private ApprovalLevel approvalLevel;
    /** Mã trạng thái lịch sử (InfrastructureHistoryStatus.getCode()). */
    private String status;
    /** Tên người thực hiện (đã phân giải), không trả về UUID. */
    private String approvedBy;
    /** Tên đơn vị của người thực hiện. */
    private String orgUnitName;
    private LocalDateTime approvedDate;
    private String reason;
    private String changedField;
    private String previousValue;
    private String newValue;
}
