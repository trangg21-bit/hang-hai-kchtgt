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
 * Handler cho báo cáo F-161 (BCDL_176) — Biểu 14-T: Báo cáo chi tiết tàu biển ra, vào cảng biển.
 */
@Component
public class F161ReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Override
    public boolean supports(String reportCode) {
        return "F-161".equalsIgnoreCase(reportCode) || "BCDL_176".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        LocalDate fromDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.of(reportYear, 1, 1);
        LocalDate toDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.of(reportYear, 12, 31);

        List<ShipPortCall> ships = aggregationService.getFilteredShipPortCalls(targetUnitId, fromDate, toDate);

        List<String> headers = List.of(
                "STT", "Tên tàu", "Hô hiệu", "Số IMO", "Quốc tịch", "Loại tàu",
                "Chiều dài (m)", "Mớn nước (m)", "DWT", "GT",
                "XK Hàng hóa (Tấn)", "XK Container (TEU)",
                "NK Hàng hóa (Tấn)", "NK Container (TEU)",
                "Nội địa đến (Tấn)", "Nội địa rời (Tấn)",
                "Chuyển tải (Tấn)", "Quá cảnh bốc dỡ (Tấn)", "Quá cảnh không bốc dỡ (Tấn)",
                "Hành khách đến", "Hành khách rời", "Cảng đến", "Cảng rời", "Ngày đến", "Ngày rời"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        BigDecimal totalDwt = BigDecimal.ZERO;
        BigDecimal totalGt = BigDecimal.ZERO;
        BigDecimal totalExp = BigDecimal.ZERO;
        BigDecimal totalImp = BigDecimal.ZERO;

        for (ShipPortCall s : ships) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên tàu", s.getShipName() != null ? s.getShipName() : "");
            r.put("Hô hiệu", s.getCallSign() != null ? s.getCallSign() : "");
            r.put("Số IMO", s.getImoNumber() != null ? s.getImoNumber() : "");
            r.put("Quốc tịch", s.getNationality() != null ? s.getNationality() : "");
            r.put("Loại tàu", s.getShipType() != null ? s.getShipType() : "");
            r.put("Chiều dài (m)", s.getLength() != null ? s.getLength() : "");
            r.put("Mớn nước (m)", s.getDraftArrivalDeparture() != null ? s.getDraftArrivalDeparture() : "");
            r.put("DWT", s.getDwt() != null ? s.getDwt() : "");
            r.put("GT", s.getGt() != null ? s.getGt() : "");

            BigDecimal exp = aggregationService.defaultZero(s.getExportTons());
            BigDecimal imp = aggregationService.defaultZero(s.getImportTons());
            totalDwt = totalDwt.add(aggregationService.defaultZero(s.getDwt()));
            totalGt = totalGt.add(aggregationService.defaultZero(s.getGt()));
            totalExp = totalExp.add(exp);
            totalImp = totalImp.add(imp);

            r.put("XK Hàng hóa (Tấn)", exp);
            r.put("XK Container (TEU)", s.getExportTeus() != null ? s.getExportTeus() : "");
            r.put("NK Hàng hóa (Tấn)", imp);
            r.put("NK Container (TEU)", s.getImportTeus() != null ? s.getImportTeus() : "");
            r.put("Nội địa đến (Tấn)", s.getDomesticInTons() != null ? s.getDomesticInTons() : "");
            r.put("Nội địa rời (Tấn)", s.getDomesticOutTons() != null ? s.getDomesticOutTons() : "");
            r.put("Chuyển tải (Tấn)", s.getTransshipmentTons() != null ? s.getTransshipmentTons() : "");
            r.put("Quá cảnh bốc dỡ (Tấn)", s.getTransitHandlingTons() != null ? s.getTransitHandlingTons() : "");
            r.put("Quá cảnh không bốc dỡ (Tấn)", s.getTransitNoHandlingTons() != null ? s.getTransitNoHandlingTons() : "");
            r.put("Hành khách đến", s.getPassengersArrival() != null ? s.getPassengersArrival() : 0);
            r.put("Hành khách rời", s.getPassengersDeparture() != null ? s.getPassengersDeparture() : 0);
            r.put("Cảng đến", s.getArrivalPortName() != null ? s.getArrivalPortName() : "");
            r.put("Cảng rời", s.getLastPortOfCall() != null ? s.getLastPortOfCall() : "");
            r.put("Ngày đến", s.getArrivalDate() != null ? s.getArrivalDate().format(DATE_FORMATTER) : "");
            r.put("Ngày rời", s.getDepartureDate() != null ? s.getDepartureDate().format(DATE_FORMATTER) : "");
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số lượt tàu", ships.size());
        summary.put("Tổng DWT", totalDwt);
        summary.put("Tổng GT", totalGt);
        summary.put("Tổng hàng xuất khẩu (Tấn)", totalExp);
        summary.put("Tổng hàng nhập khẩu (Tấn)", totalImp);

        return buildPreviewResponse("F-161", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        LocalDate fromDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.of(reportYear, 1, 1);
        LocalDate toDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.of(reportYear, 12, 31);

        List<ShipPortCall> ships = aggregationService.getFilteredShipPortCalls(targetUnitId, fromDate, toDate);
        List<Map<String, Object>> result = new ArrayList<>();

        for (ShipPortCall s : ships) {
            Map<String, Object> item = new HashMap<>();
            item.put("tenTau", s.getShipName() != null ? s.getShipName() : "");
            item.put("hoHieu", s.getCallSign() != null ? s.getCallSign() : "");
            item.put("soImo", s.getImoNumber() != null ? s.getImoNumber() : "");
            item.put("quocTich", s.getNationality() != null ? s.getNationality() : "");
            item.put("loaiTau", s.getShipType() != null ? s.getShipType() : "");
            item.put("chieuDai", s.getLength() != null ? s.getLength() : "");
            item.put("monNuocDenRoiCang", s.getDraftArrivalDeparture() != null ? s.getDraftArrivalDeparture() : "");
            item.put("dwt", s.getDwt() != null ? s.getDwt() : "");
            item.put("gt", s.getGt() != null ? s.getGt() : "");
            item.put("chieuCaoTinhKhongThucTeVaoRoiCang", s.getAirDraftActual() != null ? s.getAirDraftActual() : "");

            item.put("hangHoaXuatKhauTan", s.getExportTons() != null ? s.getExportTons() : "");
            item.put("hangHoaXuatKhauTeus", s.getExportTeus() != null ? s.getExportTeus() : "");
            item.put("hangHoaXuatKhauTeusRong", s.getExportEmptyTeus() != null ? s.getExportEmptyTeus() : "");
            item.put("hangHoaNhapKhauTan", s.getImportTons() != null ? s.getImportTons() : "");
            item.put("hangHoaNhapKhauTeus", s.getImportTeus() != null ? s.getImportTeus() : "");
            item.put("hangHoaNhapKhauTeusRong", s.getImportEmptyTeus() != null ? s.getImportEmptyTeus() : "");
            item.put("hangHoaNoiDiaDenTan", s.getDomesticInTons() != null ? s.getDomesticInTons() : "");
            item.put("hangHoaNoiDiaDenTeus", s.getDomesticInTeus() != null ? s.getDomesticInTeus() : "");
            item.put("hangHoaNoiDiaDenTeusRong", s.getDomesticInEmptyTeus() != null ? s.getDomesticInEmptyTeus() : "");
            item.put("hangHoaNoiDiaRoiTan", s.getDomesticOutTons() != null ? s.getDomesticOutTons() : "");
            item.put("hangHoaNoiDiaRoiTeus", s.getDomesticOutTeus() != null ? s.getDomesticOutTeus() : "");
            item.put("hangHoaNoiDiaRoiTeusRong", s.getDomesticOutEmptyTeus() != null ? s.getDomesticOutEmptyTeus() : "");

            item.put("hangHoaChuyenTaiTan", s.getTransshipmentTons() != null ? s.getTransshipmentTons() : "");
            item.put("hangHoaChuyenTaiTeus", s.getTransshipmentTeus() != null ? s.getTransshipmentTeus() : "");
            item.put("hangHoaQuaCangBocDoTan", s.getTransitHandlingTons() != null ? s.getTransitHandlingTons() : "");
            item.put("hangHoaQuaCangBocDoTeus", s.getTransitHandlingTeus() != null ? s.getTransitHandlingTeus() : "");
            item.put("hangHoaQuaCangKhongBocDoTan", s.getTransitNoHandlingTons() != null ? s.getTransitNoHandlingTons() : "");
            item.put("hangHoaQuaCangKhongBocDoTeus", s.getTransitNoHandlingTeus() != null ? s.getTransitNoHandlingTeus() : "");

            item.put("hanhKhachDenCang", s.getPassengersArrival() != null ? s.getPassengersArrival() : 0);
            item.put("hanhKhachRoiCang", s.getPassengersDeparture() != null ? s.getPassengersDeparture() : 0);
            item.put("tenHang", s.getCargoName() != null ? s.getCargoName() : "");
            item.put("cangRoiCuoiCung", s.getLastPortOfCall() != null ? s.getLastPortOfCall() : "");
            item.put("cangDenCangDoHang", s.getArrivalPortName() != null ? s.getArrivalPortName() : "");
            item.put("cangDiCangXepHang", s.getDeparturePortName() != null ? s.getDeparturePortName() : "");
            item.put("cangDich", s.getDestinationPort() != null ? s.getDestinationPort() : "");

            item.put("ngayDenCang", s.getArrivalDate() != null ? s.getArrivalDate().format(DATE_FORMATTER) : "");
            item.put("ngayRoiCang", s.getDepartureDate() != null ? s.getDepartureDate().format(DATE_FORMATTER) : "");
            item.put("tuyenTuBoRaDaoDanhDau", s.getIslandRoute() == ShipPortCall.IslandRoute.YES ? "1" : "2");
            item.put("hangNguyHiem", s.getDangerousGoods() == ShipPortCall.DangerousGoods.YES ? "1" : "2");
            item.put("daiLyTauBien", s.getShipAgent() != null ? s.getShipAgent() : "");

            result.add(item);
        }
        return result;
    }
}
