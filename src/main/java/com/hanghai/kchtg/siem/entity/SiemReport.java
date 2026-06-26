package com.hanghai.kchtg.siem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents a generated SIEM report — versioned and tracked for audit.
 */
@Entity
@Table(name = "siem_reports")
@Getter
@Setter
@NoArgsConstructor
public class SiemReport {

    /** Unique report identifier. */
    private UUID id;

    /** Export format: WORD / EXCEL / PDF / HTML / XML. */
    @Column(nullable = false, length = 10)
    private String format;

    /** Status of the report generation lifecycle. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SiemReportStatus status;

    /** Report version number (auto-incremented per generated report instance). */
    @Column(nullable = false)
    private int version;

    /** The content bytes stored in DB (or S3 key, depending on scale). */
    @Column(columnDefinition = "LONGBLOB")
    private byte[] content;

    /** Content type (MIME type). */
    @Column(length = 100)
    private String contentType;

    /** File size in bytes. */
    @Column(nullable = false)
    private long fileSizeBytes;

    /** Name of the user who triggered this report. */
    @Column(length = 100)
    private String createdBy;

    /** The timestamp when the report was generated. */
    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    /** Scheduled execution flag. */
    @Column(name = "is_scheduled", nullable = false)
    private boolean scheduled;

    /** Cron expression if this is a scheduled report (null = ad-hoc). */
    @Column(name = "cron_expression", length = 50)
    private String cronExpression;
}
