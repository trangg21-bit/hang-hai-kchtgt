package com.hanghai.kchtg.station.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.mapicon.entity.MapSymbol;
import com.hanghai.kchtg.mapicon.repository.MapSymbolRepository;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongHistoryResponse;
import com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongRequest;
import com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongResponse;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSHistoryResponse;
import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.repository.CoastalStationHaiphongRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
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
    private OperatingOrganizationLookup operatingOrganizationLookup;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GisSpatialObjectService gisSpatialObjectService;

    @Mock
    private InfrastructureAttachmentRepository attachmentRepository;

    @Mock
    private MapSymbolRepository mapSymbolRepository;

    @InjectMocks
    private CoastalStationHaiphongService service;

    @BeforeEach
    void setUp() {
        lenient().when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
    }

    @Test
    void canGetDeletedStationByIdAndReturnsArchived() {
        UUID stationId = UUID.randomUUID();
        CoastalStationHaiphong station = station(stationId, ApprovalStatus.APPROVED);
        station.setDeletedAt(LocalDateTime.now());
        when(repository.findById(stationId)).thenReturn(Optional.of(station));

        CoastalStationHaiphong found = service.getStationById(stationId);
        assertThat(found).isNotNull();

        CoastalStationHaiphongResponse response = service.buildResponse(found);
        assertThat(response.getApprovalStatus()).isEqualTo(ApprovalStatus.ARCHIVED);
    }

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
        CoastalStationHaiphongRequest req = CoastalStationHaiphongRequest.builder()
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
        MapSymbol symbolEntity = new MapSymbol();
        symbolEntity.setId(symbolUuid);
        symbolEntity.setCode("BT-0001");
        when(mapSymbolRepository.findByCode("BT-0001")).thenReturn(Optional.of(symbolEntity));

        CoastalStationHaiphongRequest req = new CoastalStationHaiphongRequest();
        req.setName("Đài TTXLTT Test Code");
        req.setSymbol("BT-0001");

        when(repository.save(any(CoastalStationHaiphong.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CoastalStationHaiphong created = service.createStation(req);
        assertThat(created.getSymbolId()).isEqualTo(symbolUuid);
    }

    @Test
    void getHistory_preservesAccountOrgUnitNameWhenPresent() {
        UUID stationId = UUID.randomUUID();
        UUID orgUnitId = UUID.randomUUID();
        CoastalStationHaiphong station = station(stationId, ApprovalStatus.APPROVED);
        station.setOrgUnitId(orgUnitId);
        when(repository.findById(stationId)).thenReturn(Optional.of(station));
        when(orgUnitCacheService.getName(orgUnitId)).thenReturn("Cục Hàng hải và Đường thủy Việt Nam");

        CoastalStationVTSHistoryResponse historyItem = new CoastalStationVTSHistoryResponse();
        historyItem.setId(UUID.randomUUID());
        historyItem.setStationCode("HP-001");
        historyItem.setActionType(StationHistoryActionType.UPDATE);
        historyItem.setChangedField("name");
        historyItem.setPreviousValue("Tên cũ");
        historyItem.setNewValue("Tên mới");
        historyItem.setChangedBy("Nguyễn Văn An");
        historyItem.setOrgUnitName("Bộ Giao thông Vận tải");
        historyItem.setChangedAt(LocalDateTime.now());

        when(historyService.getHistory(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(historyItem));

        List<CoastalStationHaiphongHistoryResponse> result = service.getHistory(stationId, 0, 20, null, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getOrgUnitName()).isEqualTo("Bộ Giao thông Vận tải");
        assertThat(result.get(0).getChangedBy()).isEqualTo("Nguyễn Văn An");
    }

    @Test
    void getHistory_fallbackToManagementOrgUnitWhenAccountOrgUnitNull() {
        UUID stationId = UUID.randomUUID();
        UUID orgUnitId = UUID.randomUUID();
        CoastalStationHaiphong station = station(stationId, ApprovalStatus.APPROVED);
        station.setOrgUnitId(orgUnitId);
        when(repository.findById(stationId)).thenReturn(Optional.of(station));
        when(orgUnitCacheService.getName(orgUnitId)).thenReturn("Cục Hàng hải và Đường thủy Việt Nam");

        CoastalStationVTSHistoryResponse historyItem = new CoastalStationVTSHistoryResponse();
        historyItem.setId(UUID.randomUUID());
        historyItem.setStationCode("HP-001");
        historyItem.setActionType(StationHistoryActionType.UPDATE);
        historyItem.setChangedField("name");
        historyItem.setPreviousValue("Tên cũ");
        historyItem.setNewValue("Tên mới");
        historyItem.setChangedBy("Hệ thống");
        historyItem.setOrgUnitName(null);
        historyItem.setChangedAt(LocalDateTime.now());

        when(historyService.getHistory(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(historyItem));

        List<CoastalStationHaiphongHistoryResponse> result = service.getHistory(stationId, 0, 20, null, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getOrgUnitName()).isEqualTo("Cục Hàng hải và Đường thủy Việt Nam");
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
