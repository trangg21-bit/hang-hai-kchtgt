package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.dto.bencang.BenCangResponse;
import com.hanghai.kchtg.cangben.dto.bencang.CreateBenCangRequest;
import com.hanghai.kchtg.cangben.entity.BenCang;
import com.hanghai.kchtg.cangben.entity.CangBien;
import com.hanghai.kchtg.cangben.repository.BenCangRepository;
import com.hanghai.kchtg.cangben.repository.CangBienRepository;
import com.hanghai.kchtg.cangben.service.BenCangService;
import com.hanghai.kchtg.cangben.service.shared.AuditLogService;
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
@DisplayName("BenCangService unit tests — F-014/F-015/F-016")
class BenCangServiceTest {

    @InjectMocks
    private BenCangService service;

    @Mock
    private BenCangRepository benCangRepository;

    @Mock
    private CangBienRepository cangBienRepository;

    @Mock
    private LichSuThayDoiService lichSuThayDoiService;

    @Mock
    private AuditLogService auditLogService;

    private UUID parentId;
    private UUID testId;
    private CangBien parentHienHanh;
    private CangBien parentNotActive;
    private BenCang testBenCang;

    @BeforeEach
    void setUp() {
        parentId = UUID.randomUUID();
        testId = UUID.randomUUID();

        parentHienHanh = new CangBien();
        ReflectionTestUtils.setField(parentHienHanh, "id", parentId);
        parentHienHanh.setMaCang("CB-001");
        parentHienHanh.setTenCang("Cảng Cha Hoạt Động");
        parentHienHanh.setTrangThaiHoatDong("HIEN_HANH");
        parentHienHanh.setTrangThaiPheDuyet("DUOC_PHE_DUYET");

        parentNotActive = new CangBien();
        ReflectionTestUtils.setField(parentNotActive, "id", parentId);
        parentNotActive.setMaCang("CB-002");
        parentNotActive.setTenCang("Cảng Cha Không Hoạt Động");
        parentNotActive.setTrangThaiHoatDong("NGUNG_HOAT_DONG");
        parentNotActive.setTrangThaiPheDuyet("CHO_PHE_DUYET");

        testBenCang = new BenCang();
        ReflectionTestUtils.setField(testBenCang, "id", testId);
        testBenCang.setMaBen("BEN-001");
        testBenCang.setTenBen("Bến Cảng Test");
        testBenCang.setCangBienId(parentId);
        testBenCang.setTrangThaiHoatDong("HIEN_HANH");
        testBenCang.setTrangThaiPheDuyet("CHO_PHE_DUYET");
    }

    // ── CREATE (F-014) ─────────────────────────────────────────────────────

    @Test
    @DisplayName("F-014: create — succeeds when parent is HIEN_HANH")
    void create_parentHienHanh_succeeds() {
        CreateBenCangRequest request = buildCreateRequest("BEN-002", "Bến mới", parentId);

        when(benCangRepository.existsByMaBen("BEN-002")).thenReturn(false);
        when(cangBienRepository.findById(parentId)).thenReturn(Optional.of(parentHienHanh));
        when(benCangRepository.save(any(BenCang.class))).thenAnswer(inv -> {
            BenCang saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        BenCangResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("BEN-002", result.getMaBen());
        assertEquals("Bến mới", result.getTenBen());
        assertEquals("CHO_PHE_DUYET", result.getTrangThaiPheDuyet());
        verify(benCangRepository).save(any(BenCang.class));
    }

    @Test
    @DisplayName("F-014: create — rejected when parent CangBien NOT HIEN_HANH")
    void create_parentNotHienHanh_throws() {
        CreateBenCangRequest request = buildCreateRequest("BEN-003", "Bến từ chối", parentId);

        when(benCangRepository.existsByMaBen("BEN-003")).thenReturn(false);
        when(cangBienRepository.findById(parentId)).thenReturn(Optional.of(parentNotActive));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));
        assertTrue(ex.getMessage().contains("HIEN_HANH"),
                "Exception should mention HIEN_HANH requirement but was: " + ex.getMessage());
        verify(benCangRepository, never()).save(any());
    }

    @Test
    @DisplayName("F-014: create — rejected when parent CangBien in draft status")
    void create_parentDraft_throws() {
        parentHienHanh.setTrangThaiHoatDong("DRAFT");
        CreateBenCangRequest request = buildCreateRequest("BEN-004", "Bến từ chối draft", parentId);

        when(benCangRepository.existsByMaBen("BEN-004")).thenReturn(false);
        when(cangBienRepository.findById(parentId)).thenReturn(Optional.of(parentHienHanh));

        assertThrows(IllegalArgumentException.class, () -> service.create(request));
        verify(benCangRepository, never()).save(any());
    }

    @Test
    @DisplayName("F-014: create — duplicate code throws IllegalArgumentException")
    void create_duplicateCode_throws() {
        CreateBenCangRequest request = buildCreateRequest("BEN-001", "Duplicate", parentId);

        when(benCangRepository.existsByMaBen("BEN-001")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));
        assertTrue(ex.getMessage().contains("BEN-001"));
        verify(cangBienRepository, never()).findById(any());
        verify(benCangRepository, never()).save(any());
    }

    @Test
    @DisplayName("F-014: create — throws EntityNotFoundException when parent CangBien missing")
    void create_parentNotFound_throws() {
        CreateBenCangRequest request = buildCreateRequest("BEN-005", "Bến không cha", parentId);

        when(benCangRepository.existsByMaBen("BEN-005")).thenReturn(false);
        when(cangBienRepository.findById(parentId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.create(request));
    }

    // ── READ ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("F-017: getById — returns response when found")
    void getById_found() {
        when(benCangRepository.findById(testId)).thenReturn(Optional.of(testBenCang));

        BenCangResponse result = service.getById(testId);

        assertEquals("BEN-001", result.getMaBen());
        assertEquals("Bến Cảng Test", result.getTenBen());
    }

    @Test
    @DisplayName("F-017: getById — throws EntityNotFoundException when not found")
    void getById_notFound_throws() {
        when(benCangRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.getById(testId));
    }

    // ── DELETE (F-016) ─────────────────────────────────────────────────────

    @Test
    @DisplayName("F-016: softDelete — sets deletedAt and saves")
    void softDelete_succeeds() {
        when(benCangRepository.findById(testId)).thenReturn(Optional.of(testBenCang));
        when(benCangRepository.save(any())).thenReturn(testBenCang);

        service.softDelete(testId);

        assertNotNull(testBenCang.getDeletedAt());
        verify(benCangRepository).save(testBenCang);
    }

    @Test
    @DisplayName("F-016: softDelete — throws EntityNotFoundException when not found")
    void softDelete_notFound_throws() {
        when(benCangRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.softDelete(testId));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private CreateBenCangRequest buildCreateRequest(String maBen, String tenBen, UUID cangBienId) {
        CreateBenCangRequest req = new CreateBenCangRequest();
        req.setMaBen(maBen);
        req.setTenBen(tenBen);
        req.setCangBienId(cangBienId);
        req.setTrangThaiHoatDong("HIEN_HANH");
        return req;
    }
}
