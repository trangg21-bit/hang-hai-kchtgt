package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.managedasset.entity.ManagedAsset;
import com.hanghai.kchtg.managedasset.repository.ManagedAssetRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Handler cho báo cáo F-188 (BCCNDB_203) — Báo cáo kê khai, tình hình quản lý TS KCHTGT hàng hải.
 */
@Component
public class F188ReportHandler extends BaseReportHandler {

    @Autowired
    private ManagedAssetRepository managedAssetRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-188".equalsIgnoreCase(reportCode) || "BCCNDB_203".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<ManagedAsset> assets = managedAssetRepository.findAll().stream()
                .filter(a -> isRoot || targetUnitId.equals(a.getOrgUnitId()))
                .filter(a -> a.getCreatedAt() == null || a.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
                "STT", "Tên tài sản", "Nhóm tài sản", "Đơn vị tính",
                "Số lượng", "Năm xây dựng", "Năm sử dụng", "Diện tích đất (m²)",
                "Sàn sử dụng (m²)", "Nguyên giá (đồng)", "Giá trị còn lại (đồng)",
                "Tình trạng tài sản", "Đơn vị quản lý"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        BigDecimal totalNguyenGia = BigDecimal.ZERO;
        BigDecimal totalConLai = BigDecimal.ZERO;

        for (ManagedAsset ma : assets) {
            String donViQl = "";
            if (ma.getOrgUnitId() != null) {
                donViQl = orgUnitRepository.findById(ma.getOrgUnitId()).map(OrgUnit::getName).orElse("");
            }

            BigDecimal nguyenGia = ma.getOriginalCost() != null ? ma.getOriginalCost() : BigDecimal.ZERO;
            BigDecimal conLai = ma.getResidualValue() != null ? ma.getResidualValue() : BigDecimal.ZERO;

            totalNguyenGia = totalNguyenGia.add(nguyenGia);
            totalConLai = totalConLai.add(conLai);

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên tài sản", ma.getAssetName());
            r.put("Nhóm tài sản", assetGroupLabel(ma.getAssetGroup()));
            r.put("Đơn vị tính", ma.getUnitOfMeasure() != null ? ma.getUnitOfMeasure() : "Hệ thống");
            r.put("Số lượng", ma.getQuantity() != null ? ma.getQuantity() : BigDecimal.ONE);
            r.put("Năm xây dựng", ma.getConstructionYear() != null ? String.valueOf(ma.getConstructionYear()) : "2018");
            r.put("Năm sử dụng", ma.getInServiceYear() != null ? String.valueOf(ma.getInServiceYear()) : "2019");
            r.put("Diện tích đất (m²)", ma.getLandArea() != null ? ma.getLandArea() : BigDecimal.ZERO);
            r.put("Sàn sử dụng (m²)", ma.getFloorArea() != null ? ma.getFloorArea() : BigDecimal.ZERO);
            r.put("Nguyên giá (đồng)", nguyenGia);
            r.put("Giá trị còn lại (đồng)", conLai);
            r.put("Tình trạng tài sản", ma.getAssetCondition() != null ? ma.getAssetCondition() : "Đang sử dụng");
            r.put("Đơn vị quản lý", donViQl);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tài sản", rows.size());
        summary.put("Tổng nguyên giá (đồng)", totalNguyenGia);
        summary.put("Tổng giá trị còn lại (đồng)", totalConLai);

        return buildPreviewResponse("F-188", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<ManagedAsset> assets = managedAssetRepository.findAll().stream()
                .filter(a -> isRoot || targetUnitId.equals(a.getOrgUnitId()))
                .filter(a -> a.getCreatedAt() == null || a.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> list = new ArrayList<>();
        int idx = 1;

        for (ManagedAsset ma : assets) {
            String donViQl = "";
            if (ma.getOrgUnitId() != null) {
                donViQl = orgUnitRepository.findById(ma.getOrgUnitId()).map(OrgUnit::getName).orElse("");
            }

            Map<String, Object> item = new HashMap<>();
            item.put("idx", idx++);
            item.put("taiSan", ma.getAssetName());
            item.put("donViTinh", ma.getUnitOfMeasure() != null ? ma.getUnitOfMeasure() : "Hệ thống");
            item.put("soLuong", ma.getQuantity() != null ? ma.getQuantity() : 1);
            item.put("namXayDung", ma.getConstructionYear() != null ? String.valueOf(ma.getConstructionYear()) : "2018");
            item.put("namSuDung", ma.getInServiceYear() != null ? String.valueOf(ma.getInServiceYear()) : "2019");
            item.put("dienTichDat", ma.getLandArea() != null ? ma.getLandArea() : BigDecimal.ZERO);
            item.put("sanSuDung", ma.getFloorArea() != null ? ma.getFloorArea() : BigDecimal.ZERO);
            item.put("nguyenGia", ma.getOriginalCost() != null ? ma.getOriginalCost() : BigDecimal.ZERO);
            item.put("giaTriConLai", ma.getResidualValue() != null ? ma.getResidualValue() : BigDecimal.ZERO);
            item.put("tinhTrangTaiSan", ma.getAssetCondition() != null ? ma.getAssetCondition() : "Đang sử dụng");
            item.put("donViQuanLy", donViQl);
            list.add(item);
        }

        if (list.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("idx", 1);
            empty.put("taiSan", "Không có dữ liệu");
            empty.put("donViTinh", "");
            empty.put("soLuong", 0);
            empty.put("namXayDung", "");
            empty.put("namSuDung", "");
            empty.put("dienTichDat", BigDecimal.ZERO);
            empty.put("sanSuDung", BigDecimal.ZERO);
            empty.put("nguyenGia", BigDecimal.ZERO);
            empty.put("giaTriConLai", BigDecimal.ZERO);
            empty.put("tinhTrangTaiSan", "");
            empty.put("donViQuanLy", "");
            list.add(empty);
        }

        return list;
    }

    private String assetGroupLabel(String code) {
        if (code == null) return "Tài sản khác";
        switch (code.toUpperCase()) {
            case "CB": return "Cảng biển";
            case "BC": return "Bến cảng";
            case "CC": return "Cầu cảng";
            case "BP": return "Bến phao";
            case "ND": return "Khu neo đậu";
            case "LHH": return "Luồng hàng hải";
            case "DBNT": return "Đèn biển / Nhà trạm";
            case "PT": return "Phao tiêu";
            case "VTS": return "Hệ thống VTS";
            default: return code;
        }
    }
}
