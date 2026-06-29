package com.hanghai.kchtg.siem.controller;

import com.hanghai.kchtg.siem.dto.SiemReportRequest;
import com.hanghai.kchtg.siem.dto.SiemReportResponse;
import com.hanghai.kchtg.siem.entity.SiemReportStatus;
import com.hanghai.kchtg.siem.service.SiemReportService;
import com.hanghai.kchtg.siem.service.SiemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SiemController Unit Tests (F-283)")
class SiemControllerTest {

    @Mock
    private SiemService siemService;

    @Mock
    private SiemReportService siemReportService;

    @InjectMocks
    private SiemController siemController;

    private UUID reportId;

    @BeforeEach
    void setUp() {
        reportId = UUID.randomUUID();
    }

    @Test
    @DisplayName("generateReport_shouldReturn200WithPendingReportMetadata")
    void generateReport_ShouldReturn200WithPendingMetadata() {
        SiemReportResponse responseDto = new SiemReportResponse(
                reportId, "PDF", "PENDING", 1, 0, "admin",
                LocalDateTime.now(), false, null
        );
        when(siemReportService.generateReport(any(SiemReportRequest.class))).thenReturn(responseDto);

        SiemReportRequest request = new SiemReportRequest();
        request.setFormat("PDF");

        ResponseEntity<?> result = siemController.generateReport(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    @DisplayName("generateReport_shouldReturn400WhenFormatIsNull")
    void generateReport_ShouldReturn400WhenFormatNull() {
        SiemReportRequest request = new SiemReportRequest();
        request.setFormat("");

        ResponseEntity<?> result = siemController.generateReport(request);

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    @DisplayName("getReport_shouldReturn200WithReportMetadata")
    void getReport_ShouldReturn200WithMetadata() {
        SiemReportResponse responseDto = new SiemReportResponse(
                reportId, "EXCEL", "COMPLETED", 2, 1024, "admin",
                LocalDateTime.now(), false, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        when(siemReportService.getReportMetadata(reportId)).thenReturn(responseDto);

        ResponseEntity<?> result = siemController.getReport(reportId);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    @DisplayName("getReport_shouldReturn404WhenNotFound")
    void getReport_ShouldReturn404WhenNotFound() {
        when(siemReportService.getReportMetadata(reportId))
                .thenThrow(new IllegalArgumentException("Report not found: " + reportId));

        ResponseEntity<?> result = siemController.getReport(reportId);

        assertEquals(HttpStatus.NOT_FOUND, result.getStatusCode());
    }

    @Test
    @DisplayName("generateReport_shouldReturn500OnError")
    void generateReport_ShouldReturn500OnError() {
        when(siemReportService.generateReport(any(SiemReportRequest.class)))
                .thenThrow(new RuntimeException("Export engine failure"));

        SiemReportRequest request = new SiemReportRequest();
        request.setFormat("PDF");

        ResponseEntity<?> result = siemController.generateReport(request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    @DisplayName("listReports_shouldReturn200WithReportList")
    void listReports_ShouldReturn200() {
        when(siemReportService.listReportsByStatus(any(SiemReportStatus.class)))
                .thenReturn(Collections.emptyList());

        ResponseEntity<?> result = siemController.listReports(null, null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(siemReportService).listReportsByStatus(SiemReportStatus.COMPLETED);
    }

    @Test
    @DisplayName("listReports_shouldFilterByFormat")
    void listReports_ShouldFilterByFormat() {
        when(siemReportService.listReportsByFormat(eq("PDF")))
                .thenReturn(Collections.emptyList());

        ResponseEntity<?> result = siemController.listReports("PDF", null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(siemReportService).listReportsByFormat("PDF");
    }

    @Test
    @DisplayName("listReports_shouldFilterByStatus")
    void listReports_ShouldFilterByStatus() {
        when(siemReportService.listReportsByStatus(eq(SiemReportStatus.FAILED)))
                .thenReturn(Collections.emptyList());

        ResponseEntity<?> result = siemController.listReports(null, "FAILED");

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(siemReportService).listReportsByStatus(SiemReportStatus.FAILED);
    }
}
