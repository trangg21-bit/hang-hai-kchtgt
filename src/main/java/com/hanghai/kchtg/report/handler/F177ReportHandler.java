package com.hanghai.kchtg.report.handler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.InlandWaterwayPortCall;
import com.hanghai.kchtg.report.entity.ReportRecord;
import com.hanghai.kchtg.report.service.BcdlAggregationService;
import com.hanghai.kchtg.report.service.ReportRecordService;
import com.hanghai.kchtg.shipportcall.entity.ShipPortCall;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Handler cho báo cáo F-177 (BCTT48_192) — Biểu 28-T: Khối lượng hàng hóa thông qua cảng (tháng).
 */
@Component
public class F177ReportHandler extends BaseReportHandler {

    @Autowired
    private ReportRecordService reportRecordService;

    @Autowired
    private BcdlAggregationService aggregationService;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean supports(String reportCode) {
        return "F-177".equalsIgnoreCase(reportCode) || "BCTT48_192".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "MONTHLY";

        List<String> headers = List.of(
                "STT", "Chỉ tiêu hàng hóa", "Đơn vị tính",
                "Thực hiện tháng này", "Thực hiện tháng trước", "Lũy kế từ đầu năm", "So với cùng kỳ (%)"
        );

        List<Map<String, Object>> rows = loadRows(targetUnitId, reportYear, period, request.getStartDate());

        BigDecimal totalMonth = BigDecimal.ZERO;
        for (Map<String, Object> r : rows) {
            Object cur = r.get("Thực hiện tháng này");
            if (cur instanceof Number) {
                totalMonth = totalMonth.add(BigDecimal.valueOf(((Number) cur).doubleValue()));
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng thực hiện tháng này", totalMonth);

        return buildPreviewResponse("F-177", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        String period = request.getReportPeriod() != null ? request.getReportPeriod() : "MONTHLY";
        return loadRows(targetUnitId, reportYear, period, request.getStartDate());
    }

    private List<Map<String, Object>> loadRows(UUID orgUnitId, int reportYear, String period, LocalDate startDate) {
        Optional<ReportRecord> recordOpt = reportRecordService.findSnapshot(orgUnitId, "F-177", reportYear, period);
        if (recordOpt.isPresent() && recordOpt.get().getReportData() != null) {
            try {
                return objectMapper.readValue(recordOpt.get().getReportData(), new TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception ignored) {
            }
        }
        int reportMonth = startDate != null ? startDate.getMonthValue() : requestMonth(period, reportYear);
        return getDefaultRows(orgUnitId, reportYear, reportMonth);
    }

    private int requestMonth(String period, int reportYear) {
        try {
            if (period != null && period.matches(".*(?:0?[1-9]|1[0-2]).*")) {
                java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(?:^|\\D)(0?[1-9]|1[0-2])(?:\\D|$)").matcher(period);
                if (matcher.find()) return Integer.parseInt(matcher.group(1));
            }
        } catch (RuntimeException ignored) {
        }
        return LocalDate.now().getYear() == reportYear ? LocalDate.now().getMonthValue() : 12;
    }

    private List<Map<String, Object>> getDefaultRows(UUID orgUnitId, int reportYear, int reportMonth) {
        LocalDate monthStart = LocalDate.of(reportYear, reportMonth, 1);
        LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);
        Map<String, BigDecimal> month = aggregationService.aggregateCargoMetrics(
                aggregationService.getFilteredShipPortCalls(orgUnitId, monthStart, monthEnd),
                aggregationService.getFilteredInlandPortCalls(orgUnitId, monthStart, monthEnd));
        Map<String, BigDecimal> yearToDate = aggregationService.aggregateCargoMetrics(
                aggregationService.getFilteredShipPortCalls(orgUnitId, LocalDate.of(reportYear, 1, 1), monthEnd),
                aggregationService.getFilteredInlandPortCalls(orgUnitId, LocalDate.of(reportYear, 1, 1), monthEnd));
        LocalDate priorEnd = LocalDate.of(reportYear - 1, reportMonth, 1).plusMonths(1).minusDays(1);
        Map<String, BigDecimal> priorYearToDate = aggregationService.aggregateCargoMetrics(
                aggregationService.getFilteredShipPortCalls(orgUnitId, LocalDate.of(reportYear - 1, 1, 1), priorEnd),
                aggregationService.getFilteredInlandPortCalls(orgUnitId, LocalDate.of(reportYear - 1, 1, 1), priorEnd));

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        for (F165ReportHandler.MetricRowDef def : F165ReportHandler.getMetricDefinitions()) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", def.isGroupHeader ? def.code : String.valueOf(stt++));
            r.put("Chỉ tiêu hàng hóa", def.title);
            r.put("Đơn vị tính", def.unit);
            if (def.isGroupHeader) {
                r.put("Thực hiện tháng này", "");
                r.put("Thực hiện tháng trước", "");
                r.put("Lũy kế từ đầu năm", "");
                r.put("So với cùng kỳ (%)", "");
                r.put("_rowType", "section");
            } else {
                BigDecimal cur = month.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal ytd = yearToDate.getOrDefault(def.metricKey, BigDecimal.ZERO);
                r.put("Thực hiện tháng này", cur);
                r.put("Kế hoạch năm", BigDecimal.ZERO);
                r.put("Lũy kế từ đầu năm", ytd);
                r.put("Lũy kế cùng kỳ năm trước", priorYearToDate.getOrDefault(def.metricKey, BigDecimal.ZERO));
            }
            rows.add(r);
        }
        return rows;
    }
}
