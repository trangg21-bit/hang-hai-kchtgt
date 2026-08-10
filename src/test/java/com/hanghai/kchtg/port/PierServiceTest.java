package com.hanghai.kchtg.port;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.dto.pier.CreatePierRequest;
import com.hanghai.kchtg.port.dto.pier.PierResponse;
import com.hanghai.kchtg.port.dto.pier.UpdatePierRequest;
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.service.PierService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
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
@DisplayName("PierService unit tests — INT-005 / CRUD")
class PierServiceTest {

    @InjectMocks
    private PierService service;

    @Mock
    private PierRepository pierRepository;

    @Mock
    private BerthRepository berthRepository;

    @Mock
    private ChangeHistoryService changeHistoryService;

    @Mock
    private UserResolverService userResolverService;

    @Mock
    private com.hanghai.kchtg.orgunit.service.OrgUnitCacheService orgUnitCacheService;

    private UUID testId;
    private UUID parentId;
    private Berth activeBerth;
    private Pier testEntity;

    @BeforeEach
    void setUp() {
        lenient().when(userResolverService.resolveName(any())).thenAnswer(inv -> {
            String arg = inv.getArgument(0);
            return arg != null ? arg : "SYSTEM";
        });

        testId = UUID.randomUUID();
        parentId = UUID.randomUUID();

        activeBerth = new Berth();
        ReflectionTestUtils.setField(activeBerth, "id", parentId);
        activeBerth.setBerthCode("BEN-001");
        activeBerth.setBerthName("Bến Cảng Demo");
        activeBerth.setOperationalStatus(OperationalStatus.OPERATIONAL);
        activeBerth.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        testEntity = new Pier();
        ReflectionTestUtils.setField(testEntity, "id", testId);
        testEntity.setPierCode("CAU-001");
        testEntity.setPierName("Cầu Cảng Demo");
        testEntity.setBerthId(parentId);
        testEntity.setLength(new BigDecimal("200.00"));
        testEntity.setDesignLoad(new BigDecimal("50000.00"));
        testEntity.setOperationalStatus(OperationalStatus.OPERATIONAL);
        testEntity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
    }

    // ── CREATE — INT-005 parent guard ──────────────────────────────────────

    @Test
    @DisplayName("INT-005: create — parent Berth not found → EntityNotFoundException")
    void create_parentNotFound_throwsEntityNotFound() {
        CreatePierRequest request = buildCreateRequest("CAU-NEW", "Cầu mới", parentId);
        when(pierRepository.existsByPierCode("CAU-NEW")).thenReturn(false);
        when(berthRepository.findById(parentId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.create(request));
        verify(pierRepository, never()).save(any());
    }

    @Test
    @DisplayName("INT-005: create — parent Berth not HIEN_HANH → IllegalArgumentException")
    void create_parentNotHienHanh_throwsIllegalArg() {
        activeBerth.setOperationalStatus(OperationalStatus.SUSPENDED);
        CreatePierRequest request = buildCreateRequest("CAU-NEW", "Cầu mới", parentId);
        when(pierRepository.existsByPierCode("CAU-NEW")).thenReturn(false);
        when(berthRepository.findById(parentId)).thenReturn(Optional.of(activeBerth));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));
        assertTrue(ex.getMessage().contains("HIEN_HANH"),
                "Exception message should mention HIEN_HANH, was: " + ex.getMessage());
        verify(pierRepository, never()).save(any());
    }

    @Test
    @DisplayName("create — duplicate pierCode → IllegalArgumentException")
    void create_duplicateCode_throwsIllegalArg() {
        CreatePierRequest request = buildCreateRequest("CAU-001", "Cầu trùng mã", parentId);
        when(pierRepository.existsByPierCode("CAU-001")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));
        assertTrue(ex.getMessage().contains("CAU-001"));
        verify(pierRepository, never()).save(any());
    }

    @Test
    @DisplayName("create — parent HIEN_HANH, no dupe → saves and returns response")
    void create_success() {
        CreatePierRequest request = buildCreateRequest("CAU-NEW", "Cầu mới", parentId);
        when(pierRepository.existsByPierCode("CAU-NEW")).thenReturn(false);
        when(berthRepository.findById(parentId)).thenReturn(Optional.of(activeBerth));
        when(pierRepository.save(any(Pier.class))).thenAnswer(inv -> {
            Pier saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        PierResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("CAU-NEW", result.getPierCode());
        assertEquals("Cầu mới", result.getPierName());
        assertEquals(ApprovalStatus.DRAFT, result.getApprovalStatus());
        verify(pierRepository).save(any(Pier.class));
    }

    // ── UPDATE ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("update — applies mutable fields, resets to PENDING, calls recordChanges")
    void update_appliesMutableFields_resetsApproval() {
        testEntity.setApprovalStatus(ApprovalStatus.APPROVED);
        when(pierRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(pierRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdatePierRequest request = new UpdatePierRequest();
        request.setId(testId);
        request.setPierName("Cầu Đã Cập Nhật");
        request.setLength(new BigDecimal("300.00"));

        PierResponse result = service.update(request);

        assertEquals("Cầu Đã Cập Nhật", result.getPierName());
        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        assertEquals("CAU-001", result.getPierCode()); // code unchanged
        verify(changeHistoryService).recordChanges(eq("Pier"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("update — entity not found → EntityNotFoundException")
    void update_notFound_throws() {
        UpdatePierRequest request = new UpdatePierRequest();
        request.setId(testId);
        when(pierRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.update(request));
    }

    // ── SOFT DELETE ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("softDelete — entity found, softDelete() called, save called")
    void softDelete_setsDeletedAt() {
        when(pierRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(pierRepository.save(any())).thenReturn(testEntity);

        service.softDelete(testId);

        assertNotNull(testEntity.getDeletedAt());
        verify(pierRepository).save(testEntity);
    }

    @Test
    @DisplayName("softDelete — entity not found → EntityNotFoundException")
    void softDelete_notFound_throws() {
        when(pierRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.softDelete(testId));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private CreatePierRequest buildCreateRequest(String pierCode, String pierName, UUID berthId) {
        CreatePierRequest req = new CreatePierRequest();
        req.setPierCode(pierCode);
        req.setPierName(pierName);
        req.setBerthId(berthId);
        req.setOperationalStatus(OperationalStatus.OPERATIONAL);
        return req;
    }
}
