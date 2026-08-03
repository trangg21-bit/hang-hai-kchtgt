package com.hanghai.kchtg.datasharingaggregation.dto;

import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class CreateDataSharingAggregationRequest {

    @NotNull
    private SharingType sharingType;

    private String targetSystem;

    private String sharePeriod;

    @NotBlank
    private String dataPayload;

    private LocalDateTime shareDate;

    private UUID createdBy;
}
