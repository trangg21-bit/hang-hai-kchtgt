package com.hanghai.kchtg.report.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Search request DTO for BCC_157 (F-142) reports.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bcc157SearchRequest {

    private UUID orgUnitId;
    private Integer reportYear;
    private String nguonDuLieu;
}
