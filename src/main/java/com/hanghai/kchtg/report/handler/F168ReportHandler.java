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
 * Handler cho báo cáo F-168 (BCDL_183) — Biểu 19-T: Khối lượng hàng hóa bằng đội tàu biển VN & PTTND (tháng).
 */
@Component
public class F168ReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    @Override
    public boolean supports(String reportCode) {
        return "F-168".equalsIgnoreCase(reportCode) || "BCDL_183".equalsIgnoreCase(reportCode);
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
        Map<String, BigDecimal> mMonth = computeFleetMetrics(shipsMonth, boatsMonth);

        List<ShipPortCall> shipsPrev = reportMonth > 1 ? aggregationService.getFilteredShipPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        List<InlandWaterwayPortCall> boatsPrev = reportMonth > 1 ? aggregationService.getFilteredInlandPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        Map<String, BigDecimal> mPrev = computeFleetMetrics(shipsPrev, boatsPrev);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        Map<String, BigDecimal> mLastYear = computeFleetMetrics(shipsLastYear, boatsLastYear);

        List<String> headers = List.of(
                "STT", "Chỉ tiêu", "Đơn vị tính",
                "Thực hiện tháng báo cáo",
                "Từ đầu năm đến hết tháng trước",
                "Lũy kế cùng kỳ năm trước"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        List<F165ReportHandler.MetricRowDef> defs = getFleetMetricDefinitions();
        int stt = 1;

        for (F165ReportHandler.MetricRowDef def : defs) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", def.isGroupHeader ? def.code : String.valueOf(stt++));
            r.put("Chỉ tiêu", def.title);
            r.put("Đơn vị tính", def.unit);

            if (def.isGroupHeader) {
                r.put("Thực hiện tháng báo cáo", "");
                r.put("Từ đầu năm đến hết tháng trước", "");
                r.put("Lũy kế cùng kỳ năm trước", "");
            } else {
                BigDecimal monthVal = mMonth.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal prevVal = mPrev.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal lastYearVal = mLastYear.getOrDefault(def.metricKey, BigDecimal.ZERO);

                r.put("Thực hiện tháng báo cáo", monthVal);
                r.put("Từ đầu năm đến hết tháng trước", prevVal);
                r.put("Lũy kế cùng kỳ năm trước", lastYearVal);
            }
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Hàng xuất khẩu (Tấn)", mMonth.getOrDefault("hangXuatKhau", BigDecimal.ZERO));
        summary.put("Hàng nhập khẩu (Tấn)", mMonth.getOrDefault("hangNhapKhau", BigDecimal.ZERO));
        summary.put("Hàng nội địa (Tấn)", mMonth.getOrDefault("hangNoiDia", BigDecimal.ZERO));
        summary.put("Tổng hành khách (Lượt)", mMonth.getOrDefault("hanhKhach", BigDecimal.ZERO));

        return buildPreviewResponse("F-168", headers, rows, summary);
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
        Map<String, BigDecimal> mMonth = computeFleetMetrics(shipsMonth, boatsMonth);

        List<ShipPortCall> shipsPrev = reportMonth > 1 ? aggregationService.getFilteredShipPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        List<InlandWaterwayPortCall> boatsPrev = reportMonth > 1 ? aggregationService.getFilteredInlandPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        Map<String, BigDecimal> mPrev = computeFleetMetrics(shipsPrev, boatsPrev);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        Map<String, BigDecimal> mLastYear = computeFleetMetrics(shipsLastYear, boatsLastYear);

        Map<String, Object> exportItem = new HashMap<>();

        for (F165ReportHandler.MetricRowDef def : getFleetMetricDefinitions()) {
            if (def.isGroupHeader || def.metricKey == null) continue;

            String key = def.metricKey;
            BigDecimal mVal = mMonth.getOrDefault(key, BigDecimal.ZERO);
            BigDecimal pVal = mPrev.getOrDefault(key, BigDecimal.ZERO);
            BigDecimal lVal = mLastYear.getOrDefault(key, BigDecimal.ZERO);

            exportItem.put(key + "ThucHienThangBaoCao", mVal);
            exportItem.put(key + "TuDauNamDenHetThangTruoc", pVal);
            exportItem.put(key + "LuyKeCungKyNamTruoc", lVal);

            exportItem.put("zobjComReport." + key + "ThucHienThangBaoCao.asText()", mVal);
            exportItem.put("zobjDataDefault." + key + "TuDauNamDenHetThangTruoc.asText()", pVal);
            exportItem.put("zobjDataDefault." + key + "LuyKeCungKyNamTruoc.asText()", lVal);
        }

        return List.of(exportItem);
    }

    private Map<String, BigDecimal> computeFleetMetrics(List<ShipPortCall> ships, List<InlandWaterwayPortCall> boats) {
        Map<String, BigDecimal> m = new HashMap<>();

        BigDecimal pttndContTeus = BigDecimal.ZERO;
        BigDecimal pttndContTan = BigDecimal.ZERO;
        BigDecimal pttndLongGa = BigDecimal.ZERO;
        BigDecimal pttndKhoBachHoa = BigDecimal.ZERO;

        for (InlandWaterwayPortCall b : boats) {
            BigDecimal expTan = aggregationService.defaultZero(b.getExportTons());
            BigDecimal impTan = aggregationService.defaultZero(b.getImportTons());
            BigDecimal domInTan = aggregationService.defaultZero(b.getDomesticInTons());
            BigDecimal domOutTan = aggregationService.defaultZero(b.getDomesticOutTons());
            BigDecimal totalTan = expTan.add(impTan).add(domInTan).add(domOutTan);

            BigDecimal expTeus = aggregationService.defaultZero(b.getExportTeus());
            BigDecimal impTeus = aggregationService.defaultZero(b.getImportTeus());
            BigDecimal domInTeus = aggregationService.defaultZero(b.getDomesticInTeus());
            BigDecimal domOutTeus = aggregationService.defaultZero(b.getDomesticOutTeus());
            BigDecimal totalTeus = expTeus.add(impTeus).add(domInTeus).add(domOutTeus);

            String cargoType = b.getCargoType() != null ? b.getCargoType().trim().toUpperCase(Locale.ROOT) : "";
            if (cargoType.contains("CONTAINER") || totalTeus.compareTo(BigDecimal.ZERO) > 0) {
                pttndContTan = pttndContTan.add(totalTan);
                pttndContTeus = pttndContTeus.add(totalTeus);
            } else if (cargoType.contains("LỎNG") || cargoType.contains("GA") || cargoType.contains("XĂNG") || cargoType.contains("DẦU")) {
                pttndLongGa = pttndLongGa.add(totalTan);
            } else {
                pttndKhoBachHoa = pttndKhoBachHoa.add(totalTan);
            }
        }

        m.put("pttndHangContainerTeus", pttndContTeus);
        m.put("pttndHangContainerTan", pttndContTan);
        m.put("pttndHangLongGa", pttndLongGa);
        m.put("pttndHangKhoBachHoa", pttndKhoBachHoa);

        BigDecimal vnXuatKhau = BigDecimal.ZERO;
        BigDecimal vnNhapKhau = BigDecimal.ZERO;
        BigDecimal vnNoiDia = BigDecimal.ZERO;
        BigDecimal vnContTeus = BigDecimal.ZERO;
        BigDecimal vnContTan = BigDecimal.ZERO;
        BigDecimal vnLongGa = BigDecimal.ZERO;
        BigDecimal vnKhoBachHoa = BigDecimal.ZERO;
        BigDecimal vnTrungChuyen = BigDecimal.ZERO;
        long totalPassengers = 0;

        for (ShipPortCall s : ships) {
            if (aggregationService.isForeignShip(s)) continue; // chỉ tính đội tàu Việt Nam

            BigDecimal expTan = aggregationService.defaultZero(s.getExportTons());
            BigDecimal impTan = aggregationService.defaultZero(s.getImportTons());
            BigDecimal domInTan = aggregationService.defaultZero(s.getDomesticInTons());
            BigDecimal domOutTan = aggregationService.defaultZero(s.getDomesticOutTons());
            BigDecimal transTan = aggregationService.defaultZero(s.getTransshipmentTons());

            vnXuatKhau = vnXuatKhau.add(expTan);
            vnNhapKhau = vnNhapKhau.add(impTan);
            vnNoiDia = vnNoiDia.add(domInTan).add(domOutTan);
            vnTrungChuyen = vnTrungChuyen.add(transTan);

            BigDecimal expTeus = aggregationService.defaultZero(s.getExportTeus());
            BigDecimal impTeus = aggregationService.defaultZero(s.getImportTeus());
            BigDecimal domInTeus = aggregationService.defaultZero(s.getDomesticInTeus());
            BigDecimal domOutTeus = aggregationService.defaultZero(s.getDomesticOutTeus());

            BigDecimal shipContTeus = expTeus.add(impTeus).add(domInTeus).add(domOutTeus);
            BigDecimal shipTotalTan = expTan.add(impTan).add(domInTan).add(domOutTan).add(transTan);

            String cargoType = s.getCargoType() != null ? s.getCargoType().trim().toUpperCase(Locale.ROOT) : "";
            if (cargoType.contains("CONTAINER") || shipContTeus.compareTo(BigDecimal.ZERO) > 0) {
                vnContTan = vnContTan.add(shipTotalTan);
                vnContTeus = vnContTeus.add(shipContTeus);
            } else if (cargoType.contains("LỎNG") || cargoType.contains("GA") || cargoType.contains("XĂNG") || cargoType.contains("DẦU")) {
                vnLongGa = vnLongGa.add(shipTotalTan);
            } else {
                vnKhoBachHoa = vnKhoBachHoa.add(shipTotalTan);
            }

            totalPassengers += aggregationService.defaultZero(s.getPassengersArrival()) + aggregationService.defaultZero(s.getPassengersDeparture());
        }

        m.put("hangXuatKhau", vnXuatKhau);
        m.put("hangNhapKhau", vnNhapKhau);
        m.put("hangNoiDia", vnNoiDia);
        m.put("hangContainerTeus", vnContTeus);
        m.put("hangContainerTan", vnContTan);
        m.put("hangLongGa", vnLongGa);
        m.put("hangKhoBachHoa", vnKhoBachHoa);
        m.put("hangTrungChuyen", vnTrungChuyen);
        m.put("hanhKhach", BigDecimal.valueOf(totalPassengers));

        return m;
    }

    public static List<F165ReportHandler.MetricRowDef> getFleetMetricDefinitions() {
        return List.of(
                new F165ReportHandler.MetricRowDef("I", "VẬN CHUYỂN BẰNG PHƯƠNG TIỆN THỦY NỘI ĐỊA", "", true),
                new F165ReportHandler.MetricRowDef("1", "Hàng container (TEUs)", "TEUs", "pttndHangContainerTeus"),
                new F165ReportHandler.MetricRowDef("2", "Hàng container (Tấn)", "Tấn", "pttndHangContainerTan"),
                new F165ReportHandler.MetricRowDef("3", "Hàng lỏng, khí hóa lỏng", "Tấn", "pttndHangLongGa"),
                new F165ReportHandler.MetricRowDef("4", "Hàng khô, bách hóa", "Tấn", "pttndHangKhoBachHoa"),
                new F165ReportHandler.MetricRowDef("II", "VẬN CHUYỂN BẰNG ĐỘI TÀU BIỂN VIỆT NAM", "", true),
                new F165ReportHandler.MetricRowDef("5", "Hàng xuất khẩu", "Tấn", "hangXuatKhau"),
                new F165ReportHandler.MetricRowDef("6", "Hàng nhập khẩu", "Tấn", "hangNhapKhau"),
                new F165ReportHandler.MetricRowDef("7", "Hàng nội địa", "Tấn", "hangNoiDia"),
                new F165ReportHandler.MetricRowDef("8", "Hàng container (TEUs)", "TEUs", "hangContainerTeus"),
                new F165ReportHandler.MetricRowDef("9", "Hàng container (Tấn)", "Tấn", "hangContainerTan"),
                new F165ReportHandler.MetricRowDef("10", "Hàng lỏng, khí hóa lỏng", "Tấn", "hangLongGa"),
                new F165ReportHandler.MetricRowDef("11", "Hàng khô, bách hóa", "Tấn", "hangKhoBachHoa"),
                new F165ReportHandler.MetricRowDef("12", "Hàng trung chuyển", "Tấn", "hangTrungChuyen"),
                new F165ReportHandler.MetricRowDef("III", "HÀNH KHÁCH", "", true),
                new F165ReportHandler.MetricRowDef("13", "Hành khách vận chuyển", "Lượt", "hanhKhach")
        );
    }
}
