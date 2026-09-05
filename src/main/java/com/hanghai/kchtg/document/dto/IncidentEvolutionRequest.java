package com.hanghai.kchtg.document.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Diễn biến sự cố row payload (F-131 child incident_evolution).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class IncidentEvolutionRequest {

    private UUID id;

    @NotNull(message = "event không được để trống")
    private String event;

    private LocalDate fromDate;
    private LocalDate toDate;
}
