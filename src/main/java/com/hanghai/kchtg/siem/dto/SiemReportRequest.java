package com.hanghai.kchtg.siem.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Request payload for triggering a new SIEM report.
 */
@Getter
@Setter
public class SiemReportRequest {

    /** Required: export format — WORD, EXCEL, PDF, HTML, XML. */
    private String format;

    /** Optional: scheduled flag. Default false (ad-hoc). */
    private boolean scheduled;

    /** Optional: cron expression when scheduled=true. */
    private String cronExpression;

    /** Optional: user who triggered the report. Defaults to "system". */
    private String createdBy;
}
