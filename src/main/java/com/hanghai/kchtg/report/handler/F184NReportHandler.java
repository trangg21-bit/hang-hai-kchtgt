package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.service.BcdlAggregationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Handler cho báo cáo F-184N (BCDL_184N) — Biểu 15-T: Khối lượng hàng hóa, hành khách qua cảng biển, bến cảng, khu chuyển tải theo ngày.
 */
@Component
public class F184NReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    @Override
    public boolean supports(String reportCode) {
        return "F-184N".equalsIgnoreCase(reportCode) || "BCDL_184N".equalsIgnoreCase(reportCode);
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

        List<Map<String, Object>> berthList = aggregationService.aggregateByPortBerth(targetUnitId, fromDate, toDate);

        List<String> headers = List.of(
                "STT", "Bến cảng / Khu chuyển tải", "Container (Tấn)", "Container (TEUs)",
                "Hàng khô, tổng hợp (Tấn)", "Hàng lỏng (Tấn)", "Hàng quá cảnh (Tấn)",
                "Tổng hàng hóa (Tấn)", "Lượt tàu biển", "Lượt PTTND", "Ghi chú"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        BigDecimal grandTotalTan = BigDecimal.ZERO;
        BigDecimal grandTotalTeus = BigDecimal.ZERO;
        BigDecimal grandTotalTauBien = BigDecimal.ZERO;
        BigDecimal grandTotalPttnd = BigDecimal.ZERO;

        for (Map<String, Object> item : berthList) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Bến cảng / Khu chuyển tải", item.getOrDefault("cangBen", ""));

            BigDecimal contTan = (BigDecimal) item.getOrDefault("containerTanThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal contTeus = (BigDecimal) item.getOrDefault("containerTeusThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal hangKho = (BigDecimal) item.getOrDefault("hangKhoTongHopThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal hangLong = (BigDecimal) item.getOrDefault("hangLongThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal hangQuaCanh = (BigDecimal) item.getOrDefault("hangQuaCanhXepDoThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal totalTan = (BigDecimal) item.getOrDefault("hangHoaTongSoThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal luotTau = (BigDecimal) item.getOrDefault("tauBienLuotThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal luotPttnd = (BigDecimal) item.getOrDefault("pttndLuotThucHienThangBaoCao", BigDecimal.ZERO);

            grandTotalTan = grandTotalTan.add(totalTan);
            grandTotalTeus = grandTotalTeus.add(contTeus);
            grandTotalTauBien = grandTotalTauBien.add(luotTau);
            grandTotalPttnd = grandTotalPttnd.add(luotPttnd);

            r.put("Container (Tấn)", contTan);
            r.put("Container (TEUs)", contTeus);
            r.put("Hàng khô, tổng hợp (Tấn)", hangKho);
            r.put("Hàng lỏng (Tấn)", hangLong);
            r.put("Hàng quá cảnh (Tấn)", hangQuaCanh);
            r.put("Tổng hàng hóa (Tấn)", totalTan);
            r.put("Lượt tàu biển", luotTau);
            r.put("Lượt PTTND", luotPttnd);
            r.put("Ghi chú", "");
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số bến cảng / khu vực", berthList.size());
        summary.put("Tổng hàng hóa thông qua kỳ (Tấn)", grandTotalTan);
        summary.put("Tổng container (TEUs)", grandTotalTeus);
        summary.put("Tổng lượt tàu biển", grandTotalTauBien);
        summary.put("Tổng lượt PTTND", grandTotalPttnd);

        return buildPreviewResponse("F-184N", headers, rows, summary);
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

        List<Map<String, Object>> berthList = aggregationService.aggregateByPortBerth(targetUnitId, fromDate, toDate);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Map<String, Object> b : berthList) {
            Map<String, Object> item = new HashMap<>();
            String name = (String) b.getOrDefault("cangBen", "");
            item.put("cangBen", name);

            BigDecimal contTan = (BigDecimal) b.getOrDefault("containerTanThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal contTeus = (BigDecimal) b.getOrDefault("containerTeusThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal hangKho = (BigDecimal) b.getOrDefault("hangKhoTongHopThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal hangLong = (BigDecimal) b.getOrDefault("hangLongThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal hangQuaCanh = (BigDecimal) b.getOrDefault("hangQuaCanhXepDoThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal luotTau = ((BigDecimal) b.getOrDefault("tauBienLuotThucHienThangBaoCao", BigDecimal.ZERO))
                    .add((BigDecimal) b.getOrDefault("pttndLuotThucHienThangBaoCao", BigDecimal.ZERO));

            item.put("containerTan", contTan);
            item.put("containerTeus", contTeus);
            item.put("hangKho", hangKho);
            item.put("hangLong", hangLong);
            item.put("hangQuaCanhXepDo", hangQuaCanh);
            item.put("luotTau", luotTau);
            item.put("ghiChu", "");

            item.put("cbContainerTanLuyKeDenThangBaoCao", contTan);
            item.put("cbContainerTeusLuyKeDenThangBaoCao", contTeus);
            item.put("cbHangKhoLuyKeDenThangBaoCao", hangKho);
            item.put("cbHangLongLuyKeDenThangBaoCao", hangLong);
            item.put("cbHangQuaCanhXepDoLuyKeDenThangBaoCao", hangQuaCanh);
            item.put("cbLuotTauLuyKeDenThangBaoCao", luotTau);

            item.put("bpndContainerTanLuyKeDenThangBaoCao", contTan);
            item.put("bpndContainerTeusLuyKeDenThangBaoCao", contTeus);
            item.put("bpndHangKhoLuyKeDenThangBaoCao", hangKho);
            item.put("bpndHangLongLuyKeDenThangBaoCao", hangLong);
            item.put("bpndHangQuaCanhXepDoLuyKeDenThangBaoCao", hangQuaCanh);
            item.put("bpndLuotTauLuyKeDenThangBaoCao", luotTau);

            result.add(item);
        }

        if (result.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("cangBen", "Khu vực cảng");
            empty.put("containerTan", BigDecimal.ZERO);
            empty.put("containerTeus", BigDecimal.ZERO);
            empty.put("hangKho", BigDecimal.ZERO);
            empty.put("hangLong", BigDecimal.ZERO);
            empty.put("hangQuaCanhXepDo", BigDecimal.ZERO);
            empty.put("luotTau", BigDecimal.ZERO);
            empty.put("ghiChu", "");
            result.add(empty);
        }

        return result;
    }
}
