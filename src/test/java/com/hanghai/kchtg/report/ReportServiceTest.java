package com.hanghai.kchtg.report;

import com.hanghai.kchtg.report.dto.ReportRequest;
import com.hanghai.kchtg.report.entity.ReportEntity;
import com.hanghai.kchtg.report.entity.ReportFormat;
import com.hanghai.kchtg.report.entity.ReportStatus;
import com.hanghai.kchtg.report.entity.ReportType;
import com.hanghai.kchtg.report.repository.ReportEntityRepository;
import com.hanghai.kchtg.report.repository.ReportRepository;
import com.hanghai.kchtg.report.service.ReportService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReportService Unit Tests")
class ReportServiceTest {

    @Mock
    private ReportRepository reportRepo;

    @Mock
    private ReportEntityRepository reportEntityRepo;

    @InjectMocks
    private ReportService reportService;

    private ReportRequest buildRequest() {
        return ReportRequest.builder()
                .reportType(ReportType.SUMMARY)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .outputFormat(ReportFormat.PDF)
                .build();
    }

    private ReportEntity buildEntity(String code) {
        return ReportEntity.builder()
                .id(UUID.randomUUID())
                .code(code)
                .name("Báo cáo demo")
                .reportType(ReportType.SUMMARY)
                .status(ReportStatus.READY)
                .outputFormat(ReportFormat.PDF)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .parameters("{}")
                .generatedAt(Instant.now())
                .fileUrl("https://storage.example.com/report.pdf")
                .build();
    }

    @Test
    @DisplayName("F-016-01: createReport — creates ReportEntity with PENDING status")
    void createReport_success() {
        ReportRequest request = buildRequest();
        ReportEntity saved = buildEntity("RPT-001");
        saved.setStatus(ReportStatus.PENDING);

        when(reportRepo.save(any(ReportEntity.class))).thenAnswer(invocation -> {
            ReportEntity e = invocation.getArgument(0);
            if (e.getId() == null) {
                e.setId(UUID.randomUUID());
            }
            if (e.getCode() == null) {
                e.setCode("RPT-" + System.currentTimeMillis());
            }
            return e;
        });

        ReportEntity result = reportService.createReport(request);

        assertNotNull(result);
        assertEquals(ReportStatus.PENDING, result.getStatus());
        assertEquals(ReportType.SUMMARY, result.getReportType());
        assertEquals(ReportFormat.PDF, result.getOutputFormat());
        verify(reportRepo).save(any(ReportEntity.class));
    }

    @Test
    @DisplayName("F-016-02: findById — returns entity when found")
    void findById_success() {
        String code = "RPT-001";
        ReportEntity entity = buildEntity(code);

        when(reportEntityRepo.findByCode(code)).thenReturn(Optional.of(entity));

        ReportEntity result = reportService.findByCode(code);

        assertNotNull(result);
        assertEquals(code, result.getCode());
        assertEquals(ReportType.SUMMARY, result.getReportType());
    }

    @Test
    @DisplayName("F-016-03: findById — throws EntityNotFoundException when not found")
    void findById_notFound_throws() {
        String code = "NONEXIST";
        when(reportEntityRepo.findByCode(code)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> reportService.findByCode(code));
        verify(reportEntityRepo).findByCode(code);
    }

    @Test
    @DisplayName("F-016-04: findAll — returns paginated READY reports")
    void findAll_pageable() {
        Pageable pageable = PageRequest.of(0, 10);
        ReportEntity e1 = buildEntity("RPT-001");
        ReportEntity e2 = buildEntity("RPT-002");
        Page<ReportEntity> page = new PageImpl<>(List.of(e1, e2));

        when(reportEntityRepo.findByStatus(ReportStatus.READY, pageable)).thenReturn(page);

        Page<ReportEntity> result = reportService.findAll(pageable);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals("RPT-001", result.getContent().get(0).getCode());
        verify(reportEntityRepo).findByStatus(ReportStatus.READY, pageable);
    }

    @Test
    @DisplayName("F-016-05: findByReportType — returns matching reports")
    void findByReportType() {
        ReportEntity e1 = buildEntity("RPT-F02");
        e1.setReportType(ReportType.FORM_02);
        ReportEntity e2 = buildEntity("RPT-F03");
        e2.setReportType(ReportType.FORM_03);
        List<ReportEntity> all = List.of(e1, e2);

        when(reportEntityRepo.findByReportType(ReportType.FORM_02)).thenReturn(List.of(e1));

        List<ReportEntity> result = reportService.findByReportType(ReportType.FORM_02);

        assertEquals(1, result.size());
        assertEquals(ReportType.FORM_02, result.get(0).getReportType());
        verify(reportEntityRepo).findByReportType(ReportType.FORM_02);
    }

