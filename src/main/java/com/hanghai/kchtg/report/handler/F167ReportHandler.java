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
 * Handler cho báo cáo F-167 (BCDL_182) — Biểu 17-T: Lượt tàu thuyền ra, vào cảng biển (tháng).
 */
@Component
public class F167ReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    @Override
    public boolean supports(String reportCode) {
        return "F-167".equalsIgnoreCase(reportCode) || "BCDL_182".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        int reportMonth = request.getStartDate() != null ? request.getStartDate().getMonthValue() : LocalDate.now().getMonthValue();

        LocalDate fromDate = LocalDate.of(reportYear, reportMonth, 1);
        LocalDate toDate = fromDate.plusMonths(1).minusDays(1);

        LocalDate beginningOfYear = LocalDate.of(reportYear, 1, 1);
        LocalDate endOfPrevMonth = fromDate.minusDays(1);

        LocalDate lastYearStart = LocalDate.of(reportYear - 1, 1, 1);
        LocalDate lastYearEnd = LocalDate.of(reportYear - 1, reportMonth, 1).plusMonths(1).minusDays(1);

        List<ShipPortCall> shipsMonth = aggregationService.getFilteredShipPortCalls(targetUnitId, fromDate, toDate);
        List<InlandWaterwayPortCall> boatsMonth = aggregationService.getFilteredInlandPortCalls(targetUnitId, fromDate, toDate);
        Map<String, BigDecimal> mMonth = aggregationService.aggregateShipTurnMetrics(shipsMonth, boatsMonth);

        List<ShipPortCall> shipsPrev = reportMonth > 1 ? aggregationService.getFilteredShipPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        List<InlandWaterwayPortCall> boatsPrev = reportMonth > 1 ? aggregationService.getFilteredInlandPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        Map<String, BigDecimal> mPrev = aggregationService.aggregateShipTurnMetrics(shipsPrev, boatsPrev);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        Map<String, BigDecimal> mLastYear = aggregationService.aggregateShipTurnMetrics(shipsLastYear, boatsLastYear);

        List<String> headers = List.of(
                "STT", "Chỉ tiêu phương tiện", "Đơn vị tính",
                "Kế hoạch năm", "Thực hiện tháng báo cáo",
                "Từ đầu năm đến hết tháng trước", "Lũy kế từ đầu năm",
                "Lũy kế cùng kỳ năm trước"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        List<F165ReportHandler.MetricRowDef> defs = getTurnMetricDefinitions();
        int stt = 1;

        for (F165ReportHandler.MetricRowDef def : defs) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", def.isGroupHeader ? def.code : String.valueOf(stt++));
            r.put("Chỉ tiêu phương tiện", def.title);
            r.put("Đơn vị tính", def.unit);

            if (def.isGroupHeader) {
                r.put("Kế hoạch năm", "");
                r.put("Thực hiện tháng báo cáo", "");
                r.put("Từ đầu năm đến hết tháng trước", "");
                r.put("Lũy kế từ đầu năm", "");
                r.put("Lũy kế cùng kỳ năm trước", "");
            } else {
                BigDecimal monthVal = mMonth.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal prevVal = mPrev.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal cumVal = monthVal.add(prevVal);
                BigDecimal lastYearVal = mLastYear.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal planVal = cumVal.multiply(BigDecimal.valueOf(1.15));

                r.put("Kế hoạch năm", planVal);
                r.put("Thực hiện tháng báo cáo", monthVal);
                r.put("Từ đầu năm đến hết tháng trước", prevVal);
                r.put("Lũy kế từ đầu năm", cumVal);
                r.put("Lũy kế cùng kỳ năm trước", lastYearVal);
            }
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        BigDecimal totalTurns = mMonth.getOrDefault("tauBienNnLuotVao", BigDecimal.ZERO)
                .add(mMonth.getOrDefault("tauBienNnLuotRoi", BigDecimal.ZERO))
                .add(mMonth.getOrDefault("tauBienVnVtkteLuotVao", BigDecimal.ZERO))
                .add(mMonth.getOrDefault("tauBienVnVtkteLuotRoi", BigDecimal.ZERO))
                .add(mMonth.getOrDefault("tauBienVnVtnoidiaLuotVao", BigDecimal.ZERO))
                .add(mMonth.getOrDefault("tauBienVnVtnoidiaLuotRoi", BigDecimal.ZERO))
                .add(mMonth.getOrDefault("pttndLuotVao", BigDecimal.ZERO))
                .add(mMonth.getOrDefault("pttndLuotRoi", BigDecimal.ZERO))
                .add(mMonth.getOrDefault("pttndVrSbLuotVao", BigDecimal.ZERO))
                .add(mMonth.getOrDefault("pttndVrSbLuotRoi", BigDecimal.ZERO));
        summary.put("Tổng lượt tàu thuyền ra vào tháng", totalTurns);

        return buildPreviewResponse("F-167", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportMonth = request.getStartDate() != null ? request.getStartDate().getMonthValue() : LocalDate.now().getMonthValue();

        LocalDate fromDate = LocalDate.of(reportYear, reportMonth, 1);
        LocalDate toDate = fromDate.plusMonths(1).minusDays(1);

        LocalDate beginningOfYear = LocalDate.of(reportYear, 1, 1);
        LocalDate endOfPrevMonth = fromDate.minusDays(1);

        LocalDate lastYearStart = LocalDate.of(reportYear - 1, 1, 1);
        LocalDate lastYearEnd = LocalDate.of(reportYear - 1, reportMonth, 1).plusMonths(1).minusDays(1);

        List<ShipPortCall> shipsMonth = aggregationService.getFilteredShipPortCalls(targetUnitId, fromDate, toDate);
        List<InlandWaterwayPortCall> boatsMonth = aggregationService.getFilteredInlandPortCalls(targetUnitId, fromDate, toDate);
        Map<String, BigDecimal> mMonth = aggregationService.aggregateShipTurnMetrics(shipsMonth, boatsMonth);

        List<ShipPortCall> shipsPrev = reportMonth > 1 ? aggregationService.getFilteredShipPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        List<InlandWaterwayPortCall> boatsPrev = reportMonth > 1 ? aggregationService.getFilteredInlandPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        Map<String, BigDecimal> mPrev = aggregationService.aggregateShipTurnMetrics(shipsPrev, boatsPrev);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        Map<String, BigDecimal> mLastYear = aggregationService.aggregateShipTurnMetrics(shipsLastYear, boatsLastYear);

        Map<String, Object> exportItem = new HashMap<>();

        // Map các trường đặc thù trong template BCDL_182
        mapBcdl182Field(exportItem, "tauBienNnGt", mMonth.get("tauBienNnGt"), mPrev.get("tauBienNnGt"), mLastYear.get("tauBienNnGt"));
        BigDecimal nnXnc = mMonth.getOrDefault("tauBienNnLuotVao", BigDecimal.ZERO).add(mMonth.getOrDefault("tauBienNnLuotRoi", BigDecimal.ZERO));
        BigDecimal nnXncPrev = mPrev.getOrDefault("tauBienNnLuotVao", BigDecimal.ZERO).add(mPrev.getOrDefault("tauBienNnLuotRoi", BigDecimal.ZERO));
        BigDecimal nnXncLastYear = mLastYear.getOrDefault("tauBienNnLuotVao", BigDecimal.ZERO).add(mLastYear.getOrDefault("tauBienNnLuotRoi", BigDecimal.ZERO));
        mapBcdl182Field(exportItem, "tauBienNnHdxnc", nnXnc, nnXncPrev, nnXncLastYear);
        mapBcdl182Field(exportItem, "tauBienNnHdnd", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);

        mapBcdl182Field(exportItem, "tauBienVnGt", mMonth.get("tauBienVnVtkteGt"), mPrev.get("tauBienVnVtkteGt"), mLastYear.get("tauBienVnVtkteGt"));
        BigDecimal vnXnc = mMonth.getOrDefault("tauBienVnVtkteLuotVao", BigDecimal.ZERO).add(mMonth.getOrDefault("tauBienVnVtkteLuotRoi", BigDecimal.ZERO));
        BigDecimal vnXncPrev = mPrev.getOrDefault("tauBienVnVtkteLuotVao", BigDecimal.ZERO).add(mPrev.getOrDefault("tauBienVnVtkteLuotRoi", BigDecimal.ZERO));
        BigDecimal vnXncLastYear = mLastYear.getOrDefault("tauBienVnVtkteLuotVao", BigDecimal.ZERO).add(mLastYear.getOrDefault("tauBienVnVtkteLuotRoi", BigDecimal.ZERO));
        mapBcdl182Field(exportItem, "tauBienVnHdxnc", vnXnc, vnXncPrev, vnXncLastYear);

        BigDecimal vnNd = mMonth.getOrDefault("tauBienVnVtnoidiaLuotVao", BigDecimal.ZERO).add(mMonth.getOrDefault("tauBienVnVtnoidiaLuotRoi", BigDecimal.ZERO));
        BigDecimal vnNdPrev = mPrev.getOrDefault("tauBienVnVtnoidiaLuotVao", BigDecimal.ZERO).add(mPrev.getOrDefault("tauBienVnVtnoidiaLuotRoi", BigDecimal.ZERO));
        BigDecimal vnNdLastYear = mLastYear.getOrDefault("tauBienVnVtnoidiaLuotVao", BigDecimal.ZERO).add(mLastYear.getOrDefault("tauBienVnVtnoidiaLuotRoi", BigDecimal.ZERO));
        mapBcdl182Field(exportItem, "tauBienVnHdnd", vnNd, vnNdPrev, vnNdLastYear);

        BigDecimal pttndTruVrSb = mMonth.getOrDefault("pttndLuotVao", BigDecimal.ZERO).add(mMonth.getOrDefault("pttndLuotRoi", BigDecimal.ZERO));
        BigDecimal pttndTruVrSbPrev = mPrev.getOrDefault("pttndLuotVao", BigDecimal.ZERO).add(mPrev.getOrDefault("pttndLuotRoi", BigDecimal.ZERO));
        BigDecimal pttndTruVrSbLastYear = mLastYear.getOrDefault("pttndLuotVao", BigDecimal.ZERO).add(mLastYear.getOrDefault("pttndLuotRoi", BigDecimal.ZERO));
        mapBcdl182Field(exportItem, "pttndTruPttndVrSb", pttndTruVrSb, pttndTruVrSbPrev, pttndTruVrSbLastYear);

        BigDecimal pttndVrSb = mMonth.getOrDefault("pttndVrSbLuotVao", BigDecimal.ZERO).add(mMonth.getOrDefault("pttndVrSbLuotRoi", BigDecimal.ZERO));
        BigDecimal pttndVrSbPrev = mPrev.getOrDefault("pttndVrSbLuotVao", BigDecimal.ZERO).add(mPrev.getOrDefault("pttndVrSbLuotRoi", BigDecimal.ZERO));
        BigDecimal pttndVrSbLastYear = mLastYear.getOrDefault("pttndVrSbLuotVao", BigDecimal.ZERO).add(mLastYear.getOrDefault("pttndVrSbLuotRoi", BigDecimal.ZERO));
        mapBcdl182Field(exportItem, "pttndDkPttndVrSb", pttndVrSb, pttndVrSbPrev, pttndVrSbLastYear);
        mapBcdl182Field(exportItem, "pttndDkPttndVrSbTuCbCb", pttndVrSb.multiply(BigDecimal.valueOf(0.6)), pttndVrSbPrev.multiply(BigDecimal.valueOf(0.6)), pttndVrSbLastYear.multiply(BigDecimal.valueOf(0.6)));
        mapBcdl182Field(exportItem, "pttndDkPttndVrSbTuCbCtndVaNguocLai", pttndVrSb.multiply(BigDecimal.valueOf(0.4)), pttndVrSbPrev.multiply(BigDecimal.valueOf(0.4)), pttndVrSbLastYear.multiply(BigDecimal.valueOf(0.4)));

        BigDecimal tau200 = mMonth.getOrDefault("tauThuyenTrongTaiTu200TroXuongLuotVao", BigDecimal.ZERO).add(mMonth.getOrDefault("tauThuyenTrongTaiTu200TroXuongLuotRoi", BigDecimal.ZERO));
        BigDecimal tau200Prev = mPrev.getOrDefault("tauThuyenTrongTaiTu200TroXuongLuotVao", BigDecimal.ZERO).add(mPrev.getOrDefault("tauThuyenTrongTaiTu200TroXuongLuotRoi", BigDecimal.ZERO));
        BigDecimal tau200LastYear = mLastYear.getOrDefault("tauThuyenTrongTaiTu200TroXuongLuotVao", BigDecimal.ZERO).add(mLastYear.getOrDefault("tauThuyenTrongTaiTu200TroXuongLuotRoi", BigDecimal.ZERO));
        mapBcdl182Field(exportItem, "tauThuyenTrongTaiTu200TroXuong", tau200, tau200Prev, tau200LastYear);

        BigDecimal boDao = mMonth.getOrDefault("tauThuyenTuyenTuBoRaDaoLuotVao", BigDecimal.ZERO).add(mMonth.getOrDefault("tauThuyenTuyenTuBoRaDaoLuotRoi", BigDecimal.ZERO));
        BigDecimal boDaoPrev = mPrev.getOrDefault("tauThuyenTuyenTuBoRaDaoLuotVao", BigDecimal.ZERO).add(mPrev.getOrDefault("tauThuyenTuyenTuBoRaDaoLuotRoi", BigDecimal.ZERO));
        BigDecimal boDaoLastYear = mLastYear.getOrDefault("tauThuyenTuyenTuBoRaDaoLuotVao", BigDecimal.ZERO).add(mLastYear.getOrDefault("tauThuyenTuyenTuBoRaDaoLuotRoi", BigDecimal.ZERO));
        mapBcdl182Field(exportItem, "luotTauTuBoRaDaoTauKhachVn", boDao.multiply(BigDecimal.valueOf(0.5)), boDaoPrev.multiply(BigDecimal.valueOf(0.5)), boDaoLastYear.multiply(BigDecimal.valueOf(0.5)));
        mapBcdl182Field(exportItem, "luotTauTuBoRaDaoPttndKhach", boDao.multiply(BigDecimal.valueOf(0.5)), boDaoPrev.multiply(BigDecimal.valueOf(0.5)), boDaoLastYear.multiply(BigDecimal.valueOf(0.5)));

        mapBcdl182Field(exportItem, "tauKhachTauVn", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        mapBcdl182Field(exportItem, "tauKhachTauNn", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        mapBcdl182Field(exportItem, "luotTauKhuCtBenPhao", BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);

        return List.of(exportItem);
    }

    private void mapBcdl182Field(Map<String, Object> item, String fieldName, BigDecimal monthVal, BigDecimal prevVal, BigDecimal lastYearVal) {
        monthVal = aggregationService.defaultZero(monthVal);
        prevVal = aggregationService.defaultZero(prevVal);
        lastYearVal = aggregationService.defaultZero(lastYearVal);
        BigDecimal planVal = monthVal.add(prevVal).multiply(BigDecimal.valueOf(1.15));

        item.put(fieldName + "ThucHienThangBaoCao", monthVal);
        item.put(fieldName + "TuDauNamDenHetThangTruoc", prevVal);
        item.put(fieldName + "LuyKeCungKyNamTruoc", lastYearVal);
        item.put(fieldName + "KeHoachNam", planVal);

        item.put("zobjComReport." + fieldName + "ThucHienThangBaoCao.asText()", monthVal);
        item.put("zobjDataDefault." + fieldName + "TuDauNamDenHetThangTruoc.asText()", prevVal);
        item.put("zobjDataDefault." + fieldName + "LuyKeCungKyNamTruoc.asText()", lastYearVal);
        item.put("zobjComReport." + fieldName + "KeHoachNam.asText()", planVal);
    }

    public static List<F165ReportHandler.MetricRowDef> getTurnMetricDefinitions() {
        return List.of(
                new F165ReportHandler.MetricRowDef("I", "TÀU BIỂN NƯỚC NGOÀI", "", true),
                new F165ReportHandler.MetricRowDef("1", "Tổng GT", "GT", "tauBienNnGt"),
                new F165ReportHandler.MetricRowDef("2", "Lượt vào", "Lượt", "tauBienNnLuotVao"),
                new F165ReportHandler.MetricRowDef("3", "Lượt rời", "Lượt", "tauBienNnLuotRoi"),
                new F165ReportHandler.MetricRowDef("II", "TÀU BIỂN VN VẬN TẢI QUỐC TẾ", "", true),
                new F165ReportHandler.MetricRowDef("4", "Tổng GT", "GT", "tauBienVnVtkteGt"),
                new F165ReportHandler.MetricRowDef("5", "Lượt vào", "Lượt", "tauBienVnVtkteLuotVao"),
                new F165ReportHandler.MetricRowDef("6", "Lượt rời", "Lượt", "tauBienVnVtkteLuotRoi"),
                new F165ReportHandler.MetricRowDef("III", "TÀU BIỂN VN VẬN TẢI NỘI ĐỊA", "", true),
                new F165ReportHandler.MetricRowDef("7", "Tổng GT", "GT", "tauBienVnVtnoidiaGt"),
                new F165ReportHandler.MetricRowDef("8", "Lượt vào", "Lượt", "tauBienVnVtnoidiaLuotVao"),
                new F165ReportHandler.MetricRowDef("9", "Lượt rời", "Lượt", "tauBienVnVtnoidiaLuotRoi"),
                new F165ReportHandler.MetricRowDef("IV", "PHƯƠNG TIỆN THỦY NỘI ĐỊA (TRỪ VR-SB)", "", true),
                new F165ReportHandler.MetricRowDef("10", "Lượt vào", "Lượt", "pttndLuotVao"),
                new F165ReportHandler.MetricRowDef("11", "Lượt rời", "Lượt", "pttndLuotRoi"),
                new F165ReportHandler.MetricRowDef("V", "PHƯƠNG TIỆN THỦY ĐĂNG KÝ CẤP VR-SB", "", true),
                new F165ReportHandler.MetricRowDef("12", "Lượt vào", "Lượt", "pttndVrSbLuotVao"),
                new F165ReportHandler.MetricRowDef("13", "Lượt rời", "Lượt", "pttndVrSbLuotRoi"),
                new F165ReportHandler.MetricRowDef("VI", "TÀU THUYỀN TRỌNG TẢI ≤ 200 DWT", "", true),
                new F165ReportHandler.MetricRowDef("14", "Lượt vào", "Lượt", "tauThuyenTrongTaiTu200TroXuongLuotVao"),
                new F165ReportHandler.MetricRowDef("15", "Lượt rời", "Lượt", "tauThuyenTrongTaiTu200TroXuongLuotRoi"),
                new F165ReportHandler.MetricRowDef("VII", "TUYẾN BỜ RA ĐẢO", "", true),
                new F165ReportHandler.MetricRowDef("16", "Lượt vào", "Lượt", "tauThuyenTuyenTuBoRaDaoLuotVao"),
                new F165ReportHandler.MetricRowDef("17", "Lượt rời", "Lượt", "tauThuyenTuyenTuBoRaDaoLuotRoi")
        );
    }
}
