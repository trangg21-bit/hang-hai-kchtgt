package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class F151ReportHandler extends BaseReportHandler {

    @Autowired
    private LineObjectRepository lineObjectRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-151".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<LineObject> lines = lineObjectRepository.findAll().stream()
                .filter(p -> skipFilter || targetUnitId.equals(p.getUnitId()))
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .filter(p -> p.getObjectType() == LineObject.ObjectType.SHIPPING_ROUTE
                        || p.getObjectType() == LineObject.ObjectType.WATERWAY)
                .toList();

        List<String> headers = List.of(
            "STT", "Tên tuyến luồng", "Chiều dài (km)", "Chiều rộng lớn nhất (m)", "Chiều rộng nhỏ nhất (m)",
            "Độ sâu (m)", "Mái dốc", "Độ sâu hiện tại", "Khối lượng nạo vét duy tu (m3)",
            "Luồng công cộng", "Luồng chuyên dùng", "Đơn vị quản lý vận hành"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        for (LineObject p : lines) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên tuyến luồng", p.getName());
            r.put("Chiều dài (km)", p.getLength() != null ? p.getLength() : 0.0);
            r.put("Chiều rộng lớn nhất (m)", 0.0);
            r.put("Chiều rộng nhỏ nhất (m)", 0.0);
            r.put("Độ sâu (m)", 0.0);
            r.put("Mái dốc", 0.0);
            r.put("Độ sâu hiện tại", 0.0);
            r.put("Khối lượng nạo vét duy tu (m3)", 0.0);
            r.put("Luồng công cộng", 0.0);
            r.put("Luồng chuyên dùng", 0.0);
            String donVi = "";
            if (p.getUnitId() != null) {
                donVi = orgUnitRepository.findById(p.getUnitId())
                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                        .orElse("");
            }
            r.put("Đơn vị quản lý vận hành", donVi);
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

        List<LineObject> lines = lineObjectRepository.findAll().stream()
                .filter(p -> skipFilter || targetUnitId.equals(p.getUnitId()))
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .filter(p -> p.getObjectType() == LineObject.ObjectType.SHIPPING_ROUTE
                        || p.getObjectType() == LineObject.ObjectType.WATERWAY)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        for (LineObject p : lines) {
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
            item.put("daiLuong", p.getLength() != null ? p.getLength() : 0.0);
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
