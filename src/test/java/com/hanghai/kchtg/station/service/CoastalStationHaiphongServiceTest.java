package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongResponse;
import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import com.hanghai.kchtg.station.repository.CoastalStationHaiphongRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CoastalStationHaiphongServiceTest {

    @Mock
    private CoastalStationHaiphongRepository repository;
    @Mock
    private InfrastructureApprovalService approvalService;
    @Mock
    private HistoryService historyService;
    @Mock
    private OrgUnitScopeService orgUnitScopeService;
    @Mock
    private OrgUnitRepository orgUnitRepository;
    @Mock
    private OrgUnitCacheService orgUnitCacheService;
    @Mock
    private OperatingOrganizationRepository operatingOrganizationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private GisSpatialObjectService gisSpatialObjectService;
    @Mock
    private InfrastructureAttachmentRepository attachmentRepository;
    @Mock
    private com.hanghai.kchtg.mapicon.repository.MapSymbolRepository mapSymbolRepository;

    @InjectMocks
    private CoastalStationHaiphongService service;

    @Test
    void autoFillsLevel1ApprovalWhenDirectlyApprovedByLevel2() {
        UUID stationId = UUID.randomUUID();
        CoastalStationHaiphong station = station(stationId, ApprovalStatus.PENDING_APPROVAL);

        when(repository.findById(stationId)).thenReturn(Optional.of(station));
        when(repository.save(any(CoastalStationHaiphong.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CoastalStationHaiphong approved = service.approveLevel2(stationId);

        assertThat(approved.getApproverLevel1()).isNotNull();
        assertThat(approved.getApprovedDateLevel1()).isNotNull();
        assertThat(approved.getLevel1ApprovalContent()).isEqualTo("Cấp Cục phê duyệt trực tiếp");
        assertThat(approved.getSubmittedBy()).isNotNull();
        assertThat(approved.getSubmittedAt()).isNotNull();
        assertThat(approved.getApproverLevel2()).isNotNull();
        assertThat(approved.getApprovedDateLevel2()).isNotNull();
        verifyNoInteractions(historyService);
    }

    @Test
    void resolvesSubmittedByNameInBuildResponse() {
        UUID stationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        CoastalStationHaiphong station = station(stationId, ApprovalStatus.APPROVED);
        station.setSubmittedBy(userId);

        User user = new User();
        user.setId(userId);
        user.setFullName("Nguyễn Văn An");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        CoastalStationHaiphongResponse response = service.buildResponse(station);

        assertThat(response.getSubmittedBy()).isEqualTo(userId);
        assertThat(response.getSubmittedByName()).isEqualTo("Nguyễn Văn An");
    }

    @Test
    void resolvesSymbolIdWhenUuidProvidedInCreate() {
        UUID symbolUuid = UUID.randomUUID();
        com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongRequest req = com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongRequest.builder()
                .name("Đài TTXLTT Test")
                .symbolId(symbolUuid)
                .build();

        when(repository.save(any(CoastalStationHaiphong.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CoastalStationHaiphong created = service.createStation(req);

        assertThat(created.getSymbolId()).isEqualTo(symbolUuid);
    }

    @Test
    void resolvesSymbolIdWhenCodeProvidedInCreate() {
        UUID symbolUuid = UUID.randomUUID();
        com.hanghai.kchtg.mapicon.entity.MapSymbol symbolEntity = new com.hanghai.kchtg.mapicon.entity.MapSymbol();
        symbolEntity.setId(symbolUuid);
        symbolEntity.setCode("BT-0001");
        when(mapSymbolRepository.findByCode("BT-0001")).thenReturn(Optional.of(symbolEntity));

        com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongRequest req = new com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongRequest();
        req.setName("Đài TTXLTT Test Code");
        req.setSymbol("BT-0001");

        when(repository.save(any(CoastalStationHaiphong.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CoastalStationHaiphong created = service.createStation(req);

        assertThat(created.getSymbolId()).isEqualTo(symbolUuid);
    }

    private CoastalStationHaiphong station(UUID id, ApprovalStatus approvalStatus) {
        CoastalStationHaiphong station = new CoastalStationHaiphong();
        station.setId(id);
        station.setCode("HP-001");
        station.setName("Đài TTXLTT kiểm thử");
        station.setApprovalStatus(approvalStatus);
        station.setLatitude(new BigDecimal("10.5"));
        station.setLongitude(new BigDecimal("106.8"));
        return station;
    }
}
