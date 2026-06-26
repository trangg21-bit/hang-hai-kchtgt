package com.hanghai.kchtg.siem.service;

import com.hanghai.kchtg.siem.dto.SiemReportRequest;
import com.hanghai.kchtg.siem.dto.SiemReportResponse;
import com.hanghai.kchtg.siem.entity.SiemReport;
import com.hanghai.kchtg.siem.entity.SiemReportStatus;
import com.hanghai.kchtg.siem.repository.SiemReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Dedicated service for F-283: SIEM Report generation, scheduling, and versioning.
 * <p>
 * Previously, all export logic lived in SiemService alongside real-time metrics.
 * This service is responsible for creating versioned report records, persisting them,
 * and supporting scheduled report generation via cron expressions.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SiemReportService {

    private final SiemReportRepository reportRepository;

    /**
     * Generates a new SIEM report by delegating to SiemService's export methods,
     * then persists the result as a versioned report record.
     *
     * @param request the report generation request
     * @return the generated report metadata (without raw content)
     */
    @Transactional
    public SiemReportResponse generateReport(SiemReportRequest request) {
        String format = normalizeFormat(request.getFormat());
        String createdBy = request.getCreatedBy() != null ? request.getCreatedBy() : "system";
        boolean isScheduled = request.isScheduled();
        String cronExpression = request.getCronExpression();

        // Create the report record with PENDING status
        SiemReport report = new SiemReport();
        report.setFormat(format);
        report.setStatus(SiemReportStatus.PENDING);
        report.setScheduled(isScheduled);
        report.setCronExpression(cronExpression);
        report.setCreatedBy(createdBy);
        report.setGeneratedAt(LocalDateTime.now());

        // Calculate version: next version for this format/status combination
        int version = calculateNextVersion(format, SiemReportStatus.PENDING);
        report.setVersion(version);

        reportRepository.save(report);
        log.info("SIEM report {}-v{} generated in PENDING status by user {}",
                report.getId(), report.getVersion(), createdBy);

        return SiemReportResponse.fromEntity(report);
    }

    /**
     * Updates a report's content and finalizes its status to COMPLETED.
     *
     * @param reportId the UUID of the report to finalize
     * @param content  the generated file bytes
     * @param contentType the MIME type
     */
    @Transactional
    public void finalizeReport(UUID reportId, byte[] content, String contentType) {
        SiemReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));

        if (report.getStatus() != SiemReportStatus.PENDING) {
            throw new IllegalStateException("Report is not in PENDING status: " + report.getStatus());
        }

        report.setContent(content);
        report.setContentType(contentType);
        report.setFileSizeBytes(content.length);
        report.setStatus(SiemReportStatus.COMPLETED);
        report.setGeneratedAt(LocalDateTime.now());

        reportRepository.save(report);
        log.info("SIEM report {}-v{} finalized as COMPLETED, size={} bytes",
                report.getId(), report.getVersion(), content.length);
    }

    /**
     * Retrieves a report by its UUID.
     *
     * @param reportId the UUID of the report
     * @return the report record
     */
    @Transactional(readOnly = true)
    public SiemReport getReportById(UUID reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
    }

    /**
     * Returns a report metadata DTO (without content) for API responses.
     */
    @Transactional(readOnly = true)
    public SiemReportResponse getReportMetadata(UUID reportId) {
        SiemReport report = getReportById(reportId);
        return SiemReportResponse.fromEntity(report);
    }

    /**
     * Lists all reports for a given format.
     */
    @Transactional(readOnly = true)
    public List<SiemReportResponse> listReportsByFormat(String format) {
        return reportRepository.findByFormat(normalizeFormat(format))
                .stream()
                .map(SiemReportResponse::fromEntity)
                .toList();
    }

    /**
     * Lists all reports in a given status.
     */
    @Transactional(readOnly = true)
    public List<SiemReportResponse> listReportsByStatus(SiemReportStatus status) {
        return reportRepository.findByStatus(status)
                .stream()
                .map(SiemReportResponse::fromEntity)
                .toList();
    }

    /**
     * Lists all scheduled reports ready for cron execution.
     */
    @Transactional(readOnly = true)
    public List<SiemReport> listScheduledReports() {
        return reportRepository.findByScheduledTrue();
    }

    /**
     * Marks a report as failed (e.g., if export threw an exception).
     */
    @Transactional
    public void markReportFailed(UUID reportId, String failureReason) {
        SiemReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));

        report.setStatus(SiemReportStatus.FAILED);
        report.setGeneratedAt(LocalDateTime.now());

        reportRepository.save(report);
        log.error("SIEM report {}-v{} marked as FAILED: {}",
                report.getId(), report.getVersion(), failureReason);
    }

    /**
     * Returns the next version number for a given format and status.
     * Versioning ensures reports can be rolled back to prior versions.
     */
    private int calculateNextVersion(String format, SiemReportStatus status) {
        List<SiemReport> existing = reportRepository.findByFormatAndStatus(format, status);
        int maxVersion = existing.stream()
                .mapToInt(SiemReport::getVersion)
                .max()
                .orElse(0);
        return maxVersion + 1;
    }

    /**
     * Normalizes the format string to upper-case canonical format names.
     */
    private String normalizeFormat(String format) {
        if (format == null) throw new IllegalArgumentException("Format must not be null");
        switch (format.toUpperCase()) {
            case "WORD":
            case "DOCX":
                return "WORD";
            case "EXCEL":
            case "XLSX":
                return "EXCEL";
            case "PDF":
                return "PDF";
            case "HTML":
                return "HTML";
            case "XML":
                return "XML";
            default:
                throw new IllegalArgumentException("Unsupported format: " + format);
        }
    }

    /**
     * Creates a filename from format and timestamp.
     */
    public String createFilename(String format) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return "siem_report_" + timestamp + "." + format.toLowerCase();
    }
}
