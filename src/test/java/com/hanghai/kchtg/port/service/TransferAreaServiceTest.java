package com.hanghai.kchtg.port.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.port.dto.transferarea.TransferAreaResponse;
import com.hanghai.kchtg.port.dto.transferarea.UpdateTransferAreaRequest;
import com.hanghai.kchtg.port.entity.TransferArea;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.repository.TransferAreaMooringWaterAreaAnchorPointRepository;
import com.hanghai.kchtg.port.repository.TransferAreaMooringWaterAreaRepository;
import com.hanghai.kchtg.port.repository.TransferAreaRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TransferAreaServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID PORT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private TransferAreaRepository transferAreaRepository;

    @Mock
    private TransferAreaMooringWaterAreaRepository transferAreaMooringWaterAreaRepository;

    @Mock
    private TransferAreaMooringWaterAreaAnchorPointRepository transferAreaMooringWaterAreaAnchorPointRepository;

    @Mock
    private PortRepository portRepository;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private ChangeHistoryService changeHistoryService;

    @Mock
    private PortCacheService portCacheService;

    @Mock
    private com.hanghai.kchtg.orgunit.service.OrgUnitCacheService orgUnitCacheService;

    @Mock
    private com.hanghai.kchtg.orgunit.service.OrgUnitScopeService orgUnitScopeService;

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    @InjectMocks
    private TransferAreaService service;

    private TransferArea entity;

    @BeforeEach
    void setUp() {
        entity = TransferArea.builder()
                .id(ID)
                .transferAreaCode("HP-CT-001")
                .transferAreaName("Khu chuyển tải Hải Phòng")
                .portId(PORT_ID)
                .approvalStatus(ApprovalStatus.DRAFT)
                .build();
    }

    @Test
    void update_whenGeometryTypeCleared_shouldClearAllLocationFieldsAndSpatialObject() {
        UUID spatialId = UUID.randomUUID();
        UUID mapSymbolId = UUID.randomUUID();
        entity.setSpatialId(spatialId);
        entity.setMapSymbolId(mapSymbolId);
        entity.setCoordinateSystem(1);
        entity.setDisplayRule(1);

        GisSpatialObject mockSpatial = new GisSpatialObject();
        mockSpatial.setId(spatialId);
        mockSpatial.setGeometryType(GisGeometryType.POINT);
        mockSpatial.setCoordinates("106.123 20.456");

        when(transferAreaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transferAreaRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));
        when(transferAreaMooringWaterAreaRepository.findByTransferAreaId(ID)).thenReturn(Collections.emptyList());

        UpdateTransferAreaRequest req = new UpdateTransferAreaRequest();
        req.setId(ID);
        req.setTransferAreaName("Khu chuyển tải Hải Phòng");
        req.setGeometryType(null);
        req.setCoordinates(null);
        req.setLongitude(null);
        req.setLatitude(null);
        req.setMapSymbolId(null);
        req.setCoordinateSystem(null);
        req.setDisplayRule(null);

        TransferAreaResponse result = service.update(req);

        assertNotNull(result);
        assertNull(entity.getSpatialId());
        assertNull(entity.getMapSymbolId());
        assertNull(entity.getCoordinateSystem());
        assertNull(entity.getDisplayRule());
        verify(gisSpatialObjectService, atLeastOnce()).delete(spatialId);
        assertNull(result.getCoordinates());
        assertNull(result.getGeometryType());
        assertNull(result.getMapSymbolId());
    }

    @Test
    void update_whenFieldsCleared_shouldSetFieldsToNull() {
        entity.setDetailedLocation("Vị trí cũ");
        entity.setOperationalFunctions("Công năng cũ");
        entity.setShapeDescription("Hình dạng cũ");
        entity.setDesignWaterDepth("Độ sâu TK cũ");
        entity.setCurrentWaterDepth("Độ sâu HT cũ");
        entity.setBottomElevationDesign("Cao trình cũ");
        entity.setMaxVesselDWT("Trọng tải cũ");
        entity.setRemarks("Ghi chú cũ");
        entity.setPublicDecision("Quyết định cũ");
        entity.setInvestmentAgreement("Thỏa thuận cũ");

        when(transferAreaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transferAreaRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateTransferAreaRequest req = UpdateTransferAreaRequest.builder()
                .id(ID)
                .transferAreaName("Khu chuyển tải Hải Phòng")
                .detailedLocation("   ")
                .operationalFunctions("")
                .shapeDescription("   ")
                .designWaterDepth("")
                .currentWaterDepth("   ")
                .bottomElevationDesign("")
                .maxVesselDWT("   ")
                .remarks("")
                .publicDecision("   ")
                .investmentAgreement("")
                .build();

        TransferAreaResponse result = service.update(req);

        assertNotNull(result);
        assertNull(result.getDetailedLocation());
        assertNull(result.getOperationalFunctions());
        assertNull(result.getShapeDescription());
        assertNull(result.getDesignWaterDepth());
        assertNull(result.getCurrentWaterDepth());
        assertNull(result.getBottomElevationDesign());
        assertNull(result.getMaxVesselDWT());
        assertNull(result.getRemarks());
        assertNull(result.getPublicDecision());
        assertNull(result.getInvestmentAgreement());
    }

    @Test
    void update_whenCoordinatesProvidedWithoutGeometryType_shouldInferGeometryTypeAndNotClearLocation() {
        UUID spatialId = UUID.randomUUID();
        entity.setSpatialId(spatialId);

        GisSpatialObject mockSpatial = new GisSpatialObject();
        mockSpatial.setId(spatialId);
        mockSpatial.setGeometryType(GisGeometryType.POLYGON);
        mockSpatial.setCoordinates("POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))");

        when(transferAreaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transferAreaRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));
        when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mockSpatial);

        UpdateTransferAreaRequest req = new UpdateTransferAreaRequest();
        req.setId(ID);
        req.setTransferAreaName("Khu chuyển tải Hải Phòng");
        req.setCoordinates("POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))");
        req.setGeometryType(null); // Không truyền geometryType tường minh

        TransferAreaResponse result = service.update(req);

        assertNotNull(result);
        assertEquals(spatialId, entity.getSpatialId());
        verify(gisSpatialObjectService, never()).delete(any());
        verify(gisSpatialObjectService).createOrUpdate(
                eq(spatialId),
                eq("Khu chuyển tải Hải Phòng"),
                any(),
                eq(GisGeometryType.POLYGON),
                any(),
                eq("POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))"),
                eq(ID),
                any()
        );
        assertEquals(GisGeometryType.POLYGON, result.getGeometryType());
        assertNotNull(result.getCoordinates());
    }

    @Test
    void update_whenWktHasSridPrefix_shouldParseLatLngAndNotClearLocation() {
        UUID spatialId = UUID.randomUUID();
        entity.setSpatialId(spatialId);

        GisSpatialObject mockSpatial = new GisSpatialObject();
        mockSpatial.setId(spatialId);
        mockSpatial.setGeometryType(GisGeometryType.POINT);
        mockSpatial.setCoordinates("SRID=4326;POINT (106.685678 20.841234)");

        when(transferAreaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transferAreaRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));
        when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mockSpatial);

        UpdateTransferAreaRequest req = new UpdateTransferAreaRequest();
        req.setId(ID);
        req.setTransferAreaName("Khu chuyển tải Hải Phòng");
        req.setCoordinates("SRID=4326;POINT (106.685678 20.841234)");

        TransferAreaResponse result = service.update(req);

        assertNotNull(result);
        assertEquals(spatialId, entity.getSpatialId());
        verify(gisSpatialObjectService, never()).delete(any());
        assertEquals(GisGeometryType.POINT, result.getGeometryType());
        assertNotNull(result.getLongitude());
        assertNotNull(result.getLatitude());
        assertEquals(0, new java.math.BigDecimal("106.685678").compareTo(result.getLongitude()));
        assertEquals(0, new java.math.BigDecimal("20.841234").compareTo(result.getLatitude()));
    }

    @Test
    void update_whenLocationFieldsNotSent_shouldPreserveExistingLocation() {
        UUID spatialId = UUID.randomUUID();
        entity.setSpatialId(spatialId);
        entity.setMapSymbolId(UUID.randomUUID());
        entity.setCoordinateSystem(1);
        entity.setDisplayRule(1);

        GisSpatialObject mockSpatial = new GisSpatialObject();
        mockSpatial.setId(spatialId);
        mockSpatial.setGeometryType(GisGeometryType.POINT);
        mockSpatial.setCoordinates("POINT (106.685678 20.841234)");

        when(transferAreaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(transferAreaRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));

        // Chỉ update remarks, không đụng tới GIS fields
        UpdateTransferAreaRequest req = new UpdateTransferAreaRequest();
        req.setId(ID);
        req.setRemarks("Ghi chú mới");

        TransferAreaResponse result = service.update(req);

        assertNotNull(result);
        assertEquals(spatialId, entity.getSpatialId());
        assertNotNull(entity.getMapSymbolId());
        assertEquals(1, entity.getCoordinateSystem());
        assertEquals(1, entity.getDisplayRule());
        verify(gisSpatialObjectService, never()).delete(any());
        assertEquals(GisGeometryType.POINT, result.getGeometryType());
        assertEquals("POINT (106.685678 20.841234)", result.getCoordinates());
    }
}
