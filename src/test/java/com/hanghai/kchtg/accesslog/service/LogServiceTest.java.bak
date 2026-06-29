package com.hanghai.kchtg.accesslog.service;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.dto.AccessLogResponse;
import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("LogService Unit Tests")
class LogServiceTest {

    @Mock
    private AccessLogService accessLogService;

    @Mock
    private AccessLogRepository repository;

    private LogService logService;

    private AccessLog sampleLog;
    private UUID logId;
    private UUID userId;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        logService = new LogService(accessLogService, repository, "", tempDir.toString());

        logId = UUID.randomUUID();
        userId = UUID.randomUUID();

        sampleLog = new AccessLog();
        sampleLog.setId(logId);
        sampleLog.setUserId(userId);
        sampleLog.setUsername("testuser");
        sampleLog.setAction("CREATE_USER");
        sampleLog.setModule("USER");
        sampleLog.setIpAddress("127.0.0.1");
        sampleLog.setUserAgent("Mozilla/5.0 \"Browser\"");
        sampleLog.setStatus(AccessLogStatus.SUCCESS);
        sampleLog.setDetail("HTTP 201 \"Created\"");
        sampleLog.setCreatedAt(LocalDateTime.now());
        sampleLog.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("findById should delegate to accessLogService")
    void findById_ShouldDelegate() {
        AccessLogResponse mockResponse = new AccessLogResponse(sampleLog);
        when(accessLogService.findById(logId)).thenReturn(mockResponse);

        AccessLogResponse response = logService.findById(logId);

        assertNotNull(response);
        assertEquals(logId, response.getId());
        verify(accessLogService).findById(logId);
    }

    @Test
    @DisplayName("findAll should delegate to accessLogService")
    void findAll_ShouldDelegate() {
        Pageable pageable = PageRequest.of(0, 20);
        AccessLogFilterRequest filter = new AccessLogFilterRequest();
        Page<AccessLogResponse> mockPage = new PageImpl<>(Collections.singletonList(new AccessLogResponse(sampleLog)));

        when(accessLogService.findAll(filter, pageable)).thenReturn(mockPage);

        Page<AccessLogResponse> response = logService.findAll(filter, pageable);

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        verify(accessLogService).findAll(filter, pageable);
    }

    @Test
    @DisplayName("exportToCsv should create a CSV file and escape double quotes")
    void exportToCsv_ShouldCreateFileAndEscapeQuotes() throws IOException {
        Pageable pageable = PageRequest.of(0, 20);
        AccessLogFilterRequest filter = new AccessLogFilterRequest();
        Page<AccessLogResponse> mockPage = new PageImpl<>(Collections.singletonList(new AccessLogResponse(sampleLog)));

        when(accessLogService.findAll(filter, pageable)).thenReturn(mockPage);

        String filePath = logService.exportToCsv(filter, pageable);
        assertNotNull(filePath);

        Path csvPath = Path.of(filePath);
        assertTrue(Files.exists(csvPath));

        List<String> lines = Files.readAllLines(csvPath);
        assertTrue(lines.size() >= 2);
        assertTrue(lines.get(0).contains("Username"));
        // Check escaping: Mozilla/5.0 "Browser" -> Mozilla/5.0 ""Browser""
        assertTrue(lines.get(1).contains("\"Mozilla/5.0 \"\"Browser\"\"\""));
        // Check escaping: HTTP 201 "Created" -> HTTP 201 ""Created""
        assertTrue(lines.get(1).contains("\"HTTP 201 \"\"Created\"\"\""));
    }

    @Test
    @DisplayName("alertOnFailures should return failure count and trigger alert above threshold")
    void alertOnFailures_ShouldReturnCountAndAlert() {
        when(repository.countByStatusAndCreatedAtAfter(eq(AccessLogStatus.FAILED), any(LocalDateTime.class)))
                .thenReturn(50L);

        int count = logService.alertOnFailures(10);
        assertEquals(50, count);

        // Alias call
        when(repository.countByStatusAndCreatedAtAfter(eq(AccessLogStatus.FAILED), any(LocalDateTime.class)))
                .thenReturn(120L);

        int aliasCount = logService.checkFailureAlerts();
        assertEquals(120, aliasCount);
    }

    @Test
    @DisplayName("cleanupOldLogs should delete old logs")
    void cleanupOldLogs_ShouldCallRepository() {
        when(repository.deleteByCreatedAtBefore(any(LocalDateTime.class))).thenReturn(15L);

        logService.cleanupOldLogs();

        verify(repository).deleteByCreatedAtBefore(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("getDailyStats should return daily stats grouping")
    void getDailyStats_ShouldReturnList() {
        List<Object[]> mockStats = Arrays.asList(
                new Object[]{AccessLogStatus.SUCCESS, 10L},
                new Object[]{AccessLogStatus.FAILED, 2L}
        );
        when(repository.countByStatusGroupedByStatus(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(mockStats);

        List<Object[]> stats = logService.getDailyStats();
        assertNotNull(stats);
        assertEquals(2, stats.size());
    }

    @Test
    @DisplayName("getTotalCount should return total count from repository")
    void getTotalCount_ShouldReturnCount() {
        when(repository.count()).thenReturn(100L);

        long count = logService.getTotalCount();
        assertEquals(100L, count);
    }
}
