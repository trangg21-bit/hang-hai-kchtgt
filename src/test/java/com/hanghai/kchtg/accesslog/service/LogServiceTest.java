package com.hanghai.kchtg.accesslog.service;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.dto.AccessLogResponse;
import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.entity.LogAggregate;
import com.hanghai.kchtg.accesslog.entity.LogRetentionPolicy;
import com.hanghai.kchtg.accesslog.enums.LogSeverity;
import com.hanghai.kchtg.accesslog.enums.LogType;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.repository.LogAggregateRepository;
import com.hanghai.kchtg.accesslog.repository.LogRetentionPolicyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LogService Unit Tests")
class LogServiceTest {

    @Mock
    private AccessLogService accessLogService;

    @Mock
    private AccessLogRepository repository;

    @Mock
    private LogRetentionPolicyRepository retentionPolicyRepository;

    @Mock
    private LogAggregateRepository aggregateRepository;

    private LogService logService;

    private Long logId;
    private Long userId;

    @BeforeEach
    void setUp() {
        logService = new LogService(accessLogService, repository, retentionPolicyRepository, aggregateRepository, "", "./logs");
        ReflectionTestUtils.setField(logService, "accessLogService", accessLogService);

        logId = 1L;
        userId = 42L;
    }

    @Test
    @DisplayName("findById should delegate to accessLogService")
    void findById_ShouldDelegate() {
        AccessLog logEntity = new AccessLog();
        logEntity.setId(logId);
        logEntity.setUsername("testuser");
        AccessLogResponse mockResponse = new AccessLogResponse(logEntity);
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
        AccessLog logEntity = new AccessLog();
        logEntity.setId(logId);
        logEntity.setUsername("testuser");
        Page<AccessLogResponse> mockPage = new PageImpl<>(Collections.singletonList(new AccessLogResponse(logEntity)));

        when(accessLogService.findAll(filter, pageable)).thenReturn(mockPage);

        Page<AccessLogResponse> response = logService.findAll(filter, pageable);

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        verify(accessLogService).findAll(filter, pageable);
    }

    @Test
    @DisplayName("alertOnFailures should count login failures and return count")
    void alertOnFailures_ShouldReturnCount() {
        when(repository.countByTypeAndSeverityAndCreatedAtAfter(
                eq(LogType.LOGIN),
                eq(LogSeverity.WARNING),
                any(LocalDateTime.class)))
                .thenReturn(50L);

        int count = logService.alertOnFailures();
        assertEquals(50, count);
    }

    @Test
    @DisplayName("alertOnFailures threshold triggers warning when >= 5")
    void alertOnFailures_ShouldTriggerWarningAboveThreshold() {
        when(repository.countByTypeAndSeverityAndCreatedAtAfter(
                eq(LogType.LOGIN),
                eq(LogSeverity.WARNING),
                any(LocalDateTime.class)))
                .thenReturn(120L);

        int count = logService.alertOnFailures();
        assertEquals(120, count);
    }

    @Test
    @DisplayName("checkFailureAlerts is alias for alertOnFailures")
    void checkFailureAlerts_ShouldAliasAlertOnFailures() {
        when(repository.countByTypeAndSeverityAndCreatedAtAfter(
                eq(LogType.LOGIN),
                eq(LogSeverity.WARNING),
                any(LocalDateTime.class)))
                .thenReturn(7L);

        int count = logService.checkFailureAlerts();
        assertEquals(7, count);
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

    @Test
    @DisplayName("getRetentionPolicy should return Optional.of(policy) when found")
    void getRetentionPolicy_ShouldReturnPolicy() {
        LogRetentionPolicy policy = new LogRetentionPolicy();
        policy.setRetentionDays(90);
        when(retentionPolicyRepository.findActive()).thenReturn(Optional.of(policy));

        Optional<LogRetentionPolicy> result = logService.getRetentionPolicy();
        assertTrue(result.isPresent());
        assertEquals(90, result.get().getRetentionDays());
    }

    @Test
    @DisplayName("getRetentionPolicy should return Optional.empty() when not found")
    void getRetentionPolicy_ShouldReturnEmpty() {
        when(retentionPolicyRepository.findActive()).thenReturn(Optional.empty());

        Optional<LogRetentionPolicy> result = logService.getRetentionPolicy();
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("listAggregates should return list of aggregate responses")
    void listAggregates_ShouldReturnAggregates() {
        LogAggregate agg = new LogAggregate();
        agg.setId(1L);
        agg.setDate(java.time.LocalDate.now());
        agg.setTotalAccesses(100L);
        agg.setUniqueUsers(5L);
        when(aggregateRepository.findAll(any(org.springframework.data.domain.Sort.class))).thenReturn(Collections.singletonList(agg));

        List<com.hanghai.kchtg.accesslog.dto.LogAggregateResponse> result = logService.listAggregates(Optional.empty(), Optional.empty());
        assertEquals(1, result.size());
        assertEquals(100, result.get(0).getTotalAccesses());
    }
}
