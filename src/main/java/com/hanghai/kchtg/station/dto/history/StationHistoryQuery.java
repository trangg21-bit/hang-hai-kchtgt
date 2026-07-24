package com.hanghai.kchtg.station.dto.history;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Query DTO cho việc lọc kết quả lịch sử trạm (F-084 / F-090).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StationHistoryQuery {

    private String tramType;
    private UUID entityId;
    private String actionType;
    private Long changedBy;
    private LocalDateTime from;
    private LocalDateTime to;
}
