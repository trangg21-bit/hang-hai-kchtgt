package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.dto.vungnuoc.CreateVungNuocRequest;
import com.hanghai.kchtg.cangben.dto.vungnuoc.VungNuocResponse;
import com.hanghai.kchtg.cangben.entity.VungNuoc;
import com.hanghai.kchtg.cangben.repository.VungNuocRepository;
import com.hanghai.kchtg.cangben.service.VungNuocService;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VungNuocService unit tests — INT-004 / CRUD")
class VungNuocServiceTest {

    @InjectMocks
    private VungNuocService service;

    @Mock
    private VungNuocRepository vungNuocRepository;

    @Mock
    private LichSuThayDoiService lichSuThayDoiService;

    private UUID testId;
    private UUID cangBienId;
    private UUID orgUnitId;
    private VungNuoc testEntity;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        cangBienId = UUID.randomUUID();
        orgUnitId = UUID.randomUUID();

        testEntity = new VungNuoc();
        ReflectionTestUtils.setField(testEntity, "id", testId);
        testEntity.setMaVungNuoc("VN-001");
        testEntity.setTenVungNuoc("Vùng Nước Demo");
        testEntity.setCangBienId(cangBienId);
        testEntity.setDienTich(new BigDecimal("500.00"));
        testEntity.setDoSauMax(new BigDecimal("15.00"));
        testEntity.setDoSauTrungBinh(new BigDecimal("12.00"));
        testEntity.setLoaiVungNuoc("CANG_BIEN");
        testEntity.setTrangThaiHoatDong("HIEN_HANH");
        testEntity.setTrangThaiPheDuyet("CHO_PHE_DUYET");
    }

    // ── findAll — INT-004 two-filter overload ─────────────────────────────

    @Test
    @DisplayName("INT-004: findAll(page,size,orgUnitId,cangBienId) → calls 2-filter repo overload")
    void findAll_withCangBienIdFilter_callsOverloadedRepo() {
        Page<VungNuoc> mockPage = new PageImpl<>(List.of(testEntity));
        when(vungNuocRepository.findAllActive(eq(orgUnitId), eq(cangBienId), any(Pageable.class)))
                .thenReturn(mockPage);

        Page<VungNuocResponse> result = service.findAll(0, 20, orgUnitId, cangBienId);

        assertEquals(1, result.getTotalElements());
        verify(vungNuocRepository).findAllActive(eq(orgUnitId), eq(cangBienId), any(Pageable.class));
        // ensure the single-filter overload is NOT called
        verify(vungNuocRepository, never()).findAllActive(any(UUID.class), any(Pageable.class));
    }

    @Test
    @DisplayName("INT-004: findAll(page,size,orgUnitId) → delegates to 4-arg with cangBienId=null")
    void findAll_withoutCangBienId_callsSingleFilter() {
        Page<VungNuoc> mockPage = new PageImpl<>(List.of());
        when(vungNuocRepository.findAllActive(eq(orgUnitId), isNull(), any(Pageable.class)))
                .thenReturn(mockPage);

        Page<VungNuocResponse> result = service.findAll(0, 20, orgUnitId);

        assertEquals(0, result.getTotalElements());
        verify(vungNuocRepository).findAllActive(eq(orgUnitId), isNull(), any(Pageable.class));
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("create — saves and returns response")
    void create_success() {
        CreateVungNuocRequest request = buildCreateRequest("VN-NEW", "Vùng nước mới");
        when(vungNuocRepository.existsByMaVungNuoc("VN-NEW")).thenReturn(false);
        when(vungNuocRepository.save(any(VungNuoc.class))).thenAnswer(inv -> {
            VungNuoc saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        VungNuocResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("VN-NEW", result.getMaVungNuoc());
        assertEquals("Vùng nước mới", result.getTenVungNuoc());
        assertEquals("CHO_PHE_DUYET", result.getTrangThaiPheDuyet());
        verify(vungNuocRepository).save(any(VungNuoc.class));
    }

    @Test
    @DisplayName("create — duplicate maVungNuoc → IllegalArgumentException")
    void create_duplicateCode_throwsIllegalArg() {
        CreateVungNuocRequest request = buildCreateRequest("VN-001", "Trùng mã");
        when(vungNuocRepository.existsByMaVungNuoc("VN-001")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));
        assertTrue(ex.getMessage().contains("VN-001"));
        verify(vungNuocRepository, never()).save(any());
    }

    @Test
    @DisplayName("softDelete — entity found, soft-deleted and saved")
    void softDelete_setsDeletedAt() {
        when(vungNuocRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(vungNuocRepository.save(any())).thenReturn(testEntity);

        service.softDelete(testId);

        assertNotNull(testEntity.getDeletedAt());
        verify(vungNuocRepository).save(testEntity);
    }

    @Test
    @DisplayName("softDelete — entity not found → EntityNotFoundException")
    void softDelete_notFound_throws() {
        when(vungNuocRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.softDelete(testId));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private CreateVungNuocRequest buildCreateRequest(String maVungNuoc, String tenVungNuoc) {
        CreateVungNuocRequest req = new CreateVungNuocRequest();
        req.setMaVungNuoc(maVungNuoc);
        req.setTenVungNuoc(tenVungNuoc);
        req.setCangBienId(cangBienId);
        req.setTrangThaiHoatDong("HIEN_HANH");
        return req;
    }
}
