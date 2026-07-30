package com.hanghai.kchtg.datasharingaggregation.dto;

import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class UpdateDataSharingAggregationRequest {

    private String targetSystem;

    private String sharePeriod;

    private String dataPayload;

    private SharingStatus status;

    private String errorMessage;

    private UUID updatedBy;
}
