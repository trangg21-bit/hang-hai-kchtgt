package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.InlandWaterwayPortCall;
import com.hanghai.kchtg.report.service.BcdlAggregationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Handler cho báo cáo F-162 (BCDL_177) — Biểu 15-T: Báo cáo chi tiết phương tiện thủy nội địa ra, vào cảng biển.
 */
@Component
public class F162ReportHandler extends BaseReportHandler {

    @Autowired
    private BcdlAggregationService aggregationService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Override
    public boolean supports(String reportCode) {
        return "F-162".equalsIgnoreCase(reportCode) || "BCDL_177".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = getReportYear(request);
        LocalDate fromDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.of(reportYear, 1, 1);
        LocalDate toDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.of(reportYear, 12, 31);

        List<InlandWaterwayPortCall> boats = aggregationService.getFilteredInlandPortCalls(targetUnitId, fromDate, toDate);

        List<String> headers = List.of(
                "STT", "Tên PTTNĐ", "Số đăng ký", "Loại phương tiện", "Cấp PTTNĐ",
                "Chiều dài (m)", "Trọng tải DWT", "Dung tích",
                "XK Hàng hóa (Tấn)", "XK Container (TEU)",
                "NK Hàng hóa (Tấn)", "NK Container (TEU)",
                "Nội địa đến (Tấn)", "Nội địa rời (Tấn)",
                "Chuyển tải (Tấn)", "Quá cảnh bốc dỡ (Tấn)",
                "Hành khách đến", "Hành khách rời", "Cảng đến", "Cảng rời", "Ngày đến", "Ngày rời"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        BigDecimal totalDwt = BigDecimal.ZERO;
        BigDecimal totalExp = BigDecimal.ZERO;
        BigDecimal totalImp = BigDecimal.ZERO;

        for (InlandWaterwayPortCall b : boats) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên PTTNĐ", b.getBoatName() != null ? b.getBoatName() : "");
            r.put("Số đăng ký", b.getRegistrationNumber() != null ? b.getRegistrationNumber() : "");
            r.put("Loại phương tiện", b.getBoatType() != null ? b.getBoatType() : "");
            r.put("Cấp PTTNĐ", b.getBoatGrade() != null ? b.getBoatGrade() : "");
            r.put("Chiều dài (m)", b.getLength() != null ? b.getLength() : "");
            r.put("Trọng tải DWT", b.getDwt() != null ? b.getDwt() : "");
            r.put("Dung tích", b.getGrossTonnage() != null ? b.getGrossTonnage() : "");

            BigDecimal exp = aggregationService.defaultZero(b.getExportTons());
            BigDecimal imp = aggregationService.defaultZero(b.getImportTons());
            totalDwt = totalDwt.add(aggregationService.defaultZero(b.getDwt()));
            totalExp = totalExp.add(exp);
            totalImp = totalImp.add(imp);

            r.put("XK Hàng hóa (Tấn)", exp);
            r.put("XK Container (TEU)", b.getExportTeus() != null ? b.getExportTeus() : "");
            r.put("NK Hàng hóa (Tấn)", imp);
            r.put("NK Container (TEU)", b.getImportTeus() != null ? b.getImportTeus() : "");
            r.put("Nội địa đến (Tấn)", b.getDomesticInTons() != null ? b.getDomesticInTons() : "");
            r.put("Nội địa rời (Tấn)", b.getDomesticOutTons() != null ? b.getDomesticOutTons() : "");
            r.put("Chuyển tải (Tấn)", b.getTransshipmentTons() != null ? b.getTransshipmentTons() : "");
            r.put("Quá cảnh bốc dỡ (Tấn)", b.getTransitHandlingTons() != null ? b.getTransitHandlingTons() : "");
            r.put("Hành khách đến", b.getPassengersArrival() != null ? b.getPassengersArrival() : 0);
            r.put("Hành khách rời", b.getPassengersDeparture() != null ? b.getPassengersDeparture() : 0);
            r.put("Cảng đến", b.getArrivalPortName() != null ? b.getArrivalPortName() : "");
            r.put("Cảng rời", b.getLastPortOfCall() != null ? b.getLastPortOfCall() : "");
            r.put("Ngày đến", b.getArrivalDate() != null ? b.getArrivalDate().format(DATE_FORMATTER) : "");
            r.put("Ngày rời", b.getDepartureDate() != null ? b.getDepartureDate().format(DATE_FORMATTER) : "");
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số lượt PTTNĐ", boats.size());
        summary.put("Tổng DWT", totalDwt);
        summary.put("Tổng hàng xuất khẩu (Tấn)", totalExp);
        summary.put("Tổng hàng nhập khẩu (Tấn)", totalImp);

        return buildPreviewResponse("F-162", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        LocalDate fromDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.of(reportYear, 1, 1);
        LocalDate toDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.of(reportYear, 12, 31);

        List<InlandWaterwayPortCall> boats = aggregationService.getFilteredInlandPortCalls(targetUnitId, fromDate, toDate);
        List<Map<String, Object>> result = new ArrayList<>();

        for (InlandWaterwayPortCall b : boats) {
            Map<String, Object> item = new HashMap<>();
            item.put("tenPttnd", b.getBoatName() != null ? b.getBoatName() : "");
            item.put("soDangKy", b.getRegistrationNumber() != null ? b.getRegistrationNumber() : "");
            item.put("loaiPhuongTien", b.getBoatType() != null ? b.getBoatType() : "");
            item.put("capPttnd", b.getBoatGrade() != null ? b.getBoatGrade() : "");
            item.put("chieuDai", b.getLength() != null ? b.getLength() : "");
            item.put("trongTaiToanPhan", b.getDwt() != null ? b.getDwt() : "");
            item.put("dungTich", b.getGrossTonnage() != null ? b.getGrossTonnage() : "");

            item.put("hangHoaXuatKhauTan", b.getExportTons() != null ? b.getExportTons() : "");
            item.put("hangHoaXuatKhauTeus", b.getExportTeus() != null ? b.getExportTeus() : "");
            item.put("hangHoaXuatKhauTeusRong", b.getExportEmptyTeus() != null ? b.getExportEmptyTeus() : "");
            item.put("hangHoaNhapKhauTan", b.getImportTons() != null ? b.getImportTons() : "");
            item.put("hangHoaNhapKhauTeus", b.getImportTeus() != null ? b.getImportTeus() : "");
            item.put("hangHoaNhapKhauTeusRong", b.getImportEmptyTeus() != null ? b.getImportEmptyTeus() : "");
            item.put("hangHoaNoiDiaDenTan", b.getDomesticInTons() != null ? b.getDomesticInTons() : "");
            item.put("hangHoaNoiDiaDenTeus", b.getDomesticInTeus() != null ? b.getDomesticInTeus() : "");
            item.put("hangHoaNoiDiaDenTeusRong", b.getDomesticInEmptyTeus() != null ? b.getDomesticInEmptyTeus() : "");
            item.put("hangHoaNoiDiaRoiTan", b.getDomesticOutTons() != null ? b.getDomesticOutTons() : "");
            item.put("hangHoaNoiDiaRoiTeus", b.getDomesticOutTeus() != null ? b.getDomesticOutTeus() : "");
            item.put("hangHoaNoiDiaRoiTeusRong", b.getDomesticOutEmptyTeus() != null ? b.getDomesticOutEmptyTeus() : "");

            item.put("hangHoaChuyenTaiTan", b.getTransshipmentTons() != null ? b.getTransshipmentTons() : "");
            item.put("hangHoaChuyenTaiTeus", b.getTransshipmentTeus() != null ? b.getTransshipmentTeus() : "");
            item.put("hangHoaQuaCangBocDoTan", b.getTransitHandlingTons() != null ? b.getTransitHandlingTons() : "");
            item.put("hangHoaQuaCangBocDoTeus", b.getTransitHandlingTeus() != null ? b.getTransitHandlingTeus() : "");
            item.put("hangHoaQuaCangKhongBocDoTan", b.getTransitNoHandlingTons() != null ? b.getTransitNoHandlingTons() : "");
            item.put("hangHoaQuaCangKhongBocDoTeus", b.getTransitNoHandlingTeus() != null ? b.getTransitNoHandlingTeus() : "");

            item.put("hanhKhachDenCang", b.getPassengersArrival() != null ? b.getPassengersArrival() : 0);
            item.put("hanhKhachRoiCang", b.getPassengersDeparture() != null ? b.getPassengersDeparture() : 0);
            item.put("tenHang", b.getCargoName() != null ? b.getCargoName() : "");
            item.put("cangRoiCuoiCung", b.getLastPortOfCall() != null ? b.getLastPortOfCall() : "");
            item.put("cangDenCangDoHang", b.getArrivalPortName() != null ? b.getArrivalPortName() : "");
            item.put("cangDiCangXepHang", b.getDeparturePortName() != null ? b.getDeparturePortName() : "");
            item.put("cangDich", b.getDestinationPort() != null ? b.getDestinationPort() : "");

            item.put("ngayDenCang", b.getArrivalDate() != null ? b.getArrivalDate().format(DATE_FORMATTER) : "");
            item.put("ngayRoiCang", b.getDepartureDate() != null ? b.getDepartureDate().format(DATE_FORMATTER) : "");
            item.put("tuyenTuBoRaDaoDanhDau", b.getIslandRoute() != null ? String.valueOf(b.getIslandRoute()) : "2");
            item.put("hangNguyHiem", b.getDangerousGoods() != null ? String.valueOf(b.getDangerousGoods()) : "2");
            item.put("daiLyTauBien", "");

            result.add(item);
        }
        return result;
    }
}
