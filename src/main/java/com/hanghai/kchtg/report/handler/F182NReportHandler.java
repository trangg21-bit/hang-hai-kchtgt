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
 * Handler cho báo cáo F-182N (BCDL_182N) — Biểu 13-T: Lượt tàu thuyền vào, rời cảng biển theo ngày.
 */
@Component
public class F182NReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    @Override
    public boolean supports(String reportCode) {
        return "F-182N".equalsIgnoreCase(reportCode) || "BCDL_182N".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());

        LocalDate fromDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate toDate = request.getEndDate() != null ? request.getEndDate() : fromDate;
        if (fromDate.isAfter(toDate)) {
            LocalDate tmp = fromDate;
            fromDate = toDate;
            toDate = tmp;
        }

        LocalDate lastYearFrom = fromDate.minusYears(1);
        LocalDate lastYearTo = toDate.minusYears(1);

        List<ShipPortCall> shipsPeriod = aggregationService.getFilteredShipPortCalls(targetUnitId, fromDate, toDate);
        List<InlandWaterwayPortCall> boatsPeriod = aggregationService.getFilteredInlandPortCalls(targetUnitId, fromDate, toDate);
        Map<String, BigDecimal> mPeriod = aggregationService.aggregateShipTurnMetrics(shipsPeriod, boatsPeriod);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        Map<String, BigDecimal> mLastYear = aggregationService.aggregateShipTurnMetrics(shipsLastYear, boatsLastYear);

        List<String> headers = List.of(
                "STT", "Chỉ tiêu phương tiện", "Đơn vị tính",
                "Lượt kỳ lựa chọn", "Lượt cùng kỳ năm trước",
                "So với cùng kỳ năm trước (%)"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        List<F165ReportHandler.MetricRowDef> defs = F167ReportHandler.getTurnMetricDefinitions();
        int stt = 1;

        for (F165ReportHandler.MetricRowDef def : defs) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", def.isGroupHeader ? def.code : String.valueOf(stt++));
            r.put("Chỉ tiêu phương tiện", def.title);
            r.put("Đơn vị tính", def.unit);

            if (def.isGroupHeader) {
                r.put("Lượt kỳ lựa chọn", "");
                r.put("Lượt cùng kỳ năm trước", "");
                r.put("So với cùng kỳ năm trước (%)", "");
            } else {
                BigDecimal periodVal = mPeriod.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal lastYearVal = mLastYear.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal percentage = BcdlAggregationService.calcPercentage(periodVal, lastYearVal);

                r.put("Lượt kỳ lựa chọn", periodVal);
                r.put("Lượt cùng kỳ năm trước", lastYearVal);
                r.put("So với cùng kỳ năm trước (%)", lastYearVal.compareTo(BigDecimal.ZERO) == 0 ? "—" : percentage.toPlainString() + "%");
            }
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng lượt tàu thuyền kỳ lựa chọn", mPeriod.getOrDefault("tongLuotTauThuyen", BigDecimal.ZERO));
        summary.put("Tàu biển Việt Nam (Lượt)", mPeriod.getOrDefault("tauBienVnTongSo", BigDecimal.ZERO));
        summary.put("Tàu biển nước ngoài (Lượt)", mPeriod.getOrDefault("tauBienNnTongSo", BigDecimal.ZERO));
        summary.put("Phương tiện TNĐ (Lượt)", mPeriod.getOrDefault("pttndTongSo", BigDecimal.ZERO));

        return buildPreviewResponse("F-182N", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());

        LocalDate fromDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate toDate = request.getEndDate() != null ? request.getEndDate() : fromDate;
        if (fromDate.isAfter(toDate)) {
            LocalDate tmp = fromDate;
            fromDate = toDate;
            toDate = tmp;
        }

        LocalDate lastYearFrom = fromDate.minusYears(1);
        LocalDate lastYearTo = toDate.minusYears(1);

        List<ShipPortCall> shipsPeriod = aggregationService.getFilteredShipPortCalls(targetUnitId, fromDate, toDate);
        List<InlandWaterwayPortCall> boatsPeriod = aggregationService.getFilteredInlandPortCalls(targetUnitId, fromDate, toDate);
        Map<String, BigDecimal> mPeriod = aggregationService.aggregateShipTurnMetrics(shipsPeriod, boatsPeriod);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        Map<String, BigDecimal> mLastYear = aggregationService.aggregateShipTurnMetrics(shipsLastYear, boatsLastYear);

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("tauBienNnGtLuotKyLuaChon", mPeriod.getOrDefault("tauBienNnGt", BigDecimal.ZERO));
        row.put("tauBienNnGtLuotCungKyNamTruoc", mLastYear.getOrDefault("tauBienNnGt", BigDecimal.ZERO));
        row.put("tauBienNnHdndLuotKyLuaChon", mPeriod.getOrDefault("tauBienNnHdnd", BigDecimal.ZERO));
        row.put("tauBienNnHdndLuotCungKyNamTruoc", mLastYear.getOrDefault("tauBienNnHdnd", BigDecimal.ZERO));
        row.put("tauBienNnHdxncLuotKyLuaChon", mPeriod.getOrDefault("tauBienNnHdxnc", BigDecimal.ZERO));
        row.put("tauBienNnHdxncLuotCungKyNamTruoc", mLastYear.getOrDefault("tauBienNnHdxnc", BigDecimal.ZERO));
        row.put("tauBienVnGTLuotKyLuaChon", mPeriod.getOrDefault("tauBienVnGt", BigDecimal.ZERO));
        row.put("tauBienVnGTLuotCungKyNamTruoc", mLastYear.getOrDefault("tauBienVnGt", BigDecimal.ZERO));
        row.put("tauBienVnHdndLuotKyLuaChon", mPeriod.getOrDefault("tauBienVnHdnd", BigDecimal.ZERO));
        row.put("tauBienVnHdndLuotCungKyNamTruoc", mLastYear.getOrDefault("tauBienVnHdnd", BigDecimal.ZERO));
        row.put("tauBienVnHdxncLuotKyLuaChon", mPeriod.getOrDefault("tauBienVnHdxnc", BigDecimal.ZERO));
        row.put("tauBienVnHdxncLuotCungKyNamTruoc", mLastYear.getOrDefault("tauBienVnHdxnc", BigDecimal.ZERO));
        row.put("pttndTruPttndVrSbLuotKyLuaChon", mPeriod.getOrDefault("pttndTruVrSb", BigDecimal.ZERO));
        row.put("pttndTruPttndVrSbLuotCungKyNamTruoc", mLastYear.getOrDefault("pttndTruVrSb", BigDecimal.ZERO));
        row.put("pttndDkPttndVrSbLuotKyLuaChon", mPeriod.getOrDefault("pttndDkVrSb", BigDecimal.ZERO));
        row.put("pttndDkPttndVrSbLuotCungKyNamTruoc", mLastYear.getOrDefault("pttndDkVrSb", BigDecimal.ZERO));
        row.put("pttndDkPttndVrSbTuCbCbLuotKyLuaChon", mPeriod.getOrDefault("pttndVrSbTuCbCb", BigDecimal.ZERO));
        row.put("pttndDkPttndVrSbTuCbCbLuotCungKyNamTruoc", mLastYear.getOrDefault("pttndVrSbTuCbCb", BigDecimal.ZERO));
        row.put("pttndDkPttndVrSbTuCbCtndVaNguocLaiLuotKyLuaChon", mPeriod.getOrDefault("pttndVrSbTuCbCtnd", BigDecimal.ZERO));
        row.put("pttndDkPttndVrSbTuCbCtndVaNguocLaiLuotCungKyNamTruoc", mLastYear.getOrDefault("pttndVrSbTuCbCtnd", BigDecimal.ZERO));
        row.put("pttndTauThuyenTrongTaiDuoi200Tan", mPeriod.getOrDefault("tauDuoi200Tan", BigDecimal.ZERO));
        row.put("pttndTauThuyenTrongTaiDuoi200TanCungKyNamTruoc", mLastYear.getOrDefault("tauDuoi200Tan", BigDecimal.ZERO));
        row.put("tauKhachTauVnLuotKyLuaChon", mPeriod.getOrDefault("tauKhachVn", BigDecimal.ZERO));
        row.put("tauKhachTauVnLuotCungKyNamTruoc", mLastYear.getOrDefault("tauKhachVn", BigDecimal.ZERO));
        row.put("tauKhachTauNnLuotKyLuaChon", mPeriod.getOrDefault("tauKhachNn", BigDecimal.ZERO));
        row.put("tauKhachTauNnLuotCungKyNamTruoc", mLastYear.getOrDefault("tauKhachNn", BigDecimal.ZERO));
        row.put("luotTauTuBoRaDaoTauKhachVnLuotKyLuaChon", mPeriod.getOrDefault("luotTauBoRaDaoVn", BigDecimal.ZERO));
        row.put("luotTauTuBoRaDaoTauKhachVnLuotCungKyNamTruoc", mLastYear.getOrDefault("luotTauBoRaDaoVn", BigDecimal.ZERO));
        row.put("luotTauTuBoRaDaoPttndKhachLuotKyLuaChon", mPeriod.getOrDefault("luotTauBoRaDaoPttnd", BigDecimal.ZERO));
        row.put("luotTauTuBoRaDaoPttndKhachLuotCungKyNamTruoc", mLastYear.getOrDefault("luotTauBoRaDaoPttnd", BigDecimal.ZERO));
        row.put("luotTauKhuCtBenPhaoLuotKyLuaChon", mPeriod.getOrDefault("luotTauKhuCtBenPhao", BigDecimal.ZERO));
        row.put("luotTauKhuCtBenPhaoLuotCungKyNamTruoc", mLastYear.getOrDefault("luotTauKhuCtBenPhao", BigDecimal.ZERO));

        return List.of(row);
    }
}
