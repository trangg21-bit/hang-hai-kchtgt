package com.hanghai.kchtg.accesslog.controller;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.service.LogService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("LogExportController Unit Tests")
class LogExportControllerTest {

    @Mock
    private LogService logService;

    @InjectMocks
    private LogExportController controller;

    @Test
    @DisplayName("exportCsv should return StreamingResponseBody with attachment headers")
    void exportCsv_ShouldReturnStreamingResponseBody() {
        StreamingResponseBody dummyStream = out -> out.write("test".getBytes());
        when(logService.exportToCsvStreaming(any(AccessLogFilterRequest.class))).thenReturn(dummyStream);

        ResponseEntity<StreamingResponseBody> response = controller.exportCsv(
                1L,
                "USER",
                "CREATE_USER",
                null,
                null,
                null,
                null,
                null
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION).contains("access_logs_"));

        verify(logService).exportToCsvStreaming(any(AccessLogFilterRequest.class));
    }

    @Test
    @DisplayName("checkFailureAlerts should return count from service")
    void checkFailureAlerts_ShouldReturnCount() {
        when(logService.checkFailureAlerts()).thenReturn(5);

        ResponseEntity<ApiResponse<Integer>> response = controller.checkFailureAlerts();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(5, response.getBody().getData());

        verify(logService).checkFailureAlerts();
    }

    @Test
    @DisplayName("getDailyStats should return daily stats list")
    void getDailyStats_ShouldReturnList() {
        List<Object[]> mockStats = Collections.singletonList(new Object[]{"SUCCESS", 100L});
        when(logService.getDailyStats()).thenReturn(mockStats);

        ResponseEntity<ApiResponse<List<Object[]>>> response = controller.getDailyStats();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());

        verify(logService).getDailyStats();
    }

    @Test
    @DisplayName("getTotalCount should return total log count")
    void getTotalCount_ShouldReturnCount() {
        when(logService.getTotalCount()).thenReturn(500L);

        ResponseEntity<ApiResponse<Long>> response = controller.getTotalCount();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(500L, response.getBody().getData());

        verify(logService).getTotalCount();
    }
}
