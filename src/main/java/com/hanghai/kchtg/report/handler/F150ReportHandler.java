package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.entity.PierType;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class F150ReportHandler extends BaseReportHandler {

    @Autowired
    private PierRepository pierRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-150".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<Pier> berths = pierRepository.findAll().stream()
                .filter(b -> skipFilter || targetUnitId.equals(b.getOrgUnitId()))
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        double containerNam = 0;
        double generalPierCount = 0;
        double bulkOrePierCount = 0;
        double petroleumPierCount = 0;
        double khacNam = 0;
        double passengerPierCount = 0;

        double containerPierCountChange = 0;
        double generalPierCountChange = 0;
        double bulkOrePierCountChange = 0;
        double petroleumPierCountChange = 0;
        double otherPierCountChange = 0;
        double passengerPierCountChange = 0;

        double containerPierLength = 0;
        double generalPierLength = 0;
        double bulkOrePierLength = 0;
        double petroleumPierLength = 0;
        double otherPierLength = 0;
        double passengerPierLength = 0;

        double containerPierLengthChange = 0;
        double generalPierLengthChange = 0;
        double bulkOrePierLengthChange = 0;
        double petroleumPierLengthChange = 0;
        double otherPierLengthChange = 0;
        double passengerPierLengthChange = 0;

        for (Pier b : berths) {
            String type = classifyPier(b.getPierType(), b.getOperationalFunction());
            boolean isNewThisYear = b.getUpdatedAt() != null && b.getUpdatedAt().getYear() == reportYear;
            double len = b.getLength() != null ? b.getLength().doubleValue() : 0.0;

            switch (type) {
                case "CONTAINER":
                    containerNam += 1;
                    containerPierLength += len;
                    if (isNewThisYear) {
                        containerPierCountChange += 1;
                        containerPierLengthChange += len;
                    }
                    break;
                case "TONG_HOP":
                    generalPierCount += 1;
                    generalPierLength += len;
                    if (isNewThisYear) {
                        generalPierCountChange += 1;
                        generalPierLengthChange += len;
                    }
                    break;
                case "CHUYEN_DUNG_HANG_ROI":
                    bulkOrePierCount += 1;
                    bulkOrePierLength += len;
                    if (isNewThisYear) {
                        bulkOrePierCountChange += 1;
                        bulkOrePierLengthChange += len;
                    }
                    break;
                case "CHUYEN_DUNG_XANG_DAU":
                    petroleumPierCount += 1;
                    petroleumPierLength += len;
                    if (isNewThisYear) {
                        petroleumPierCountChange += 1;
                        petroleumPierLengthChange += len;
                    }
                    break;
                case "CHUYEN_DUNG_KHAC":
                    khacNam += 1;
                    otherPierLength += len;
                    if (isNewThisYear) {
                        otherPierCountChange += 1;
                        otherPierLengthChange += len;
                    }
                    break;
                case "HANH_KHACH":
                    passengerPierCount += 1;
                    passengerPierLength += len;
                    if (isNewThisYear) {
                        passengerPierCountChange += 1;
                        passengerPierLengthChange += len;
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
                "Cầu cảng hành khách",
                "Ghi chú"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(Map.of(
                "STT", 1,
                "Chỉ tiêu", "Số lượng cầu cảng năm báo cáo",
                "Đơn vị", "Cầu",
                "Cầu cảng container", containerNam,
                "Cầu cảng tổng hợp (bách hóa)", generalPierCount,
                "Cầu cảng chuyên dụng hàng rời, quặng", bulkOrePierCount,
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", petroleumPierCount,
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", khacNam,
                "Cầu cảng hành khách", passengerPierCount,
                "Ghi chú", ""
        ));
        rows.add(Map.of(
                "STT", 2,
                "Chỉ tiêu", "Số lượng cầu cảng thay đổi",
                "Đơn vị", "Cầu",
                "Cầu cảng container", containerPierCountChange,
                "Cầu cảng tổng hợp (bách hóa)", generalPierCountChange,
                "Cầu cảng chuyên dụng hàng rời, quặng", bulkOrePierCountChange,
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", petroleumPierCountChange,
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", otherPierCountChange,
                "Cầu cảng hành khách", passengerPierCountChange,
                "Ghi chú", ""
        ));
        rows.add(Map.of(
                "STT", 3,
                "Chỉ tiêu", "Chiều dài cầu cảng năm báo cáo",
                "Đơn vị", "m",
                "Cầu cảng container", containerPierLength,
                "Cầu cảng tổng hợp (bách hóa)", generalPierLength,
                "Cầu cảng chuyên dụng hàng rời, quặng", bulkOrePierLength,
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", petroleumPierLength,
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", otherPierLength,
                "Cầu cảng hành khách", passengerPierLength,
                "Ghi chú", ""
        ));
        rows.add(Map.of(
                "STT", 4,
                "Chỉ tiêu", "Chiều dài cầu cảng thay đổi",
                "Đơn vị", "m",
                "Cầu cảng container", containerPierLengthChange,
                "Cầu cảng tổng hợp (bách hóa)", generalPierLengthChange,
                "Cầu cảng chuyên dụng hàng rời, quặng", bulkOrePierLengthChange,
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", petroleumPierLengthChange,
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", otherPierLengthChange,
                "Cầu cảng hành khách", passengerPierLengthChange,
                "Ghi chú", ""
        ));
        rows.add(Map.of(
                "STT", 5,
                "Chỉ tiêu", "Năng lực thông qua năm báo cáo",
                "Đơn vị", "Nghìn tấn/năm",
                "Cầu cảng container", "-",
                "Cầu cảng tổng hợp (bách hóa)", "-",
                "Cầu cảng chuyên dụng hàng rời, quặng", "-",
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", "-",
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", "-",
                "Cầu cảng hành khách", "-",
                "Ghi chú", ""
        ));
        rows.add(Map.of(
                "STT", 6,
                "Chỉ tiêu", "Năng lực thông qua thay đổi",
                "Đơn vị", "Nghìn tấn/năm",
                "Cầu cảng container", "-",
                "Cầu cảng tổng hợp (bách hóa)", "-",
                "Cầu cảng chuyên dụng hàng rời, quặng", "-",
                "Cầu cảng chuyên dụng xăng dầu, khí hóa lỏng", "-",
                "Cầu cảng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu …)", "-",
                "Cầu cảng hành khách", "-",
                "Ghi chú", ""
        ));

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số bản ghi", rows.size());

        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<Pier> berths = pierRepository.findAll().stream()
                .filter(b -> skipFilter || targetUnitId.equals(b.getOrgUnitId()))
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        double containerNam = 0;
        double generalPierCount = 0;
        double bulkOrePierCount = 0;
        double petroleumPierCount = 0;
        double khacNam = 0;
        double passengerPierCount = 0;

        double containerPierCountChange = 0;
        double generalPierCountChange = 0;
        double bulkOrePierCountChange = 0;
        double petroleumPierCountChange = 0;
        double otherPierCountChange = 0;
        double passengerPierCountChange = 0;

        double containerPierLength = 0;
        double generalPierLength = 0;
        double bulkOrePierLength = 0;
        double petroleumPierLength = 0;
        double otherPierLength = 0;
        double passengerPierLength = 0;

        double containerPierLengthChange = 0;
        double generalPierLengthChange = 0;
        double bulkOrePierLengthChange = 0;
        double petroleumPierLengthChange = 0;
        double otherPierLengthChange = 0;
        double passengerPierLengthChange = 0;

        for (Pier b : berths) {
            String type = classifyPier(b.getPierType(), b.getOperationalFunction());
            boolean isNewThisYear = b.getUpdatedAt() != null && b.getUpdatedAt().getYear() == reportYear;
            double len = b.getLength() != null ? b.getLength().doubleValue() : 0.0;

            switch (type) {
                case "CONTAINER":
                    containerNam += 1;
                    containerPierLength += len;
                    if (isNewThisYear) {
                        containerPierCountChange += 1;
                        containerPierLengthChange += len;
                    }
                    break;
                case "TONG_HOP":
                    generalPierCount += 1;
                    generalPierLength += len;
                    if (isNewThisYear) {
                        generalPierCountChange += 1;
                        generalPierLengthChange += len;
                    }
                    break;
                case "CHUYEN_DUNG_HANG_ROI":
                    bulkOrePierCount += 1;
                    bulkOrePierLength += len;
                    if (isNewThisYear) {
                        bulkOrePierCountChange += 1;
                        bulkOrePierLengthChange += len;
                    }
                    break;
                case "CHUYEN_DUNG_XANG_DAU":
                    petroleumPierCount += 1;
                    petroleumPierLength += len;
                    if (isNewThisYear) {
                        petroleumPierCountChange += 1;
                        petroleumPierLengthChange += len;
                    }
                    break;
                case "CHUYEN_DUNG_KHAC":
                    khacNam += 1;
                    otherPierLength += len;
                    if (isNewThisYear) {
                        otherPierCountChange += 1;
                        otherPierLengthChange += len;
                    }
                    break;
                case "HANH_KHACH":
                    passengerPierCount += 1;
                    passengerPierLength += len;
                    if (isNewThisYear) {
                        passengerPierCountChange += 1;
                        passengerPierLengthChange += len;
                    }
                    break;
            }
        }

        Map<String, Object> item = new HashMap<>();
        item.put("soLuongPierContainerNamBaoCao", containerNam);
        item.put("soLuongPierTongHopNamBaoCao", generalPierCount);
        item.put("soLuongPierChuyenDungHangRoiQuangNamBaoCao", bulkOrePierCount);
        item.put("soLuongPierChuyenDungXangDauKhiHoaLongNamBaoCao", petroleumPierCount);
        item.put("soLuongPierChuyenDungKhacNamBaoCao", khacNam);
        item.put("soLuongPierHanhKhachNamBaoCao", passengerPierCount);

        item.put("soLuongPierContainerThayDoi", containerPierCountChange);
        item.put("soLuongPierTongHopThayDoi", generalPierCountChange);
        item.put("soLuongPierChuyenDungHangRoiQuangThayDoi", bulkOrePierCountChange);
        item.put("soLuongPierChuyenDungXangDauKhiHoaLongThayDoi", petroleumPierCountChange);
        item.put("soLuongPierChuyenDungKhacThayDoi", otherPierCountChange);
        item.put("soLuongPierHanhKhachThayDoi", passengerPierCountChange);

        item.put("chieuDaiPierContainerNamBaoCao", containerPierLength);
        item.put("chieuDaiPierTongHopNamBaoCao", generalPierLength);
        item.put("chieuDaiPierChuyenDungHangRoiQuangNamBaoCao", bulkOrePierLength);
        item.put("chieuDaiPierChuyenDungXangDauKhiHoaLongNamBaoCao", petroleumPierLength);
        item.put("chieuDaiPierChuyenDungKhacNamBaoCao", otherPierLength);
        item.put("chieuDaiPierHanhKhachNamBaoCao", passengerPierLength);

        item.put("chieuDaiPierContainerThayDoi", containerPierLengthChange);
        item.put("chieuDaiPierTongHopThayDoi", generalPierLengthChange);
        item.put("chieuDaiPierChuyenDungHangRoiQuangThayDoi", bulkOrePierLengthChange);
        item.put("chieuDaiPierChuyenDungXangDauKhiHoaLongThayDoi", petroleumPierLengthChange);
        item.put("chieuDaiPierChuyenDungKhacThayDoi", otherPierLengthChange);
        item.put("chieuDaiPierHanhKhachNamThayDoi", passengerPierLengthChange);

        item.put("nangLucContainerNamBaoCao", "-");
        item.put("nangLucTongHopNamBaoCao", "-");
        item.put("nangLucChuyenDungHangRoiQuangNamBaoCao", "-");
        item.put("nangLucChuyenDungXangDauKhiHoaLongNamBaoCao", "-");
        item.put("nangLucChuyenDungKhacNamBaoCao", "-");
        item.put("nangLucHanhKhachNamBaoCao", "-");

        item.put("nangLucContainerThayDoi", "-");
        item.put("nangLucTongHopThayDoi", "-");
        item.put("nangLucChuyenDungHangRoiQuangThayDoi", "-");
        item.put("nangLucChuyenDungXangDauKhiHoaLongThayDoi", "-");
        item.put("nangLucChuyenDungKhacThayDoi", "-");
        item.put("nangLucHanhKhachThayDoi", "-");

        item.put("ghiChu", "");

        List<Map<String, Object>> list = new ArrayList<>();
        list.add(item);
        return list;
    }

    private String classifyPier(PierType pierType, String operationalFunction) {
        if (pierType == null) return "KHAC";
        switch (pierType) {
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
