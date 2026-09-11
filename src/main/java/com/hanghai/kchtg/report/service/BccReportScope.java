package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/** Explicit scope for reports, including queries not covered by Hibernate filters. */
@Component
@RequiredArgsConstructor
public class BccReportScope {
    private final OrgUnitScopeService orgUnitScopeService;

    public List<UUID> resolve(UUID selectedUnit) {
        var scope = orgUnitScopeService.currentUserScope();
        if (selectedUnit == null) {
            return scope.unrestricted() ? null : scope.orgUnitIds();
        }
        if (!scope.allows(selectedUnit)) {
            throw new AccessDeniedException("Bạn không có quyền xem báo cáo của đơn vị này");
        }
        return orgUnitScopeService.resolveSubtreeIds(selectedUnit).stream()
                .filter(scope::allows).toList();
    }

    public void require(UUID unit) {
        if (unit == null || !orgUnitScopeService.currentUserScope().allows(unit)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập báo cáo của đơn vị này");
        }
    }
}
