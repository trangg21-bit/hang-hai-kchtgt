package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.dto.cangbien.CreateCangBienRequest;
import com.hanghai.kchtg.cangben.dto.cangbien.CangBienResponse;
import com.hanghai.kchtg.cangben.dto.cangbien.UpdateCangBienRequest;
import com.hanghai.kchtg.cangben.entity.CangBien;
import com.hanghai.kchtg.cangben.repository.BenCangRepository;
import com.hanghai.kchtg.cangben.repository.CangBienRepository;
import com.hanghai.kchtg.cangben.repository.VungNuocRepository;
import com.hanghai.kchtg.cangben.service.CangBienService;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CangBienService unit tests — F-008/F-009/F-010")
class CangBienServiceTest {

    @InjectMocks
    private CangBienService service;

    @Mock
    private CangBienRepository cangBienRepository;

    @Mock
    private BenCangRepository benCangRepository;

    @Mock
    private VungNuocRepository vungNuocRepository;

    @Mock
    private LichSuThayDoiService lichSuThayDoiService;

    private UUID testId;
    private CangBien testEntity;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testEntity = new CangBien();
        ReflectionTestUtils.setField(testEntity, "id", testId);
        testEntity.setMaCang("CB-001");
        testEntity.setTenCang("Cảng Biển Demo");
        testEntity.setTinhThanhPho("Hải Phòng");
        testEntity.setViDo(new BigDecimal("20.845"));
        testEntity.setKinhDo(new BigDecimal("106.688"));
        testEntity.setDienTich(new BigDecimal("5000.00"));
        testEntity.setTrangThaiHoatDong("HIEN_HANH");
        testEntity.setTrangThaiPheDuyet("CHO_PHE_DUYET");
    }

    // ── CREATE (F-008) ─────────────────────────────────────────────────────

    @Test
    @DisplayName("F-008: create — succeeds and returns response")
    void create_succeeds() {
        CreateCangBienRequest request = buildCreateRequest("CB-002", "Cảng mới",
                new BigDecimal("20.0"), new BigDecimal("106.0"), new BigDecimal("1000.00"));

        when(cangBienRepository.existsByMaCang("CB-002")).thenReturn(false);
        when(cangBienRepository.save(any(CangBien.class))).thenAnswer(inv -> {
            CangBien saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        CangBienResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("CB-002", result.getMaCang());
        assertEquals("Cảng mới", result.getTenCang());
        assertEquals("CHO_PHE_DUYET", result.getTrangThaiPheDuyet());
        verify(cangBienRepository).save(any(CangBien.class));
    }

    @Test
    @DisplayName("F-008: create — duplicate code throws IllegalArgumentException")
    void create_duplicateCode_throwsConflict() {
        CreateCangBienRequest request = buildCreateRequest("CB-001", "Duplicate",
                new BigDecimal("10.0"), new BigDecimal("100.0"), new BigDecimal("100.00"));

        when(cangBienRepository.existsByMaCang("CB-001")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));
        assertTrue(ex.getMessage().contains("CB-001"));
        verify(cangBienRepository, never()).save(any());
    }

    // ── READ ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("F-012: getById — returns response when found")
    void getById_found() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));

        CangBienResponse result = service.getById(testId);

        assertEquals("CB-001", result.getMaCang());
        assertEquals("Cảng Biển Demo", result.getTenCang());
    }

    @Test
    @DisplayName("F-012: getById — throws EntityNotFoundException when not found")
    void getById_notFound_throws() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.getById(testId));
    }

    @Test
    @DisplayName("F-012: findAll — pagination honored, defaults max 100")
    void findAll_paginationHonored() {
        Page<CangBien> mockPage = new PageImpl<>(List.of(testEntity));
        when(cangBienRepository.findAllActive(isNull(), any(Pageable.class))).thenReturn(mockPage);

        Page<CangBienResponse> result = service.findAll(0, 20, null);

        assertEquals(1, result.getTotalElements());
        verify(cangBienRepository).findAllActive(isNull(), any(Pageable.class));
    }

    @Test
    @DisplayName("F-012: findAll — size capped at 100")
    void findAll_sizeCappedAt100() {
        Page<CangBien> mockPage = new PageImpl<>(List.of());
        when(cangBienRepository.findAllActive(any(), any(Pageable.class))).thenReturn(mockPage);

        service.findAll(0, 999, null);

        verify(cangBienRepository).findAllActive(isNull(), argThat(p -> p.getPageSize() == 100));
    }

    // ── UPDATE (F-009) ─────────────────────────────────────────────────────

    @Test
    @DisplayName("F-009: update — applies mutable fields, resets approval to CHO_PHE_DUYET")
    void update_appliesMutableFields() {
        testEntity.setTrangThaiPheDuyet("DUOC_PHE_DUYET"); // was approved

        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(cangBienRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCangBienRequest request = new UpdateCangBienRequest();
        request.setId(testId);
        request.setTenCang("Cảng Đã Cập Nhật");
        request.setTinhThanhPho("Đà Nẵng");

        CangBienResponse result = service.update(request);

        assertEquals("Cảng Đã Cập Nhật", result.getTenCang());
        assertEquals("CHO_PHE_DUYET", result.getTrangThaiPheDuyet()); // reset
        assertEquals("CB-001", result.getMaCang()); // code unchanged
    }

    @Test
    @DisplayName("F-009: update — throws EntityNotFoundException when not found")
    void update_notFound_throws() {
        UpdateCangBienRequest request = new UpdateCangBienRequest();
        request.setId(testId);

        when(cangBienRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.update(request));
    }

    // ── DELETE (F-010) ─────────────────────────────────────────────────────

    @Test
    @DisplayName("F-010: softDelete — succeeds when no active children")
    void softDelete_noChildren_succeeds() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(benCangRepository.countByCangBienIdAndDeletedAtIsNull(testId)).thenReturn(0L);
        when(vungNuocRepository.countByCangBienIdAndDeletedAtIsNull(testId)).thenReturn(0L);
        when(cangBienRepository.save(any())).thenReturn(testEntity);

        service.softDelete(testId);

        assertNotNull(testEntity.getDeletedAt()); // softDelete() sets deletedAt
        verify(cangBienRepository).save(testEntity);
    }

    @Test
    @DisplayName("F-010: softDelete — blocked when BenCang children exist")
    void softDelete_blockedByBenCangChildren() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(benCangRepository.countByCangBienIdAndDeletedAtIsNull(testId)).thenReturn(2L);
        when(vungNuocRepository.countByCangBienIdAndDeletedAtIsNull(testId)).thenReturn(0L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.softDelete(testId));
        assertTrue(ex.getMessage().contains("bến cảng"));
        verify(cangBienRepository, never()).save(any());
    }

    @Test
    @DisplayName("F-010: softDelete — blocked when VungNuoc children exist")
    void softDelete_blockedByVungNuocChildren() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(benCangRepository.countByCangBienIdAndDeletedAtIsNull(testId)).thenReturn(0L);
        when(vungNuocRepository.countByCangBienIdAndDeletedAtIsNull(testId)).thenReturn(3L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.softDelete(testId));
        assertTrue(ex.getMessage().contains("vùng nước"));
        verify(cangBienRepository, never()).save(any());
    }

    @Test
    @DisplayName("F-010: softDelete — blocked when both child types exist, message lists both counts")
    void softDelete_blockedByBothChildTypes() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(benCangRepository.countByCangBienIdAndDeletedAtIsNull(testId)).thenReturn(1L);
        when(vungNuocRepository.countByCangBienIdAndDeletedAtIsNull(testId)).thenReturn(1L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.softDelete(testId));
        assertTrue(ex.getMessage().contains("bến cảng"));
        assertTrue(ex.getMessage().contains("vùng nước"));
    }

    @Test
    @DisplayName("F-010: softDelete — throws EntityNotFoundException when entity missing")
    void softDelete_notFound_throws() {
        when(cangBienRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.softDelete(testId));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private CreateCangBienRequest buildCreateRequest(String maCang, String tenCang,
                                                      BigDecimal viDo, BigDecimal kinhDo,
                                                      BigDecimal dienTich) {
        CreateCangBienRequest req = new CreateCangBienRequest();
        req.setMaCang(maCang);
        req.setTenCang(tenCang);
        req.setViDo(viDo);
        req.setKinhDo(kinhDo);
        req.setDienTich(dienTich);
        req.setTrangThaiHoatDong("HIEN_HANH");
        return req;
    }
}
