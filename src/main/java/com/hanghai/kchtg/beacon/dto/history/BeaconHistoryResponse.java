package com.hanghai.kchtg.beacon.dto.history;

import com.hanghai.kchtg.beacon.entity.BeaconHistoryActionType;
import com.hanghai.kchtg.beacon.entity.BeaconType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for BeaconHistory query results (F-073 / F-079).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeaconHistoryResponse {

    private UUID id;
    private BeaconType beaconType;
    private UUID entityId;
    private BeaconHistoryActionType actionType;
    private String changedField;
    private String previousValue;
    private String newValue;
    private Long changedBy;
    private String changedByName;
    private LocalDateTime changedAt;
    private String reason;
    private String diffData;
}
