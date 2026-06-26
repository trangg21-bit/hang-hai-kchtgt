package com.hanghai.kchtg.datasharing;

import com.hanghai.kchtg.datasharing.dto.ShareFilter;
import com.hanghai.kchtg.datasharing.dto.ShareSummary;
import com.hanghai.kchtg.datasharing.dto.SharedDataRequest;
import com.hanghai.kchtg.datasharing.dto.SharedDataResponse;
import com.hanghai.kchtg.datasharing.entity.ShareDataType;
import com.hanghai.kchtg.datasharing.entity.ShareStatus;
import com.hanghai.kchtg.datasharing.entity.SharedData;
import com.hanghai.kchtg.datasharing.repository.SharedDataRepository;
import com.hanghai.kchtg.datasharing.service.ShareService;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ShareService Unit Tests — M-018 Wave 4")
class ShareServiceTest {

    @Mock
    private SharedDataRepository repository;

    @InjectMocks
    private ShareService shareService;

    // ------------------------------------------------------------------
    // Create
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-01: share_success — creates SharedData with DRAFT status")
    void share_success() {
        SharedDataRequest request = SharedDataRequest.builder()
                .dataType("PORT")
                .sharedWith("KCHTGT-CN")
                .fileUrl("https://storage.example.com/port-data.csv")
                .fileFormat("CSV")
                .recordCount(150)
                .description("Dữ liệu ben caang nam 2026")
                .build();

        SharedData saved = SharedData.builder()
                .id(1L)
                .code("SD-2026-0001")
                .name("Ben Caang 2026")
                .dataType(ShareDataType.PORT)
                .shareStatus(ShareStatus.DRAFT)
                .status("DRAFT")
                .sharedWith("KCHTGT-CN")
                .fileUrl("https://storage.example.com/port-data.csv")
                .fileFormat("CSV")
                .recordCount(150)
                .description("Dữ liệu ben caang nam 2026")
                .sharedCreated(Instant.now())
                .build();

        when(repository.save(any(SharedData.class))).thenReturn(saved);

        SharedDataResponse response = shareService.share(request);

        assertNotNull(response);
        assertEquals("SD-2026-0001", response.getCode());
        assertEquals("DRAFT", response.getShareStatus());
        assertEquals("PORT", response.getDataType());
        assertEquals("KCHTGT-CN", response.getSharedWith());
        verify(repository).save(any(SharedData.class));
    }

    @Test
    @DisplayName("F-018-02: share_withAllFields — full request with all fields")
    void share_withAllFields() {
        SharedDataRequest request = SharedDataRequest.builder()
                .dataType("LIGHTHOUSE")
                .sharedWith("VTS-DNAI")
                .sharedAt(LocalDate.of(2026, 6, 15))
                .expiresAt(LocalDate.of(2027, 6, 15))
                .fileUrl("https://storage.example.com/lighthouse.xml")
                .fileFormat("XML")
                .recordCount(30)
                .description("Du lieu den bien toan bo")
                .approvedBy("ADMIN-01")
                .approvedAt(LocalDate.of(2026, 6, 10))
                .build();

        SharedData saved = SharedData.builder()
                .id(2L)
                .code("SD-2026-0002")
                .name("Den Bien Toan Bo")
                .dataType(ShareDataType.LIGHTHOUSE)
                .shareStatus(ShareStatus.DRAFT)
                .status("DRAFT")
                .sharedWith("VTS-DNAI")
                .sharedAt(LocalDate.of(2026, 6, 15))
                .expiresAt(LocalDate.of(2027, 6, 15))
                .fileUrl("https://storage.example.com/lighthouse.xml")
                .fileFormat("XML")
                .recordCount(30)
                .description("Du lieu den bien toan bo")
                .approvedBy("ADMIN-01")
                .approvedAt(LocalDate.of(2026, 6, 10))
                .sharedCreated(Instant.now())
                .build();

        when(repository.save(any(SharedData.class))).thenReturn(saved);

        SharedDataResponse response = shareService.share(request);

        assertNotNull(response);
        assertEquals("LIGHTHOUSE", response.getDataType());
        assertEquals("VTS-DNAI", response.getSharedWith());
        assertEquals(LocalDate.of(2026, 6, 15), response.getSharedAt());
        assertEquals(LocalDate.of(2027, 6, 15), response.getExpiresAt());
        assertEquals("ADMIN-01", response.getApprovedBy());
        verify(repository).save(any(SharedData.class));
    }

