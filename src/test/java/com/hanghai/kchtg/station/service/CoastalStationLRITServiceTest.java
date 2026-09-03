package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.station.dto.lrit.CoastalStationLRITUpdateRequest;
import com.hanghai.kchtg.station.dto.lrit.CoastalStationLRITRequest;
import com.hanghai.kchtg.station.dto.lrit.CoastalStationLRITResponse;
import com.hanghai.kchtg.station.entity.CoastalStationLRIT;
import com.hanghai.kchtg.station.repository.CoastalStationLRITRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CoastalStationLRITServiceTest {

    @Mock
    private CoastalStationLRITRepository repository;
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
    private com.hanghai.kchtg.mapicon.repository.MapSymbolRepository mapSymbolRepository;
    @Mock
    private InfrastructureAttachmentRepository attachmentRepository;

    @InjectMocks
    private CoastalStationLRITService service;

    @Test
    void doesNotRecordHistoryWhenCreatingDraft() {
        UUID stationId = UUID.randomUUID();
        CoastalStationLRITRequest request = new CoastalStationLRITRequest();
        request.setCode("LRIT-TEST");
        request.setName("Đài LRIT kiểm thử");

        when(repository.existsByCodeAndDeletedAtIsNull("LRIT-TEST")).thenReturn(false);
        when(repository.save(any(CoastalStationLRIT.class))).thenAnswer(invocation -> {
            CoastalStationLRIT saved = invocation.getArgument(0);
            saved.setId(stationId);
            return saved;
        });

        CoastalStationLRIT created = service.createStation(request);

        assertThat(created.getApprovalStatus()).isEqualTo(ApprovalStatus.DRAFT);
        verifyNoInteractions(historyService);
    }

    @Test
    void keepsHistoryEmptyUntilFinalApproval() {
        UUID stationId = UUID.randomUUID();
        CoastalStationLRIT station = station(stationId, null, ApprovalStatus.DRAFT);
        when(repository.findById(stationId)).thenReturn(Optional.of(station));

        assertThat(service.getHistory(stationId)).isEmpty();
        verifyNoInteractions(historyService);
    }

    @Test
    void updatesApprovedStationCoordinatesAndRecordsCoordinateHistory() {
        UUID stationId = UUID.randomUUID();
        UUID oldSpatialId = UUID.randomUUID();
        UUID newSpatialId = UUID.randomUUID();
        CoastalStationLRIT station = station(stationId, oldSpatialId, ApprovalStatus.APPROVED);
        CoastalStationLRITUpdateRequest request = coordinateRequest("POINT(108.25 16.75)");

        when(repository.findById(stationId)).thenReturn(Optional.of(station));
        when(repository.save(station)).thenReturn(station);
        when(gisSpatialObjectService.getCoordinatesBySpatialId(oldSpatialId)).thenReturn("POINT(106 10)");
        when(gisSpatialObjectService.syncSpatialObject(
                eq(oldSpatialId), any(), any(), eq(GisGeometryType.POINT),
                eq("POINT(108.25 16.75)"), eq(stationId), eq(InfrastructureType.LRIT_STATION)))
                .thenReturn(newSpatialId);

        CoastalStationLRIT updated = service.updateStation(stationId, request);

        assertThat(updated.getSpatialId()).isEqualTo(newSpatialId);
        assertThat(updated.getLatitude()).isEqualByComparingTo("16.75");
        assertThat(updated.getLongitude()).isEqualByComparingTo("108.25");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, String>> changes = ArgumentCaptor.forClass(Map.class);
        verify(historyService).recordDeltaChanges(
                eq(InfrastructureType.LRIT_STATION), eq(stationId), changes.capture(), any(), any());
        assertThat(changes.getValue()).containsEntry("Tọa độ GIS", "POINT(106 10)");
    }

    @Test
    void keepsDraftUpdatesOutOfDeltaHistory() {
        UUID stationId = UUID.randomUUID();
        UUID oldSpatialId = UUID.randomUUID();
        CoastalStationLRIT station = station(stationId, oldSpatialId, ApprovalStatus.DRAFT);
        CoastalStationLRITUpdateRequest request = coordinateRequest("POINT(108.25 16.75)");

        when(repository.findById(stationId)).thenReturn(Optional.of(station));
        when(repository.save(station)).thenReturn(station);
        when(gisSpatialObjectService.syncSpatialObject(
                eq(oldSpatialId), any(), any(), eq(GisGeometryType.POINT),
                eq("POINT(108.25 16.75)"), eq(stationId), eq(InfrastructureType.LRIT_STATION)))
                .thenReturn(UUID.randomUUID());

        service.updateStation(stationId, request);

        verify(historyService, never()).recordDeltaChanges(any(), any(), any(), any(), any());
    }

    @Test
    void resolvesLineGeometryTypeInBuildResponse() {
        UUID stationId = UUID.randomUUID();
        UUID spatialId = UUID.randomUUID();
        CoastalStationLRIT station = station(stationId, spatialId, ApprovalStatus.APPROVED);
        station.setLatitude(null);
        station.setLongitude(null);

        GisSpatialObject spatialObject = new GisSpatialObject();
        spatialObject.setId(spatialId);
        spatialObject.setGeometryType(GisGeometryType.LINE);
        spatialObject.setCoordinates("LINESTRING(112.06 17.80, 110.85 15.52)");

        when(gisSpatialObjectService.findById(spatialId)).thenReturn(Optional.of(spatialObject));

        CoastalStationLRITResponse response = service.buildResponse(station);

        assertThat(response.getGeometryType()).isEqualTo("LINE");
        assertThat(response.getObjectType()).isEqualTo("LINE");
        assertThat(response.getCoordinates()).isEqualTo("LINESTRING(112.06 17.80, 110.85 15.52)");
        assertThat(response.getLatitude()).isEqualByComparingTo("17.80");
        assertThat(response.getLongitude()).isEqualByComparingTo("112.06");
    }

    @Test
    void autoFillsLevel1ApprovalWhenDirectlyApprovedByLevel2() {
        UUID stationId = UUID.randomUUID();
        CoastalStationLRIT station = station(stationId, null, ApprovalStatus.PENDING_APPROVAL);
        station.setApproverLevel1(null);

        when(repository.findById(stationId)).thenReturn(Optional.of(station));
        when(repository.save(station)).thenReturn(station);

        CoastalStationLRIT approved = service.approveLevel2(stationId);

        assertThat(approved.getApproverLevel1()).isNotNull();
        assertThat(approved.getApprovedDateLevel1()).isNotNull();
        assertThat(approved.getLevel1ApprovalContent()).isEqualTo("Cấp Cục phê duyệt trực tiếp (đồng thuận cả 2 cấp)");
        assertThat(approved.getSubmittedBy()).isNotNull();
        assertThat(approved.getSubmittedAt()).isNotNull();
        verifyNoInteractions(historyService);
    }

    @Test
    void resolvesSubmittedByNameInBuildResponse() {
        UUID stationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        CoastalStationLRIT station = station(stationId, null, ApprovalStatus.APPROVED);
        station.setSubmittedBy(userId);

        com.hanghai.kchtg.user.entity.User user = new com.hanghai.kchtg.user.entity.User();
        user.setId(userId);
        user.setFullName("Nguyễn Văn An");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        CoastalStationLRITResponse response = service.buildResponse(station);

        assertThat(response.getSubmittedBy()).isEqualTo(userId);
        assertThat(response.getSubmittedByName()).isEqualTo("Nguyễn Văn An");
    }

    private CoastalStationLRIT station(UUID id, UUID spatialId, ApprovalStatus approvalStatus) {
        CoastalStationLRIT station = new CoastalStationLRIT();
        station.setId(id);
        station.setName("Đài LRIT kiểm thử");
        station.setGeometryType("POINT");
        station.setApprovalStatus(approvalStatus);
        station.setSpatialId(spatialId);
        station.setLatitude(new BigDecimal("10"));
        station.setLongitude(new BigDecimal("106"));
        return station;
    }

    private CoastalStationLRITUpdateRequest coordinateRequest(String coordinates) {
        CoastalStationLRITUpdateRequest request = new CoastalStationLRITUpdateRequest();
        request.setGeometryType("POINT");
        request.setCoordinates(coordinates);
        request.setLatitude(new BigDecimal("16.75"));
        request.setLongitude(new BigDecimal("108.25"));
        return request;
    }
}
