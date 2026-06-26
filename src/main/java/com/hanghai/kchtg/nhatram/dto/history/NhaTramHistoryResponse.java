package com.hanghai.kchtg.nhatram.dto.history;

import com.hanghai.kchtg.nhatram.entity.NhaTramHistoryActionType;
import com.hanghai.kchtg.nhatram.entity.NhaTramType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho kết quả truy vấn lịch sử nhà trạm (F-084 / F-090).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NhaTramHistoryResponse {

    private UUID id;
    private NhaTramType tramType;
    private UUID entityId;
    private NhaTramHistoryActionType actionType;
    private String changedField;
    private String previousValue;
    private String newValue;
    private Long changedBy;
    private String changedByName;
    private LocalDateTime changedAt;
    private String reason;
    private String diffData;
}
