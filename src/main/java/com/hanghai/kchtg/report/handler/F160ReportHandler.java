package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.deke.entity.DeKe;
import com.hanghai.kchtg.deke.entity.DeKeApprovalStatus;
import com.hanghai.kchtg.deke.entity.LoaiDe;
import com.hanghai.kchtg.deke.repository.DeKeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.Comparator;

/**
 * Report handler for F-160 Biểu 13-N: Thống kê hệ thống đê, kè chắn sóng, chắn cát.
 */
@Component
public class F160ReportHandler extends BaseReportHandler {

    @Autowired
    private DeKeRepository deKeRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-160".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<DeKe> items = deKeRepository
                .findByTrangThaiPheDuyetAndIsDeletedFalse(DeKeApprovalStatus.APPROVED)
                .stream()
                .sorted(Comparator.comparing(DeKe::getId))
                .filter(d -> skipFilter || targetUnitId.equals(d.getDonViId()))
                .filter(d -> d.getUpdatedAt() == null || d.getUpdatedAt().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
                "STT", "Tên công trình", "Loại công trình", "Vị trí (địa danh)",
                "Thời gian đưa vào khai thác (năm)", "Chiều dài", "Chiều cao",
                "Cao trình đỉnh", "Hiện trạng của công trình", "Đơn vị quản lý"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        for (DeKe d : items) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên công trình", d.getTenDeKe() != null ? d.getTenDeKe() : "");
            r.put("Loại công trình", loaiDeLabel(d.getLoaiDe()));
            r.put("Vị trí (địa danh)", d.getViTri() != null ? d.getViTri() : "");
            r.put("Thời gian đưa vào khai thác (năm)",
                    d.getThoiDiemDuaVaoKhaiThac() != null
                            ? String.valueOf(d.getThoiDiemDuaVaoKhaiThac().getYear())
                            : "");
            r.put("Chiều dài", d.getChieuDai() != null ? d.getChieuDai() : 0.0);
            r.put("Chiều cao", d.getChieuCao() != null ? d.getChieuCao() : 0.0);
            r.put("Cao trình đỉnh", formatCaoTrinhDinh(d.getCaoTrinhDinh()));
            r.put("Hiện trạng của công trình", tinhTrangLabel(d.getTinhTrang()));
            String donVi = "";
            if (d.getDonViId() != null) {
                donVi = orgUnitRepository.findById(d.getDonViId())
                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                        .orElse("");
            }
            r.put("Đơn vị quản lý", donVi);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số bản ghi", rows.size());

        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<DeKe> items = deKeRepository
                .findByTrangThaiPheDuyetAndIsDeletedFalse(DeKeApprovalStatus.APPROVED)
                .stream()
                .sorted(Comparator.comparing(DeKe::getId))
                .filter(d -> skipFilter || targetUnitId.equals(d.getDonViId()))
                .filter(d -> d.getUpdatedAt() == null || d.getUpdatedAt().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        for (DeKe deKe : items) {
            Map<String, Object> item = new HashMap<>();
            // Backward-compatible generic keys
            item.put("ten", deKe.getViTri() != null ? deKe.getViTri() : "");
            item.put("code", "");
            item.put("name", deKe.getViTri() != null ? deKe.getViTri() : "");
            item.put("description", loaiDeLabel(deKe.getLoaiDe()));
            item.put("unitId", deKe.getDonViId() != null ? deKe.getDonViId().toString() : "");
            item.put("status", deKe.getTinhTrang() != null ? deKe.getTinhTrang() : "");
            item.put("tenDeKe", deKe.getTenDeKe() != null ? deKe.getTenDeKe() : "");
            item.put("viTri", deKe.getViTri() != null ? deKe.getViTri() : "");
            item.put("matVatLieu", deKe.getMatVatLieu() != null ? deKe.getMatVatLieu() : "");
            item.put("ghiChu", deKe.getGhiChu() != null ? deKe.getGhiChu() : "");
            // Template BCKCHT_175 keys
            item.put("tenCongTrinh", deKe.getTenDeKe() != null ? deKe.getTenDeKe() : "");
            item.put("loaiCongTrinh", loaiDeLabel(deKe.getLoaiDe()));
            item.put("viTriDiaDanh", deKe.getViTri() != null ? deKe.getViTri() : "");
            item.put("thoiGianDuaVaoKhaiThac",
                    deKe.getThoiDiemDuaVaoKhaiThac() != null
                            ? String.valueOf(deKe.getThoiDiemDuaVaoKhaiThac().getYear())
                            : "");
            item.put("chieuDai", deKe.getChieuDai() != null ? deKe.getChieuDai() : 0.0);
            item.put("chieuCao", deKe.getChieuCao() != null ? deKe.getChieuCao() : 0.0);
            item.put("caoTrinhDinh", formatCaoTrinhDinh(deKe.getCaoTrinhDinh()));
            item.put("hienTrang", tinhTrangLabel(deKe.getTinhTrang()));
            String donVi = "";
            if (deKe.getDonViId() != null) {
                donVi = orgUnitRepository.findById(deKe.getDonViId())
                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                        .orElse("");
            }
            item.put("donViQuanLy", donVi);
            arrResult.add(item);
        }
        return arrResult;
    }

    private String formatCaoTrinhDinh(Double value) {
        if (value == null) return "";
        if (value > 0) return "+" + value;
        return String.valueOf(value);
    }

    private String tinhTrangLabel(String value) {
        if (value == null) return "";
        switch (value) {
            case "1": return "Chưa khai thác/vận hành";
            case "2": return "Đang khai thác/vận hành";
            case "3": return "Dừng khai thác/vận hành";
            default:  return value;
        }
    }

    private String loaiDeLabel(LoaiDe loaiDe) {
        if (loaiDe == null) return "";
        switch (loaiDe) {
            case DE_CHAN_SONG:  return "Đê chắn sóng";
            case DE_CHAN_CAT:   return "Đê chắn cát";
            case KE_HUONG_DONG: return "Kè hướng dòng";
            case KE_BAO_VE_BO:  return "Kè bảo vệ bờ";
            case GIAO_THONG:    return "Giao thông";
            case KE_CHAN_SONG:  return "Kè chắn sóng";
            case KE_CHAN_CAT:   return "Kè chắn cát";
            default:            return loaiDe.name();
        }
    }
}
