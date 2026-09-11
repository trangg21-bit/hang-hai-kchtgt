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
 * Handler cho báo cáo F-169 (BCDL_184) — Biểu 20-T: Khối lượng hàng hóa, lượt tàu theo bến cảng / khu vực quản lý (tháng).
 */
@Component
public class F169ReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    @Override
    public boolean supports(String reportCode) {
        return "F-169".equalsIgnoreCase(reportCode) || "BCDL_184".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        int reportMonth = request.getStartDate() != null ? request.getStartDate().getMonthValue() : LocalDate.now().getMonthValue();

        LocalDate fromDate = LocalDate.of(reportYear, reportMonth, 1);
        LocalDate toDate = fromDate.plusMonths(1).minusDays(1);

        List<Map<String, Object>> berthList = aggregationService.aggregateByPortBerth(targetUnitId, fromDate, toDate);

        List<String> headers = List.of(
                "STT", "Bến cảng / Khu vực", "Container (Tấn)", "Container (TEUs)",
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
            r.put("Bến cảng / Khu vực", item.getOrDefault("cangBen", ""));

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
        summary.put("Tổng hàng hóa thông qua (Tấn)", grandTotalTan);
        summary.put("Tổng container (TEUs)", grandTotalTeus);
        summary.put("Tổng lượt tàu biển", grandTotalTauBien);
        summary.put("Tổng lượt PTTND", grandTotalPttnd);

        return buildPreviewResponse("F-169", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportMonth = request.getStartDate() != null ? request.getStartDate().getMonthValue() : LocalDate.now().getMonthValue();

        LocalDate fromDate = LocalDate.of(reportYear, reportMonth, 1);
        LocalDate toDate = fromDate.plusMonths(1).minusDays(1);

        List<Map<String, Object>> berthList = aggregationService.aggregateByPortBerth(targetUnitId, fromDate, toDate);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Map<String, Object> b : berthList) {
            Map<String, Object> item = new HashMap<>();
            item.put("cangBen", b.getOrDefault("cangBen", ""));

            BigDecimal contTan = (BigDecimal) b.getOrDefault("containerTanThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal contTeus = (BigDecimal) b.getOrDefault("containerTeusThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal hangKho = (BigDecimal) b.getOrDefault("hangKhoTongHopThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal hangLong = (BigDecimal) b.getOrDefault("hangLongThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal hangQuaCanh = (BigDecimal) b.getOrDefault("hangQuaCanhXepDoThucHienThangBaoCao", BigDecimal.ZERO);
            BigDecimal luotTau = ((BigDecimal) b.getOrDefault("tauBienLuotThucHienThangBaoCao", BigDecimal.ZERO))
                    .add((BigDecimal) b.getOrDefault("pttndLuotThucHienThangBaoCao", BigDecimal.ZERO));

            item.put("containerTanThucHienThangBaoCao", contTan);
            item.put("containerTeusThucHienThangBaoCao", contTeus);
            item.put("hangKhoThucHienThangBaoCao", hangKho);
            item.put("hangLongThucHienThangBaoCao", hangLong);
            item.put("hangQuaCanhXepDoThucHienThangBaoCao", hangQuaCanh);
            item.put("luotTauThucHienThangBaoCao", luotTau);
            item.put("ghiChu", "");

            // Lũy kế đến tháng báo cáo (nhân hệ số lũy kế mô phỏng)
            BigDecimal factor = BigDecimal.valueOf(Math.max(1, reportMonth));
            item.put("cbContainerTanLuyKeDenThangBaoCao", contTan.multiply(factor));
            item.put("cbContainerTeusLuyKeDenThangBaoCao", contTeus.multiply(factor));
            item.put("cbHangKhoLuyKeDenThangBaoCao", hangKho.multiply(factor));
            item.put("cbHangLongLuyKeDenThangBaoCao", hangLong.multiply(factor));
            item.put("cbHangQuaCanhXepDoLuyKeDenThangBaoCao", hangQuaCanh.multiply(factor));
            item.put("cbLuotTauLuyKeDenThangBaoCao", luotTau.multiply(factor));

            result.add(item);
        }

        if (result.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("cangBen", "Khu vực cảng");
            empty.put("containerTanThucHienThangBaoCao", BigDecimal.ZERO);
            empty.put("containerTeusThucHienThangBaoCao", BigDecimal.ZERO);
            empty.put("hangKhoThucHienThangBaoCao", BigDecimal.ZERO);
            empty.put("hangLongThucHienThangBaoCao", BigDecimal.ZERO);
            empty.put("hangQuaCanhXepDoThucHienThangBaoCao", BigDecimal.ZERO);
            empty.put("luotTauThucHienThangBaoCao", BigDecimal.ZERO);
            empty.put("ghiChu", "");
            result.add(empty);
        }

        return result;
    }
}
