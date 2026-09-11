package com.hanghai.kchtg.report.handler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.ReportRecord;
import com.hanghai.kchtg.report.service.ReportRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Handler cho báo cáo F-170 (BCPTTV_185) — Biểu 21-6T/N: Thống kê thuyền viên, hoa tiêu hàng hải.
 */
@Component
public class F170ReportHandler extends BaseReportHandler {

    @Autowired
    private ReportRecordService reportRecordService;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean supports(String reportCode) {
        return "F-170".equalsIgnoreCase(reportCode) || "BCPTTV_185".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";

        List<String> headers = List.of("STT", "Chức danh", "Hạng 1", "Hạng 2", "Hạng 3", "Tổng số", "Ghi chú");
        List<Map<String, Object>> rows = loadRows(targetUnitId, reportYear, period);

        long totalThuyenVien = 0;
        long totalHoaTieu = 0;
        for (Map<String, Object> r : rows) {
            Object tongSoObj = r.get("Tổng số");
            if (tongSoObj instanceof Number) {
                String cd = String.valueOf(r.get("Chức danh"));
                if (cd.contains("Hoa tiêu")) {
                    totalHoaTieu += ((Number) tongSoObj).longValue();
                } else {
                    totalThuyenVien += ((Number) tongSoObj).longValue();
                }
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số thuyền viên", totalThuyenVien);
        summary.put("Tổng số hoa tiêu", totalHoaTieu);

        return buildPreviewResponse("F-170", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";
        return loadRows(targetUnitId, reportYear, period);
    }

    private List<Map<String, Object>> loadRows(UUID orgUnitId, int reportYear, String period) {
        Optional<ReportRecord> recordOpt = reportRecordService.findSnapshot(orgUnitId, "F-170", reportYear, period);
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
        // I. THUYỀN VIÊN
        rows.add(createSectionRow("I", "THUYỀN VIÊN"));
        String[] tvTitles = {
            "Thuyền trưởng", "Đại phó", "Sỹ quan boong", "Thủy thủ trực ca",
            "Máy trưởng", "Máy hai", "Sỹ quan máy", "Thợ máy trực ca",
            "Sỹ quan kỹ thuật điện", "Thợ kỹ thuật điện"
        };
        for (int i = 0; i < tvTitles.length; i++) {
            rows.add(createDataRow(String.valueOf(i + 1), tvTitles[i], 0, 0, 0, 0, ""));
        }

        // II. HOA TIÊU HÀNG HẢI
        rows.add(createSectionRow("II", "HOA TIÊU HÀNG HẢI"));
        String[] htTitles = {
            "Hoa tiêu Ngoại hạng", "Hoa tiêu Hạng 1", "Hoa tiêu Hạng 2", "Hoa tiêu Hạng 3"
        };
        for (int i = 0; i < htTitles.length; i++) {
            rows.add(createDataRow(String.valueOf(i + 1), htTitles[i], 0, 0, 0, 0, ""));
        }
        return rows;
    }

    private Map<String, Object> createSectionRow(String stt, String title) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("STT", stt);
        r.put("Chức danh", title);
        r.put("Hạng 1", "");
        r.put("Hạng 2", "");
        r.put("Hạng 3", "");
        r.put("Tổng số", "");
        r.put("Ghi chú", "");
        r.put("_rowType", "section");
        return r;
    }

    private Map<String, Object> createDataRow(String stt, String title, int h1, int h2, int h3, int total, String note) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("STT", stt);
        r.put("Chức danh", title);
        r.put("Hạng 1", h1);
        r.put("Hạng 2", h2);
        r.put("Hạng 3", h3);
        r.put("Tổng số", total);
        r.put("Ghi chú", note);
        return r;
    }
}
