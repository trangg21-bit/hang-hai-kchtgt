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
 * Handler cho báo cáo F-171 (BCPTTV_186) — Biểu 22-6T/N: Thống kê tàu biển mang cờ quốc tịch Việt Nam.
 */
@Component
public class F171ReportHandler extends BaseReportHandler {

    @Autowired
    private ReportRecordService reportRecordService;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean supports(String reportCode) {
        return "F-171".equalsIgnoreCase(reportCode) || "BCPTTV_186".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";

        List<String> headers = List.of(
                "STT", "Loại tàu", "Số lượng (Chiếc)", "Tổng dung tích (GT)",
                "Trọng tải toàn phần (DWT)", "Công suất máy (CV)", "Tuổi tàu bình quân (Năm)"
        );
        List<Map<String, Object>> rows = loadRows(targetUnitId, reportYear, period);

        long totalCount = 0;
        BigDecimal totalGt = BigDecimal.ZERO;
        BigDecimal totalDwt = BigDecimal.ZERO;

        for (Map<String, Object> r : rows) {
            Object cnt = r.get("Số lượng (Chiếc)");
            Object gt = r.get("Tổng dung tích (GT)");
            Object dwt = r.get("Trọng tải toàn phần (DWT)");

            if (cnt instanceof Number) totalCount += ((Number) cnt).longValue();
            if (gt instanceof Number) totalGt = totalGt.add(BigDecimal.valueOf(((Number) gt).doubleValue()));
            if (dwt instanceof Number) totalDwt = totalDwt.add(BigDecimal.valueOf(((Number) dwt).doubleValue()));
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tàu (Chiếc)", totalCount);
        summary.put("Tổng dung tích (GT)", totalGt);
        summary.put("Tổng trọng tải (DWT)", totalDwt);

        return buildPreviewResponse("F-171", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "ANNUAL";
        return loadRows(targetUnitId, reportYear, period);
    }

    private List<Map<String, Object>> loadRows(UUID orgUnitId, int reportYear, String period) {
        Optional<ReportRecord> recordOpt = reportRecordService.findSnapshot(orgUnitId, "F-171", reportYear, period);
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
        String[] types = {
            "Tàu chở hàng khô tổng hợp",
            "Tàu chở hàng rời",
            "Tàu chở container",
            "Tàu chở dầu/hóa chất",
            "Tàu chở khí hóa lỏng",
            "Tàu chở khách",
            "Tàu chuyên dùng khác"
        };
        for (int i = 0; i < types.length; i++) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", String.valueOf(i + 1));
            r.put("Loại tàu", types[i]);
            r.put("Số lượng (Chiếc)", 0);
            r.put("Tổng dung tích (GT)", 0);
            r.put("Trọng tải toàn phần (DWT)", 0);
            r.put("Công suất máy (CV)", 0);
            r.put("Tuổi tàu bình quân (Năm)", 0);
            rows.add(r);
        }
        return rows;
    }
}
