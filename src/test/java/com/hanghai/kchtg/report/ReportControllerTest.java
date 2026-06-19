package com.hanghai.kchtg.report;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.report.controller.ReportController;
import com.hanghai.kchtg.report.dto.ReportRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReportController Unit Tests")
public class ReportControllerTest {

    @Mock
    private ReportService reportService;

    @InjectMocks
    private ReportController reportController;

    private ReportResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleResponse = ReportResponse.builder()
                .reportCode("F-141")
                .reportName("Báo cáo tăng giảm tài sản")
                .headers(Collections.singletonList("Tên tài sản"))
                .rows(Collections.emptyList())
                .summary(Collections.emptyMap())
                .build();
    }

    @Nested
    @DisplayName("POST /preview Endpoint")
    class PreviewEndpoint {

        @Test
        @DisplayName("Should return 200 OK with report preview data")
        void getReportPreview_returns200() {
            ReportRequest request = ReportRequest.builder()
                    .reportCode("F-141")
                    .format("PREVIEW")
                    .build();

            when(reportService.generateReportPreview(any(ReportRequest.class))).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<ReportResponse>> response = reportController.getReportPreview(request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals("F-141", response.getBody().getData().getReportCode());
            verify(reportService).generateReportPreview(any(ReportRequest.class));
        }
    }

    @Nested
    @DisplayName("POST /export Endpoint")
    class ExportEndpoint {

        @Test
        @DisplayName("Should return 200 OK with binary download headers")
        void exportReport_returnsFileBytes() {
            ReportRequest request = ReportRequest.builder()
                    .reportCode("F-141")
                    .format("EXCEL")
                    .build();

            byte[] mockBytes = "mock data".getBytes();
            when(reportService.exportReport(any(ReportRequest.class))).thenReturn(mockBytes);

            ResponseEntity<byte[]> response = reportController.exportReport(request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getHeaders().containsKey(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION));
            assertTrue(response.getHeaders().getFirst(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION).contains("baocao_f-141_"));
            verify(reportService).exportReport(any(ReportRequest.class));
        }
    }
}
