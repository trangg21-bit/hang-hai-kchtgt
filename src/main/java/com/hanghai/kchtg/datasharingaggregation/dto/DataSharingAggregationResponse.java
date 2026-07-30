package com.hanghai.kchtg.datasharingaggregation.dto;

import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class DataSharingAggregationResponse {

    private String id;
    private SharingType sharingType;
    private String targetSystem;
    private String sharePeriod;
    private String dataPayload;
    private SharingStatus status;
    private String errorMessage;
    private LocalDateTime shareDate;
    private int retryCount;
    private UUID createdBy;
    private LocalDateTime createdAt;
}
