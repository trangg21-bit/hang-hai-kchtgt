package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.navigationchannel.entity.ChiTietTuyenLuong;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.ChiTietTuyenLuongRepository;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannelApprovalStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.*;
import java.math.BigDecimal;

@Component
public class F151ReportHandler extends BaseReportHandler {

    @Autowired
    private NavigationChannelRepository navigationChannelRepository;

    @Autowired
    private ChiTietTuyenLuongRepository chiTietTuyenLuongRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-151".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<NavigationChannel> ncList = navigationChannelRepository
                .findByIsDeletedFalse(Sort.unsorted())
                .stream()
                .filter(nc -> skipFilter || targetUnitId.equals(nc.getOrgUnitId()))
                .filter(nc -> (nc.getUpdatedAt() == null && nc.getCreatedAt() == null)
                        || (nc.getUpdatedAt() != null && nc.getUpdatedAt().getYear() <= reportYear)
                        || (nc.getCreatedAt() != null && nc.getCreatedAt().getYear() <= reportYear))
                .filter(nc -> nc.getApprovalStatus() == null
                        || nc.getApprovalStatus() == NavigationChannelApprovalStatus.APPROVED)
                .toList();

        List<String> headers = List.of(
            "STT", "Chỉ tiêu", "Dài (km)", "Rộng LN (m)", "Rộng NN (m)",
            "Độ sâu (m)", "Mái dốc", "Độ sâu hiện tại", "KL nạo vét (m3)",
            "Công cộng", "Chuyên dùng", "Tên trạm QL luồng", "Số lượng trạm",
            "Diện tích (m2)", "Thời điểm SC", "Nhân sự", "Chiều cao tĩnh không",
            "ĐVQL vận hành"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 0;
        for (NavigationChannel nc : ncList) {
            stt++;

            // Load children
            List<ChiTietTuyenLuong> children = chiTietTuyenLuongRepository
                    .findByNavigationChannelIdOrderBySttAsc(nc.getId());

            // Sum child lengths
            BigDecimal sumChieuDai = BigDecimal.ZERO;
            BigDecimal sumKhoiLuongNaoVet = BigDecimal.ZERO;
            for (ChiTietTuyenLuong child : children) {
                if (child.getChieuDai() != null) {
                    sumChieuDai = sumChieuDai.add(child.getChieuDai());
                }
                if (child.getKhoiLuongNaoVet() != null) {
                    sumKhoiLuongNaoVet = sumKhoiLuongNaoVet.add(child.getKhoiLuongNaoVet());
                }
            }

            String donVi = resolveDonViTen(nc.getOrgUnitId());

            // Parent row
            Map<String, Object> parentRow = new LinkedHashMap<>();
            parentRow.put("STT", stt);
            parentRow.put("Chỉ tiêu", nc.getChannelName() != null ? nc.getChannelName() : "");
            parentRow.put("Dài (km)", sumChieuDai);
            parentRow.put("Rộng LN (m)", "");
            parentRow.put("Rộng NN (m)", "");
            parentRow.put("Độ sâu (m)", "");
            parentRow.put("Mái dốc", "");
            parentRow.put("Độ sâu hiện tại", "");
            parentRow.put("KL nạo vét (m3)", sumKhoiLuongNaoVet);
            parentRow.put("Công cộng", "");
            parentRow.put("Chuyên dùng", "");
            parentRow.put("Tên trạm QL luồng", nc.getChannelManagementStation() != null ? nc.getChannelManagementStation() : "");
            parentRow.put("Số lượng trạm", nc.getStationAmountt() != null ? nc.getStationAmountt() : "");
            parentRow.put("Diện tích (m2)", nc.getStationArea() != null ? nc.getStationArea() : "");
            parentRow.put("Thời điểm SC", nc.getLatestStationRepairDate() != null
                    ? nc.getLatestStationRepairDate().toString() : "");
            parentRow.put("Nhân sự", nc.getStationStaffAmount() != null ? nc.getStationStaffAmount() : "");
            parentRow.put("nhanSuBoTriTaiTramQlLuong", nc.getStationStaffAmount() != null ? nc.getStationStaffAmount() : "");
            parentRow.put("Chiều cao tĩnh không", nc.getClearanceHeight() != null ? nc.getClearanceHeight() : "");
            parentRow.put("ĐVQL vận hành", donVi);
            rows.add(parentRow);

            // Child rows
            for (ChiTietTuyenLuong child : children) {
                Map<String, Object> childRow = new LinkedHashMap<>();
                childRow.put("STT", "");
                childRow.put("Chỉ tiêu", child.getTen() != null ? child.getTen() : "");
                childRow.put("Dài (km)", child.getChieuDai() != null ? child.getChieuDai() : "");
                childRow.put("Rộng LN (m)", child.getRongLonNhat() != null ? child.getRongLonNhat() : "");
                childRow.put("Rộng NN (m)", child.getRongNhoNhat() != null ? child.getRongNhoNhat() : "");
                childRow.put("Độ sâu (m)", child.getDoSau() != null ? child.getDoSau() : "");
                childRow.put("Mái dốc", child.getMaiDocThietKe() != null ? child.getMaiDocThietKe() : "");
                childRow.put("Độ sâu hiện tại", child.getDoSauHienTai() != null ? child.getDoSauHienTai() : "");
                childRow.put("KL nạo vét (m3)", child.getKhoiLuongNaoVet() != null ? child.getKhoiLuongNaoVet() : "");
                childRow.put("Công cộng", Boolean.TRUE.equals(child.getCongCong()) ? "X" : "");
                childRow.put("Chuyên dùng", Boolean.TRUE.equals(child.getChuyenDung()) ? "X" : "");
                childRow.put("Tên trạm QL luồng", "");
                childRow.put("Số lượng trạm", "");
                childRow.put("Diện tích (m2)", "");
                childRow.put("Thời điểm SC", "");
                childRow.put("Nhân sự", "");
                childRow.put("Chiều cao tĩnh không", "");
                childRow.put("ĐVQL vận hành", "");
                rows.add(childRow);
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số luồng", ncList.size());
        summary.put("total", ncList.size());

        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<NavigationChannel> ncList = navigationChannelRepository
                .findByIsDeletedFalse(Sort.unsorted())
                .stream()
                .filter(nc -> skipFilter || targetUnitId.equals(nc.getOrgUnitId()))
                .filter(nc -> (nc.getUpdatedAt() == null && nc.getCreatedAt() == null)
                        || (nc.getUpdatedAt() != null && nc.getUpdatedAt().getYear() <= reportYear)
                        || (nc.getCreatedAt() != null && nc.getCreatedAt().getYear() <= reportYear))
                .filter(nc -> nc.getApprovalStatus() == null
                        || nc.getApprovalStatus() == NavigationChannelApprovalStatus.APPROVED)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        int stt = 0;
        for (NavigationChannel nc : ncList) {
            stt++;

            List<ChiTietTuyenLuong> children = chiTietTuyenLuongRepository
                    .findByNavigationChannelIdOrderBySttAsc(nc.getId());

            BigDecimal sumChieuDai = BigDecimal.ZERO;
            BigDecimal sumKhoiLuongNaoVet = BigDecimal.ZERO;
            for (ChiTietTuyenLuong child : children) {
                if (child.getChieuDai() != null) {
                    sumChieuDai = sumChieuDai.add(child.getChieuDai());
                }
                if (child.getKhoiLuongNaoVet() != null) {
                    sumKhoiLuongNaoVet = sumKhoiLuongNaoVet.add(child.getKhoiLuongNaoVet());
                }
            }

            String donVi = resolveDonViTen(nc.getOrgUnitId());

            // Parent row
            Map<String, Object> parentItem = new HashMap<>();
            parentItem.put("stt", stt);
            parentItem.put("ten", nc.getChannelName() != null ? nc.getChannelName() : "");
            parentItem.put("tenTramQuanLyLuong", nc.getChannelManagementStation() != null ? nc.getChannelManagementStation() : "");
            parentItem.put("soLuongTram", nc.getStationAmountt() != null ? nc.getStationAmountt().doubleValue() : 0.0);
            parentItem.put("dienTich", nc.getStationArea() != null ? nc.getStationArea().doubleValue() : 0.0);
            parentItem.put("thoiDiemSuaChuaGanNhat", nc.getLatestStationRepairDate() != null
                    ? nc.getLatestStationRepairDate().toString() : "");
            parentItem.put("nhanSuBoTriTaiTramQlLuong", nc.getStationStaffAmount() != null
                    ? nc.getStationStaffAmount().doubleValue() : 0.0);

            parentItem.put("donViQuanLyVanHanh", donVi);
            parentItem.put("chieuCaoTinhKhong", nc.getClearanceHeight() != null ? nc.getClearanceHeight() : "");
            parentItem.put("daiLuong", sumChieuDai);
            // Child fields empty for parent row
            parentItem.put("maTuyenLuong", "");
            parentItem.put("rongLonNhat", 0.0);
            parentItem.put("rongNhoNhat", 0.0);
            parentItem.put("doSau", 0.0);
            parentItem.put("maiDoc", "");
            parentItem.put("doSauHienTai", "");
            parentItem.put("khoiLuongNaoVetDuyTu", 0.0);
            parentItem.put("congCong", "");
            parentItem.put("chuyenDung", "");
            // Generic backward-compatible keys
            parentItem.put("name", nc.getChannelName() != null ? nc.getChannelName() : "");
            parentItem.put("unitId", nc.getOrgUnitId() != null ? nc.getOrgUnitId().toString() : "");
            arrResult.add(parentItem);

            // Child rows
            for (ChiTietTuyenLuong child : children) {
                Map<String, Object> childItem = new HashMap<>();
                childItem.put("stt", "");
                childItem.put("ten", child.getTen() != null ? child.getTen() : "");
                childItem.put("tenTramQuanLyLuong", "");
                childItem.put("soLuongTram", 0.0);
                childItem.put("dienTichTram", 0.0);
                childItem.put("thoiDiemSuaChuaGanNhat", "");
                childItem.put("nhanSuBoTriTaiTramQlLuong", nc.getStationStaffAmount() != null ? nc.getStationStaffAmount().doubleValue() : 0.0);
                childItem.put("chieuCaoTinhKhong", nc.getClearanceHeight() != null ? nc.getClearanceHeight() : "");
                childItem.put("donViQuanLyVanHanh", "");
                childItem.put("daiLuong", child.getChieuDai() != null ? child.getChieuDai().doubleValue() : 0.0);
                childItem.put("maTuyenLuong", child.getMa() != null ? child.getMa() : "");
                childItem.put("rongLonNhat", child.getRongLonNhat() != null ? child.getRongLonNhat().doubleValue() : 0.0);
                childItem.put("rongNhoNhat", child.getRongNhoNhat() != null ? child.getRongNhoNhat().doubleValue() : 0.0);
                childItem.put("doSau", child.getDoSau() != null ? child.getDoSau().doubleValue() : 0.0);
                childItem.put("maiDoc", child.getMaiDocThietKe() != null ? child.getMaiDocThietKe() : "");
                childItem.put("doSauHienTai", child.getDoSauHienTai() != null ? child.getDoSauHienTai() : "");
                childItem.put("khoiLuongNaoVetDuyTu", child.getKhoiLuongNaoVet() != null
                        ? child.getKhoiLuongNaoVet().doubleValue() : 0.0);
                childItem.put("congCong", Boolean.TRUE.equals(child.getCongCong()) ? "X" : "");
                childItem.put("chuyenDung", Boolean.TRUE.equals(child.getChuyenDung()) ? "X" : "");
                // Parent context for template back-reference
                childItem.put("tenTram", nc.getChannelManagementStation() != null ? nc.getChannelManagementStation() : "");
                childItem.put("soLuongTramParent", nc.getStationAmountt() != null ? nc.getStationAmountt().doubleValue() : 0.0);
                childItem.put("dienTichParent", nc.getStationArea() != null ? nc.getStationArea().doubleValue() : 0.0);
                childItem.put("thoiDiemSuaChuaParent", nc.getLatestStationRepairDate() != null ? nc.getLatestStationRepairDate().toString() : "");
                childItem.put("donViQLVH", donVi);
                // Generic backward-compatible keys
                childItem.put("name", child.getTen() != null ? child.getTen() : "");
                childItem.put("unitId", "");
                arrResult.add(childItem);
            }
        }
        return arrResult;
    }

    private String resolveDonViTen(java.util.UUID orgUnitId) {
        if (orgUnitId == null) return "";
        return orgUnitRepository.findById(orgUnitId)
                .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                .orElse("");
    }
}
