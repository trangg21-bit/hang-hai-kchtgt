package com.hanghai.kchtg.tai.dto.history;

import com.hanghai.kchtg.tai.entity.TaiHistoryActionType;
import com.hanghai.kchtg.tai.entity.TaiType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO cho kết quả truy vấn lịch sử đài thông tin (M-015).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiHistoryResponse {

    private UUID id;
    private String entityName;
    private TaiType taiType;
    private UUID entityId;
    private TaiHistoryActionType actionType;
    private String changedField;
    private String previousValue;
    private String newValue;
    private UUID changedBy;
    private String changedByName;
    private Instant changedAt;
    private String reason;
}
