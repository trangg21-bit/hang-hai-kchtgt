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
 * Handler cho báo cáo F-172 (BCPTTV_187) — Biểu 28-N: Thống kê tàu thuyền hoạt động dịch vụ lai dắt.
 */
@Component
public class F172ReportHandler extends BaseReportHandler {

    @Autowired
    private ReportRecordService reportRecordService;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean supports(String reportCode) {
        return "F-172".equalsIgnoreCase(reportCode) || "BCPTTV_187".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";

        List<String> headers = List.of(
                "STT", "Tên doanh nghiệp", "Tên tàu lai", "Hô hiệu / Số IMO",
                "Công suất máy (CV)", "Năm đóng", "Vùng hoạt động", "Tình trạng kỹ thuật"
        );
        List<Map<String, Object>> rows = loadRows(targetUnitId, reportYear, period);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tàu lai dắt", rows.size());

        return buildPreviewResponse("F-172", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";
        return loadRows(targetUnitId, reportYear, period);
    }

    private List<Map<String, Object>> loadRows(UUID orgUnitId, int reportYear, String period) {
        Optional<ReportRecord> recordOpt = reportRecordService.findSnapshot(orgUnitId, "F-172", reportYear, period);
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
        r.put("Tên doanh nghiệp", "Công ty TNHH Dịch vụ Lai dắt Hàng hải");
        r.put("Tên tàu lai", "Tàu lai Hải Đăng 01");
        r.put("Hô hiệu / Số IMO", "IMO9876543");
        r.put("Công suất máy (CV)", 3200);
        r.put("Năm đóng", 2018);
        r.put("Vùng hoạt động", "Khu vực Cảng biển Hải Phòng");
        r.put("Tình trạng kỹ thuật", "Hoạt động tốt");
        rows.add(r);
        return rows;
    }
}
