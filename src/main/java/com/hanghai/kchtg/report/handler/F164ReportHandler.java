package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.service.BcdlAggregationService;
import com.hanghai.kchtg.shipportcall.entity.ShipPortCall;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Handler cho báo cáo F-164 (BCDL_179) — Biểu 17-Q: Thống kê tàu biển Việt Nam vận tải quốc tế tại khu vực cảng biển.
 */
@Component
public class F164ReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    @Override
    public boolean supports(String reportCode) {
        return "F-164".equalsIgnoreCase(reportCode) || "BCDL_179".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        LocalDate fromDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.of(reportYear, 1, 1);
        LocalDate toDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.of(reportYear, 12, 31);

        List<ShipPortCall> ships = aggregationService.getFilteredShipPortCalls(targetUnitId, fromDate, toDate).stream()
                .filter(s -> aggregationService.isVnShip(s) && aggregationService.isInternationalVoyage(s))
                .toList();

        List<String> headers = List.of(
                "STT", "Tên tàu", "Loại tàu", "Trọng tải (DWT)", "Hàng hóa chuyên chở",
                "Ngày rời cảng", "Cảng đích", "Quốc gia / Vùng lãnh thổ"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        BigDecimal totalDwt = BigDecimal.ZERO;

        for (ShipPortCall s : ships) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên tàu", s.getShipName() != null ? s.getShipName() : "");
            r.put("Loại tàu", s.getShipType() != null ? s.getShipType() : "");

            BigDecimal dwt = aggregationService.defaultZero(s.getDwt());
            totalDwt = totalDwt.add(dwt);
            r.put("Trọng tải (DWT)", dwt);

            r.put("Hàng hóa chuyên chở", s.getCargoName() != null ? s.getCargoName() : "");
            r.put("Ngày rời cảng", s.getDepartureDate() != null ? s.getDepartureDate().format(DATE_FORMATTER) : "");
            r.put("Cảng đích", s.getDestinationPort() != null ? s.getDestinationPort() : "");

            String country = s.getDestinationPort() != null ? s.getDestinationPort() : "Quốc tế";
            r.put("Quốc gia / Vùng lãnh thổ", country);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tàu VN vận tải quốc tế", ships.size());
        summary.put("Tổng DWT", totalDwt);

        return buildPreviewResponse("F-164", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        LocalDate fromDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.of(reportYear, 1, 1);
        LocalDate toDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.of(reportYear, 12, 31);

        List<ShipPortCall> ships = aggregationService.getFilteredShipPortCalls(targetUnitId, fromDate, toDate).stream()
                .filter(s -> aggregationService.isVnShip(s) && aggregationService.isInternationalVoyage(s))
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (ShipPortCall s : ships) {
            Map<String, Object> item = new HashMap<>();
            item.put("tenTau", s.getShipName() != null ? s.getShipName() : "");
            item.put("loaiTau", s.getShipType() != null ? s.getShipType() : "");
            item.put("trongTaiDwt", s.getDwt() != null ? s.getDwt().toPlainString() : "");
            item.put("tenHangHoaChuyenCho", s.getCargoName() != null ? s.getCargoName() : "");
            item.put("ngayRoiCang", s.getDepartureDate() != null ? s.getDepartureDate().format(DATE_FORMATTER) : "");
            item.put("cangDich", s.getDestinationPort() != null ? s.getDestinationPort() : "");
            item.put("tenQuocGiaVungLanhTho", s.getDestinationPort() != null ? s.getDestinationPort() : "Quốc tế");
            result.add(item);
        }
        return result;
    }
}
