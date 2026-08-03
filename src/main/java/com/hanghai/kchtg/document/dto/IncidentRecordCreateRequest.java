package com.hanghai.kchtg.document.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentRecordCreateRequest {

    @NotNull
    private UUID incidentId;

    private String detailedDescription;

    private String remedialMeasures;

    private LocalDateTime processingEndTime;

    private String recorder;

    private String attachedDocuments;
}
