package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.nhatram.entity.NhaTramDen;
import com.hanghai.kchtg.nhatram.repository.NhaTramDenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class F155ReportHandler extends BaseReportHandler {

    @Autowired
    private NhaTramDenRepository nhaTramDenRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-155".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<NhaTramDen> lighthouses = nhaTramDenRepository.findAll().stream()
                .filter(p -> skipFilter || targetUnitId.equals(p.getUnitId()))
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
            "STT", "Tên đèn biển", "Địa điểm đặt trạm", "Hình dáng tháp đèn", "Kết cấu tháp đèn",
            "Tầm hiệu lực địa lý (Hải lý)", "Tầm hiệu lực ánh sáng (Hải lý)",
            "Đèn chính", "Đèn dự phòng", "Màu sắc tháp đèn", "Thời điểm sửa chữa gần nhất", "Đơn vị quản lý"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        for (NhaTramDen p : lighthouses) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên đèn biển", p.getName());
            r.put("Địa điểm đặt trạm", p.getDescription() != null ? p.getDescription() : "");
            r.put("Hình dáng tháp đèn", "");
            r.put("Kết cấu tháp đèn", "");
            r.put("Tầm hiệu lực địa lý (Hải lý)", p.getRange() != null ? p.getRange() : 0.0);
            r.put("Tầm hiệu lực ánh sáng (Hải lý)", p.getLightRange() != null ? p.getLightRange() : 0.0);
            r.put("Đèn chính", "");
            r.put("Đèn dự phòng", "");
            r.put("Màu sắc tháp đèn", p.getLightColor() != null ? p.getLightColor() : "");
            r.put("Thời điểm sửa chữa gần nhất", p.getLastMaintenanceDate() != null ? p.getLastMaintenanceDate().toString() : "");
            String donVi = "";
            if (p.getUnitId() != null) {
                donVi = orgUnitRepository.findById(p.getUnitId())
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

        List<NhaTramDen> lighthouses = nhaTramDenRepository.findAll().stream()
                .filter(p -> skipFilter || targetUnitId.equals(p.getUnitId()))
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        for (NhaTramDen p : lighthouses) {
            Map<String, Object> item = new HashMap<>();
            item.put("ten", p.getName());
            item.put("code", p.getCode());
            item.put("name", p.getName());
            item.put("description", p.getDescription());
            item.put("unitId", p.getUnitId() != null ? p.getUnitId().toString() : "");
            item.put("status", p.getStatus() != null ? p.getStatus().name() : "");

            item.put("diaDiemDatTramDen", p.getDescription() != null ? p.getDescription() : "");
            item.put("hinhDang", "");
            item.put("ketCau", "");
            item.put("dienTich", 0.0);
            item.put("chieuCaoThapDen", 0.0);
            item.put("chieuCaoTamSang", 0.0);
            item.put("tamHieuLucDiaLy", p.getRange() != null ? p.getRange() : 0.0);
            item.put("tamHieuLucAnhSang", p.getLightRange() != null ? p.getLightRange() : 0.0);
            item.put("chungLoaiDenChinh", "");
            item.put("chungLoaiDenDuPhong", "");
            item.put("mauSacBenNgoaiCuaThapDen", p.getLightColor() != null ? p.getLightColor() : "");
            item.put("nguonCungCapNangLuongChoDen", "");
            item.put("ngaySuaChua", p.getLastMaintenanceDate() != null ? p.getLastMaintenanceDate().toString() : "");
            item.put("soLuongNhanSuBoTri", 0.0);
            item.put("dienTichSuDungTram", 0.0);
            item.put("donViQuanLy", p.getUnitId() != null ? p.getUnitId().toString() : "");
            arrResult.add(item);
        }
        return arrResult;
    }
}
