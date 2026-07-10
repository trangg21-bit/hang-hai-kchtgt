package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class F152ToF154ReportHandler extends BaseReportHandler {

    @Autowired
    private PolygonObjectRepository polygonObjectRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-152".equalsIgnoreCase(reportCode)
                || "F-153".equalsIgnoreCase(reportCode)
                || "F-154".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<PolygonObject> polygons = polygonObjectRepository.findAll().stream()
                .filter(p -> skipFilter || targetUnitId.equals(p.getUnitId()))
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
                "STT", "Chỉ tiêu", "Vị trí, tọa độ", "Hình dạng", "Diện tích (m2)",
                "Cỡ tàu lớn nhất (DWT)", "Đơn vị quản lý khai thác",
                "Độ sâu theo thiết kế (m)", "Độ sâu hiện tại (m)",
                "Đã công bố", "Năm công bố", "Ghi chú"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        for (PolygonObject p : polygons) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Chỉ tiêu", p.getName());
            r.put("Vị trí, tọa độ", p.getCoordinates() != null ? p.getCoordinates() : "");
            r.put("Hình dạng", "");
            r.put("Diện tích (m2)", 0.0);
            r.put("Cỡ tàu lớn nhất (DWT)", 0.0);
            String donVi = "";
            if (p.getUnitId() != null) {
                donVi = orgUnitRepository.findById(p.getUnitId())
                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                        .orElse("");
            }
            r.put("Đơn vị quản lý khai thác", donVi);
            r.put("Độ sâu theo thiết kế (m)", 0.0);
            r.put("Độ sâu hiện tại (m)", 0.0);
            r.put("Đã công bố", "");
            r.put("Năm công bố", "");
            r.put("Ghi chú", p.getDescription() != null ? p.getDescription() : "");
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

        List<PolygonObject> polygons = polygonObjectRepository.findAll().stream()
                .filter(p -> skipFilter || targetUnitId.equals(p.getUnitId()))
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        for (PolygonObject p : polygons) {
            Map<String, Object> item = new HashMap<>();
            item.put("ten", p.getName());
            item.put("code", p.getCode());
            item.put("name", p.getName());
            item.put("description", p.getDescription());
            item.put("unitId", p.getUnitId() != null ? p.getUnitId().toString() : "");
            item.put("status", p.getStatus() != null ? p.getStatus().name() : "");

            item.put("tenCangBien", p.getName());
            item.put("tenCang", p.getName());
            item.put("loaiTaiSan", p.getName());
            item.put("maTuyenLuong", p.getCode());
            item.put("tenTramQuanLyLuong", p.getName());
            item.put("tenDiemNeo", p.getName());

            item.put("soLuongTram", 0.0);
            item.put("dienTich", 0.0);
            item.put("thoiDiemSuaChuaGanNhat", "");
            item.put("thoiDiemCongBo", "");
            item.put("ngaySuaChua", "");
            item.put("nhanSuBoTriTaiTramQlLuong", 0.0);
            item.put("nhanSuBoTriTaiTramQL", 0.0);
            item.put("soLuongNhanSuBoTri", 0.0);
            item.put("daiLuong", 0.0);
            item.put("rongLonNhat", 0.0);
            item.put("rongNhoNhat", 0.0);
            item.put("doSau", 0.0);
            item.put("doSauThietKe", 0.0);
            item.put("doSauKhuNuocTheoThietKe", 0.0);
            item.put("maiDoc", 0.0);
            item.put("doSauHienTai", 0.0);
            item.put("khoiLuongNaoVetDuyTu", 0.0);
            item.put("congCong", 0.0);
            item.put("chuyenDung", 0.0);
            item.put("chieuCaoTinhKhong", 0.0);
            item.put("donViQuanLyVanHanh", p.getUnitId() != null ? p.getUnitId().toString() : "");
            arrResult.add(item);
        }
        return arrResult;
    }
}
