package com.hanghai.kchtg.station.dto.history;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho kết quả truy vấn lịch sử trạm (F-084 / F-090).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StationHistoryResponse {

    private UUID id;
    private String stationType;
    private UUID entityId;
    private String actionType;
    private String changedField;
    private String previousValue;
    private String newValue;
    private Long changedBy;
    private String changedByName;
    private LocalDateTime changedAt;
    private String reason;
    private String diffData;
}
