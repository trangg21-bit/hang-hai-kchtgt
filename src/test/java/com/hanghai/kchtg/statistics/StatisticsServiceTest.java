package com.hanghai.kchtg.statistics;

import com.hanghai.kchtg.statistics.dto.StatisticsFilter;
import com.hanghai.kchtg.statistics.dto.StatisticsFormRequest;
import com.hanghai.kchtg.statistics.dto.StatisticsFormResponse;
import com.hanghai.kchtg.statistics.dto.StatisticsSummary;
import com.hanghai.kchtg.statistics.entity.StatFormStatus;
import com.hanghai.kchtg.statistics.entity.StatFormType;
import com.hanghai.kchtg.statistics.entity.StatisticsForm;
import com.hanghai.kchtg.statistics.repository.StatisticsFormRepository;
import com.hanghai.kchtg.statistics.service.StatisticsService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StatisticsService Unit Tests — M-017 Wave 4")
class StatisticsServiceTest {

    @Mock
    private StatisticsFormRepository repository;

    @InjectMocks
    private StatisticsService statisticsService;

    // ------------------------------------------------------------------
    // Create
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-017-01: createForm — creates StatisticsForm with DRAFT status")
    void createForm_success() {
        StatisticsFormRequest request = StatisticsFormRequest.builder()
                .formCode("F01N-2026-06")
                .formType("PORT_THROUGHPUT")
                .reportingPeriod("2026-06")
                .build();

        StatisticsForm saved = StatisticsForm.builder()
                .id(1L)
                .code("S-001")
                .name("Bieu 01-N")
                .formCode("F01N-2026-06")
                .formType(StatFormType.PORT_THROUGHPUT)
                .formStatus(StatFormStatus.DRAFT)
                .reportingPeriod("2026-06")
                .createdAt(Instant.now())
                .build();

        when(repository.save(any(StatisticsForm.class))).thenReturn(saved);

        StatisticsFormResponse response = statisticsService.createForm(request);

        assertNotNull(response);
        assertEquals("F01N-2026-06", response.getFormCode());
        assertEquals("DRAFT", response.getFormStatus());
        verify(repository).save(any(StatisticsForm.class));
    }

