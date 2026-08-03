package com.hanghai.kchtg.document.dto;

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
public class IncidentRecordResponse {

    private UUID id;
    private java.util.UUID incidentId;
    private String detailedDescription;
    private String remedialMeasures;
    private LocalDateTime processingEndTime;
    private String recorder;
    private LocalDateTime recordedAt;
    private String attachedDocuments;
}
