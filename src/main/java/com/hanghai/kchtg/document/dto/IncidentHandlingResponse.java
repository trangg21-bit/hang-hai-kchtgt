package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Chỉ đạo / xử lý sự cố row response (F-131 child incident_handling).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class IncidentHandlingResponse {

    private UUID id;
    private String handler;
    private String directiveContent;
    private LocalDate directiveDate;
    private String measure;
    private String result;
    private String note;
}
