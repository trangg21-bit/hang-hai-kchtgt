package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.cangben.entity.CauCang;
import com.hanghai.kchtg.cangben.repository.CauCangRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class F150ReportHandler extends BaseReportHandler {

    @Autowired
    private CauCangRepository cauCangRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-150".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<CauCang> berths = cauCangRepository.findAll().stream()
                .filter(b -> skipFilter || targetUnitId.equals(b.getOrgUnitId()))
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        double containerNam = 0;
        double tongHopNam = 0;
        double roiQuangNam = 0;
        double xangDauNam = 0;
        double khacNam = 0;
        double hanhKhachNam = 0;

        double containerThayDoi = 0;
        double tongHopThayDoi = 0;
        double roiQuangThayDoi = 0;
        double xangDauThayDoi = 0;
        double khacThayDoi = 0;
        double hanhKhachThayDoi = 0;

        double containerDaiNam = 0;
        double tongHopDaiNam = 0;
        double roiQuangDaiNam = 0;
        double xangDauDaiNam = 0;
        double khacDaiNam = 0;
        double hanhKhachDaiNam = 0;

        double containerDaiThayDoi = 0;
        double tongHopDaiThayDoi = 0;
        double roiQuangDaiThayDoi = 0;
        double xangDauDaiThayDoi = 0;
        double khacDaiThayDoi = 0;
        double hanhKhachDaiThayDoi = 0;

        for (CauCang b : berths) {
            String type = classifyCauCang(b.getLoaiCau(), b.getCongNangKhaiThac());
            boolean isNewThisYear = b.getCreatedAt() != null && b.getCreatedAt().getYear() == reportYear;
            double len = b.getChieuDai() != null ? b.getChieuDai().doubleValue() : 0.0;

            switch (type) {
                case "CONTAINER":
                    containerNam += 1;
                    containerDaiNam += len;
                    if (isNewThisYear) {
                        containerThayDoi += 1;
                        containerDaiThayDoi += len;
                    }
                    break;
                case "TONG_HOP":
                    tongHopNam += 1;
                    tongHopDaiNam += len;
                    if (isNewThisYear) {
                        tongHopThayDoi += 1;
                        tongHopDaiThayDoi += len;
                    }
                    break;
                case "CHUYEN_DUNG_HANG_ROI":
                    roiQuangNam += 1;
                    roiQuangDaiNam += len;
                    if (isNewThisYear) {
                        roiQuangThayDoi += 1;
                        roiQuangDaiThayDoi += len;
                    }
                    break;
                case "CHUYEN_DUNG_XANG_DAU":
                    xangDauNam += 1;
                    xangDauDaiNam += len;
                    if (isNewThisYear) {
                        xangDauThayDoi += 1;
                        xangDauDaiThayDoi += len;
                    }
                    break;
                case "CHUYEN_DUNG_KHAC":
                    khacNam += 1;
                    khacDaiNam += len;
                    if (isNewThisYear) {
                        khacThayDoi += 1;
                        khacDaiThayDoi += len;
                    }
                    break;
                case "HANH_KHACH":
                    hanhKhachNam += 1;
                    hanhKhachDaiNam += len;
                    if (isNewThisYear) {
                        hanhKhachThayDoi += 1;
                        hanhKhachDaiThayDoi += len;
                    }
                    break;
            }
        }

        List<String> headers = List.of(
                "STT",
                "Chỉ tiêu",
                "Đơn vị",
                "Cầu cảng container",
                "Cầu cảng tổng hợp (bách hóa)",
                "Cầu cảng chuyên dụng hàng rời, quặng",
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng",
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)",
                "Cầu cảng hành khách"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(Map.of(
                "STT", 1,
                "Chỉ tiêu", "Số lượng cầu cảng năm báo cáo",
                "Đơn vị", "Cầu",
                "Cầu cảng container", containerNam,
                "Cầu cảng tổng hợp (bách hóa)", tongHopNam,
                "Cầu cảng chuyên dụng hàng rời, quặng", roiQuangNam,
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", xangDauNam,
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", khacNam,
                "Cầu cảng hành khách", hanhKhachNam
        ));
        rows.add(Map.of(
                "STT", 2,
                "Chỉ tiêu", "Số lượng cầu cảng thay đổi",
                "Đơn vị", "Cầu",
                "Cầu cảng container", containerThayDoi,
                "Cầu cảng tổng hợp (bách hóa)", tongHopThayDoi,
                "Cầu cảng chuyên dụng hàng rời, quặng", roiQuangThayDoi,
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", xangDauThayDoi,
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", khacThayDoi,
                "Cầu cảng hành khách", hanhKhachThayDoi
        ));
        rows.add(Map.of(
                "STT", 3,
                "Chỉ tiêu", "Chiều dài cầu cảng năm báo cáo",
                "Đơn vị", "m",
                "Cầu cảng container", containerDaiNam,
                "Cầu cảng tổng hợp (bách hóa)", tongHopDaiNam,
                "Cầu cảng chuyên dụng hàng rời, quặng", roiQuangDaiNam,
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", xangDauDaiNam,
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", khacDaiNam,
                "Cầu cảng hành khách", hanhKhachDaiNam
        ));
        rows.add(Map.of(
                "STT", 4,
                "Chỉ tiêu", "Chiều dài cầu cảng thay đổi",
                "Đơn vị", "m",
                "Cầu cảng container", containerDaiThayDoi,
                "Cầu cảng tổng hợp (bách hóa)", tongHopDaiThayDoi,
                "Cầu cảng chuyên dụng hàng rời, quặng", roiQuangDaiThayDoi,
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", xangDauDaiThayDoi,
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", khacDaiThayDoi,
                "Cầu cảng hành khách", hanhKhachDaiThayDoi
        ));
        rows.add(Map.of(
                "STT", 5,
                "Chỉ tiêu", "Năng lực thông qua năm báo cáo",
                "Đơn vị", "Nghìn tấn/năm",
                "Cầu cảng container", 0.0,
                "Cầu cảng tổng hợp (bách hóa)", 0.0,
                "Cầu cảng chuyên dụng hàng rời, quặng", 0.0,
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", 0.0,
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", 0.0,
                "Cầu cảng hành khách", 0.0
        ));
        rows.add(Map.of(
                "STT", 6,
                "Chỉ tiêu", "Năng lực thông qua thay đổi",
                "Đơn vị", "Nghìn tấn/năm",
                "Cầu cảng container", 0.0,
                "Cầu cảng tổng hợp (bách hóa)", 0.0,
                "Cầu cảng chuyên dụng hàng rời, quặng", 0.0,
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", 0.0,
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", 0.0,
                "Cầu cảng hành khách", 0.0
        ));

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số bản ghi", rows.size());

        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<CauCang> berths = cauCangRepository.findAll().stream()
                .filter(b -> skipFilter || targetUnitId.equals(b.getOrgUnitId()))
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        double containerNam = 0;
        double tongHopNam = 0;
        double roiQuangNam = 0;
        double xangDauNam = 0;
        double khacNam = 0;
        double hanhKhachNam = 0;

        double containerThayDoi = 0;
        double tongHopThayDoi = 0;
        double roiQuangThayDoi = 0;
        double xangDauThayDoi = 0;
        double khacThayDoi = 0;
        double hanhKhachThayDoi = 0;

        double containerDaiNam = 0;
        double tongHopDaiNam = 0;
        double roiQuangDaiNam = 0;
        double xangDauDaiNam = 0;
        double khacDaiNam = 0;
        double hanhKhachDaiNam = 0;

        double containerDaiThayDoi = 0;
        double tongHopDaiThayDoi = 0;
        double roiQuangDaiThayDoi = 0;
        double xangDauDaiThayDoi = 0;
        double khacDaiThayDoi = 0;
        double hanhKhachDaiThayDoi = 0;

        for (CauCang b : berths) {
            String type = classifyCauCang(b.getLoaiCau(), b.getCongNangKhaiThac());
            boolean isNewThisYear = b.getCreatedAt() != null && b.getCreatedAt().getYear() == reportYear;
            double len = b.getChieuDai() != null ? b.getChieuDai().doubleValue() : 0.0;

            switch (type) {
                case "CONTAINER":
                    containerNam += 1;
                    containerDaiNam += len;
                    if (isNewThisYear) {
                        containerThayDoi += 1;
                        containerDaiThayDoi += len;
                    }
                    break;
                case "TONG_HOP":
                    tongHopNam += 1;
                    tongHopDaiNam += len;
                    if (isNewThisYear) {
                        tongHopThayDoi += 1;
                        tongHopDaiThayDoi += len;
                    }
                    break;
                case "CHUYEN_DUNG_HANG_ROI":
                    roiQuangNam += 1;
                    roiQuangDaiNam += len;
                    if (isNewThisYear) {
                        roiQuangThayDoi += 1;
                        roiQuangDaiThayDoi += len;
                    }
                    break;
                case "CHUYEN_DUNG_XANG_DAU":
                    xangDauNam += 1;
                    xangDauDaiNam += len;
                    if (isNewThisYear) {
                        xangDauThayDoi += 1;
                        xangDauDaiThayDoi += len;
                    }
                    break;
                case "CHUYEN_DUNG_KHAC":
                    khacNam += 1;
                    khacDaiNam += len;
                    if (isNewThisYear) {
                        khacThayDoi += 1;
                        khacDaiThayDoi += len;
                    }
                    break;
                case "HANH_KHACH":
                    hanhKhachNam += 1;
                    hanhKhachDaiNam += len;
                    if (isNewThisYear) {
                        hanhKhachThayDoi += 1;
                        hanhKhachDaiThayDoi += len;
                    }
                    break;
            }
        }

        Map<String, Object> item = new HashMap<>();
        item.put("soLuongCauCangContainerNamBaoCao", containerNam);
        item.put("soLuongCauCangTongHopNamBaoCao", tongHopNam);
        item.put("soLuongCauCangChuyenDungHangRoiQuangNamBaoCao", roiQuangNam);
        item.put("soLuongCauCangChuyenDungXangDauKhiHoaLongNamBaoCao", xangDauNam);
        item.put("soLuongCauCangChuyenDungKhacNamBaoCao", khacNam);
        item.put("soLuongCauCangHanhKhachNamBaoCao", hanhKhachNam);

        item.put("soLuongCauCangContainerThayDoi", containerThayDoi);
        item.put("soLuongCauCangTongHopThayDoi", tongHopThayDoi);
        item.put("soLuongCauCangChuyenDungHangRoiQuangThayDoi", roiQuangThayDoi);
        item.put("soLuongCauCangChuyenDungXangDauKhiHoaLongThayDoi", xangDauThayDoi);
        item.put("soLuongCauCangChuyenDungKhacThayDoi", khacThayDoi);
        item.put("soLuongCauCangHanhKhachThayDoi", hanhKhachThayDoi);

        item.put("chieuDaiCauCangContainerNamBaoCao", containerDaiNam);
        item.put("chieuDaiCauCangTongHopNamBaoCao", tongHopDaiNam);
        item.put("chieuDaiCauCangChuyenDungHangRoiQuangNamBaoCao", roiQuangDaiNam);
        item.put("chieuDaiCauCangChuyenDungXangDauKhiHoaLongNamBaoCao", xangDauDaiNam);
        item.put("chieuDaiCauCangChuyenDungKhacNamBaoCao", khacDaiNam);
        item.put("chieuDaiCauCangHanhKhachNamBaoCao", hanhKhachDaiNam);

        item.put("chieuDaiCauCangContainerThayDoi", containerDaiThayDoi);
        item.put("chieuDaiCauCangTongHopThayDoi", tongHopDaiThayDoi);
        item.put("chieuDaiCauCangChuyenDungHangRoiQuangThayDoi", roiQuangDaiThayDoi);
        item.put("chieuDaiCauCangChuyenDungXangDauKhiHoaLongThayDoi", xangDauDaiThayDoi);
        item.put("chieuDaiCauCangChuyenDungKhacThayDoi", khacDaiThayDoi);
        item.put("chieuDaiCauCangHanhKhachNamThayDoi", hanhKhachDaiThayDoi);

        List<Map<String, Object>> list = new ArrayList<>();
        list.add(item);
        return list;
    }

    private String classifyCauCang(com.hanghai.kchtg.cangben.entity.LoaiCau loaiCau, String congNang) {
        if (loaiCau == null) return "KHAC";
        switch (loaiCau) {
            case CONTAINER:
                return "CONTAINER";
            case TONG_HOP:
                return "TONG_HOP";
            case HANH_KHACH:
                return "HANH_KHACH";
            case CHUYEN_DUNG_XANG_DAU:
                return "CHUYEN_DUNG_XANG_DAU";
            case CHUYEN_DUNG_ROI_QUANG:
                return "CHUYEN_DUNG_HANG_ROI";
            case KHAC:
            default:
                return "KHAC";
        }
    }
}
