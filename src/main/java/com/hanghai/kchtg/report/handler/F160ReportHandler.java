package com.hanghai.kchtg.report.handler;

import java.util.UUID;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentApprovalStatus;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
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
    private DikeRevetmentRepository dikeRevetmentRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-160".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<DikeRevetment> items = dikeRevetmentRepository
                .findByApprovalStatusAndIsDeletedFalse(DikeRevetmentApprovalStatus.APPROVED)
                .stream()
                .sorted(Comparator.comparing(DikeRevetment::getId))
                .filter(d -> skipFilter || targetUnitId.equals(d.getOrgUnitId()))
                .filter(d -> d.getUpdatedAt() == null || d.getUpdatedAt().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
                "STT", "Tên công trình", "Loại công trình", "Vị trí (địa danh)",
                "Thời gian đưa vào khai thác (năm)", "Chiều dài", "Chiều cao",
                "Cao trình đỉnh", "Hiện trạng của công trình", "Đơn vị quản lý"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int sequenceNo = 1;
        for (DikeRevetment dr : items) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", sequenceNo++);
            r.put("Tên công trình", dr.getDikeRevetmentName() != null ? dr.getDikeRevetmentName() : "");
            r.put("Loại công trình", dikeRevetmentTypeLabel(dr.getDikeRevetmentType()));
            r.put("Vị trí (địa danh)", dr.getLocation() != null ? dr.getLocation() : "");
            r.put("Thời gian đưa vào khai thác (năm)",
                    dr.getCommissioningDate() != null
                            ? String.valueOf(dr.getCommissioningDate().getYear())
                            : "");
            r.put("Chiều dài", dr.getLength() != null ? (dr.getLength() % 1 == 0 ? String.valueOf(dr.getLength().longValue()) : String.valueOf(dr.getLength())) : "0");
            r.put("Chiều cao", dr.getHeight() != null ? (dr.getHeight() % 1 == 0 ? String.valueOf(dr.getHeight().longValue()) : String.valueOf(dr.getHeight())) : "0");
            r.put("Cao trình đỉnh", formatCaoTrinhDinh(dr.getCrestElevation()));
            r.put("Hiện trạng của công trình", statusLabel(dr.getStatus()));
            String donVi = "";
            if (dr.getOrgUnitId() != null) {
                donVi = orgUnitRepository.findById(dr.getOrgUnitId())
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

        List<DikeRevetment> items = dikeRevetmentRepository
                .findByApprovalStatusAndIsDeletedFalse(DikeRevetmentApprovalStatus.APPROVED)
                .stream()
                .sorted(Comparator.comparing(DikeRevetment::getId))
                .filter(d -> skipFilter || targetUnitId.equals(d.getOrgUnitId()))
                .filter(d -> d.getUpdatedAt() == null || d.getUpdatedAt().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        for (DikeRevetment dikeRev : items) {
            Map<String, Object> item = new HashMap<>();
            // Backward-compatible generic keys
            item.put("ten", dikeRev.getLocation() != null ? dikeRev.getLocation() : "");
            item.put("code", "");
            item.put("name", dikeRev.getLocation() != null ? dikeRev.getLocation() : "");
            item.put("description", dikeRevetmentTypeLabel(dikeRev.getDikeRevetmentType()));
            item.put("unitId", dikeRev.getOrgUnitId() != null ? dikeRev.getOrgUnitId().toString() : "");
            item.put("status", dikeRev.getStatus() != null ? dikeRev.getStatus() : "");
            item.put("tenDeKe", dikeRev.getDikeRevetmentName() != null ? dikeRev.getDikeRevetmentName() : "");
            item.put("viTri", dikeRev.getLocation() != null ? dikeRev.getLocation() : "");
            item.put("matVatLieu", dikeRev.getSurfaceMaterial() != null ? dikeRev.getSurfaceMaterial() : "");
            item.put("ghiChu", dikeRev.getNote() != null ? dikeRev.getNote() : "");
            // Template BCKCHT_175 keys
            item.put("tenCongTrinh", dikeRev.getDikeRevetmentName() != null ? dikeRev.getDikeRevetmentName() : "");
            item.put("loaiCongTrinh", dikeRevetmentTypeLabel(dikeRev.getDikeRevetmentType()));
            item.put("viTriDiaDanh", dikeRev.getLocation() != null ? dikeRev.getLocation() : "");
            item.put("thoiGianDuaVaoKhaiThac",
                    dikeRev.getCommissioningDate() != null
                            ? String.valueOf(dikeRev.getCommissioningDate().getYear())
                            : "");
            item.put("chieuDai", dikeRev.getLength() != null ? (dikeRev.getLength() % 1 == 0 ? String.valueOf(dikeRev.getLength().longValue()) : String.valueOf(dikeRev.getLength())) : "0");
            item.put("chieuCao", dikeRev.getHeight() != null ? (dikeRev.getHeight() % 1 == 0 ? String.valueOf(dikeRev.getHeight().longValue()) : String.valueOf(dikeRev.getHeight())) : "0");
            item.put("caoTrinhDinh", formatCaoTrinhDinh(dikeRev.getCrestElevation()));
            item.put("hienTrang", statusLabel(dikeRev.getStatus()));
            String donVi = "";
            if (dikeRev.getOrgUnitId() != null) {
                donVi = orgUnitRepository.findById(dikeRev.getOrgUnitId())
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

    private String statusLabel(String value) {
        if (value == null) return "";
        switch (value) {
            case "1": return "Chưa khai thác/vận hành";
            case "2": return "Đang khai thác/vận hành";
            case "3": return "Dừng khai thác/vận hành";
            default:  return value;
        }
    }

    private String dikeRevetmentTypeLabel(DikeRevetmentType type) {
        if (type == null) return "";
        switch (type) {
            case RIVER_DIKE:  return "Đê chắn sóng";
            case SAND_DIKE:   return "Đê chắn cát";
            case FLOW_GUIDE_REVETMENT: return "Kè hướng dòng";
            case BANK_PROTECTION_REVETMENT:  return "Kè bảo vệ bờ";
            case TRAFFIC:    return "Giao thông";
            case WAVE_BREAK_REVETMENT:  return "Kè chắn sóng";
            case SAND_BREAK_REVETMENT:   return "Kè chắn cát";
            default:            return type.name();
        }
    }
}
