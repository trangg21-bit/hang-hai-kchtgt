package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
