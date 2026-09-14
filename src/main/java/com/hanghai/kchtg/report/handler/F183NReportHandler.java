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
 * Handler cho báo cáo F-183N (BCDL_183N) — Biểu 14-T: Khối lượng hàng hóa, hành khách, lượt tàu qua cảng biển bằng đội tàu VN theo ngày.
 */
@Component
public class F183NReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    @Override
    public boolean supports(String reportCode) {
        return "F-183N".equalsIgnoreCase(reportCode) || "BCDL_183N".equalsIgnoreCase(reportCode);
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
        Map<String, BigDecimal> mPeriod = computeFleetMetrics(shipsPeriod, boatsPeriod);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        Map<String, BigDecimal> mLastYear = computeFleetMetrics(shipsLastYear, boatsLastYear);

        List<String> headers = List.of(
                "STT", "Chỉ tiêu", "Đơn vị tính",
                "Khối lượng kỳ lựa chọn", "Khối lượng cùng kỳ năm trước",
                "So sánh cùng kỳ năm trước (%)"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        List<F165ReportHandler.MetricRowDef> defs = F168ReportHandler.getFleetMetricDefinitions();
        int stt = 1;

        for (F165ReportHandler.MetricRowDef def : defs) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", def.isGroupHeader ? def.code : String.valueOf(stt++));
            r.put("Chỉ tiêu", def.title);
            r.put("Đơn vị tính", def.unit);

            if (def.isGroupHeader) {
                r.put("Khối lượng kỳ lựa chọn", "");
                r.put("Khối lượng cùng kỳ năm trước", "");
                r.put("So sánh cùng kỳ năm trước (%)", "");
            } else {
                BigDecimal periodVal = mPeriod.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal lastYearVal = mLastYear.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal percentage = BcdlAggregationService.calcPercentage(periodVal, lastYearVal);

                r.put("Khối lượng kỳ lựa chọn", periodVal);
                r.put("Khối lượng cùng kỳ năm trước", lastYearVal);
                r.put("So sánh cùng kỳ năm trước (%)", lastYearVal.compareTo(BigDecimal.ZERO) == 0 ? "—" : percentage.toPlainString() + "%");
            }
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Hàng xuất khẩu kỳ lựa chọn (Tấn)", mPeriod.getOrDefault("hangXuatKhau", BigDecimal.ZERO));
        summary.put("Hàng nhập khẩu kỳ lựa chọn (Tấn)", mPeriod.getOrDefault("hangNhapKhau", BigDecimal.ZERO));
        summary.put("Hàng nội địa kỳ lựa chọn (Tấn)", mPeriod.getOrDefault("hangNoiDia", BigDecimal.ZERO));
        summary.put("Tổng hành khách kỳ lựa chọn (Lượt)", mPeriod.getOrDefault("hanhKhach", BigDecimal.ZERO));

        return buildPreviewResponse("F-183N", headers, rows, summary);
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
        Map<String, BigDecimal> mPeriod = computeFleetMetrics(shipsPeriod, boatsPeriod);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        Map<String, BigDecimal> mLastYear = computeFleetMetrics(shipsLastYear, boatsLastYear);

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("hangXuatKhauKyLuaChon", mPeriod.getOrDefault("hangXuatKhau", BigDecimal.ZERO));
        row.put("hangXuatKhauCungKyNamTruoc", mLastYear.getOrDefault("hangXuatKhau", BigDecimal.ZERO));
        row.put("hangNhapKhauKyLuaChon", mPeriod.getOrDefault("hangNhapKhau", BigDecimal.ZERO));
        row.put("hangNhapKhauCungKyNamTruoc", mLastYear.getOrDefault("hangNhapKhau", BigDecimal.ZERO));
        row.put("hangNoiDiaKyLuaChon", mPeriod.getOrDefault("hangNoiDia", BigDecimal.ZERO));
        row.put("hangNoiDiaCungKyNamTruoc", mLastYear.getOrDefault("hangNoiDia", BigDecimal.ZERO));
        row.put("hangContainerTeusKyLuaChon", mPeriod.getOrDefault("hangContainerTeus", BigDecimal.ZERO));
        row.put("hangContainerTeusCungKyNamTruoc", mLastYear.getOrDefault("hangContainerTeus", BigDecimal.ZERO));
        row.put("hangContainerTanKyLuaChon", mPeriod.getOrDefault("hangContainerTan", BigDecimal.ZERO));
        row.put("hangContainerTanCungKyNamTruoc", mLastYear.getOrDefault("hangContainerTan", BigDecimal.ZERO));
        row.put("hangLongGaKyLuaChon", mPeriod.getOrDefault("hangLongGa", BigDecimal.ZERO));
        row.put("hangLongGaCungKyNamTruoc", mLastYear.getOrDefault("hangLongGa", BigDecimal.ZERO));
        row.put("hangKhoBachHoaKyLuaChon", mPeriod.getOrDefault("hangKhoBachHoa", BigDecimal.ZERO));
        row.put("hangKhoBachHoaCungKyNamTruoc", mLastYear.getOrDefault("hangKhoBachHoa", BigDecimal.ZERO));

        row.put("hangTndContainerTeusKyLuaChon", mPeriod.getOrDefault("pttndHangContainerTeus", BigDecimal.ZERO));
        row.put("hangTndContainerTeusCungKyNamTruoc", mLastYear.getOrDefault("pttndHangContainerTeus", BigDecimal.ZERO));
        row.put("hangTndContainerTanKyLuaChon", mPeriod.getOrDefault("pttndHangContainerTan", BigDecimal.ZERO));
        row.put("hangTndContainerTanCungKyNamTruoc", mLastYear.getOrDefault("pttndHangContainerTan", BigDecimal.ZERO));
        row.put("hangTndLongGaKyLuaChon", mPeriod.getOrDefault("pttndHangLongGa", BigDecimal.ZERO));
        row.put("hangTndLongGaCungKyNamTruoc", mLastYear.getOrDefault("pttndHangLongGa", BigDecimal.ZERO));
        row.put("hangTndKhoBachHoaKyLuaChon", mPeriod.getOrDefault("pttndHangKhoBachHoa", BigDecimal.ZERO));
        row.put("hangTndKhoBachHoaCungKyNamTruoc", mLastYear.getOrDefault("pttndHangKhoBachHoa", BigDecimal.ZERO));

        return List.of(row);
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
}
