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
 * Handler cho báo cáo F-180N (BCDL_180N) — Biểu 12-T: Khối lượng hàng hóa, hành khách thông qua cảng biển theo ngày.
 */
@Component
public class F180NReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    @Override
    public boolean supports(String reportCode) {
        return "F-180N".equalsIgnoreCase(reportCode) || "BCDL_180N".equalsIgnoreCase(reportCode);
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
        Map<String, BigDecimal> mPeriod = aggregationService.aggregateCargoMetrics(shipsPeriod, boatsPeriod);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        Map<String, BigDecimal> mLastYear = aggregationService.aggregateCargoMetrics(shipsLastYear, boatsLastYear);

        List<String> headers = List.of(
                "STT", "Chỉ tiêu", "Đơn vị tính",
                "Khối lượng kỳ lựa chọn", "Khối lượng cùng kỳ năm trước",
                "So với cùng kỳ (%)"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        List<F165ReportHandler.MetricRowDef> defs = F165ReportHandler.getMetricDefinitions();
        int stt = 1;

        for (F165ReportHandler.MetricRowDef def : defs) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", def.isGroupHeader ? def.code : String.valueOf(stt++));
            r.put("Chỉ tiêu", def.title);
            r.put("Đơn vị tính", def.unit);

            if (def.isGroupHeader) {
                r.put("Khối lượng kỳ lựa chọn", "");
                r.put("Khối lượng cùng kỳ năm trước", "");
                r.put("So với cùng kỳ (%)", "");
            } else {
                BigDecimal periodVal = mPeriod.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal lastYearVal = mLastYear.getOrDefault(def.metricKey, BigDecimal.ZERO);
                BigDecimal percentage = BcdlAggregationService.calcPercentage(periodVal, lastYearVal);

                r.put("Khối lượng kỳ lựa chọn", periodVal);
                r.put("Khối lượng cùng kỳ năm trước", lastYearVal);
                r.put("So với cùng kỳ (%)", lastYearVal.compareTo(BigDecimal.ZERO) == 0 ? "—" : percentage.toPlainString() + "%");
            }
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng hàng hóa kỳ lựa chọn (Tấn)", mPeriod.getOrDefault("hangHoaThongQuaCangBienTongSo", BigDecimal.ZERO));
        summary.put("Tổng container kỳ lựa chọn (TEUs)", mPeriod.getOrDefault("containerTeus", BigDecimal.ZERO));
        summary.put("Tổng hành khách kỳ lựa chọn (Lượt)", mPeriod.getOrDefault("hanhKhachTongSo", BigDecimal.ZERO));

        return buildPreviewResponse("F-180N", headers, rows, summary);
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
        Map<String, BigDecimal> mPeriod = aggregationService.aggregateCargoMetrics(shipsPeriod, boatsPeriod);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearFrom, lastYearTo);
        Map<String, BigDecimal> mLastYear = aggregationService.aggregateCargoMetrics(shipsLastYear, boatsLastYear);

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("hangHoaTongSoKyLuaChon", mPeriod.getOrDefault("hangHoaThongQuaCangBienTongSo", BigDecimal.ZERO));
        row.put("hangHoaTongSoCungKyNamTruoc", mLastYear.getOrDefault("hangHoaThongQuaCangBienTongSo", BigDecimal.ZERO));
        row.put("containerXuatKhauTanKyLuaChon", mPeriod.getOrDefault("containerXuatKhauTan", BigDecimal.ZERO));
        row.put("containerXuatKhauTanCungKyNamTruoc", mLastYear.getOrDefault("containerXuatKhauTan", BigDecimal.ZERO));
        row.put("containerNhapKhauTanKyLuaChon", mPeriod.getOrDefault("containerNhapKhauTan", BigDecimal.ZERO));
        row.put("containerNhapKhauTanCungKyNamTruoc", mLastYear.getOrDefault("containerNhapKhauTan", BigDecimal.ZERO));
        row.put("containerNoiDiaTanKyLuaChon", mPeriod.getOrDefault("containerNoiDiaTan", BigDecimal.ZERO));
        row.put("containerNoiDiaTanCungKyNamTruoc", mLastYear.getOrDefault("containerNoiDiaTan", BigDecimal.ZERO));
        row.put("containerTongSoTeusKyLuaChon", mPeriod.getOrDefault("containerTeus", BigDecimal.ZERO));
        row.put("containerTongSoTeusCungKyNamTruoc", mLastYear.getOrDefault("containerTeus", BigDecimal.ZERO));
        row.put("hangKhoTongHopKyLuaChon", mPeriod.getOrDefault("hangKhoTongHop", BigDecimal.ZERO));
        row.put("hangKhoTongHopCungKyNamTruoc", mLastYear.getOrDefault("hangKhoTongHop", BigDecimal.ZERO));
        row.put("hangLongKyLuaChon", mPeriod.getOrDefault("hangLong", BigDecimal.ZERO));
        row.put("hangLongCungKyNamTruoc", mLastYear.getOrDefault("hangLong", BigDecimal.ZERO));
        row.put("hangQuaCanhXepDoKyLuaChon", mPeriod.getOrDefault("hangQuaCanhXepDo", BigDecimal.ZERO));
        row.put("hangQuaCanhXepDoCungKyNamTruoc", mLastYear.getOrDefault("hangQuaCanhXepDo", BigDecimal.ZERO));
        row.put("hangHoaThongQuaBangTauBienKyLuaChon", mPeriod.getOrDefault("hangHoaThongQuaBangTauBien", BigDecimal.ZERO));
        row.put("hangHoaThongQuaBangTauBienCungKyNamTruoc", mLastYear.getOrDefault("hangHoaThongQuaBangTauBien", BigDecimal.ZERO));
        row.put("hangVanChuyenBangPttndTruPttndVrSbKyLuaChon", mPeriod.getOrDefault("hangVanChuyenBangPttndTruVrSb", BigDecimal.ZERO));
        row.put("hangVanChuyenBangPttndTruPttndVrSbCungKyNamTruoc", mLastYear.getOrDefault("hangVanChuyenBangPttndTruVrSb", BigDecimal.ZERO));
        row.put("hangVanChuyenBangPttndDangKyVrSbTuCbCbKyLuaChon", mPeriod.getOrDefault("hangVanChuyenPttndVrSbCbCb", BigDecimal.ZERO));
        row.put("hangVanChuyenBangPttndDangKyVrSbTuCbCbCungKyNamTruoc", mLastYear.getOrDefault("hangVanChuyenPttndVrSbCbCb", BigDecimal.ZERO));
        row.put("hangVanChuyenBangPttndDangKyVrSbTuCbCtndVaNguocLaiKyLuaChon", mPeriod.getOrDefault("hangVanChuyenPttndVrSbCbCtnd", BigDecimal.ZERO));
        row.put("hangVanChuyenBangPttndDangKyVrSbTuCbCtndVaNguocLaiCungKyNamTruoc", mLastYear.getOrDefault("hangVanChuyenPttndVrSbCbCtnd", BigDecimal.ZERO));
        row.put("hangHoaTauThuyenTrongTaiDuoi200Tan", mPeriod.getOrDefault("hangHoaTauDuoi200Tan", BigDecimal.ZERO));
        row.put("hangHoaTauThuyenTrongTaiDuoi200TanCungKyNamTruoc", mLastYear.getOrDefault("hangHoaTauDuoi200Tan", BigDecimal.ZERO));
        row.put("hangQuaCanhKhongXepDoKyLuaChon", mPeriod.getOrDefault("hangQuaCanhKhongXepDo", BigDecimal.ZERO));
        row.put("hangQuaCanhKhongXepDoCungKyNamTruoc", mLastYear.getOrDefault("hangQuaCanhKhongXepDo", BigDecimal.ZERO));
        row.put("hangHoaTuyenTuBoRaDaoKyLuaChon", mPeriod.getOrDefault("hangHoaTuyenBoRaDao", BigDecimal.ZERO));
        row.put("hangHoaTuyenTuBoRaDaoCungKyNamTruoc", mLastYear.getOrDefault("hangHoaTuyenBoRaDao", BigDecimal.ZERO));
        row.put("hangKhuChuyenTaiBenPhaoKyLuaChon", mPeriod.getOrDefault("hangKhuChuyenTaiBenPhao", BigDecimal.ZERO));
        row.put("hangKhuChuyenTaiBenPhaoCungKyNamTruoc", mLastYear.getOrDefault("hangKhuChuyenTaiBenPhao", BigDecimal.ZERO));
        row.put("hanhKhachThongQuaBangDoiTauBienVnKyLuaChon", mPeriod.getOrDefault("hanhKhachTauBienVn", BigDecimal.ZERO));
        row.put("hanhKhachThongQuaBangDoiTauBienVnCungKyNamTruoc", mLastYear.getOrDefault("hanhKhachTauBienVn", BigDecimal.ZERO));
        row.put("hanhKhachThongQuaBangDoiTauBienNuocNgoaiKyLuaChon", mPeriod.getOrDefault("hanhKhachTauBienNn", BigDecimal.ZERO));
        row.put("hanhKhachThongQuaBangDoiTauBienNuocNgoaiCungKyNamTruoc", mLastYear.getOrDefault("hanhKhachTauBienNn", BigDecimal.ZERO));
        row.put("hanhKhachThongQuaBangPttndKyLuaChon", mPeriod.getOrDefault("hanhKhachPttnd", BigDecimal.ZERO));
        row.put("hanhKhachThongQuaBangPttndCungKyNamTruoc", mLastYear.getOrDefault("hanhKhachPttnd", BigDecimal.ZERO));
        row.put("hanhKhachTuyenTuBoRaDaoKyLuaChon", mPeriod.getOrDefault("hanhKhachTuyenBoRaDao", BigDecimal.ZERO));
        row.put("hanhKhachTuyenTuBoRaDaoCungKyNamTruoc", mLastYear.getOrDefault("hanhKhachTuyenBoRaDao", BigDecimal.ZERO));

        return List.of(row);
    }
}
