package com.hanghai.kchtg.siem.service;

import com.hanghai.kchtg.siem.dto.SiemReportRequest;
import com.hanghai.kchtg.siem.dto.SiemReportResponse;
import com.hanghai.kchtg.siem.entity.SiemReport;
import com.hanghai.kchtg.siem.entity.SiemReportStatus;
import com.hanghai.kchtg.siem.repository.SiemReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SiemReportService Unit Tests (F-283)")
class SiemReportServiceTest {

    @Mock
    private SiemReportRepository reportRepository;

    @InjectMocks
    private SiemReportService siemReportService;

    private UUID testReportId;

    @BeforeEach
    void setUp() {
        testReportId = UUID.randomUUID();
    }

    @Test
    @DisplayName("generateReport_shouldCreatePendingReportAndReturnMetadata")
    void generateReport_ShouldCreatePendingReport() {
        when(reportRepository.save(any(SiemReport.class))).thenAnswer(invocation -> {
            SiemReport report = invocation.getArgument(0);
            report.setId(testReportId);
            return report;
        });
        when(reportRepository.findByFormatAndStatus(anyString(), any())).thenReturn(List.of());

        SiemReportRequest request = new SiemReportRequest();
        request.setFormat("PDF");
        request.setCreatedBy("admin@test.com");

        SiemReportResponse response = siemReportService.generateReport(request);

        assertNotNull(response);
        assertEquals(testReportId, response.getId());
        assertEquals("PDF", response.getFormat());
        assertEquals("PENDING", response.getStatus());
        assertEquals(1, response.getVersion());
        assertEquals("admin@test.com", response.getCreatedBy());
        verify(reportRepository).save(any(SiemReport.class));
    }

    @Test
    @DisplayName("generateReport_shouldIncrementVersionForExistingReports")
    void generateReport_ShouldIncrementVersion() {
        SiemReport existingReport = new SiemReport();
        existingReport.setId(UUID.randomUUID());
        existingReport.setFormat("PDF");
        existingReport.setStatus(SiemReportStatus.COMPLETED);
        existingReport.setVersion(3);

        when(reportRepository.findByFormatAndStatus(eq("PDF"), eq(SiemReportStatus.PENDING)))
                .thenReturn(List.of(existingReport));
        when(reportRepository.save(any(SiemReport.class))).thenAnswer(invocation -> {
            SiemReport report = invocation.getArgument(0);
            report.setId(testReportId);
            return report;
        });

        SiemReportRequest request = new SiemReportRequest();
        request.setFormat("PDF");
        request.setCreatedBy("scheduler");

        SiemReportResponse response = siemReportService.generateReport(request);

        assertNotNull(response);
        assertEquals(4, response.getVersion()); // 3 + 1
    }

    @Test
    @DisplayName("finalizeReport_shouldUpdateStatusToCompleted")
    void finalizeReport_ShouldUpdateToCompleted() {
        SiemReport pendingReport = new SiemReport();
        pendingReport.setId(testReportId);
        pendingReport.setFormat("WORD");
        pendingReport.setStatus(SiemReportStatus.PENDING);
        pendingReport.setVersion(1);

        when(reportRepository.findById(testReportId)).thenReturn(Optional.of(pendingReport));
        when(reportRepository.save(any(SiemReport.class))).thenAnswer(invocation -> {
            SiemReport r = invocation.getArgument(0);
            return r;
        });

        byte[] content = "PDF content mock".getBytes();
        String contentType = "application/pdf";

        siemReportService.finalizeReport(testReportId, content, contentType);

        assertEquals(SiemReportStatus.COMPLETED, pendingReport.getStatus());
        assertArrayEquals(content, pendingReport.getContent());
        assertEquals(contentType, pendingReport.getContentType());
        assertEquals(content.length, pendingReport.getFileSizeBytes());
        verify(reportRepository).save(pendingReport);
    }

    @Test
    @DisplayName("finalizeReport_shouldThrowWhenReportNotPending")
    void finalizeReport_ShouldThrowIfNotPending() {
        SiemReport completedReport = new SiemReport();
        completedReport.setId(testReportId);
        completedReport.setStatus(SiemReportStatus.COMPLETED);

        when(reportRepository.findById(testReportId)).thenReturn(Optional.of(completedReport));

        assertThrows(IllegalStateException.class,
                () -> siemReportService.finalizeReport(testReportId, new byte[0], "text/plain"));
    }

    @Test
    @DisplayName("finalizeReport_shouldThrowWhenReportNotFound")
    void finalizeReport_ShouldThrowIfNotFound() {
        when(reportRepository.findById(testReportId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> siemReportService.finalizeReport(testReportId, new byte[0], "text/plain"));
    }

    @Test
    @DisplayName("getReportById_shouldReturnReport")
    void getReportById_ShouldReturnReport() {
        SiemReport report = new SiemReport();
        report.setId(testReportId);
        report.setFormat("EXCEL");
        report.setStatus(SiemReportStatus.COMPLETED);
        report.setVersion(2);

        when(reportRepository.findById(testReportId)).thenReturn(Optional.of(report));

        SiemReport found = siemReportService.getReportById(testReportId);

        assertNotNull(found);
        assertEquals(testReportId, found.getId());
        assertEquals("EXCEL", found.getFormat());
    }

    @Test
    @DisplayName("getReportById_shouldThrowWhenNotFound")
    void getReportById_ShouldThrowIfNotFound() {
        when(reportRepository.findById(testReportId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> siemReportService.getReportById(testReportId));
    }

    @Test
    @DisplayName("markReportFailed_shouldSetStatusToFailed")
    void markReportFailed_ShouldSetStatusToFailed() {
        SiemReport report = new SiemReport();
        report.setId(testReportId);
        report.setStatus(SiemReportStatus.PENDING);
        report.setVersion(1);

        when(reportRepository.findById(testReportId)).thenReturn(Optional.of(report));
        when(reportRepository.save(any(SiemReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        siemReportService.markReportFailed(testReportId, "Export engine timeout");

        assertEquals(SiemReportStatus.FAILED, report.getStatus());
        verify(reportRepository).save(report);
    }

    @Test
    @DisplayName("createFilename_shouldReturnFormattedFilename")
    void createFilename_ShouldReturnFormattedFilename() {
        String filename = siemReportService.createFilename("PDF");

        assertNotNull(filename);
        assertTrue(filename.startsWith("siem_report_"));
        assertTrue(filename.endsWith(".pdf"));
    }

    @Test
    @DisplayName("listReportsByFormat_shouldReturnFilteredReports")
    void listReportsByFormat_ShouldReturnFiltered() {
        SiemReport r1 = new SiemReport();
        r1.setId(UUID.randomUUID());
        r1.setFormat("PDF");
        r1.setStatus(SiemReportStatus.COMPLETED);
        r1.setVersion(1);

        SiemReport r2 = new SiemReport();
        r2.setId(UUID.randomUUID());
        r2.setFormat("WORD");
        r2.setStatus(SiemReportStatus.COMPLETED);
        r2.setVersion(1);

        when(reportRepository.findByFormat(eq("PDF"))).thenReturn(List.of(r1));

        List<SiemReportResponse> result = siemReportService.listReportsByFormat("pdf");

        assertEquals(1, result.size());
        assertEquals("PDF", result.get(0).getFormat());
    }
}
