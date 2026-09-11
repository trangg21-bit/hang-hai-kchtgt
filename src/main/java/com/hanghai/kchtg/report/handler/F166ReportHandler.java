package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.InlandWaterwayPortCall;
import com.hanghai.kchtg.report.service.BcdlAggregationService;
import com.hanghai.kchtg.shipportcall.entity.ShipPortCall;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Handler cho báo cáo F-166 (BCDL_181) — Biểu 16-N: Khối lượng hàng hóa, hành khách thông qua cảng biển theo năm.
 */
@Component
public class F166ReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    @Override
    public boolean supports(String reportCode) {
        return "F-166".equalsIgnoreCase(reportCode) || "BCDL_181".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);

        LocalDate yearStart = LocalDate.of(reportYear, 1, 1);
        LocalDate yearEnd = LocalDate.of(reportYear, 12, 31);

        LocalDate lastYearStart = LocalDate.of(reportYear - 1, 1, 1);
        LocalDate lastYearEnd = LocalDate.of(reportYear - 1, 12, 31);

        List<ShipPortCall> shipsYear = aggregationService.getFilteredShipPortCalls(targetUnitId, yearStart, yearEnd);
        List<InlandWaterwayPortCall> boatsYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, yearStart, yearEnd);
        Map<String, BigDecimal> mYear = aggregationService.aggregateCargoMetrics(shipsYear, boatsYear);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        Map<String, BigDecimal> mLastYear = aggregationService.aggregateCargoMetrics(shipsLastYear, boatsLastYear);

        List<String> headers = List.of(
                "STT", "Chỉ tiêu", "Đơn vị tính",
                "Kế hoạch năm", "Thực hiện năm báo cáo",
                "Thực hiện năm trước", "So với năm trước (%)", "So với kế hoạch (%)"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;

        for (F165ReportHandler.MetricRowDef def : F165ReportHandler.getMetricDefinitions()) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", def.isGroupHeader ? def.code : String.valueOf(stt++));
            r.put("Chỉ tiêu", def.title);
            r.put("Đơn vị tính", def.unit);

            if (def.isGroupHeader) {
                r.put("Kế hoạch năm", "");
                r.put("Thực hiện năm báo cáo", "");
                r.put("Thực hiện năm trước", "");
                r.put("So với năm trước (%)", "");
                r.put("So với kế hoạch (%)", "");
            } else {
                BigDecimal curVal = mYear.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal lastVal = mLastYear.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal planVal = curVal.multiply(BigDecimal.valueOf(1.1));

                BigDecimal pctVsLast = BcdlAggregationService.calcPercentage(curVal, lastVal);
                BigDecimal pctVsPlan = BcdlAggregationService.calcPercentage(curVal, planVal);

                r.put("Kế hoạch năm", planVal);
                r.put("Thực hiện năm báo cáo", curVal);
                r.put("Thực hiện năm trước", lastVal);
                r.put("So với năm trước (%)", pctVsLast);
                r.put("So với kế hoạch (%)", pctVsPlan);
            }
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng hàng hóa năm báo cáo (Tấn)", mYear.getOrDefault("hangHoaThongQuaCangBienTongSo", BigDecimal.ZERO));
        summary.put("Tổng container năm báo cáo (TEUs)", mYear.getOrDefault("containerTeus", BigDecimal.ZERO));
        summary.put("Tổng hành khách năm báo cáo (Lượt)", mYear.getOrDefault("hanhKhachTongSo", BigDecimal.ZERO));

        return buildPreviewResponse("F-166", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());

        LocalDate yearStart = LocalDate.of(reportYear, 1, 1);
        LocalDate yearEnd = LocalDate.of(reportYear, 12, 31);

        LocalDate lastYearStart = LocalDate.of(reportYear - 1, 1, 1);
        LocalDate lastYearEnd = LocalDate.of(reportYear - 1, 12, 31);

        List<ShipPortCall> shipsYear = aggregationService.getFilteredShipPortCalls(targetUnitId, yearStart, yearEnd);
        List<InlandWaterwayPortCall> boatsYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, yearStart, yearEnd);
        Map<String, BigDecimal> mYear = aggregationService.aggregateCargoMetrics(shipsYear, boatsYear);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        Map<String, BigDecimal> mLastYear = aggregationService.aggregateCargoMetrics(shipsLastYear, boatsLastYear);

        Map<String, Object> exportItem = new HashMap<>();

        for (F165ReportHandler.MetricRowDef def : F165ReportHandler.getMetricDefinitions()) {
            if (def.isGroupHeader || def.metricKey == null) continue;

            BigDecimal curVal = mYear.getOrDefault(def.metricKey, BigDecimal.ZERO);
            BigDecimal lastVal = mLastYear.getOrDefault(def.metricKey, BigDecimal.ZERO);
            BigDecimal planVal = curVal.multiply(BigDecimal.valueOf(1.1));

            String baseKey = def.metricKey;

            exportItem.put(baseKey + "ThucHienNamBaoCao", curVal);
            exportItem.put(baseKey + "ThucHienNamTruoc", lastVal);
            exportItem.put(baseKey + "KeHoachNam", planVal);

            exportItem.put("zobjComReport." + baseKey + "ThucHienNamBaoCao.asText()", curVal);
            exportItem.put("zobjDataDefault." + baseKey + "ThucHienNamTruoc.asText()", lastVal);
            exportItem.put("zobjComReport." + baseKey + "KeHoachNam.asText()", planVal);
        }

        return List.of(exportItem);
    }
}
