package com.hanghai.kchtg.nhatram.dto.history;

import com.hanghai.kchtg.nhatram.entity.NhaTramHistoryActionType;
import com.hanghai.kchtg.nhatram.entity.NhaTramType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Query DTO cho việc lọc kết quả lịch sử nhà trạm (F-084 / F-090).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NhaTramHistoryQuery {

    private NhaTramType tramType;
    private UUID entityId;
    private NhaTramHistoryActionType actionType;
    private Long changedBy;
    private LocalDateTime from;
    private LocalDateTime to;
}
