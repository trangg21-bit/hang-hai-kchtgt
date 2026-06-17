package com.hanghai.kchtg.accesslog;

import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.service.AccessLogService;
import com.hanghai.kchtg.accesslog.controller.LogExportController;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccessLogServiceTest {

    @Mock
    private com.hanghai.kchtg.accesslog.repository.AccessLogRepository accessLogRepository;

    @InjectMocks
    private AccessLogService accessLogService;

    @InjectMocks
    private LogExportController controller;

    private AccessLog testLog = new AccessLog();
    private List<AccessLog> logs = List.of(testLog);

    @Test
    void filterByStatus_shouldReturnFilteredLogs() {
        when(accessLogRepository.findByStatus(any(), any())).thenReturn(new PageImpl<>(logs));

        Page<AccessLog> result = accessLogService.filterByStatus(
            com.hanghai.kchtg.accesslog.entity.AccessLogStatus.SUCCESS, PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void filterByUsername_shouldReturnFilteredLogs() {
        when(accessLogRepository.findByUsernameContaining(anyString(), any())).thenReturn(new PageImpl<>(logs));

        Page<AccessLog> result = accessLogService.filterByUsername("john", PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void filterByDateRange_shouldReturnFilteredLogs() {
        when(accessLogRepository.findByCreatedAtBetween(any(), any(), any())).thenReturn(new PageImpl<>(logs));

        Page<AccessLog> result = accessLogService.filterByDateRange(
            java.time.LocalDateTime.now().minusDays(7),
            java.time.LocalDateTime.now(),
            PageRequest.of(0, 20));

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void cleanupOldLogs_shouldDeleteRecords() {
        when(accessLogRepository.countOlderThan(any())).thenReturn(100L);
        when(accessLogRepository.deleteOlderThan(any())).thenReturn(100);

        int deleted = accessLogService.cleanupOldLogs(90);

        assertEquals(100, deleted);
        verify(accessLogRepository).deleteOlderThan(any());
    }

    @Test
    void exportCsv_shouldReturnByteArray() {
        when(accessLogRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(logs));

        byte[] result = accessLogService.exportCsv(20);

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    void getFailureRate_shouldCalculateCorrectly() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("success", 40L);
        stats.put("failure", 60L);
        when(accessLogRepository.getFailureStats(any(), any())).thenReturn(stats);

        double rate = accessLogService.getFailureRate(
            java.time.LocalDateTime.now().minusHours(1));

        assertEquals(60.0, rate, 0.1);
    }
}
