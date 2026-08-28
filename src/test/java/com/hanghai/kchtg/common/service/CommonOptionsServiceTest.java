package com.hanghai.kchtg.common.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.repository.OperatingUnitRepository;
import com.hanghai.kchtg.mapicon.service.MapSymbolService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.dto.port.PortOptionResponse;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.radarstation.service.RadarStationService;
import com.hanghai.kchtg.vtsoperationcenter.service.VtsOperationCenterService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommonOptionsServiceTest {

    @Mock private OrgUnitCacheService orgUnitCacheService;
    @Mock private OrgUnitScopeService orgUnitScopeService;
    @Mock private PortCacheService portCacheService;
    @Mock private PortRepository portRepository;
    @Mock private OperatingOrganizationRepository operatingOrganizationRepository;
    @Mock private OperatingUnitRepository operatingUnitRepository;
    @Mock private MapSymbolService mapSymbolService;
    @Mock private RadarStationService radarStationService;
    @Mock private VtsOperationCenterService vtsOperationCenterService;

    @InjectMocks private CommonOptionsService service;

    @Test
    void approvedPortOptionsUseApprovalFilterForUnrestrictedScope() {
        PortOptionResponse option = new PortOptionResponse();
        when(orgUnitScopeService.currentUserScope()).thenReturn(OrgUnitScopeService.Scope.all());
        when(portRepository.findOptionsByApprovalStatus(ApprovalStatus.APPROVED))
                .thenReturn(List.of(option));

        assertThat(service.getPortOptions(ApprovalStatus.APPROVED)).containsExactly(option);
        verify(portRepository).findOptionsByApprovalStatus(ApprovalStatus.APPROVED);
    }

    @Test
    void approvedPortOptionsKeepCurrentOrganizationScope() {
        UUID orgUnitId = UUID.randomUUID();
        PortOptionResponse option = new PortOptionResponse();
        when(orgUnitScopeService.currentUserScope())
                .thenReturn(OrgUnitScopeService.Scope.restricted(List.of(orgUnitId)));
        when(portRepository.findOptionsByOrgUnitIdsAndApprovalStatus(
                List.of(orgUnitId), ApprovalStatus.APPROVED)).thenReturn(List.of(option));

        assertThat(service.getPortOptions(ApprovalStatus.APPROVED)).containsExactly(option);
        verify(portRepository).findOptionsByOrgUnitIdsAndApprovalStatus(
                List.of(orgUnitId), ApprovalStatus.APPROVED);
    }
}
