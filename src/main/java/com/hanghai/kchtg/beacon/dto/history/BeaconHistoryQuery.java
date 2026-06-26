package com.hanghai.kchtg.beacon.dto.history;

import com.hanghai.kchtg.beacon.entity.BeaconHistoryActionType;
import com.hanghai.kchtg.beacon.entity.BeaconType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Query DTO for filtering BeaconHistory results (F-073 / F-079).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeaconHistoryQuery {

    private BeaconType beaconType;
    private UUID entityId;
    private BeaconHistoryActionType actionType;
    private Long changedBy;
    private LocalDateTime from;
    private LocalDateTime to;
}
