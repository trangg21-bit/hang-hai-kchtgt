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
import com.hanghai.kchtg.port.dto.anchorage.AnchorageResponse;
import com.hanghai.kchtg.port.dto.anchorage.UpdateAnchorageRequest;
import com.hanghai.kchtg.port.entity.Anchorage;
import com.hanghai.kchtg.port.repository.AnchorageRepository;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.BuoyBerthRepository;
import com.hanghai.kchtg.port.repository.MooringWaterAreaAnchorPointRepository;
import com.hanghai.kchtg.port.repository.MooringWaterAreaRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AnchorageServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID PORT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private AnchorageRepository anchorageRepository;

    @Mock
    private MooringWaterAreaRepository mooringWaterAreaRepository;

    @Mock
    private MooringWaterAreaAnchorPointRepository mooringWaterAreaAnchorPointRepository;

    @Mock
    private PortRepository portRepository;

    @Mock
    private BuoyBerthRepository buoyBerthRepository;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private ChangeHistoryService changeHistoryService;

    @Mock
    private UserResolverService userResolverService;

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
    private AnchorageService service;

    private Anchorage entity;

    @BeforeEach
    void setUp() {
        entity = Anchorage.builder()
                .id(ID)
                .anchorageCode("HP-ND-001")
                .anchorageName("Khu neo Hải Phòng")
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

        when(anchorageRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(anchorageRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));
        when(mooringWaterAreaRepository.findByAnchorageId(ID)).thenReturn(Collections.emptyList());

        UpdateAnchorageRequest req = new UpdateAnchorageRequest();
        req.setId(ID);
        req.setAnchorageName("Khu neo Hải Phòng");
        req.setGeometryType(null);
        req.setCoordinates(null);
        req.setLongitude(null);
        req.setLatitude(null);
        req.setMapSymbolId(null);
        req.setCoordinateSystem(null);
        req.setDisplayRule(null);

        AnchorageResponse result = service.update(req);

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
        entity.setShapeDescription("Hình dạng cũ");
        entity.setDesignWaterDepth("Độ sâu TK cũ");
        entity.setCurrentWaterDepth("Độ sâu HT cũ");
        entity.setBottomElevationDesign("Cao trình cũ");
        entity.setMaxVesselDWT("Trọng tải cũ");
        entity.setRemarks("Ghi chú cũ");
        entity.setPublicDecision("Quyết định cũ");
        entity.setInvestmentAgreement("Thỏa thuận cũ");

        when(anchorageRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(anchorageRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateAnchorageRequest req = UpdateAnchorageRequest.builder()
                .id(ID)
                .anchorageName("Khu neo Hải Phòng")
                .detailedLocation("   ")
                .shapeDescription("")
                .designWaterDepth("   ")
                .currentWaterDepth("")
                .bottomElevationDesign("   ")
                .maxVesselDWT("")
                .remarks("   ")
                .publicDecision("")
                .investmentAgreement("   ")
                .build();

        AnchorageResponse result = service.update(req);

        assertNotNull(result);
        assertNull(result.getDetailedLocation());
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

        when(anchorageRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(anchorageRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));
        when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mockSpatial);

        UpdateAnchorageRequest req = new UpdateAnchorageRequest();
        req.setId(ID);
        req.setAnchorageName("Khu neo Hải Phòng");
        req.setCoordinates("POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))");
        req.setGeometryType(null); // Không truyền geometryType tường minh

        AnchorageResponse result = service.update(req);

        assertNotNull(result);
        assertEquals(spatialId, entity.getSpatialId());
        verify(gisSpatialObjectService, never()).delete(any());
        verify(gisSpatialObjectService).createOrUpdate(
                eq(spatialId),
                eq("Khu neo Hải Phòng"),
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

        when(anchorageRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(anchorageRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));
        when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mockSpatial);

        UpdateAnchorageRequest req = new UpdateAnchorageRequest();
        req.setId(ID);
        req.setAnchorageName("Khu neo Hải Phòng");
        req.setCoordinates("SRID=4326;POINT (106.685678 20.841234)");

        AnchorageResponse result = service.update(req);

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

        when(anchorageRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(anchorageRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));

        // Chỉ update remarks, không đụng tới GIS fields
        UpdateAnchorageRequest req = new UpdateAnchorageRequest();
        req.setId(ID);
        req.setRemarks("Ghi chú mới");

        AnchorageResponse result = service.update(req);

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
