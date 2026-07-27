package com.hanghai.kchtg.siem.service;

import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.lockout.repository.UserLockoutRepository;
import com.hanghai.kchtg.siem.dto.SiemMetricsResponse;
import com.hanghai.kchtg.user.repository.LoginAuditLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class SiemServiceTest {

    @Mock
    private AccessLogRepository accessLogRepository;

    @Mock
    private LoginAuditLogRepository loginAuditLogRepository;

    @Mock
    private UserLockoutRepository userLockoutRepository;

    @InjectMocks
    private SiemService siemService;

    @Test
    void getMetrics_shouldCalculateCorrectAggregations() {
        when(accessLogRepository.count()).thenReturn(100L);
        when(loginAuditLogRepository.count()).thenReturn(50L);

        when(accessLogRepository.countByCreatedAtAfter(any(LocalDateTime.class))).thenReturn(10L);
        when(loginAuditLogRepository.countByAttemptedAtAfter(any(LocalDateTime.class))).thenReturn(5L);

        when(accessLogRepository.countByStatus(AccessLogStatus.FAILED)).thenReturn(5L);
        when(accessLogRepository.countByStatus(AccessLogStatus.FAILURE)).thenReturn(0L);
        when(loginAuditLogRepository.countByResult(any())).thenReturn(2L);

        when(userLockoutRepository.countActiveLockouts(any(LocalDateTime.class))).thenReturn(3L);

        SiemMetricsResponse metrics = siemService.getMetrics();

        assertNotNull(metrics);
        assertEquals(150L, metrics.getTotalEventsCount());
        assertEquals(0.25, metrics.getEventsPerSecond(), 0.001); // (10 + 5) / 60
        assertEquals(4.666, metrics.getFailureRate(), 0.1); // 7 / 150 * 100
        assertEquals(3, metrics.getActiveAlertsCount());
    }

    @Test
    void exportWordReport_shouldProduceNonEmptyByteArray() throws IOException {
        List<AccessLog> logs = new ArrayList<>();
        AccessLog log = new AccessLog();
        log.setId(UUID.randomUUID());
        log.setUsername("testadmin");
        log.setAction("LOGIN");
        log.setModule("AUTH");
        log.setIpAddress("127.0.0.1");
        log.setStatus(AccessLogStatus.SUCCESS);
        log.setCreatedAt(LocalDateTime.now());
        logs.add(log);

        when(accessLogRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(logs));

        byte[] report = siemService.exportWordReport();
        assertNotNull(report);
        assertTrue(report.length > 0);
    }

    @Test
    void exportExcelReport_shouldProduceNonEmptyByteArray() throws IOException {
        List<AccessLog> logs = new ArrayList<>();
        AccessLog log = new AccessLog();
        log.setId(UUID.randomUUID());
        log.setUsername("testadmin");
        log.setAction("LOGIN");
        log.setModule("AUTH");
        log.setIpAddress("127.0.0.1");
        log.setStatus(AccessLogStatus.SUCCESS);
        log.setCreatedAt(LocalDateTime.now());
        logs.add(log);

        when(accessLogRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(logs));

        byte[] report = siemService.exportExcelReport();
        assertNotNull(report);
        assertTrue(report.length > 0);
    }

    @Test
    void exportPdfReport_shouldProduceNonEmptyByteArray() throws IOException {
        List<AccessLog> logs = new ArrayList<>();
        AccessLog log = new AccessLog();
        log.setId(UUID.randomUUID());
        log.setUsername("testadmin");
        log.setAction("LOGIN");
        log.setModule("AUTH");
        log.setIpAddress("127.0.0.1");
        log.setStatus(AccessLogStatus.SUCCESS);
        log.setCreatedAt(LocalDateTime.now());
        logs.add(log);

        when(accessLogRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(logs));

        byte[] report = siemService.exportPdfReport();
        assertNotNull(report);
        assertTrue(report.length > 0);
    }

    @Test
    void exportHtmlReport_shouldProduceNonEmptyByteArray() {
        List<AccessLog> logs = new ArrayList<>();
        AccessLog log = new AccessLog();
        log.setId(UUID.randomUUID());
        log.setUsername("testadmin");
        log.setAction("LOGIN");
        log.setModule("AUTH");
        log.setIpAddress("127.0.0.1");
        log.setStatus(AccessLogStatus.SUCCESS);
        log.setCreatedAt(LocalDateTime.now());
        logs.add(log);

        when(accessLogRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(logs));

        byte[] report = siemService.exportHtmlReport();
        assertNotNull(report);
        assertTrue(report.length > 0);
    }

    @Test
    void exportXmlReport_shouldProduceNonEmptyByteArray() {
        List<AccessLog> logs = new ArrayList<>();
        AccessLog log = new AccessLog();
        log.setId(UUID.randomUUID());
        log.setUsername("testadmin");
        log.setAction("LOGIN");
        log.setModule("AUTH");
        log.setIpAddress("127.0.0.1");
        log.setStatus(AccessLogStatus.SUCCESS);
        log.setCreatedAt(LocalDateTime.now());
        logs.add(log);

        when(accessLogRepository.findAll(any(PageRequest.class))).thenReturn(new PageImpl<>(logs));

        byte[] report = siemService.exportXmlReport();
        assertNotNull(report);
        assertTrue(report.length > 0);
    }
}
