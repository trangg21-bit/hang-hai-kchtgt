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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
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
}
