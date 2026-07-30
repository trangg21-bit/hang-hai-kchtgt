package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.ReportStatus;
import com.hanghai.kchtg.report.entity.ReportType;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public abstract class BaseReportHandler implements ReportHandler {

    @Autowired
    protected OrgUnitRepository orgUnitRepository;

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
            return false;
        }
        return orgUnitRepository.findById(targetUnitId)
                .map(u -> "CUC_HHVT".equals(u.getCode()))
                .orElse(false);
    }

    protected int getReportYear(ReportPreviewRequest request) {
        return request.getStartDate() != null ? request.getStartDate().getYear()
                : LocalDate.now().getYear();
    }
}
