package com.hanghai.kchtg.gis.search.service;

import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
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
import com.hanghai.kchtg.shiprepairfacility.repository.ShipRepairFacilityRepository;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import com.hanghai.kchtg.station.repository.CoastalStationCospasSarsatRepository;
import com.hanghai.kchtg.station.repository.CoastalStationHaiphongRepository;
import com.hanghai.kchtg.station.repository.CoastalStationInmarsatRepository;
import com.hanghai.kchtg.station.repository.CoastalStationLRITRepository;
import com.hanghai.kchtg.station.repository.CoastalStationVTSRepository;
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
        List<Berth> approvedBerths = List.of(
                approvedBerth(orgUnitId, "BC-01", OperationalStatus.OPERATIONAL),
                approvedBerth(orgUnitId, "BC-02", OperationalStatus.SUSPENDED),
                approvedBerth(orgUnitId, "BC-03", null));
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
        verify(berthRepository).searchBerths(
                isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(),
                eq(ApprovalStatus.APPROVED), any(Pageable.class));
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