    @Test
    @DisplayName("F-017-02: createForm_withAllFields — full request with all fields")
    void createForm_withAllFields() {
        StatisticsFormRequest request = StatisticsFormRequest.builder()
                .formCode("F02N-2026-06")
                .formType("DOCK_CAPACITY")
                .reportingPeriod("2026-06")
                .periodType("MONTHLY")
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2026, 6, 30))
                .totalValue(new BigDecimal("1500000000"))
                .totalUnits(500L)
                .portsCount(5)
                .vesselsCount(120)
                .parameters("{\"dockCount\": 10}")
                .notes("Kiem tra nam 2026")
                .build();

        StatisticsForm saved = StatisticsForm.builder()
                .id(2L)
                .code("S-002")
                .name("Bieu 02-N")
                .formCode("F02N-2026-06")
                .formType(StatFormType.DOCK_CAPACITY)
                .formStatus(StatFormStatus.DRAFT)
                .reportingPeriod("2026-06")
                .periodType("MONTHLY")
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2026, 6, 30))
                .totalValue(new BigDecimal("1500000000"))
                .totalUnits(500L)
                .portsCount(5)
                .vesselsCount(120)
                .parameters("{\"dockCount\": 10}")
                .notes("Kiem tra nam 2026")
                .createdAt(Instant.now())
                .build();

        when(repository.save(any(StatisticsForm.class))).thenReturn(saved);

        StatisticsFormResponse response = statisticsService.createForm(request);

        assertNotNull(response);
        assertEquals("DOCK_CAPACITY", response.getFormType());
        assertEquals("MONTHLY", response.getPeriodType());
        assertThat(response.getTotalValue()).isEqualByComparingTo(new BigDecimal("1500000000"));
        assertEquals(5, response.getPortsCount());
        assertEquals(120, response.getVesselsCount());
        verify(repository).save(any(StatisticsForm.class));
    }

    // ------------------------------------------------------------------
    // Read — findById
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-017-03: findById_success — returns Optional.of(response)")
    void findById_success() {
        StatisticsForm entity = StatisticsForm.builder()
                .id(1L)
                .code("S-001")
                .name("Bieu 01-N")
                .formCode("F01N-2026-06")
                .formType(StatFormType.PORT_THROUGHPUT)
                .formStatus(StatFormStatus.APPROVED)
                .createdAt(Instant.now())
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        Optional<StatisticsFormResponse> result = statisticsService.findById(1L);

        assertThat(result).isPresent();
        StatisticsFormResponse response = result.get();
        assertEquals(1L, response.getId());
        assertEquals("F01N-2026-06", response.getFormCode());
        assertEquals("APPROVED", response.getFormStatus());
        verify(repository).findById(1L);
    }

    @Test
    @DisplayName("F-017-04: findById_notFound — returns empty")
    void findById_notFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        Optional<StatisticsFormResponse> result = statisticsService.findById(999L);

        assertThat(result).isEmpty();
        verify(repository).findById(999L);
    }

    // ------------------------------------------------------------------
    // Read — findByCode
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-017-05: findByCode_success — returns Optional.of(response)")
    void findByCode_success() {
        StatisticsForm entity = StatisticsForm.builder()
                .id(3L)
                .code("S-003")
                .name("Bieu 03-Q")
                .formCode("F03Q-2026-Q2")
                .formType(StatFormType.CARGO_VOLUME)
                .formStatus(StatFormStatus.SUBMITTED)
                .createdAt(Instant.now())
                .build();

        when(repository.findByFormCode("F03Q-2026-Q2")).thenReturn(Optional.of(entity));

        Optional<StatisticsFormResponse> result = statisticsService.findByCode("F03Q-2026-Q2");

        assertThat(result).isPresent();
        StatisticsFormResponse response = result.get();
        assertEquals("F03Q-2026-Q2", response.getFormCode());
        assertEquals("CARGO_VOLUME", response.getFormType());
        verify(repository).findByFormCode("F03Q-2026-Q2");
    }

    @Test
    @DisplayName("F-017-06: findByCode_notFound — returns empty")
    void findByCode_notFound() {
        when(repository.findByFormCode("NONEXIST-CODE")).thenReturn(Optional.empty());

        Optional<StatisticsFormResponse> result = statisticsService.findByCode("NONEXIST-CODE");

        assertThat(result).isEmpty();
        verify(repository).findByFormCode("NONEXIST-CODE");
    }

    // ------------------------------------------------------------------
    // Read — findAll (paginated)
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-017-07: findAll_pageable — returns PageImpl with 2 items")
    void findAll_pageable() {
        StatisticsFilter filter = StatisticsFilter.builder()
                .page(0)
                .size(10)
                .build();

        StatisticsForm e1 = StatisticsForm.builder()
                .id(1L)
                .code("S-001")
                .name("Bieu 01-N")
                .formType(StatFormType.PORT_THROUGHPUT)
                .formStatus(StatFormStatus.APPROVED)
                .createdAt(Instant.now())
                .build();
        StatisticsForm e2 = StatisticsForm.builder()
                .id(2L)
                .code("S-002")
                .name("Bieu 02-N")
                .formType(StatFormType.DOCK_CAPACITY)
                .formStatus(StatFormStatus.APPROVED)
                .createdAt(Instant.now())
                .build();

        Page<StatisticsForm> page = new PageImpl<>(List.of(e1, e2));
        when(repository.findAll(any(Pageable.class))).thenReturn(page);

        Page<StatisticsFormResponse> result = statisticsService.findAll(filter);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals("S-001", result.getContent().get(0).getCode());
        verify(repository).findAll(any(Pageable.class));
    }

    // ------------------------------------------------------------------
    // Read — findByFormType
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-017-08: findByFormType — returns list filtered by type")
    void findByFormType() {
        StatisticsForm e1 = StatisticsForm.builder()
                .id(1L)
                .code("S-001")
                .name("Bieu 01-N")
                .formType(StatFormType.PORT_THROUGHPUT)
                .formStatus(StatFormStatus.APPROVED)
                .createdAt(Instant.now())
                .build();
        StatisticsForm e2 = StatisticsForm.builder()
                .id(2L)
                .code("S-002")
                .name("Bieu 01N-bis")
                .formType(StatFormType.PORT_THROUGHPUT)
                .formStatus(StatFormStatus.DRAFT)
                .createdAt(Instant.now())
                .build();

        when(repository.findByFormType(StatFormType.PORT_THROUGHPUT)).thenReturn(List.of(e1, e2));

        List<StatisticsFormResponse> result = statisticsService.findByFormType("PORT_THROUGHPUT");

        assertEquals(2, result.size());
        assertThat(result).allSatisfy(r -> assertThat(r.getFormType()).isEqualTo("PORT_THROUGHPUT"));
        verify(repository).findByFormType(StatFormType.PORT_THROUGHPUT);
    }

    // ------------------------------------------------------------------
    // Update — updateStatus
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-017-09: updateStatus_success — sets status to APPROVED")
    void updateStatus_success() {
        StatisticsForm entity = StatisticsForm.builder()
                .id(1L)
                .code("S-001")
                .name("Bieu 01-N")
                .formType(StatFormType.PORT_THROUGHPUT)
                .formStatus(StatFormStatus.DRAFT)
                .createdAt(Instant.now())
                .updatedAt(null)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any(StatisticsForm.class))).thenReturn(entity);

        statisticsService.updateStatus(1L, "APPROVED");

        assertEquals(StatFormStatus.APPROVED, entity.getFormStatus());
        assertNotNull(entity.getUpdatedAt());
        verify(repository).save(entity);
    }

    @Test
    @DisplayName("F-017-10: updateStatus_notFound — throws EntityNotFoundException")
    void updateStatus_notFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> statisticsService.updateStatus(999L, "APPROVED"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("StatisticsForm not found: 999");

        verify(repository).findById(999L);
        verify(repository, never()).save(any());
    }

    // ------------------------------------------------------------------
    // Counts
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-017-11: countByStatus_success — returns 42 for APPROVED")
    void countByStatus_success() {
        when(repository.countByStatus(StatFormStatus.APPROVED)).thenReturn(42L);

        long count = statisticsService.countByStatus("APPROVED");

        assertEquals(42L, count);
        verify(repository).countByStatus(StatFormStatus.APPROVED);
    }

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-017-12: getSummary_success — returns StatisticsSummary with totals")
    void getSummary_success() {
        StatisticsForm e1 = StatisticsForm.builder()
                .id(1L)
                .formType(StatFormType.PORT_THROUGHPUT)
                .formStatus(StatFormStatus.APPROVED)
                .totalValue(new BigDecimal("1000000000"))
                .build();
        StatisticsForm e2 = StatisticsForm.builder()
                .id(2L)
                .formType(StatFormType.DOCK_CAPACITY)
                .formStatus(StatFormStatus.DRAFT)
                .totalValue(new BigDecimal("500000000"))
                .build();

        when(repository.findAll()).thenReturn(List.of(e1, e2));
        when(repository.countByStatus(StatFormStatus.APPROVED)).thenReturn(1L);
        when(repository.countByStatus(StatFormStatus.DRAFT)).thenReturn(1L);

        StatisticsSummary summary = statisticsService.getSummary();

        assertThat(summary).isNotNull();
        assertEquals(2L, summary.getTotalForms());
        assertEquals(1L, summary.getApprovedForms());
        assertEquals(1L, summary.getPendingForms());
        assertThat(summary.getTotalValue()).isEqualByComparingTo(new BigDecimal("1500000000"));
    }
}
