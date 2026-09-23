package com.hanghai.kchtg.port;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.dto.shiprepairyard.CreateShipRepairYardRequest;
import com.hanghai.kchtg.port.dto.shiprepairyard.ShipRepairYardResponse;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.entity.ShipRepairYard;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.repository.ShipRepairYardRepository;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.port.service.ShipRepairYardService;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.port.dto.shiprepairyard.UpdateShipRepairYardRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ShipRepairYardService unit tests - Code generation and unique constraint prevention")
class ShipRepairYardServiceTest {

    @InjectMocks
    private ShipRepairYardService service;

    @Mock
    private ShipRepairYardRepository shipRepairYardRepository;

    @Mock
    private PortRepository portRepository;

    @Mock
    private PierRepository pierRepository;

    @Mock
    private OrgUnitCacheService orgUnitCacheService;

    @Mock
    private OrgUnitScopeService orgUnitScopeService;

    @Mock
    private PortCacheService portCacheService;

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private InfrastructureHistoryRepository historyRepository;

    private UUID portId;
    private Port port;

    @BeforeEach
    void setUp() {
        portId = UUID.randomUUID();
        port = Port.builder()
                .portCode("CB-000004")
                .portName("Cảng biển test 01")
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    @Test
    @DisplayName("generateShipRepairYardCode: when no codes exist, returns sequence 001")
    void testGenerateCode_WhenNoExistingCodes_Returns001() {
        when(portRepository.findById(portId)).thenReturn(Optional.of(port));
        when(shipRepairYardRepository.findAllShipRepairYardCodesStartingWith("CB-000004-SCDT-"))
                .thenReturn(List.of());
        when(shipRepairYardRepository.existsByShipRepairYardCode("CB-000004-SCDT-001")).thenReturn(false);

        String code = service.generateShipRepairYardCode(portId);

        assertEquals("CB-000004-SCDT-001", code);
    }

    @Test
    @DisplayName("generateShipRepairYardCode: when soft-deleted code exists in table, increments to next available 002")
    void testGenerateCode_WhenCodeExistsInTable_IncrementsToNext() {
        when(portRepository.findById(portId)).thenReturn(Optional.of(port));
        when(shipRepairYardRepository.findAllShipRepairYardCodesStartingWith("CB-000004-SCDT-"))
                .thenReturn(List.of("CB-000004-SCDT-001"));
        when(shipRepairYardRepository.existsByShipRepairYardCode("CB-000004-SCDT-002")).thenReturn(false);

        String code = service.generateShipRepairYardCode(portId);

        assertEquals("CB-000004-SCDT-002", code);
    }

    @Test
    @DisplayName("generateShipRepairYardCode: while loop skips already existing candidates until free")
    void testGenerateCode_WhileLoopSkipsExistingCandidates() {
        when(portRepository.findById(portId)).thenReturn(Optional.of(port));
        when(shipRepairYardRepository.findAllShipRepairYardCodesStartingWith("CB-000004-SCDT-"))
                .thenReturn(List.of("CB-000004-SCDT-001"));
        when(shipRepairYardRepository.existsByShipRepairYardCode("CB-000004-SCDT-002")).thenReturn(true);
        when(shipRepairYardRepository.existsByShipRepairYardCode("CB-000004-SCDT-003")).thenReturn(false);

        String code = service.generateShipRepairYardCode(portId);

        assertEquals("CB-000004-SCDT-003", code);
    }

    @Test
    @DisplayName("create: when request code already exists in DB, fallback to auto-generated available code")
    void testCreate_WhenProvidedCodeAlreadyExists_FallbackToGeneratedCode() {
        when(portRepository.findById(portId)).thenReturn(Optional.of(port));
        when(shipRepairYardRepository.existsByShipRepairYardCode("CB-000004-SCDT-001")).thenReturn(true);
        when(shipRepairYardRepository.findAllShipRepairYardCodesStartingWith("CB-000004-SCDT-"))
                .thenReturn(List.of("CB-000004-SCDT-001"));
        when(shipRepairYardRepository.existsByShipRepairYardCode("CB-000004-SCDT-002")).thenReturn(false);

        when(shipRepairYardRepository.save(any(ShipRepairYard.class))).thenAnswer(invocation -> {
            ShipRepairYard entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        CreateShipRepairYardRequest req = new CreateShipRepairYardRequest();
        req.setPortId(portId);
        req.setShipRepairYardCode("CB-000004-SCDT-001");
        req.setShipRepairYardName("Cơ sở mới");
        req.setDetailedLocation("Thái Bình");
        req.setOperationalStatus(OperationalStatus.NOT_YET_OPERATIONAL);

        ShipRepairYardResponse response = service.create(req);

        assertNotNull(response);
        assertEquals("CB-000004-SCDT-002", response.getShipRepairYardCode());
    }

    @Test
    @DisplayName("update: when geometryType is null in request, location fields and spatial object are cleared")
    void testUpdate_WhenGeometryTypeIsNull_ClearsLocationAndDeletesSpatialObject() {
        UUID yardId = UUID.randomUUID();
        UUID spatialId = UUID.randomUUID();
        UUID symbolId = UUID.randomUUID();

        ShipRepairYard existing = ShipRepairYard.builder()
                .shipRepairYardCode("CB-000004-SCDT-001")
                .shipRepairYardName("Cơ sở cũ")
                .portId(portId)
                .approvalStatus(ApprovalStatus.DRAFT)
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .spatialId(spatialId)
                .mapSymbolId(symbolId)
                .coordinateSystem(1)
                .displayRule(1)
                .build();
        existing.setId(yardId);

        when(shipRepairYardRepository.findById(yardId)).thenReturn(Optional.of(existing));
        when(portRepository.findById(portId)).thenReturn(Optional.of(port));
        when(shipRepairYardRepository.saveAndFlush(any(ShipRepairYard.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateShipRepairYardRequest req = new UpdateShipRepairYardRequest();
        req.setId(yardId);
        req.setShipRepairYardName("Cơ sở sửa");
        req.setPortId(portId);
        req.setGeometryType(null);
        req.setCoordinates(null);
        req.setMapSymbolId(null);
        req.setCoordinateSystem(null);
        req.setDisplayRule(null);

        ShipRepairYardResponse response = service.update(req);

        assertNotNull(response);
        assertNull(response.getSpatialId());
        assertNull(response.getGeometryType());
        assertNull(response.getCoordinates());
        assertNull(response.getMapSymbolId());
        assertNull(response.getCoordinateSystem());
        assertNull(response.getDisplayRule());

        verify(gisSpatialObjectService).delete(spatialId);
        assertNull(existing.getSpatialId());
        assertNull(existing.getMapSymbolId());
        assertNull(existing.getCoordinateSystem());
        assertNull(existing.getDisplayRule());
    }

    @Test
    @DisplayName("update: when record was APPROVED and geometryType is cleared, writes audit history for GIS clearing")
    void testUpdate_WhenRecordIsApprovedAndGeometryTypeCleared_WritesHistoryRows() {
        UUID yardId = UUID.randomUUID();
        UUID spatialId = UUID.randomUUID();

        ShipRepairYard existing = ShipRepairYard.builder()
                .shipRepairYardCode("CB-000004-SCDT-001")
                .shipRepairYardName("Cơ sở đã duyệt")
                .portId(portId)
                .approvalStatus(ApprovalStatus.APPROVED)
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .spatialId(spatialId)
                .build();
        existing.setId(yardId);

        GisSpatialObject oldSpatial = GisSpatialObject.builder()
                .name("Cơ sở đã duyệt")
                .code("SHIP_REPAIR_YARD_CB-000004-SCDT-001")
                .coordinates("POINT(106.5 20.8)")
                .geometryType(GisGeometryType.POINT)
                .build();
        oldSpatial.setId(spatialId);

        when(shipRepairYardRepository.findById(yardId)).thenReturn(Optional.of(existing));
        when(portRepository.findById(portId)).thenReturn(Optional.of(port));
        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(oldSpatial));
        when(shipRepairYardRepository.saveAndFlush(any(ShipRepairYard.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateShipRepairYardRequest req = new UpdateShipRepairYardRequest();
        req.setId(yardId);
        req.setPortId(portId);
        req.setGeometryType(null);
        req.setCoordinates(null);

        ShipRepairYardResponse response = service.update(req);

        assertNotNull(response);
        assertNull(response.getSpatialId());

        verify(gisSpatialObjectService).delete(spatialId);

        ArgumentCaptor<InfrastructureHistory> captor = ArgumentCaptor.forClass(InfrastructureHistory.class);
        verify(historyRepository, atLeastOnce()).save(captor.capture());

        List<InfrastructureHistory> historyRows = captor.getAllValues();
        boolean hasWktCleared = historyRows.stream().anyMatch(h ->
                "Tọa độ GIS".equals(h.getChangedField()) && "POINT(106.5 20.8)".equals(h.getPreviousValue()) && h.getNewValue() == null);
        boolean hasGeomCleared = historyRows.stream().anyMatch(h ->
                "Loại đối tượng GIS".equals(h.getChangedField()) && "Đối tượng điểm".equals(h.getPreviousValue()) && h.getNewValue() == null);

        assertTrue(hasWktCleared, "Must record history for clearing GIS coordinates");
        assertTrue(hasGeomCleared, "Must record history for clearing GIS geometry type");
    }

    @Test
    @DisplayName("update: when fields are cleared, sets entity fields to null")
    void testUpdate_WhenFieldsCleared_SetsFieldsToNull() {
        UUID yardId = UUID.randomUUID();
        ShipRepairYard existing = ShipRepairYard.builder()
                .shipRepairYardCode("CB-000004-SCDT-001")
                .shipRepairYardName("Cơ sở cũ")
                .detailedLocation("Vị trí cũ")
                .usageFunction("Công năng cũ")
                .vesselType("Loại tàu cũ")
                .vesselDwt("DWT cũ")
                .businessType("Ngành nghề cũ")
                .activity("Hoạt động cũ")
                .remarks("Ghi chú cũ")
                .portId(portId)
                .approvalStatus(ApprovalStatus.DRAFT)
                .build();
        existing.setId(yardId);

        when(shipRepairYardRepository.findById(yardId)).thenReturn(Optional.of(existing));
        when(portRepository.findById(portId)).thenReturn(Optional.of(port));
        when(shipRepairYardRepository.saveAndFlush(any(ShipRepairYard.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateShipRepairYardRequest req = UpdateShipRepairYardRequest.builder()
                .id(yardId)
                .portId(portId)
                .shipRepairYardName("Tên mới")
                .detailedLocation("   ")
                .usageFunction("")
                .vesselType("")
                .vesselDwt("   ")
                .businessType("")
                .activity("   ")
                .remarks("")
                .build();

        ShipRepairYardResponse response = service.update(req);

        assertNotNull(response);
        assertEquals("Tên mới", response.getShipRepairYardName());
        assertNull(response.getDetailedLocation());
        assertNull(response.getUsageFunction());
        assertNull(response.getVesselType());
        assertNull(response.getVesselDwt());
        assertNull(response.getBusinessType());
        assertNull(response.getActivity());
        assertNull(response.getRemarks());
    }
}
