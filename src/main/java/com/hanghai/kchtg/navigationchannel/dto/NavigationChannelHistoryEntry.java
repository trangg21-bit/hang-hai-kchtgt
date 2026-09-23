package com.hanghai.kchtg.navigationchannel.dto;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Một dòng nhật ký thay đổi/phê duyệt của luồng hàng hải (F-043).
 * <p>
 * Đồng bộ chuẩn /beacon-stations {@code BeaconHistoryEntry}: bổ sung {@code approvalLevel},
 * {@code orgUnitName} và cặp giá trị trước/sau để dựng đúng timeline nhóm theo lần cập nhật.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NavigationChannelHistoryEntry {

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
