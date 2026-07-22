package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.luonghanghai.entity.ChiTietTuyenLuong;
import com.hanghai.kchtg.luonghanghai.entity.LuongHangHai;
import com.hanghai.kchtg.luonghanghai.repository.ChiTietTuyenLuongRepository;
import com.hanghai.kchtg.luonghanghai.repository.LuongHangHaiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.*;
import java.math.BigDecimal;

@Component
public class F151ReportHandler extends BaseReportHandler {

    @Autowired
    private LuongHangHaiRepository luongHangHaiRepository;

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

        List<LuongHangHai> luongHangHaiList = luongHangHaiRepository
                .findByIsDeletedFalse(Sort.unsorted())
                .stream()
                .filter(lhh -> skipFilter || targetUnitId.equals(lhh.getDonViId()))
                .filter(lhh -> (lhh.getUpdatedAt() == null && lhh.getCreatedAt() == null)
                        || (lhh.getUpdatedAt() != null && lhh.getUpdatedAt().getYear() <= reportYear)
                        || (lhh.getCreatedAt() != null && lhh.getCreatedAt().getYear() <= reportYear))
                .filter(lhh -> lhh.getApprovalStatus() == null
                        || lhh.getApprovalStatus() == com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus.APPROVED)
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
        for (LuongHangHai lhh : luongHangHaiList) {
            stt++;

            // Load children
            List<ChiTietTuyenLuong> children = chiTietTuyenLuongRepository
                    .findByLuongHangHaiIdOrderBySttAsc(lhh.getId());

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

            String donVi = resolveDonViTen(lhh.getDonViId());

            // Parent row
            Map<String, Object> parentRow = new LinkedHashMap<>();
            parentRow.put("STT", stt);
            parentRow.put("Chỉ tiêu", lhh.getTen() != null ? lhh.getTen() : "");
            parentRow.put("Dài (km)", sumChieuDai);
            parentRow.put("Rộng LN (m)", "");
            parentRow.put("Rộng NN (m)", "");
            parentRow.put("Độ sâu (m)", "");
            parentRow.put("Mái dốc", "");
            parentRow.put("Độ sâu hiện tại", "");
            parentRow.put("KL nạo vét (m3)", sumKhoiLuongNaoVet);
            parentRow.put("Công cộng", "");
            parentRow.put("Chuyên dùng", "");
            parentRow.put("Tên trạm QL luồng", lhh.getTramQuanLyLuong() != null ? lhh.getTramQuanLyLuong() : "");
            parentRow.put("Số lượng trạm", lhh.getSoLuongTram() != null ? lhh.getSoLuongTram() : "");
            parentRow.put("Diện tích (m2)", lhh.getDienTichTram() != null ? lhh.getDienTichTram() : "");
            parentRow.put("Thời điểm SC", lhh.getThoiDiemSuaChuaTramGanNhat() != null
                    ? lhh.getThoiDiemSuaChuaTramGanNhat().toString() : "");
            parentRow.put("Nhân sự", lhh.getSoLuongNhanSuTaiTram() != null ? lhh.getSoLuongNhanSuTaiTram() : "");
            parentRow.put("nhanSuBoTriTaiTramQlLuong", lhh.getSoLuongNhanSuTaiTram() != null ? lhh.getSoLuongNhanSuTaiTram() : "");
            parentRow.put("Chiều cao tĩnh không", lhh.getChieuCaoTinhKhong() != null ? lhh.getChieuCaoTinhKhong() : "");
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
        summary.put("Tổng số luồng", luongHangHaiList.size());
        summary.put("total", luongHangHaiList.size());

        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<LuongHangHai> luongHangHaiList = luongHangHaiRepository
                .findByIsDeletedFalse(Sort.unsorted())
                .stream()
                .filter(lhh -> skipFilter || targetUnitId.equals(lhh.getDonViId()))
                .filter(lhh -> (lhh.getUpdatedAt() == null && lhh.getCreatedAt() == null)
                        || (lhh.getUpdatedAt() != null && lhh.getUpdatedAt().getYear() <= reportYear)
                        || (lhh.getCreatedAt() != null && lhh.getCreatedAt().getYear() <= reportYear))
                .filter(lhh -> lhh.getApprovalStatus() == null
                        || lhh.getApprovalStatus() == com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus.APPROVED)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        int stt = 0;
        for (LuongHangHai lhh : luongHangHaiList) {
            stt++;

            List<ChiTietTuyenLuong> children = chiTietTuyenLuongRepository
                    .findByLuongHangHaiIdOrderBySttAsc(lhh.getId());

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

            String donVi = resolveDonViTen(lhh.getDonViId());

            // Parent row
            Map<String, Object> parentItem = new HashMap<>();
            parentItem.put("stt", stt);
            parentItem.put("ten", lhh.getTen() != null ? lhh.getTen() : "");
            parentItem.put("tenTramQuanLyLuong", lhh.getTramQuanLyLuong() != null ? lhh.getTramQuanLyLuong() : "");
            parentItem.put("soLuongTram", lhh.getSoLuongTram() != null ? lhh.getSoLuongTram().doubleValue() : 0.0);
            parentItem.put("dienTich", lhh.getDienTichTram() != null ? lhh.getDienTichTram().doubleValue() : 0.0);
            parentItem.put("thoiDiemSuaChuaGanNhat", lhh.getThoiDiemSuaChuaTramGanNhat() != null
                    ? lhh.getThoiDiemSuaChuaTramGanNhat().toString() : "");
            parentItem.put("nhanSuBoTriTaiTramQlLuong", lhh.getSoLuongNhanSuTaiTram() != null
                    ? lhh.getSoLuongNhanSuTaiTram().doubleValue() : 0.0);

            parentItem.put("donViQuanLyVanHanh", donVi);
            parentItem.put("chieuCaoTinhKhong", lhh.getChieuCaoTinhKhong() != null ? lhh.getChieuCaoTinhKhong() : "");
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
            parentItem.put("name", lhh.getTen() != null ? lhh.getTen() : "");
            parentItem.put("unitId", lhh.getDonViId() != null ? lhh.getDonViId().toString() : "");
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
                childItem.put("nhanSuBoTriTaiTramQlLuong", lhh.getSoLuongNhanSuTaiTram() != null ? lhh.getSoLuongNhanSuTaiTram().doubleValue() : 0.0);
                childItem.put("chieuCaoTinhKhong", lhh.getChieuCaoTinhKhong() != null ? lhh.getChieuCaoTinhKhong() : "");
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
                childItem.put("tenTram", lhh.getTramQuanLyLuong() != null ? lhh.getTramQuanLyLuong() : "");
                childItem.put("soLuongTramParent", lhh.getSoLuongTram() != null ? lhh.getSoLuongTram().doubleValue() : 0.0);
                childItem.put("dienTichParent", lhh.getDienTichTram() != null ? lhh.getDienTichTram().doubleValue() : 0.0);
                childItem.put("thoiDiemSuaChuaParent", lhh.getThoiDiemSuaChuaTramGanNhat() != null ? lhh.getThoiDiemSuaChuaTramGanNhat().toString() : "");
                childItem.put("donViQLVH", donVi);
                // Generic backward-compatible keys
                childItem.put("name", child.getTen() != null ? child.getTen() : "");
                childItem.put("unitId", "");
                arrResult.add(childItem);
            }
        }
        return arrResult;
    }

    private String resolveDonViTen(java.util.UUID donViId) {
        if (donViId == null) return "";
        return orgUnitRepository.findById(donViId)
                .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                .orElse("");
    }
}