    // ------------------------------------------------------------------
    // Read — findById
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-03: findById_success — returns Optional.of(response)")
    void findById_success() {
        SharedData entity = SharedData.builder()
                .id(1L)
                .code("SD-2026-0001")
                .name("Ben Caang 1")
                .dataType(ShareDataType.PORT)
                .shareStatus(ShareStatus.SHARED)
                .status("SHARED")
                .sharedWith("KCHTGT-CN")
                .sharedCreated(Instant.now())
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(entity));

        Optional<SharedDataResponse> result = shareService.findById(1L);

        assertThat(result).isPresent();
        SharedDataResponse response = result.get();
        assertEquals(1L, response.getId());
        assertEquals("SD-2026-0001", response.getCode());
        assertEquals("SHARED", response.getShareStatus());
        verify(repository).findById(1L);
    }

    @Test
    @DisplayName("F-018-04: findById_notFound — returns empty")
    void findById_notFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        Optional<SharedDataResponse> result = shareService.findById(999L);

        assertThat(result).isEmpty();
        verify(repository).findById(999L);
    }

    // ------------------------------------------------------------------
    // Read — findByCode
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-05: findByCode_success — returns Optional.of(response)")
    void findByCode_success() {
        SharedData entity = SharedData.builder()
                .id(3L)
                .code("SD-2026-0003")
                .name("He thong VTS")
                .dataType(ShareDataType.VTS_SYSTEM)
                .shareStatus(ShareStatus.SHARED)
                .status("SHARED")
                .sharedWith("VTS-DNAI")
                .sharedCreated(Instant.now())
                .build();

        when(repository.findByCode("SD-2026-0003")).thenReturn(Optional.of(entity));

        Optional<SharedDataResponse> result = shareService.findByCode("SD-2026-0003");

        assertThat(result).isPresent();
        SharedDataResponse response = result.get();
        assertEquals("SD-2026-0003", response.getCode());
        assertEquals("VTS_SYSTEM", response.getDataType());
        verify(repository).findByCode("SD-2026-0003");
    }

    // ------------------------------------------------------------------
    // Read — findAll (paginated)
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-06: findAll_pageable — returns PageImpl with items filtered by status")
    void findAll_pageable() {
        ShareFilter filter = ShareFilter.builder()
                .page(0)
                .size(10)
                .shareStatus("SHARED")
                .build();

        SharedData e1 = SharedData.builder()
                .id(1L)
                .code("SD-001")
                .name("Ben Caang 1")
                .dataType(ShareDataType.PORT)
                .shareStatus(ShareStatus.SHARED)
                .status("SHARED")
                .sharedCreated(Instant.now())
                .build();
        SharedData e2 = SharedData.builder()
                .id(2L)
                .code("SD-002")
                .name("Cau Caang 2")
                .dataType(ShareDataType.DOCK)
                .shareStatus(ShareStatus.SHARED)
                .status("SHARED")
                .sharedCreated(Instant.now())
                .build();

        Page<SharedData> page = new PageImpl<>(List.of(e1, e2));
        when(repository.findByShareStatus(eq(ShareStatus.SHARED), any(Pageable.class))).thenReturn(page);

        Page<SharedDataResponse> result = shareService.findAll(filter);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals("SD-001", result.getContent().get(0).getCode());
        verify(repository).findByShareStatus(eq(ShareStatus.SHARED), any(Pageable.class));
    }

    // ------------------------------------------------------------------
    // Read — findByDataType
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-07: findByDataType — returns list filtered by data type (PORT)")
    void findByDataType() {
        SharedData e1 = SharedData.builder()
                .id(1L)
                .code("SD-001")
                .name("Ben Caang 1")
                .dataType(ShareDataType.PORT)
                .shareStatus(ShareStatus.SHARED)
                .status("SHARED")
                .sharedCreated(Instant.now())
                .build();
        SharedData e2 = SharedData.builder()
                .id(2L)
                .code("SD-002")
                .name("Ben Caang 2")
                .dataType(ShareDataType.PORT)
                .shareStatus(ShareStatus.DRAFT)
                .status("DRAFT")
                .sharedCreated(Instant.now())
                .build();

        when(repository.findByDataType(ShareDataType.PORT)).thenReturn(List.of(e1, e2));

        List<SharedDataResponse> result = shareService.findByDataType("PORT");

        assertEquals(2, result.size());
        assertThat(result).allSatisfy(r -> assertThat(r.getDataType()).isEqualTo("PORT"));
        verify(repository).findByDataType(ShareDataType.PORT);
    }

    // ------------------------------------------------------------------
    // Read — findBySharedWith
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-08: findBySharedWith — returns list for a specific recipient")
    void findBySharedWith() {
        SharedData e1 = SharedData.builder()
                .id(1L)
                .code("SD-001")
                .name("Ben Caang 1")
                .dataType(ShareDataType.PORT)
                .shareStatus(ShareStatus.SHARED)
                .status("SHARED")
                .sharedWith("KCHTGT-CN")
                .sharedCreated(Instant.now())
                .build();
        SharedData e2 = SharedData.builder()
                .id(3L)
                .code("SD-003")
                .name("He thong VTS")
                .dataType(ShareDataType.VTS_SYSTEM)
                .shareStatus(ShareStatus.SHARED)
                .status("SHARED")
                .sharedWith("KCHTGT-CN")
                .sharedCreated(Instant.now())
                .build();

        when(repository.findBySharedWith("KCHTGT-CN")).thenReturn(List.of(e1, e2));

        List<SharedDataResponse> result = shareService.findBySharedWith("KCHTGT-CN");

        assertEquals(2, result.size());
        assertThat(result).allSatisfy(r -> assertThat(r.getSharedWith()).isEqualTo("KCHTGT-CN"));
        verify(repository).findBySharedWith("KCHTGT-CN");
    }

    // ------------------------------------------------------------------
    // Update — revoke
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-09: revoke_success — sets status to REVOKED")
    void revoke_success() {
        SharedData entity = SharedData.builder()
                .id(1L)
                .code("SD-001")
                .name("Ben Caang 1")
                .dataType(ShareDataType.PORT)
                .shareStatus(ShareStatus.SHARED)
                .status("SHARED")
                .sharedWith("KCHTGT-CN")
                .sharedCreated(Instant.now())
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any(SharedData.class))).thenReturn(entity);

        shareService.revoke(1L);

        verify(repository).save(entity);
        // Note: entity status is set to "REVOKED" string internally by the service
        verify(repository).findById(1L);
    }

    @Test
    @DisplayName("F-018-10: revoke_notFound — throws EntityNotFoundException")
    void revoke_notFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareService.revoke(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("SharedData not found: 999");

        verify(repository).findById(999L);
        verify(repository, never()).save(any());
    }

    // ------------------------------------------------------------------
    // Counts
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-11: countByStatus_success — returns count for SHARED status")
    void countByStatus_success() {
        when(repository.countByStatus(ShareStatus.SHARED)).thenReturn(42L);

        long count = shareService.countByStatus("SHARED");

        assertEquals(42L, count);
        verify(repository).countByStatus(ShareStatus.SHARED);
    }

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-12: getSummary_success — returns ShareSummary with totals by status")
    void getSummary_success() {
        SharedData e1 = SharedData.builder()
                .id(1L)
                .dataType(ShareDataType.PORT)
                .shareStatus(ShareStatus.SHARED)
                .status("SHARED")
                .recordCount(100)
                .sharedCreated(Instant.now())
                .build();
        SharedData e2 = SharedData.builder()
                .id(2L)
                .dataType(ShareDataType.DOCK)
                .shareStatus(ShareStatus.DRAFT)
                .status("DRAFT")
                .recordCount(50)
                .sharedCreated(Instant.now())
                .build();
        SharedData e3 = SharedData.builder()
                .id(3L)
                .dataType(ShareDataType.LIGHTHOUSE)
                .shareStatus(ShareStatus.EXPIRED)
                .status("EXPIRED")
                .recordCount(20)
                .sharedCreated(Instant.now())
                .build();

        when(repository.findAll()).thenReturn(List.of(e1, e2, e3));
        when(repository.countByStatus(ShareStatus.SHARED)).thenReturn(1L);
        when(repository.countByStatus(ShareStatus.REVOKED)).thenReturn(0L);
        when(repository.countByStatus(ShareStatus.EXPIRED)).thenReturn(1L);

        ShareSummary summary = shareService.getSummary();

        assertThat(summary).isNotNull();
        assertEquals(3L, summary.getTotalShared());
        assertEquals(1L, summary.getActiveShares());
        assertEquals(0L, summary.getRevokedShares());
        assertEquals(1L, summary.getExpiredShares());
    }
}