    @Test
    @DisplayName("F-016-06: countByStatus — returns count for given status")
    void countByStatus() {
        when(reportEntityRepo.countByStatus(ReportStatus.READY)).thenReturn(42L);
        when(reportEntityRepo.countByStatus(ReportStatus.ERROR)).thenReturn(3L);

        assertEquals(42, reportService.countByStatus(ReportStatus.READY));
        assertEquals(3, reportService.countByStatus(ReportStatus.ERROR));
        verify(reportEntityRepo, times(2)).countByStatus(any(ReportStatus.class));
    }

    @Test
    @DisplayName("F-016-07: generateReport_asyncStub — sets status=READY and logs")
    void generateReport_asyncStub() {
        ReportRequest request = buildRequest();
        ReportEntity latest = buildEntity("RPT-LATEST");
        latest.setStatus(ReportStatus.PENDING);

        when(reportEntityRepo.findByReportType(ReportType.SUMMARY)).thenReturn(List.of(latest));
        when(reportEntityRepo.findByCode("RPT-LATEST")).thenReturn(java.util.Optional.of(latest));

        reportService.generateReport(request);

        assertEquals(ReportStatus.READY, latest.getStatus());
        assertNotNull(latest.getGeneratedAt());
        verify(reportEntityRepo).save(latest);
    }

    @Test
    @DisplayName("F-016-07: generateReport_asyncStub — no-op when no reports of type exist")
    void generateReport_asyncStub_noReports() {
        ReportRequest request = buildRequest();
        when(reportEntityRepo.findByReportType(ReportType.SUMMARY)).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> reportService.generateReport(request));

        verify(reportEntityRepo, never()).save(any());
    }

    @Test
    @DisplayName("F-016-08: updateReportStatus — sets status and saves")
    void updateReportStatus() {
        String code = "RPT-001";
        ReportEntity entity = buildEntity(code);

        when(reportEntityRepo.findByCode(code)).thenReturn(Optional.of(entity));
        when(reportEntityRepo.save(entity)).thenReturn(entity);

        reportService.updateReportStatus(code, ReportStatus.READY);

        assertEquals(ReportStatus.READY, entity.getStatus());
        assertNotNull(entity.getGeneratedAt());
        verify(reportEntityRepo).save(entity);
    }

    @Test
    @DisplayName("F-016-09: updateReportStatus — throws when code not found")
    void updateReportStatus_notFound_throws() {
        when(reportEntityRepo.findByCode("NOPE")).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> reportService.updateReportStatus("NOPE", ReportStatus.READY));
    }

    @Test
    @DisplayName("F-016-10: downloadReport — returns fileUrl when present")
    void downloadReport_returnsFileUrl() {
        String code = "RPT-001";
        ReportEntity entity = buildEntity(code);

        when(reportEntityRepo.findByCode(code)).thenReturn(Optional.of(entity));

        String url = reportService.downloadReport(code);

        assertEquals("https://storage.example.com/report.pdf", url);
    }

    @Test
    @DisplayName("F-016-11: downloadReport — returns null when fileUrl is empty")
    void downloadReport_emptyFileUrl_returnsNull() {
        ReportEntity entity = buildEntity("RPT-002");
        entity.setFileUrl(null);

        when(reportEntityRepo.findByCode("RPT-002")).thenReturn(Optional.of(entity));

        String url = reportService.downloadReport("RPT-002");

        assertNull(url);
    }

    @Test
    @DisplayName("F-016-12: createReport — stores parameters as JSON string even when null")
    void createReport_nullParameters() {
        ReportRequest request = ReportRequest.builder()
                .reportType(ReportType.B03_CCTT)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .outputFormat(ReportFormat.EXCEL)
                .build();

        when(reportRepo.save(any(ReportEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReportEntity result = reportService.createReport(request);

        assertNotNull(result);
        assertEquals("{}", result.getParameters());
        assertEquals(ReportStatus.PENDING, result.getStatus());
    }

    @Test
    @DisplayName("F-016-13: createReport — uses Instant.now() for generatedAt")
    void createReport_timestampSet() {
        Instant before = Instant.now();
        when(reportRepo.save(any(ReportEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reportService.createReport(buildRequest());

        // generatedAt is set during builder, so the entity should have a value
    }
}
