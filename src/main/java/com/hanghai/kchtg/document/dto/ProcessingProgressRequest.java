package com.hanghai.kchtg.document.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for updating ProcessingProgress progress.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingProgressRequest {

    @NotNull(message = "incidentId không được để trống")
    private java.util.UUID incidentId;

    private LocalDateTime updatedAt;
    private String progressDescription;

    @NotBlank(message = "updatedBy không được để trống")
    private String updatedBy;
}
