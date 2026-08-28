package com.hanghai.kchtg.common.service;

import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.dto.port.PortOptionResponse;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.common.dto.OperatingOrganizationOptionResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperatingOrganization;
import com.hanghai.kchtg.common.entity.OperatingUnit;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.repository.OperatingUnitRepository;
import com.hanghai.kchtg.mapicon.dto.MapSymbolOptionResponse;
import com.hanghai.kchtg.mapicon.service.MapSymbolService;
import com.hanghai.kchtg.radarstation.dto.RadarStationOptionResponse;
import com.hanghai.kchtg.radarstation.service.RadarStationService;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterOptionResponse;
import com.hanghai.kchtg.vtsoperationcenter.service.VtsOperationCenterService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Shared authenticated option lookups used by forms and filters across modules.
 * The result is limited to the current user's organisation subtree unless the
 * user has an explicit nationwide-scope permission.
 */
@Service
@Transactional(readOnly = true)
public class CommonOptionsService {

    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final PortCacheService portCacheService;
    private final PortRepository portRepository;
    private final OperatingOrganizationRepository operatingOrganizationRepository;
    private final OperatingUnitRepository operatingUnitRepository;
    private final MapSymbolService mapSymbolService;
    private final RadarStationService radarStationService;
    private final VtsOperationCenterService vtsOperationCenterService;

    public CommonOptionsService(OrgUnitCacheService orgUnitCacheService,
            OrgUnitScopeService orgUnitScopeService,
            PortCacheService portCacheService,
            PortRepository portRepository,
            OperatingOrganizationRepository operatingOrganizationRepository,
            OperatingUnitRepository operatingUnitRepository,
            MapSymbolService mapSymbolService,
            RadarStationService radarStationService,
            VtsOperationCenterService vtsOperationCenterService) {
        this.orgUnitCacheService = orgUnitCacheService;
        this.orgUnitScopeService = orgUnitScopeService;
        this.portCacheService = portCacheService;
        this.portRepository = portRepository;
        this.operatingOrganizationRepository = operatingOrganizationRepository;
        this.operatingUnitRepository = operatingUnitRepository;
        this.mapSymbolService = mapSymbolService;
        this.radarStationService = radarStationService;
        this.vtsOperationCenterService = vtsOperationCenterService;
    }

    public List<OrgUnitResponse> getOrgUnitOptions() {
        OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();
        List<OrgUnitResponse> all = orgUnitCacheService.getList();
        if (scope.unrestricted()) {
            return all;
        }
        return all.stream()
                .filter(unit -> scope.allows(unit.getId()))
                .toList();
    }

    public List<PortOptionResponse> getPortOptions(ApprovalStatus approvalStatus) {
        OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();
        if (scope.unrestricted()) {
            return approvalStatus == null
                    ? portCacheService.getOptions()
                    : portRepository.findOptionsByApprovalStatus(approvalStatus);
        }
        if (scope.orgUnitIds().isEmpty()) {
            return List.of();
        }
        return approvalStatus == null
                ? portRepository.findOptionsByOrgUnitIds(scope.orgUnitIds())
                : portRepository.findOptionsByOrgUnitIdsAndApprovalStatus(scope.orgUnitIds(), approvalStatus);
    }

    public List<OperatingOrganizationOptionResponse> getOperatingOrganizationOptions(String keyword) {
        List<OperatingOrganization> list;
        if (keyword != null && !keyword.trim().isEmpty()) {
            list = operatingOrganizationRepository.searchActive(keyword.trim());
        } else {
            list = operatingOrganizationRepository.findAllActive();
        }
        return list.stream()
                .map(org -> OperatingOrganizationOptionResponse.builder()
                        .id(org.getId())
                        .code(org.getCode())
                        .name(org.getName())
                        .parentCode(org.getParentCode())
                        .build())
                .toList();
    }

    public List<OperatingOrganizationOptionResponse> getOperatingUnitOptions(String keyword) {
        List<OperatingUnit> list;
        if (keyword != null && !keyword.trim().isEmpty()) {
            list = operatingUnitRepository.searchActive(keyword.trim());
        } else {
            list = operatingUnitRepository.findAllActive();
        }
        return list.stream()
                .map(org -> OperatingOrganizationOptionResponse.builder()
                        .id(org.getId())
                        .code(org.getCode())
                        .name(org.getName())
                        .parentCode(org.getParentCode())
                        .build())
                .toList();
    }

    public List<MapSymbolOptionResponse> getSymbolOptions() {
        return mapSymbolService.getOptions();
    }

    public List<RadarStationOptionResponse> getRadarStationOptions() {
        return radarStationService.getOptions(null);
    }

    public List<VtsOperationCenterOptionResponse> getVtsOperationCenterOptions() {
        return vtsOperationCenterService.getOptions(null);
    }
}
