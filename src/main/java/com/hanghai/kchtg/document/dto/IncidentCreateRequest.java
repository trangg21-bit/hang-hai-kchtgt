package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.SeverityLevel;
import com.hanghai.kchtg.document.entity.ProcessingStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a Incident record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentCreateRequest {

    @NotBlank(message = "location không được để trống")
    private String location;

    private String discoveryTime;
    private String description;
    private SeverityLevel severityLevel;
    private ProcessingStatus processingStatus;
    private String reporter;
}
