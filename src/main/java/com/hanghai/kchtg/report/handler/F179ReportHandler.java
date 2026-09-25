package com.hanghai.kchtg.report.handler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.ReportRecord;
import com.hanghai.kchtg.report.service.ReportRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Handler cho báo cáo F-179 (BCTT48_194) — Biểu 33-N: Sản lượng dịch vụ vận tải, doanh nghiệp và các hoạt động hỗ trợ.
 */
@Component
public class F179ReportHandler extends BaseReportHandler {

    @Autowired
    private ReportRecordService reportRecordService;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean supports(String reportCode) {
        return "F-179".equalsIgnoreCase(reportCode) || "BCTT48_194".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";

        List<String> headers = List.of(
                "STT", "Lĩnh vực hoạt động", "Số doanh nghiệp", "Khối lượng vận chuyển (Nghìn tấn)",
                "Khối lượng luân chuyển (Triệu Tấn.km)", "Lượt hành khách (Nghìn lượt)", "Doanh thu (Tỷ đồng)"
        );

        List<Map<String, Object>> rows = loadRows(targetUnitId, reportYear, period);

        BigDecimal totalDoanhThu = BigDecimal.ZERO;
        long totalDn = 0;

        for (Map<String, Object> r : rows) {
            Object dn = r.get("Số doanh nghiệp");
            Object dt = r.get("Doanh thu (Tỷ đồng)");
            if (dn instanceof Number) totalDn += ((Number) dn).longValue();
            if (dt instanceof Number) totalDoanhThu = totalDoanhThu.add(BigDecimal.valueOf(((Number) dt).doubleValue()));
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số doanh nghiệp", totalDn);
        summary.put("Tổng doanh thu (Tỷ đồng)", totalDoanhThu);

        return buildPreviewResponse("F-179", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";
        return loadRows(targetUnitId, reportYear, period);
    }

    private List<Map<String, Object>> loadRows(UUID orgUnitId, int reportYear, String period) {
        Optional<ReportRecord> recordOpt = reportRecordService.findSnapshot(orgUnitId, "F-179", reportYear, period);
        if (recordOpt.isPresent() && recordOpt.get().getReportData() != null) {
            try {
                return objectMapper.readValue(recordOpt.get().getReportData(), new TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception ignored) {
            }
        }
        return getDefaultRows();
    }

    private List<Map<String, Object>> getDefaultRows() {
        return new ArrayList<>();
    }
}
