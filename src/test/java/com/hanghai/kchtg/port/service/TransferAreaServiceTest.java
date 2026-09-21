package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.port.dto.transferarea.TransferAreaResponse;
import com.hanghai.kchtg.port.dto.transferarea.UpdateTransferAreaRequest;
import com.hanghai.kchtg.port.entity.TransferArea;
import com.hanghai.kchtg.port.repository.*;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.PortCacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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
}
