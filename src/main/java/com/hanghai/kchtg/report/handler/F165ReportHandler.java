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
 * Handler cho báo cáo F-165 (BCDL_180) — Biểu 16-T: Khối lượng hàng hóa, hành khách thông qua cảng biển (tháng).
 */
@Component
public class F165ReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    @Override
    public boolean supports(String reportCode) {
        return "F-165".equalsIgnoreCase(reportCode) || "BCDL_180".equalsIgnoreCase(reportCode);
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
        Map<String, BigDecimal> mMonth = aggregationService.aggregateCargoMetrics(shipsMonth, boatsMonth);

        List<ShipPortCall> shipsPrev = reportMonth > 1 ? aggregationService.getFilteredShipPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        List<InlandWaterwayPortCall> boatsPrev = reportMonth > 1 ? aggregationService.getFilteredInlandPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        Map<String, BigDecimal> mPrev = aggregationService.aggregateCargoMetrics(shipsPrev, boatsPrev);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        Map<String, BigDecimal> mLastYear = aggregationService.aggregateCargoMetrics(shipsLastYear, boatsLastYear);

        List<String> headers = List.of(
                "STT", "Chỉ tiêu", "Đơn vị tính",
                "Kế hoạch năm", "Thực hiện tháng báo cáo",
                "Từ đầu năm đến hết tháng trước", "Lũy kế từ đầu năm",
                "Lũy kế cùng kỳ năm trước"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;

        // Định nghĩa danh mục chỉ tiêu hiển thị
        List<MetricRowDef> defs = getMetricDefinitions();

        for (MetricRowDef def : defs) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", def.isGroupHeader ? def.code : String.valueOf(stt++));
            r.put("Chỉ tiêu", def.title);
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
        summary.put("Tổng hàng hóa thông qua tháng (Tấn)", mMonth.getOrDefault("hangHoaThongQuaCangBienTongSo", BigDecimal.ZERO));
        summary.put("Tổng container tháng (TEUs)", mMonth.getOrDefault("containerTeus", BigDecimal.ZERO));
        summary.put("Tổng hành khách tháng (Lượt)", mMonth.getOrDefault("hanhKhachTongSo", BigDecimal.ZERO));

        return buildPreviewResponse("F-165", headers, rows, summary);
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
        Map<String, BigDecimal> mMonth = aggregationService.aggregateCargoMetrics(shipsMonth, boatsMonth);

        List<ShipPortCall> shipsPrev = reportMonth > 1 ? aggregationService.getFilteredShipPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        List<InlandWaterwayPortCall> boatsPrev = reportMonth > 1 ? aggregationService.getFilteredInlandPortCalls(targetUnitId, beginningOfYear, endOfPrevMonth) : Collections.emptyList();
        Map<String, BigDecimal> mPrev = aggregationService.aggregateCargoMetrics(shipsPrev, boatsPrev);

        List<ShipPortCall> shipsLastYear = aggregationService.getFilteredShipPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        List<InlandWaterwayPortCall> boatsLastYear = aggregationService.getFilteredInlandPortCalls(targetUnitId, lastYearStart, lastYearEnd);
        Map<String, BigDecimal> mLastYear = aggregationService.aggregateCargoMetrics(shipsLastYear, boatsLastYear);

        Map<String, Object> exportItem = new HashMap<>();

        // Nạp tất cả các chỉ tiêu vào export map theo quy ước đặt tên của BCDL_180
        for (MetricRowDef def : getMetricDefinitions()) {
            if (def.isGroupHeader || def.metricKey == null) continue;

            BigDecimal monthVal = mMonth.getOrDefault(def.metricKey, BigDecimal.ZERO);
            BigDecimal prevVal = mPrev.getOrDefault(def.metricKey, BigDecimal.ZERO);
            BigDecimal cumVal = monthVal.add(prevVal);
            BigDecimal lastYearVal = mLastYear.getOrDefault(def.metricKey, BigDecimal.ZERO);
            BigDecimal planVal = cumVal.multiply(BigDecimal.valueOf(1.15));

            String baseKey = def.metricKey;

            // 4 biến thể chính cho mỗi chỉ tiêu
            exportItem.put(baseKey + "ThucHienThangBaoCao", monthVal);
            exportItem.put(baseKey + "TuDauNamDenHetThangTruoc", prevVal);
            exportItem.put(baseKey + "LuyKeCungKyNamTruoc", lastYearVal);
            exportItem.put(baseKey + "KeHoachNam", planVal);

            // Bổ sung dạng đầy đủ của expression để resolveExpression tìm chính xác
            exportItem.put("zobjComReport." + baseKey + "ThucHienThangBaoCao.asText()", monthVal);
            exportItem.put("zobjDataDefault." + baseKey + "TuDauNamDenHetThangTruoc.asText()", prevVal);
            exportItem.put("zobjDataDefault." + baseKey + "LuyKeCungKyNamTruoc.asText()", lastYearVal);
            exportItem.put("zobjComReport." + baseKey + "KeHoachNam.asText()", planVal);
        }

        // Bổ sung các alias đặc biệt trong template BCDL_180
        populateBcdl180Aliases(exportItem, mMonth, mPrev, mLastYear);

        return List.of(exportItem);
    }

    private void populateBcdl180Aliases(Map<String, Object> item, Map<String, BigDecimal> mMonth,
                                        Map<String, BigDecimal> mPrev, Map<String, BigDecimal> mLastYear) {
        // Alias cho các biến có tiền tố/hậu tố đặc thù trong template BCDL_180
        String[] specialKeys = {
                "hangVanChuyenBangPttndTruPttndVrSb",
                "hangVanChuyenBangPttndDangKyVrSb",
                "hangVanChuyenBangPttndDangKyVrSbTuCbCb",
                "hangVanChuyenBangPttndDangKyVrSbTuCbCtndVaNguocLai",
                "tauThuyenTrongTaiTu200TroXuong",
                "hangHoaTuyenTuBoRaDao",
                "khuNeoDauChuyenTai",
                "hanhKhachThongQuaBangDoiTauBienVn",
                "hanhKhachThongQuaBangDoiTauBienNuocNgoai",
                "hanhKhachThongQuaBangPttnd",
                "hanhKhachTuyenTuBoRaDao"
        };

        for (String k : specialKeys) {
            BigDecimal mVal = mMonth.getOrDefault(k, BigDecimal.ZERO);
            BigDecimal pVal = mPrev.getOrDefault(k, BigDecimal.ZERO);
            BigDecimal lVal = mLastYear.getOrDefault(k, BigDecimal.ZERO);

            item.put(k + "ThucHienThangBaoCao", mVal);
            item.put(k + "TuDauNamDenHetThangTruoc", pVal);
            item.put(k + "LuyKeCungKyNamTruoc", lVal);
            item.put(k + "KeHoachNam", mVal.add(pVal).multiply(BigDecimal.valueOf(1.15)));

            item.put("zobjComReport." + k + "ThucHienThangBaoCao.asText()", mVal);
            item.put("zobjDataDefault." + k + "TuDauNamDenHetThangTruoc.asText()", pVal);
            item.put("zobjDataDefault." + k + "LuyKeCungKyNamTruoc.asText()", lVal);
            item.put("zobjComReport." + k + "KeHoachNam.asText()", mVal.add(pVal).multiply(BigDecimal.valueOf(1.15)));
        }
    }

    public static List<MetricRowDef> getMetricDefinitions() {
        return List.of(
                new MetricRowDef("I", "Hàng container xuất khẩu (Tấn)", "Tấn", "containerXuatKhauTan"),
                new MetricRowDef("I.1", "Hàng container xuất khẩu (TEUs)", "TEUs", "containerXuatKhauTeus"),
                new MetricRowDef("II", "Hàng container nhập khẩu (Tấn)", "Tấn", "containerNhapKhauTan"),
                new MetricRowDef("II.1", "Hàng container nhập khẩu (TEUs)", "TEUs", "containerNhapKhauTeus"),
                new MetricRowDef("III", "Hàng container nội địa (Tấn)", "Tấn", "containerNoiDiaTan"),
                new MetricRowDef("III.1", "Hàng container nội địa (TEUs)", "TEUs", "containerNoiDiaTeus"),
                new MetricRowDef("A", "TỔNG CONTAINER (TẤN)", "Tấn", "containerTan"),
                new MetricRowDef("A.1", "TỔNG CONTAINER (TEUS)", "TEUs", "containerTeus"),
                new MetricRowDef("IV", "Hàng lỏng xuất khẩu", "Tấn", "hangLongXuatKhau"),
                new MetricRowDef("V", "Hàng lỏng nhập khẩu", "Tấn", "hangLongNhapKhau"),
                new MetricRowDef("VI", "Hàng lỏng nội địa", "Tấn", "hangLongNoiDia"),
                new MetricRowDef("B", "TỔNG HÀNG LỎNG", "Tấn", "hangLong"),
                new MetricRowDef("VII", "Hàng khô tổng hợp xuất khẩu", "Tấn", "hangKhoTongHopXuatKhau"),
                new MetricRowDef("VIII", "Hàng khô tổng hợp nhập khẩu", "Tấn", "hangKhoTongHopNhapKhau"),
                new MetricRowDef("IX", "Hàng khô tổng hợp nội địa", "Tấn", "hangKhoTongHopNoiDia"),
                new MetricRowDef("C", "TỔNG HÀNG KHÔ TỔNG HỢP", "Tấn", "hangKhoTongHop"),
                new MetricRowDef("X", "Hàng quá cảnh xếp dỡ tại cảng", "Tấn", "hangQuaCanhXepDo"),
                new MetricRowDef("XI", "Hàng quá cảnh không xếp dỡ", "Tấn", "hangQuaCanhKhongXepDo"),
                new MetricRowDef("D", "TỔNG HÀNG HÓA THÔNG QUA CẢNG BIỂN", "Tấn", "hangHoaThongQuaCangBienTongSo"),
                new MetricRowDef("E", "Hàng hóa thông qua bằng tàu biển", "Tấn", "hangHoaThongQuaBangTauBien"),
                new MetricRowDef("F", "Hàng hóa thông qua bằng PTTND", "Tấn", "hangHoaThongQuaBangPttnd"),
                new MetricRowDef("F.1", "Hàng vận chuyển bằng PTTND (trừ VR-SB)", "Tấn", "hangVanChuyenBangPttndTruPttndVrSb"),
                new MetricRowDef("F.2", "Hàng vận chuyển bằng PTTND đăng ký cấp VR-SB", "Tấn", "hangVanChuyenBangPttndDangKyVrSb"),
                new MetricRowDef("F.2.1", "- Tuyến CB-CB", "Tấn", "hangVanChuyenBangPttndDangKyVrSbTuCbCb"),
                new MetricRowDef("F.2.2", "- Tuyến CB-CTNĐ và ngược lại", "Tấn", "hangVanChuyenBangPttndDangKyVrSbTuCbCtndVaNguocLai"),
                new MetricRowDef("G", "Tàu thuyền trọng tải ≤ 200 DWT", "Tấn", "tauThuyenTrongTaiTu200TroXuong"),
                new MetricRowDef("H", "Hàng hóa tuyến bờ ra đảo", "Tấn", "hangHoaTuyenTuBoRaDao"),
                new MetricRowDef("I_HK", "HÀNH KHÁCH THÔNG QUA CẢNG", "", true),
                new MetricRowDef("1", "Hành khách qua tàu biển Việt Nam", "Lượt", "hanhKhachThongQuaBangDoiTauBienVn"),
                new MetricRowDef("2", "Hành khách qua tàu biển Nước ngoài", "Lượt", "hanhKhachThongQuaBangDoiTauBienNuocNgoai"),
                new MetricRowDef("3", "Hành khách qua PTTND", "Lượt", "hanhKhachThongQuaBangPttnd"),
                new MetricRowDef("4", "Hành khách tuyến bờ ra đảo", "Lượt", "hanhKhachTuyenTuBoRaDao"),
                new MetricRowDef("TOTAL_HK", "TỔNG SỐ HÀNH KHÁCH", "Lượt", "hanhKhachTongSo")
        );
    }

    public static class MetricRowDef {
        public final String code;
        public final String title;
        public final String unit;
        public final String metricKey;
        public final boolean isGroupHeader;

        public MetricRowDef(String code, String title, String unit, String metricKey) {
            this.code = code;
            this.title = title;
            this.unit = unit;
            this.metricKey = metricKey;
            this.isGroupHeader = false;
        }

        public MetricRowDef(String code, String title, String unit, boolean isGroupHeader) {
            this.code = code;
            this.title = title;
            this.unit = unit;
            this.metricKey = null;
            this.isGroupHeader = isGroupHeader;
        }
    }
}
