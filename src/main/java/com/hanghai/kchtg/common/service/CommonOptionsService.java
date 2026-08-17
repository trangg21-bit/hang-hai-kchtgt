package com.hanghai.kchtg.common.service;

import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.dto.port.PortOptionResponse;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.PortCacheService;
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

    public CommonOptionsService(OrgUnitCacheService orgUnitCacheService,
            OrgUnitScopeService orgUnitScopeService,
            PortCacheService portCacheService,
            PortRepository portRepository) {
        this.orgUnitCacheService = orgUnitCacheService;
        this.orgUnitScopeService = orgUnitScopeService;
        this.portCacheService = portCacheService;
        this.portRepository = portRepository;
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

    public List<PortOptionResponse> getPortOptions() {
        OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();
        if (scope.unrestricted()) {
            return portCacheService.getOptions();
        }
        if (scope.orgUnitIds().isEmpty()) {
            return List.of();
        }
        return portRepository.findOptionsByOrgUnitIds(scope.orgUnitIds());
    }
}
