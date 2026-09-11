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
 * Handler cho báo cáo F-174 (BCDN_189) — Biểu 46-6T/N: Tổng hợp khối lượng hàng hóa thông qua cảng biển.
 */
@Component
public class F174ReportHandler extends BaseReportHandler {

    @Autowired
    private ReportRecordService reportRecordService;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean supports(String reportCode) {
        return "F-174".equalsIgnoreCase(reportCode) || "BCDN_189".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";

        List<String> headers = List.of(
                "STT", "Tên cảng biển / Bến cảng", "Hàng xuất khẩu (Tấn)", "Hàng nhập khẩu (Tấn)",
                "Hàng nội địa (Tấn)", "Hàng quá cảnh (Tấn)", "Tổng số (Tấn)", "Container (TEUs)"
        );
        List<Map<String, Object>> rows = loadRows(targetUnitId, reportYear, period);

        BigDecimal totalHangHoa = BigDecimal.ZERO;
        BigDecimal totalTeus = BigDecimal.ZERO;

        for (Map<String, Object> r : rows) {
            Object tong = r.get("Tổng số (Tấn)");
            Object teus = r.get("Container (TEUs)");
            if (tong instanceof Number) totalHangHoa = totalHangHoa.add(BigDecimal.valueOf(((Number) tong).doubleValue()));
            if (teus instanceof Number) totalTeus = totalTeus.add(BigDecimal.valueOf(((Number) teus).doubleValue()));
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số hàng hóa (Tấn)", totalHangHoa);
        summary.put("Tổng số container (TEUs)", totalTeus);

        return buildPreviewResponse("F-174", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";
        return loadRows(targetUnitId, reportYear, period);
    }

    private List<Map<String, Object>> loadRows(UUID orgUnitId, int reportYear, String period) {
        Optional<ReportRecord> recordOpt = reportRecordService.findSnapshot(orgUnitId, "F-174", reportYear, period);
        if (recordOpt.isPresent() && recordOpt.get().getReportData() != null) {
            try {
                return objectMapper.readValue(recordOpt.get().getReportData(), new TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception ignored) {
            }
        }
        return getDefaultRows();
    }

    private List<Map<String, Object>> getDefaultRows() {
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("STT", "1");
        r.put("Tên cảng biển / Bến cảng", "Khu vực Cảng biển Hải Phòng");
        r.put("Hàng xuất khẩu (Tấn)", 2500000);
        r.put("Hàng nhập khẩu (Tấn)", 3200000);
        r.put("Hàng nội địa (Tấn)", 1800000);
        r.put("Hàng quá cảnh (Tấn)", 150000);
        r.put("Tổng số (Tấn)", 7650000);
        r.put("Container (TEUs)", 540000);
        rows.add(r);
        return rows;
    }
}
