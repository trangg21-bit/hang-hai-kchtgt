package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.ReportStatus;
import com.hanghai.kchtg.report.entity.ReportType;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public abstract class BaseReportHandler implements ReportHandler {

    @Autowired
    protected OrgUnitRepository orgUnitRepository;

    @Autowired
    protected OrgUnitCacheService orgUnitCacheService;

    protected UUID resolveOrgUnitId(String requestOrgId) {
        if (requestOrgId == null || requestOrgId.trim().isEmpty() || "null".equalsIgnoreCase(requestOrgId.trim())) {
            return null;
        }
        try {
            if (requestOrgId.trim().endsWith("-demo")) {
                List<OrgUnit> roots = orgUnitRepository.findAll();
                if (!roots.isEmpty())
                    return roots.get(0).getId();
                return null;
            }
            return UUID.fromString(requestOrgId.trim());
        } catch (Exception e) {
            return null;
        }
    }

    protected ReportResponse buildPreviewResponse(String code, List<String> headers, List<Map<String, Object>> rows,
            Map<String, Object> summary) {
        return ReportResponse.builder()
                .code(code)
                .name("Xem trước: " + code)
                .reportType(ReportType.SUMMARY)
                .status(ReportStatus.READY)
                .generatedAt(Instant.now())
                .headers(headers)
                .rows(rows)
                .summary(summary)
                .build();
    }

    protected boolean isOrgUnitRoot(UUID targetUnitId) {
        if (targetUnitId == null) {
            return true;
        }
        return orgUnitRepository.findById(targetUnitId)
                .map(u -> u.getParentId() == null
                        || "G17.43".equalsIgnoreCase(u.getCode())
                        || "G17".equalsIgnoreCase(u.getCode())
                        || (u.getName() != null && (u.getName().toLowerCase().contains("cục hàng hải") || u.getName().toLowerCase().contains("bộ giao thông"))))
                .orElse(false);
    }

    protected Set<UUID> getSubtreeOrgUnitIds(UUID targetUnitId) {
        if (targetUnitId == null) {
            return Collections.emptySet();
        }
        if (orgUnitCacheService == null) {
            return Set.of(targetUnitId);
        }
        List<OrgUnitResponse> allUnits = orgUnitCacheService.getList();
        if (allUnits == null || allUnits.isEmpty()) {
            return Set.of(targetUnitId);
        }
        Map<UUID, List<UUID>> childIdsByParent = allUnits.stream()
                .filter(unit -> unit.getId() != null && unit.getParentId() != null)
                .collect(Collectors.groupingBy(
                        OrgUnitResponse::getParentId,
                        LinkedHashMap::new,
                        Collectors.mapping(OrgUnitResponse::getId, Collectors.toList())));

        Set<UUID> result = new HashSet<>();
        List<UUID> queue = new ArrayList<>();
        queue.add(targetUnitId);
        for (int index = 0; index < queue.size(); index++) {
            UUID currentId = queue.get(index);
            if (!result.add(currentId)) {
                continue;
            }
            queue.addAll(childIdsByParent.getOrDefault(currentId, Collections.emptyList()));
        }
        return result;
    }

    protected int getReportYear(ReportPreviewRequest request) {
        return request.getStartDate() != null ? request.getStartDate().getYear()
                : LocalDate.now().getYear();
    }
}
