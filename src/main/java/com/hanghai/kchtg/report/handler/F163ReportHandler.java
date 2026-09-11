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
 * Handler cho báo cáo F-163 (BCDL_178) — Biểu 16-Q: Thống kê tàu biển nước ngoài đến, rời tại khu vực cảng biển.
 */
@Component
public class F163ReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Override
    public boolean supports(String reportCode) {
        return "F-163".equalsIgnoreCase(reportCode) || "BCDL_178".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        LocalDate fromDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.of(reportYear, 1, 1);
        LocalDate toDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.of(reportYear, 12, 31);

        List<ShipPortCall> ships = aggregationService.getFilteredShipPortCalls(targetUnitId, fromDate, toDate).stream()
                .filter(aggregationService::isForeignShip)
                .toList();

        List<String> headers = List.of(
                "STT", "Tên tàu", "Số IMO", "Quốc tịch", "Loại tàu",
                "Trọng tải (DWT)", "Lượng khách", "Hàng hóa chuyên chở",
                "Cảng rời cuối cùng & Nước", "Cảng đến làm hàng", "Cảng đích tiếp theo & Nước",
                "Ngày đến", "Ngày rời"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        BigDecimal totalDwt = BigDecimal.ZERO;
        long totalPassengers = 0;

        for (ShipPortCall s : ships) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên tàu", s.getShipName() != null ? s.getShipName() : "");
            r.put("Số IMO", s.getImoNumber() != null ? s.getImoNumber() : "");
            r.put("Quốc tịch", s.getNationality() != null ? s.getNationality() : "");
            r.put("Loại tàu", s.getShipType() != null ? s.getShipType() : "");

            BigDecimal dwt = aggregationService.defaultZero(s.getDwt());
            totalDwt = totalDwt.add(dwt);
            r.put("Trọng tải (DWT)", dwt);

            long passengers = aggregationService.defaultZero(s.getPassengersArrival()) + aggregationService.defaultZero(s.getPassengersDeparture());
            totalPassengers += passengers;
            r.put("Lượng khách", passengers);

            r.put("Hàng hóa chuyên chở", s.getCargoName() != null ? s.getCargoName() : "");
            r.put("Cảng rời cuối cùng & Nước", s.getLastPortOfCall() != null ? s.getLastPortOfCall() : "");
            r.put("Cảng đến làm hàng", s.getArrivalPortName() != null ? s.getArrivalPortName() : "");
            r.put("Cảng đích tiếp theo & Nước", s.getDestinationPort() != null ? s.getDestinationPort() : "");
            r.put("Ngày đến", s.getArrivalDate() != null ? s.getArrivalDate().format(DATE_FORMATTER) : "");
            r.put("Ngày rời", s.getDepartureDate() != null ? s.getDepartureDate().format(DATE_FORMATTER) : "");
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tàu nước ngoài", ships.size());
        summary.put("Tổng DWT", totalDwt);
        summary.put("Tổng lượng khách", totalPassengers);

        return buildPreviewResponse("F-163", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        LocalDate fromDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.of(reportYear, 1, 1);
        LocalDate toDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.of(reportYear, 12, 31);

        List<ShipPortCall> ships = aggregationService.getFilteredShipPortCalls(targetUnitId, fromDate, toDate).stream()
                .filter(aggregationService::isForeignShip)
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (ShipPortCall s : ships) {
            Map<String, Object> item = new HashMap<>();
            item.put("tenTau", s.getShipName() != null ? s.getShipName() : "");
            item.put("soImo", s.getImoNumber() != null ? s.getImoNumber() : "");
            item.put("quocTichTau", s.getNationality() != null ? s.getNationality() : "");
            item.put("loaiTau", s.getShipType() != null ? s.getShipType() : "");
            item.put("trongTaiDwt", s.getDwt() != null ? s.getDwt().toPlainString() : "");
            long pass = aggregationService.defaultZero(s.getPassengersArrival()) + aggregationService.defaultZero(s.getPassengersDeparture());
            item.put("luongKhach", pass > 0 ? String.valueOf(pass) : "0");
            item.put("tenHangHoaChuyenCho", s.getCargoName() != null ? s.getCargoName() : "");
            item.put("cangRoiCuoiCungVaTenNuoc", s.getLastPortOfCall() != null ? s.getLastPortOfCall() : "");
            item.put("cangDenCangLamHang", s.getArrivalPortName() != null ? s.getArrivalPortName() : "");
            item.put("cangDichDenTiepTheoVaTenNuoc", s.getDestinationPort() != null ? s.getDestinationPort() : "");
            item.put("ngayDenCang", s.getArrivalDate() != null ? s.getArrivalDate().format(DATE_FORMATTER) : "");
            item.put("ngayRoiCang", s.getDepartureDate() != null ? s.getDepartureDate().format(DATE_FORMATTER) : "");
            result.add(item);
        }
        return result;
    }
}
