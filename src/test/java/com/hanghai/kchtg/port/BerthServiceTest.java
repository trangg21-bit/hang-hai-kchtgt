package com.hanghai.kchtg.port;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.dto.berth.BerthResponse;
import com.hanghai.kchtg.port.dto.berth.CreateBerthRequest;
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.BerthService;
import com.hanghai.kchtg.port.service.shared.AuditLogService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.port.service.PortCacheService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BerthService unit tests — F-014/F-015/F-016")
class BerthServiceTest {

    @InjectMocks
    private BerthService service;

    @Mock
    private BerthRepository berthRepository;

    @Mock
    private PortRepository portRepository;

    @Mock
    private com.hanghai.kchtg.port.repository.PierRepository pierRepository;

    @Mock
    private ChangeHistoryService changeHistoryService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private UserResolverService userResolverService;

    @Mock
    private com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private com.hanghai.kchtg.orgunit.service.OrgUnitCacheService orgUnitCacheService;

    @Mock
    private PortCacheService portCacheService;

    private UUID parentId;
    private UUID testId;
    private Port parentHienHanh;
    private Port parentNotActive;
    private Berth testBerth;

    @BeforeEach
    void setUp() {
        lenient().when(userResolverService.resolveName(any())).thenAnswer(inv -> {
            String arg = inv.getArgument(0);
            return arg != null ? arg : "SYSTEM";
        });
        lenient().when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenAnswer(inv -> {
                    com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatial = new com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject();
                    spatial.setId(UUID.randomUUID());
                    return spatial;
                });

        parentId = UUID.randomUUID();
        testId = UUID.randomUUID();

        parentHienHanh = new Port();
        ReflectionTestUtils.setField(parentHienHanh, "id", parentId);
        parentHienHanh.setPortCode("CB-001");
        parentHienHanh.setPortName("Cảng Cha Hoạt Động");
        parentHienHanh.setOperationalStatus(OperationalStatus.OPERATIONAL);
        parentHienHanh.setApprovalStatus(ApprovalStatus.APPROVED);

        parentNotActive = new Port();
        ReflectionTestUtils.setField(parentNotActive, "id", parentId);
        parentNotActive.setPortCode("CB-002");
        parentNotActive.setPortName("Cảng Cha Không Hoạt Động");
        parentNotActive.setOperationalStatus(OperationalStatus.SUSPENDED);
        parentNotActive.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        testBerth = new Berth();
        ReflectionTestUtils.setField(testBerth, "id", testId);
        testBerth.setBerthCode("BEN-001");
        testBerth.setBerthName("Bến Cảng Test");
        testBerth.setPortId(parentId);
        testBerth.setOperationalStatus(OperationalStatus.OPERATIONAL);
        testBerth.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
    }

    // ── CREATE (F-014) ─────────────────────────────────────────────────────

    @Test
    @DisplayName("F-014: create — succeeds when parent is HIEN_HANH")
    void create_parentHienHanh_succeeds() {
        CreateBerthRequest request = buildCreateRequest("BEN-002", "Bến mới", parentId);

        lenient().when(berthRepository.existsByBerthCode("BEN-002")).thenReturn(false);
        when(portRepository.findById(parentId)).thenReturn(Optional.of(parentHienHanh));
        when(berthRepository.save(any(Berth.class))).thenAnswer(inv -> {
            Berth saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        BerthResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("CB-001-B01", result.getBerthCode());
        assertEquals("Bến mới", result.getBerthName());
        assertEquals(ApprovalStatus.DRAFT, result.getApprovalStatus());
        verify(berthRepository).save(any(Berth.class));
    }

    @Test
    @DisplayName("F-014: create — rejected when parent Port NOT HIEN_HANH")
    void create_parentNotHienHanh_throws() {
        CreateBerthRequest request = buildCreateRequest("BEN-003", "Bến từ chối", parentId);

        when(portRepository.findById(parentId)).thenReturn(Optional.of(parentNotActive));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));
        assertTrue(ex.getMessage().contains("được phê duyệt"),
                "Exception should mention approval requirement but was: " + ex.getMessage());
        verify(berthRepository, never()).save(any());
    }

    @Test
    @DisplayName("F-014: create — rejected when parent Port in draft status")
    void create_parentDraft_throws() {
        Port draftParent = new Port();
        draftParent.setApprovalStatus(ApprovalStatus.DRAFT);
        CreateBerthRequest request = buildCreateRequest("BEN-004", "Bến từ chối draft", parentId);

        when(portRepository.findById(parentId)).thenReturn(Optional.of(draftParent));

        assertThrows(IllegalArgumentException.class, () -> service.create(request));
        verify(berthRepository, never()).save(any());
    }

    @Test
    @DisplayName("F-014: create — throws EntityNotFoundException when parent Port missing")
    void create_parentNotFound_throws() {
        CreateBerthRequest request = buildCreateRequest("BEN-005", "Bến không cha", parentId);

        when(portRepository.findById(parentId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.create(request));
    }

    // ── READ ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("F-017: getById — returns response when found")
    void getById_found() {
        when(berthRepository.findById(testId)).thenReturn(Optional.of(testBerth));

        BerthResponse result = service.getById(testId);

        assertEquals("BEN-001", result.getBerthCode());
        assertEquals("Bến Cảng Test", result.getBerthName());
    }

    @Test
    @DisplayName("F-017: getById — throws EntityNotFoundException when not found")
    void getById_notFound_throws() {
        when(berthRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.getById(testId));
    }

    // ── DELETE (F-016) ─────────────────────────────────────────────────────

    @Test
    @DisplayName("F-016: softDelete — sets deletedAt and saves")
    void softDelete_succeeds() {
        testBerth.setApprovalStatus(ApprovalStatus.DRAFT);
        when(berthRepository.findById(testId)).thenReturn(Optional.of(testBerth));
        when(pierRepository.countByBerthIdAndDeletedAtIsNull(testId)).thenReturn(0L);
        when(berthRepository.save(any())).thenReturn(testBerth);

        service.softDelete(testId);

        assertNotNull(testBerth.getDeletedAt());
        verify(berthRepository).save(testBerth);
    }

    @Test
    @DisplayName("F-016: softDelete — throws EntityNotFoundException when not found")
    void softDelete_notFound_throws() {
        when(berthRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.softDelete(testId));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private CreateBerthRequest buildCreateRequest(String berthCode, String berthName, UUID portId) {
        CreateBerthRequest req = new CreateBerthRequest();
        req.setBerthCode(berthCode);
        req.setBerthName(berthName);
        req.setPortId(portId);
        req.setOperationalStatus(OperationalStatus.OPERATIONAL);
        return req;
    }
}
