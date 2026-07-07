package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.dto.caucang.CauCangResponse;
import com.hanghai.kchtg.cangben.dto.caucang.CreateCauCangRequest;
import com.hanghai.kchtg.cangben.dto.caucang.UpdateCauCangRequest;
import com.hanghai.kchtg.cangben.entity.BenCang;
import com.hanghai.kchtg.cangben.entity.CauCang;
import com.hanghai.kchtg.cangben.repository.BenCangRepository;
import com.hanghai.kchtg.cangben.repository.CauCangRepository;
import com.hanghai.kchtg.cangben.service.CauCangService;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CauCangService unit tests — INT-005 / CRUD")
class CauCangServiceTest {

    @InjectMocks
    private CauCangService service;

    @Mock
    private CauCangRepository cauCangRepository;

    @Mock
    private BenCangRepository benCangRepository;

    @Mock
    private LichSuThayDoiService lichSuThayDoiService;

    private UUID testId;
    private UUID parentId;
    private BenCang activeBenCang;
    private CauCang testEntity;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        parentId = UUID.randomUUID();

        activeBenCang = new BenCang();
        ReflectionTestUtils.setField(activeBenCang, "id", parentId);
        activeBenCang.setMaBen("BEN-001");
        activeBenCang.setTenBen("Bến Cảng Demo");
        activeBenCang.setTrangThaiHoatDong("HIEN_HANH");
        activeBenCang.setTrangThaiPheDuyet("CHO_PHE_DUYET");

        testEntity = new CauCang();
        ReflectionTestUtils.setField(testEntity, "id", testId);
        testEntity.setMaCau("CAU-001");
        testEntity.setTenCau("Cầu Cảng Demo");
        testEntity.setBenCangId(parentId);
        testEntity.setChieuDai(new BigDecimal("200.00"));
        testEntity.setTaiTrong(new BigDecimal("50000.00"));
        testEntity.setTrangThaiHoatDong("HIEN_HANH");
        testEntity.setTrangThaiPheDuyet("CHO_PHE_DUYET");
    }

    // ── CREATE — INT-005 parent guard ──────────────────────────────────────

    @Test
    @DisplayName("INT-005: create — parent BenCang not found → EntityNotFoundException")
    void create_parentNotFound_throwsEntityNotFound() {
        CreateCauCangRequest request = buildCreateRequest("CAU-NEW", "Cầu mới", parentId);
        when(cauCangRepository.existsByMaCau("CAU-NEW")).thenReturn(false);
        when(benCangRepository.findById(parentId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.create(request));
        verify(cauCangRepository, never()).save(any());
    }

    @Test
    @DisplayName("INT-005: create — parent BenCang not HIEN_HANH → IllegalArgumentException")
    void create_parentNotHienHanh_throwsIllegalArg() {
        activeBenCang.setTrangThaiHoatDong("DUNG_HOAT_DONG");
        CreateCauCangRequest request = buildCreateRequest("CAU-NEW", "Cầu mới", parentId);
        when(cauCangRepository.existsByMaCau("CAU-NEW")).thenReturn(false);
        when(benCangRepository.findById(parentId)).thenReturn(Optional.of(activeBenCang));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));
        assertTrue(ex.getMessage().contains("HIEN_HANH"),
                "Exception message should mention HIEN_HANH, was: " + ex.getMessage());
        verify(cauCangRepository, never()).save(any());
    }

    @Test
    @DisplayName("create — duplicate maCau → IllegalArgumentException")
    void create_duplicateCode_throwsIllegalArg() {
        CreateCauCangRequest request = buildCreateRequest("CAU-001", "Cầu trùng mã", parentId);
        when(cauCangRepository.existsByMaCau("CAU-001")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));
        assertTrue(ex.getMessage().contains("CAU-001"));
        verify(cauCangRepository, never()).save(any());
    }

    @Test
    @DisplayName("create — parent HIEN_HANH, no dupe → saves and returns response")
    void create_success() {
        CreateCauCangRequest request = buildCreateRequest("CAU-NEW", "Cầu mới", parentId);
        when(cauCangRepository.existsByMaCau("CAU-NEW")).thenReturn(false);
        when(benCangRepository.findById(parentId)).thenReturn(Optional.of(activeBenCang));
        when(cauCangRepository.save(any(CauCang.class))).thenAnswer(inv -> {
            CauCang saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        CauCangResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("CAU-NEW", result.getMaCau());
        assertEquals("Cầu mới", result.getTenCau());
        assertEquals("CHO_PHE_DUYET", result.getTrangThaiPheDuyet());
        verify(cauCangRepository).save(any(CauCang.class));
    }

    // ── UPDATE ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("update — applies mutable fields, resets to CHO_PHE_DUYET, calls recordChanges")
    void update_appliesMutableFields_resetsApproval() {
        testEntity.setTrangThaiPheDuyet("DUOC_PHE_DUYET");
        when(cauCangRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(cauCangRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateCauCangRequest request = new UpdateCauCangRequest();
        request.setId(testId);
        request.setTenCau("Cầu Đã Cập Nhật");
        request.setChieuDai(new BigDecimal("300.00"));

        CauCangResponse result = service.update(request);

        assertEquals("Cầu Đã Cập Nhật", result.getTenCau());
        assertEquals("CHO_PHE_DUYET", result.getTrangThaiPheDuyet());
        assertEquals("CAU-001", result.getMaCau()); // code unchanged
        verify(lichSuThayDoiService).recordChanges(eq("CauCang"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("update — entity not found → EntityNotFoundException")
    void update_notFound_throws() {
        UpdateCauCangRequest request = new UpdateCauCangRequest();
        request.setId(testId);
        when(cauCangRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.update(request));
    }

    // ── SOFT DELETE ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("softDelete — entity found, softDelete() called, save called")
    void softDelete_setsDeletedAt() {
        when(cauCangRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(cauCangRepository.save(any())).thenReturn(testEntity);

        service.softDelete(testId);

        assertNotNull(testEntity.getDeletedAt());
        verify(cauCangRepository).save(testEntity);
    }

    @Test
    @DisplayName("softDelete — entity not found → EntityNotFoundException")
    void softDelete_notFound_throws() {
        when(cauCangRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.softDelete(testId));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private CreateCauCangRequest buildCreateRequest(String maCau, String tenCau, UUID benCangId) {
        CreateCauCangRequest req = new CreateCauCangRequest();
        req.setMaCau(maCau);
        req.setTenCau(tenCau);
        req.setBenCangId(benCangId);
        req.setTrangThaiHoatDong("HIEN_HANH");
        return req;
    }
}
