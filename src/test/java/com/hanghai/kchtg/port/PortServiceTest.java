package com.hanghai.kchtg.port;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.dto.port.CreatePortRequest;
import com.hanghai.kchtg.port.dto.port.PortResponse;
import com.hanghai.kchtg.port.dto.port.UpdatePortRequest;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.repository.WaterZoneRepository;
import com.hanghai.kchtg.port.service.PortService;
import com.hanghai.kchtg.port.service.shared.ChangeTrackingService;
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
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;

@ExtendWith(MockitoExtension.class)
@DisplayName("PortService unit tests — F-008/F-009/F-010")
class PortServiceTest {

    @InjectMocks
    private PortService service;

    @Mock
    private PortRepository portRepository;

    @Mock
    private BerthRepository berthRepository;

    @Mock
    private WaterZoneRepository waterZoneRepository;

    @Mock
    private ChangeTrackingService changeTrackingService;

    @Mock
    private ChangeHistoryService changeHistoryService;

    @Mock
    private UserResolverService userResolverService;

    @Mock
    private com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private com.hanghai.kchtg.orgunit.service.OrgUnitCacheService orgUnitCacheService;

    @Mock
    private PortCacheService portCacheService;

    private UUID testId;
    private Port testEntity;

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

        testId = UUID.randomUUID();
        testEntity = new Port();
        ReflectionTestUtils.setField(testEntity, "id", testId);
        testEntity.setPortCode("CB-001");
        testEntity.setPortName("Cảng Biển Demo");
        testEntity.setProvince("Hà Nội");
        testEntity.setArea(new BigDecimal("5000.00"));
        testEntity.setOperationalStatus(OperationalStatus.OPERATIONAL);
        testEntity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
    }

    // ── CREATE (F-008) ─────────────────────────────────────────────────────

    @Test
    @DisplayName("F-008: create — succeeds and returns response")
    void create_succeeds() {
        CreatePortRequest request = buildCreateRequest("CB-002", "Cảng mới",
                new BigDecimal("20.0"), new BigDecimal("106.0"), new BigDecimal("1000.00"));

        when(portRepository.existsByPortCode("CB-002")).thenReturn(false);
        when(portRepository.save(any(Port.class))).thenAnswer(inv -> {
            Port saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        PortResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("CB-002", result.getPortCode());
        assertEquals("Cảng mới", result.getPortName());
        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        verify(portRepository, times(1)).save(any(Port.class));
    }

    @Test
    @DisplayName("F-008: create — duplicate code throws IllegalArgumentException")
    void create_duplicateCode_throwsConflict() {
        CreatePortRequest request = buildCreateRequest("CB-001", "Duplicate",
                new BigDecimal("10.0"), new BigDecimal("100.0"), new BigDecimal("100.00"));

        when(portRepository.existsByPortCode("CB-001")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));
        assertTrue(ex.getMessage().contains("CB-001"));
        verify(portRepository, never()).save(any());
    }

    // ── READ ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("F-012: getById — returns response when found")
    void getById_found() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));

        PortResponse result = service.getById(testId);

        assertEquals("CB-001", result.getPortCode());
        assertEquals("Cảng Biển Demo", result.getPortName());
    }

    @Test
    @DisplayName("F-012: getById — throws EntityNotFoundException when not found")
    void getById_notFound_throws() {
        when(portRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.getById(testId));
    }

    @Test
    @DisplayName("F-012: findAll — pagination honored, defaults max 100")
    void findAll_paginationHonored() {
        Page<Port> mockPage = new PageImpl<>(List.of(testEntity));
        when(portRepository.searchPorts(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), any(Pageable.class))).thenReturn(mockPage);

        Page<PortResponse> result = service.findAll(0, 20, null);

        assertEquals(1, result.getTotalElements());
        verify(portRepository).searchPorts(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    @DisplayName("F-012: findAll — size capped at 5000")
    void findAll_sizeCappedAt5000() {
        Page<Port> mockPage = new PageImpl<>(List.of());
        when(portRepository.searchPorts(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), any(Pageable.class))).thenReturn(mockPage);

        service.findAll(0, 9999, null);

        verify(portRepository).searchPorts(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), argThat(p -> p.getPageSize() == 5000));
    }

    // ── UPDATE (F-009) ─────────────────────────────────────────────────────

    @Test
    @DisplayName("F-009: update — applies mutable fields, resets approval to PENDING")
    void update_appliesMutableFields() {
        testEntity.setApprovalStatus(ApprovalStatus.APPROVED); // was approved

        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(portRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdatePortRequest request = new UpdatePortRequest();
        request.setId(testId);
        request.setPortName("Cảng Đã Cập Nhật");
        request.setProvince("Hà Nội");

        PortResponse result = service.update(request);

        assertEquals("Cảng Đã Cập Nhật", result.getPortName());
        assertEquals(ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus()); // reset
        assertEquals("CB-001", result.getPortCode()); // code unchanged
    }

    @Test
    @DisplayName("F-009: update — throws EntityNotFoundException when not found")
    void update_notFound_throws() {
        UpdatePortRequest request = new UpdatePortRequest();
        request.setId(testId);

        when(portRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.update(request));
    }

    // ── DELETE (F-010) ─────────────────────────────────────────────────────

    @Test
    @DisplayName("F-010: softDelete — succeeds when no active children")
    void softDelete_noChildren_succeeds() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(berthRepository.countByPortIdAndDeletedAtIsNull(testId)).thenReturn(0L);
        when(waterZoneRepository.countByPortIdAndDeletedAtIsNull(testId)).thenReturn(0L);
        when(portRepository.save(any())).thenReturn(testEntity);

        service.softDelete(testId);

        assertNotNull(testEntity.getDeletedAt()); // softDelete() sets deletedAt
        verify(portRepository).save(testEntity);
    }

    @Test
    @DisplayName("F-010: softDelete — blocked when Berth children exist")
    void softDelete_blockedByBerthChildren() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(berthRepository.countByPortIdAndDeletedAtIsNull(testId)).thenReturn(2L);
        when(waterZoneRepository.countByPortIdAndDeletedAtIsNull(testId)).thenReturn(0L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.softDelete(testId));
        assertTrue(ex.getMessage().contains("bến cảng"));
        verify(portRepository, never()).save(any());
    }

    @Test
    @DisplayName("F-010: softDelete — blocked when WaterZone children exist")
    void softDelete_blockedByWaterZoneChildren() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(berthRepository.countByPortIdAndDeletedAtIsNull(testId)).thenReturn(0L);
        when(waterZoneRepository.countByPortIdAndDeletedAtIsNull(testId)).thenReturn(3L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.softDelete(testId));
        assertTrue(ex.getMessage().contains("vùng nước"));
        verify(portRepository, never()).save(any());
    }

    @Test
    @DisplayName("F-010: softDelete — blocked when both child types exist, message lists both counts")
    void softDelete_blockedByBothChildTypes() {
        when(portRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(berthRepository.countByPortIdAndDeletedAtIsNull(testId)).thenReturn(1L);
        when(waterZoneRepository.countByPortIdAndDeletedAtIsNull(testId)).thenReturn(1L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.softDelete(testId));
        assertTrue(ex.getMessage().contains("bến cảng"));
        assertTrue(ex.getMessage().contains("vùng nước"));
    }

    @Test
    @DisplayName("F-010: softDelete — throws EntityNotFoundException when entity missing")
    void softDelete_notFound_throws() {
        when(portRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.softDelete(testId));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private CreatePortRequest buildCreateRequest(String portCode, String portName,
                                                     BigDecimal latitude, BigDecimal longitude,
                                                     BigDecimal area) {
        CreatePortRequest req = new CreatePortRequest();
        req.setPortCode(portCode);
        req.setPortName(portName);
        req.setArea(area);
        req.setOperationalStatus(OperationalStatus.OPERATIONAL);
        return req;
    }
}
