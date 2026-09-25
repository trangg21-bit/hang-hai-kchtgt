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
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.port.dto.stormshelter.StormShelterAreaResponse;
import com.hanghai.kchtg.port.dto.stormshelter.UpdateStormShelterAreaRequest;
import com.hanghai.kchtg.port.entity.StormShelterArea;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.BuoyBerthRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.repository.StormShelterAreaRepository;
import com.hanghai.kchtg.port.repository.StormShelterMooringWaterAreaAnchorPointRepository;
import com.hanghai.kchtg.port.repository.StormShelterMooringWaterAreaRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StormShelterAreaServiceTest {

    private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID PORT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private StormShelterAreaRepository stormShelterAreaRepository;

    @Mock
    private StormShelterMooringWaterAreaRepository stormShelterMooringWaterAreaRepository;

    @Mock
    private StormShelterMooringWaterAreaAnchorPointRepository stormShelterMooringWaterAreaAnchorPointRepository;

    @Mock
    private PortRepository portRepository;

    @Mock
    private BuoyBerthRepository buoyBerthRepository;

    @Mock
    private NavigationChannelRepository navigationChannelRepository;

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
    private StormShelterAreaService service;

    private StormShelterArea entity;

    @BeforeEach
    void setUp() {
        entity = StormShelterArea.builder()
                .id(ID)
                .stormShelterCode("HP-TTB-001")
                .stormShelterName("Khu tránh bão Hải Phòng")
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

        when(stormShelterAreaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(stormShelterAreaRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));
        when(stormShelterMooringWaterAreaRepository.findByStormShelterAreaId(ID)).thenReturn(Collections.emptyList());

        UpdateStormShelterAreaRequest req = new UpdateStormShelterAreaRequest();
        req.setId(ID);
        req.setStormShelterName("Khu tránh bão Hải Phòng");
        req.setGeometryType(null);
        req.setCoordinates(null);
        req.setLongitude(null);
        req.setLatitude(null);
        req.setMapSymbolId(null);
        req.setCoordinateSystem(null);
        req.setDisplayRule(null);

        StormShelterAreaResponse result = service.update(req);

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
    void update_whenCoordinatesProvidedWithoutGeometryType_shouldInferGeometryTypeAndNotClearLocation() {
        UUID spatialId = UUID.randomUUID();
        entity.setSpatialId(spatialId);

        GisSpatialObject mockSpatial = new GisSpatialObject();
        mockSpatial.setId(spatialId);
        mockSpatial.setGeometryType(GisGeometryType.POLYGON);
        mockSpatial.setCoordinates("POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))");

        when(stormShelterAreaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(stormShelterAreaRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));
        when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mockSpatial);

        UpdateStormShelterAreaRequest req = new UpdateStormShelterAreaRequest();
        req.setId(ID);
        req.setStormShelterName("Khu tránh bão Hải Phòng");
        req.setCoordinates("POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))");
        req.setGeometryType(null); // Không truyền geometryType tường minh

        StormShelterAreaResponse result = service.update(req);

        assertNotNull(result);
        assertEquals(spatialId, entity.getSpatialId());
        verify(gisSpatialObjectService, never()).delete(any());
        verify(gisSpatialObjectService).createOrUpdate(
                eq(spatialId),
                eq("Khu tránh bão Hải Phòng"),
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

        when(stormShelterAreaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(stormShelterAreaRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));
        when(gisSpatialObjectService.createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mockSpatial);

        UpdateStormShelterAreaRequest req = new UpdateStormShelterAreaRequest();
        req.setId(ID);
        req.setStormShelterName("Khu tránh bão Hải Phòng");
        req.setCoordinates("SRID=4326;POINT (106.685678 20.841234)");

        StormShelterAreaResponse result = service.update(req);

        assertNotNull(result);
        assertEquals(spatialId, entity.getSpatialId());
        verify(gisSpatialObjectService, never()).delete(any());
        verify(gisSpatialObjectService).createOrUpdate(
                eq(spatialId),
                eq("Khu tránh bão Hải Phòng"),
                any(),
                eq(GisGeometryType.POINT),
                any(),
                eq("POINT (106.685678 20.841234)"),
                eq(ID),
                any()
        );
        assertNotNull(result.getLongitude());
        assertNotNull(result.getLatitude());
    }

    @Test
    void update_whenOnlyGeneralInfoEdited_shouldPreserveSpatialAndLocationData() {
        UUID spatialId = UUID.randomUUID();
        UUID mapSymbolId = UUID.randomUUID();
        entity.setSpatialId(spatialId);
        entity.setMapSymbolId(mapSymbolId);
        entity.setCoordinateSystem(1);
        entity.setDisplayRule(1);

        GisSpatialObject mockSpatial = new GisSpatialObject();
        mockSpatial.setId(spatialId);
        mockSpatial.setGeometryType(GisGeometryType.POLYGON);
        mockSpatial.setCoordinates("POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))");

        when(stormShelterAreaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(stormShelterAreaRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));

        // Request CHỈ sửa tên và ghi chú, KHÔNG truyền các trường vị trí (coordinates, geometryType, mapSymbolId...)
        UpdateStormShelterAreaRequest req = new UpdateStormShelterAreaRequest();
        req.setId(ID);
        req.setStormShelterName("Khu tránh bão Hải Phòng Mới");
        req.setRemarks("Ghi chú mới");

        StormShelterAreaResponse result = service.update(req);

        assertNotNull(result);
        assertEquals("Khu tránh bão Hải Phòng Mới", entity.getStormShelterName());
        assertEquals("Ghi chú mới", entity.getRemarks());
        // Tọa độ và spatialId được bảo toàn nguyên vẹn
        assertEquals(spatialId, entity.getSpatialId());
        assertEquals(mapSymbolId, entity.getMapSymbolId());
        assertEquals(1, entity.getCoordinateSystem());
        assertEquals(1, entity.getDisplayRule());
        verify(gisSpatialObjectService, never()).delete(any());
        verify(gisSpatialObjectService, never()).createOrUpdate(any(), any(), any(), any(), any(), any(), any(), any());
        assertEquals(spatialId, result.getSpatialId());
        assertEquals(GisGeometryType.POLYGON, result.getGeometryType());
        assertEquals("POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))", result.getCoordinates());
    }

    @Test
    void toResponse_whenGeometryTypeNullInSpatial_shouldInferFromCoordinates() {
        UUID spatialId = UUID.randomUUID();
        entity.setSpatialId(spatialId);

        GisSpatialObject mockSpatial = new GisSpatialObject();
        mockSpatial.setId(spatialId);
        mockSpatial.setGeometryType(null); // geometryType trong GIS DB bị null
        mockSpatial.setCoordinates("POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))");

        when(stormShelterAreaRepository.findById(ID)).thenReturn(Optional.of(entity));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(mockSpatial));

        StormShelterAreaResponse res = service.getById(ID);

        assertNotNull(res);
        assertEquals(GisGeometryType.POLYGON, res.getGeometryType());
        assertEquals(1, res.getCoordinateSystem());
        assertEquals(1, res.getDisplayRule());
    }
}
