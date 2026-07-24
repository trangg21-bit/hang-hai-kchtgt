package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.cangben.dto.vungnuoc.CreateWaterZoneRequest;
import com.hanghai.kchtg.cangben.dto.vungnuoc.WaterZoneResponse;
import com.hanghai.kchtg.cangben.entity.WaterZone;
import com.hanghai.kchtg.cangben.repository.WaterZoneRepository;
import com.hanghai.kchtg.cangben.service.WaterZoneService;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import com.hanghai.kchtg.cangben.service.shared.UserResolverService;
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
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.hanghai.kchtg.cangben.entity.Port;
import com.hanghai.kchtg.cangben.repository.PortRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("WaterZoneService unit tests — INT-004 / CRUD")
class WaterZoneServiceTest {

    @InjectMocks
    private WaterZoneService service;

    @Mock
    private WaterZoneRepository waterZoneRepository;

    @Mock
    private PortRepository portRepository;

    @Mock
    private LichSuThayDoiService lichSuThayDoiService;

    @Mock
    private UserResolverService userResolverService;

    @Mock
    private com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    private UUID testId;
    private UUID portId;
    private UUID orgUnitId;
    private WaterZone testEntity;

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
        portId = UUID.randomUUID();
        orgUnitId = UUID.randomUUID();

        testEntity = new WaterZone();
        ReflectionTestUtils.setField(testEntity, "id", testId);
        testEntity.setWaterZoneCode("VN-001");
        testEntity.setWaterZoneName("Vùng Nước Demo");
        testEntity.setPortId(portId);
        testEntity.setArea(new BigDecimal("500.00"));
        testEntity.setMaxDepth(new BigDecimal("15.00"));
        testEntity.setAvgDepth(new BigDecimal("12.00"));
        testEntity.setWaterZoneType(com.hanghai.kchtg.cangben.entity.LoaiVungNuoc.NEO_DAU);
        testEntity.setOperationalStatus(TrangThaiHoatDong.HIEN_HANH);
        testEntity.setApprovalStatus(TrangThaiPheDuyet.CHO_PHE_DUYET);
    }

    // ── findAll — INT-004 two-filter overload ─────────────────────────────

    @Test
    @DisplayName("INT-004: findAll(page,size,orgUnitId,portId) → calls 2-filter repo overload")
    void findAll_withPortIdFilter_callsOverloadedRepo() {
        Page<WaterZone> mockPage = new PageImpl<>(List.of(testEntity));
        when(waterZoneRepository.searchWaterZones(eq(orgUnitId), eq(portId), isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(mockPage);

        Page<WaterZoneResponse> result = service.findAll(0, 20, orgUnitId, portId);

        assertEquals(1, result.getTotalElements());
        verify(waterZoneRepository).searchWaterZones(eq(orgUnitId), eq(portId), isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    @DisplayName("INT-004: findAll(page,size,orgUnitId) → delegates to 4-arg with portId=null")
    void findAll_withoutPortId_callsSingleFilter() {
        Page<WaterZone> mockPage = new PageImpl<>(List.of());
        when(waterZoneRepository.searchWaterZones(eq(orgUnitId), isNull(), isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(mockPage);

        Page<WaterZoneResponse> result = service.findAll(0, 20, orgUnitId);

        assertEquals(0, result.getTotalElements());
        verify(waterZoneRepository).searchWaterZones(eq(orgUnitId), isNull(), isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("create — saves and returns response")
    void create_success() {
        CreateWaterZoneRequest request = buildCreateRequest("VN-NEW", "Vùng nước mới");
        Port parent = new Port();
        parent.setOrgUnitId(orgUnitId);
        when(portRepository.findById(portId)).thenReturn(Optional.of(parent));
        when(waterZoneRepository.existsByWaterZoneCode("VN-NEW")).thenReturn(false);
        when(waterZoneRepository.save(any(WaterZone.class))).thenAnswer(inv -> {
            WaterZone saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        WaterZoneResponse result = service.create(request);

        assertNotNull(result);
        assertEquals("VN-NEW", result.getWaterZoneCode());
        assertEquals("Vùng nước mới", result.getWaterZoneName());
        assertEquals(TrangThaiPheDuyet.CHO_PHE_DUYET, result.getApprovalStatus());
        verify(waterZoneRepository).save(any(WaterZone.class));
    }

    @Test
    @DisplayName("create — duplicate waterZoneCode → IllegalArgumentException")
    void create_duplicateCode_throwsIllegalArg() {
        CreateWaterZoneRequest request = buildCreateRequest("VN-001", "Trùng mã");
        when(waterZoneRepository.existsByWaterZoneCode("VN-001")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(request));
        assertTrue(ex.getMessage().contains("VN-001"));
        verify(waterZoneRepository, never()).save(any());
    }

    @Test
    @DisplayName("softDelete — entity found, soft-deleted and saved")
    void softDelete_setsDeletedAt() {
        when(waterZoneRepository.findById(testId)).thenReturn(Optional.of(testEntity));
        when(waterZoneRepository.save(any())).thenReturn(testEntity);

        service.softDelete(testId);

        assertNotNull(testEntity.getDeletedAt());
        verify(waterZoneRepository).save(testEntity);
    }

    @Test
    @DisplayName("softDelete — entity not found → EntityNotFoundException")
    void softDelete_notFound_throws() {
        when(waterZoneRepository.findById(testId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.softDelete(testId));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private CreateWaterZoneRequest buildCreateRequest(String waterZoneCode, String waterZoneName) {
        CreateWaterZoneRequest req = new CreateWaterZoneRequest();
        req.setWaterZoneCode(waterZoneCode);
        req.setWaterZoneName(waterZoneName);
        req.setPortId(portId);
        req.setOperationalStatus(TrangThaiHoatDong.HIEN_HANH);
        return req;
    }
}
