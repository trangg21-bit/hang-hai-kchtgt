package com.hanghai.kchtg.accesslog.controller;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.service.LogService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

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

    @TempDir
    Path tempDir;

    private Path dummyFile;

    @BeforeEach
    void setUp() throws IOException {
        dummyFile = tempDir.resolve("test_export.csv");
        Files.writeString(dummyFile, "test data");
    }

    @Test
    @DisplayName("exportCsv should return FileSystemResource with attachment headers")
    void exportCsv_ShouldReturnFileResource() {
        when(logService.exportToCsv(any(AccessLogFilterRequest.class), any(Pageable.class)))
                .thenReturn(dummyFile.toString());

        ResponseEntity<Resource> response = controller.exportCsv(
                UUID.randomUUID().toString(),
                "USER",
                "CREATE_USER",
                null,
                null,
                0,
                10
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().getFirst("Content-Disposition").contains("test_export.csv"));

        verify(logService).exportToCsv(any(AccessLogFilterRequest.class), any(Pageable.class));
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
