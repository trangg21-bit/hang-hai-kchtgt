package com.hanghai.kchtg.gis.search.service;

import com.hanghai.kchtg.aissystem.entity.AisSystem;
import com.hanghai.kchtg.aissystem.repository.AisSystemRepository;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.cctv.repository.CctvRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.search.dto.KchtGisSearchPage;
import com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.DryPortRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.repository.WaterZoneRepository;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.scada.entity.Scada;
import com.hanghai.kchtg.scada.repository.ScadaRepository;
import com.hanghai.kchtg.shiprepairfacility.repository.ShipRepairFacilityRepository;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import com.hanghai.kchtg.station.repository.CoastalStationCospasSarsatRepository;
import com.hanghai.kchtg.station.repository.CoastalStationHaiphongRepository;
import com.hanghai.kchtg.station.repository.CoastalStationInmarsatRepository;
import com.hanghai.kchtg.station.repository.CoastalStationLRITRepository;
import com.hanghai.kchtg.station.repository.CoastalStationVTSRepository;
import com.hanghai.kchtg.transmission.entity.Transmission;
import com.hanghai.kchtg.transmission.repository.TransmissionRepository;
import com.hanghai.kchtg.vtsassist.entity.VtsAssist;
import com.hanghai.kchtg.vtsassist.repository.VtsAssistRepository;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KchtGis155ServiceTest {

    @Mock private PortRepository portRepository;
    @Mock private BerthRepository berthRepository;
    @Mock private PierRepository pierRepository;
    @Mock private DryPortRepository dryPortRepository;
    @Mock private OrgUnitScopeService orgUnitScopeService;
    @Mock private WaterZoneRepository waterZoneRepository;
    @Mock private NavigationChannelRepository navigationChannelRepository;
    @Mock private DikeRevetmentRepository dikeRevetmentRepository;
    @Mock private ShipRepairFacilityRepository shipRepairFacilityRepository;
    @Mock private BuoyStationRepository buoyStationRepository;
    @Mock private VtsSystemRepository vtsSystemRepository;
    @Mock private RadarStationRepository radarStationRepository;
    @Mock private OrgUnitCacheService orgUnitCacheService;
    @Mock private GisSpatialObjectRepository gisSpatialObjectRepository;
    @Mock private BeaconStationRepository beaconStationRepository;
    @Mock private BuoyRepository buoyRepository;
    @Mock private CoastalStationVTSRepository coastalStationVTSRepository;
    @Mock private CoastalStationInmarsatRepository coastalStationInmarsatRepository;
    @Mock private CoastalStationCospasSarsatRepository coastalStationCospasSarsatRepository;
    @Mock private CoastalStationLRITRepository coastalStationLRITRepository;
    @Mock private CoastalStationHaiphongRepository coastalStationHaiphongRepository;
    @Mock private CctvRepository cctvRepository;
    @Mock private ScadaRepository scadaRepository;
    @Mock private AisSystemRepository aisSystemRepository;
    @Mock private VtsAssistRepository vtsAssistRepository;
    @Mock private TransmissionRepository transmissionRepository;
    @Mock private VtsOperationCenterRepository vtsOperationCenterRepository;
    @Mock private EntityManager entityManager;

    @InjectMocks private KchtGis155Service service;

    @Test
    void representativeCoordinateUsesLongitudeLatitudeOrderForPoint() {
        double[] coordinate = KchtGis155Service.representativeCoordinate(
                "POINT (106.721 20.864)", "POINT");

        assertThat(coordinate).containsExactly(20.864, 106.721);
    }

    @Test
    void representativeCoordinateUsesBoundingBoxCenterForPolygon() {
        double[] coordinate = KchtGis155Service.representativeCoordinate(
                "POLYGON ((106 20, 108 20, 108 22, 106 22, 106 20))", "POLYGON");

        assertThat(coordinate).containsExactly(21.0, 107.0);
    }

    @Test
    void representativeCoordinateDoesNotInventMissingGeometry() {
        assertThat(KchtGis155Service.representativeCoordinate(null, "POINT")).isNull();
        assertThat(KchtGis155Service.representativeCoordinate("", "POINT")).isNull();
    }

    @Test
    void portTerminalSearchReturnsAllThreeApprovedRecordsRegardlessOfOperationalStatus() {
        UUID orgUnitId = UUID.randomUUID();
        UUID mapSymbolId = UUID.randomUUID();
        List<Berth> approvedBerths = List.of(
                approvedBerth(orgUnitId, "BC-01", OperationalStatus.OPERATIONAL),
                approvedBerth(orgUnitId, "BC-02", OperationalStatus.SUSPENDED),
                approvedBerth(orgUnitId, "BC-03", null));
        approvedBerths.get(0).setMapSymbolId(mapSymbolId);
        when(orgUnitCacheService.getDirectory()).thenReturn(Map.of());
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        when(berthRepository.searchBerths(
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(),
                eq(ApprovalStatus.APPROVED), any(Pageable.class)))
                .thenReturn(new PageImpl<>(approvedBerths));

        KchtGisSearchPage result = service.search(
                null, List.of(InfrastructureType.PORT_TERMINAL), null, null, null, null, 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(3);
        assertThat(result.getContent()).extracting("code")
                .containsExactly("BC-01", "BC-02", "BC-03");
        assertThat(result.getContent().get(0).getMapSymbolId()).isEqualTo(mapSymbolId);
        verify(berthRepository).searchBerths(
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(),
                eq(ApprovalStatus.APPROVED), any(Pageable.class));
    }

    @Test
    void scadaSearchReturnsApprovedRecords() {
        UUID orgUnitId = UUID.randomUUID();
        UUID mapSymbolId = UUID.randomUUID();
        Scada scada = new Scada();
        scada.setId(UUID.randomUUID());
        scada.setDeviceCode("SCA-000001");
        scada.setDeviceName("Viba trung tâm điều hành");
        scada.setOrgUnitId(orgUnitId);
        scada.setProvinceName("Hưng Yên");
        scada.setDetailedLocation("Trung tâm điều hành");
        scada.setMapSymbolId(mapSymbolId);
        scada.setApprovalStatus(ApprovalStatus.APPROVED);

        when(orgUnitCacheService.getDirectory()).thenReturn(Map.of(orgUnitId, "Đại diện"));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        when(scadaRepository.searchScada(
                eq(true), eq(List.of()), eq(false), isNull(), isNull(), isNull(), isNull(),
                eq(ApprovalStatus.APPROVED), isNull(), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(scada)));
        when(gisSpatialObjectRepository.findByRefIdInAndRefType(
                any(), eq(InfrastructureType.SCADA))).thenReturn(List.of());
        when(gisSpatialObjectRepository.findAllById(any())).thenReturn(List.of());
        when(gisSpatialObjectRepository.findByRefIdIn(any())).thenReturn(List.of());

        KchtGisSearchPage result = service.search(
                null, List.of(InfrastructureType.SCADA), null, null, null, null, 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getCode()).isEqualTo("SCA-000001");
        assertThat(result.getContent().get(0).getName()).isEqualTo("Viba trung tâm điều hành");
        assertThat(result.getContent().get(0).getKchtTypeLabel()).isEqualTo("Hệ thống SCADA");
        assertThat(result.getContent().get(0).getOrgName()).isEqualTo("Đại diện");
        assertThat(result.getContent().get(0).getMapSymbolId()).isEqualTo(mapSymbolId);
        verify(scadaRepository).searchScada(
                eq(true), eq(List.of()), eq(false), isNull(), isNull(), isNull(), isNull(),
                eq(ApprovalStatus.APPROVED), isNull(), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void aisSearchReturnsApprovedRecords() {
        UUID orgUnitId = UUID.randomUUID();
        UUID mapSymbolId = UUID.randomUUID();
        AisSystem ais = new AisSystem();
        ais.setId(UUID.randomUUID());
        ais.setCode("AIS-000001");
        ais.setName("Hệ thống AIS Hải Phòng");
        ais.setOrgUnitId(orgUnitId);
        ais.setSymbolId(mapSymbolId);
        ais.setApprovalStatus(ApprovalStatus.APPROVED);

        when(orgUnitCacheService.getDirectory()).thenReturn(Map.of(orgUnitId, "Cảng vụ Hải Phòng"));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        when(aisSystemRepository.search(
                eq(false), eq(List.of()), isNull(), isNull(), isNull(), isNull(), isNull(),
                eq(ApprovalStatus.APPROVED), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(ais)));

        KchtGisSearchPage result = service.search(
                null, List.of(InfrastructureType.AIS_SYSTEM), null, null, null, null, 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getCode()).isEqualTo("AIS-000001");
        assertThat(result.getContent().get(0).getKchtTypeLabel()).isEqualTo("Hệ thống AIS");
        assertThat(result.getContent().get(0).getMapSymbolId()).isEqualTo(mapSymbolId);
    }

    @Test
    void vtsAssistSearchReturnsApprovedRecords() {
        UUID orgUnitId = UUID.randomUUID();
        UUID mapSymbolId = UUID.randomUUID();
        VtsAssist vtsAssist = new VtsAssist();
        vtsAssist.setId(UUID.randomUUID());
        vtsAssist.setDeviceCode("PTVTS-000001");
        vtsAssist.setDeviceName("Thiết bị phụ trợ VTS");
        vtsAssist.setOrgUnitId(orgUnitId);
        vtsAssist.setMapSymbolId(mapSymbolId);
        vtsAssist.setApprovalStatus(ApprovalStatus.APPROVED);

        when(orgUnitCacheService.getDirectory()).thenReturn(Map.of(orgUnitId, "Cảng vụ Vũng Tàu"));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        when(vtsAssistRepository.searchVtsAssist(
                eq(true), eq(List.of()), eq(false), eq(List.of()), isNull(), isNull(), isNull(),
                eq(ApprovalStatus.APPROVED), isNull(), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(vtsAssist)));

        KchtGisSearchPage result = service.search(
                null, List.of(InfrastructureType.VTS_ASSIST), null, null, null, null, 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getCode()).isEqualTo("PTVTS-000001");
        assertThat(result.getContent().get(0).getKchtTypeLabel()).isEqualTo("Hệ thống phụ trợ VTS");
        assertThat(result.getContent().get(0).getMapSymbolId()).isEqualTo(mapSymbolId);
    }

    @Test
    void transmissionSearchReturnsApprovedRecords() {
        UUID orgUnitId = UUID.randomUUID();
        UUID mapSymbolId = UUID.randomUUID();
        Transmission transmission = new Transmission();
        transmission.setId(UUID.randomUUID());
        transmission.setDeviceCode("TRD-000001");
        transmission.setDeviceName("Thiết bị truyền dẫn");
        transmission.setOrgUnitId(orgUnitId);
        transmission.setMapSymbolId(mapSymbolId);
        transmission.setApprovalStatus(ApprovalStatus.APPROVED);

        when(orgUnitCacheService.getDirectory()).thenReturn(Map.of(orgUnitId, "Cảng vụ Đà Nẵng"));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        when(transmissionRepository.searchTransmission(
                eq(true), eq(List.of()), eq(false), eq(List.of()), isNull(), isNull(), isNull(),
                eq(ApprovalStatus.APPROVED), isNull(), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(transmission)));

        KchtGisSearchPage result = service.search(
                null, List.of(InfrastructureType.TRANSMISSION), null, null, null, null, 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getCode()).isEqualTo("TRD-000001");
        assertThat(result.getContent().get(0).getKchtTypeLabel()).isEqualTo("Hệ thống truyền dẫn");
        assertThat(result.getContent().get(0).getMapSymbolId()).isEqualTo(mapSymbolId);
    }

    @Test
    void vtsOperationCenterSearchReturnsApprovedRecords() {
        UUID orgUnitId = UUID.randomUUID();
        UUID mapSymbolId = UUID.randomUUID();
        VtsOperationCenter center = new VtsOperationCenter();
        center.setId(UUID.randomUUID());
        center.setCode("TTVTS-000001");
        center.setName("Trung tâm điều hành VTS");
        center.setOrgUnitId(orgUnitId);
        center.setSymbolId(mapSymbolId);
        center.setApprovalStatus(ApprovalStatus.APPROVED);

        when(orgUnitCacheService.getDirectory()).thenReturn(Map.of(orgUnitId, "Cảng vụ Quảng Ninh"));
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        when(vtsOperationCenterRepository.search(
                eq(false), eq(List.of()), isNull(), isNull(), isNull(), isNull(), isNull(),
                eq(ApprovalStatus.APPROVED), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(center)));

        KchtGisSearchPage result = service.search(
                null, List.of(InfrastructureType.VTS_OPERATION_CENTER), null, null, null, null, 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getCode()).isEqualTo("TTVTS-000001");
        assertThat(result.getContent().get(0).getKchtTypeLabel()).isEqualTo("Trung tâm điều hành VTS");
        assertThat(result.getContent().get(0).getMapSymbolId()).isEqualTo(mapSymbolId);
    }

    private Berth approvedBerth(UUID orgUnitId, String code, OperationalStatus operationalStatus) {
        Berth berth = new Berth();
        berth.setId(UUID.randomUUID());
        berth.setBerthCode(code);
        berth.setBerthName(code);
        berth.setApprovalStatus(ApprovalStatus.APPROVED);
        berth.setOperationalStatus(operationalStatus);
        berth.setOrgUnitId(orgUnitId);
        return berth;
    }
}
