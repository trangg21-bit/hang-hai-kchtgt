package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Diễn biến sự cố row response (F-131 child incident_evolution).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class IncidentEvolutionResponse {

    private UUID id;
    private String event;
    private LocalDate fromDate;
    private LocalDate toDate;
}
