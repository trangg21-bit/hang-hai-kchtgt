package com.hanghai.kchtg.siem.dto;

import com.hanghai.kchtg.siem.entity.SiemReport;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO returned to the caller for a generated SIEM report.
 * Never exposes the raw content bytes over the API.
 */
@Getter
public class SiemReportResponse {

    private final UUID id;
    private final String format;
    private final String status;
    private final int version;
    private final long fileSizeBytes;
    private final String createdBy;
    private final LocalDateTime generatedAt;
    private final boolean scheduled;
    private final String contentType;

    public static SiemReportResponse fromEntity(SiemReport report) {
        return new SiemReportResponse(
                report.getId(),
                report.getFormat(),
                report.getStatus().name(),
                report.getVersion(),
                report.getFileSizeBytes(),
                report.getCreatedBy(),
                report.getGeneratedAt(),
                report.isScheduled(),
                report.getContentType()
        );
    }

    public SiemReportResponse(UUID id, String format, String status, int version,
                              long fileSizeBytes, String createdBy, LocalDateTime generatedAt,
                              boolean scheduled, String contentType) {
        this.id = id;
        this.format = format;
        this.status = status;
        this.version = version;
        this.fileSizeBytes = fileSizeBytes;
        this.createdBy = createdBy;
        this.generatedAt = generatedAt;
        this.scheduled = scheduled;
        this.contentType = contentType;
    }
}
