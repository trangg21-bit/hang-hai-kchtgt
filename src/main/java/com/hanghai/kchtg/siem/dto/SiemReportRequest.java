package com.hanghai.kchtg.siem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request payload for triggering a new SIEM report.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiemReportRequest {

    /** Required: export format — WORD, EXCEL, PDF, HTML, XML. */
    private String format;

    /** Optional: scheduled flag. Default false (ad-hoc). */
    private boolean scheduled;

    /** Optional: cron expression when scheduled=true. */
    private String cronExpression;

    /** Optional: user who triggered the report. Defaults to "system". */
    private UUID createdBy;
}
