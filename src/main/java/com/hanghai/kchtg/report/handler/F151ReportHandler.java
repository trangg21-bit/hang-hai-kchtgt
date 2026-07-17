package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.luonghanghai.entity.LuongHangHai;
import com.hanghai.kchtg.luonghanghai.repository.LuongHangHaiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class F151ReportHandler extends BaseReportHandler {

    @Autowired
    private LineObjectRepository lineObjectRepository;

    @Autowired
    private LuongHangHaiRepository luongHangHaiRepository;

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
                .filter(lhh -> {
                    if (lhh.getNgayGhiNhan() != null) {
                        return lhh.getNgayGhiNhan().getYear() <= reportYear;
                    }
                    return lhh.getCreatedAt() == null || lhh.getCreatedAt().getYear() <= reportYear;
                })
                .toList();

        List<String> headers = List.of(
            "STT", "Tên tuyến luồng", "Chiều dài (km)", "Chiều rộng lớn nhất (m)", "Chiều rộng nhỏ nhất (m)",
            "Độ sâu (m)", "Mái dốc", "Độ sâu hiện tại", "Khối lượng nạo vét duy tu (m3)",
            "Luồng công cộng", "Luồng chuyên dùng", "Đơn vị quản lý vận hành"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        for (LuongHangHai lhh : luongHangHaiList) {
            // Look up LineObject by spatial_id (khongGianId)
            String tenTuyen = lhh.getTen();
            Double chieuDai = 0.0;
            if (lhh.getKhongGianId() != null) {
                Optional<LineObject> lineOpt = lineObjectRepository.findById(lhh.getKhongGianId());
                if (lineOpt.isPresent()) {
                    LineObject line = lineOpt.get();
                    chieuDai = line.getLength() != null ? line.getLength() : 0.0;
                }
            }

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên tuyến luồng", tenTuyen != null ? tenTuyen : "");
            r.put("Chiều dài (km)", chieuDai);
            r.put("Chiều rộng lớn nhất (m)", 0.0);
            r.put("Chiều rộng nhỏ nhất (m)", 0.0);
            r.put("Độ sâu (m)", 0.0);
            r.put("Mái dốc", 0.0);
            r.put("Độ sâu hiện tại", 0.0);
            r.put("Khối lượng nạo vét duy tu (m3)", 0.0);
            r.put("Luồng công cộng", 0.0);
            r.put("Luồng chuyên dùng", 0.0);
            String donVi = "";
            if (lhh.getDonViId() != null) {
                donVi = orgUnitRepository.findById(lhh.getDonViId())
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

        List<LuongHangHai> luongHangHaiList = luongHangHaiRepository
                .findByIsDeletedFalse(Sort.unsorted())
                .stream()
                .filter(lhh -> skipFilter || targetUnitId.equals(lhh.getDonViId()))
                .filter(lhh -> {
                    if (lhh.getNgayGhiNhan() != null) {
                        return lhh.getNgayGhiNhan().getYear() <= reportYear;
                    }
                    return lhh.getCreatedAt() == null || lhh.getCreatedAt().getYear() <= reportYear;
                })
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        for (LuongHangHai lhh : luongHangHaiList) {
            // Look up LineObject by spatial_id (khongGianId)
            String tenTuyen = lhh.getTen();
            Double chieuDai = 0.0;
            String code = "";
            String moTa = "";
            if (lhh.getKhongGianId() != null) {
                Optional<LineObject> lineOpt = lineObjectRepository.findById(lhh.getKhongGianId());
                if (lineOpt.isPresent()) {
                    LineObject line = lineOpt.get();
                    code = line.getCode();
                    moTa = line.getDescription();
                    chieuDai = line.getLength() != null ? line.getLength() : 0.0;
                }
            }

            Map<String, Object> item = new HashMap<>();
            item.put("ten", lhh.getTen() != null ? lhh.getTen() : "");
            item.put("code", code);
            item.put("name", tenTuyen != null ? tenTuyen : "");
            item.put("description", moTa != null ? moTa : "");
            item.put("unitId", lhh.getDonViId() != null ? lhh.getDonViId().toString() : "");
            item.put("status", "");

            item.put("tenCangBien", tenTuyen != null ? tenTuyen : "");
            item.put("tenCang", tenTuyen != null ? tenTuyen : "");
            item.put("loaiTaiSan", tenTuyen != null ? tenTuyen : "");
            item.put("maTuyenLuong", lhh.getTen() != null ? lhh.getTen() : "");
            item.put("tenTramQuanLyLuong", tenTuyen != null ? tenTuyen : "");
            item.put("tenDiemNeo", tenTuyen != null ? tenTuyen : "");

            item.put("soLuongTram", lhh.getSoLuong() != null ? lhh.getSoLuong().doubleValue() : 0.0);
            item.put("dienTich", lhh.getDienTichDangBo() != null ? parseDoubleSafe(lhh.getDienTichDangBo()) : 0.0);
            item.put("thoiDiemSuaChuaGanNhat", "");
            item.put("thoiDiemCongBo", "");
            item.put("ngaySuaChua", "");
            item.put("nhanSuBoTriTaiTramQlLuong", 0.0);
            item.put("nhanSuBoTriTaiTramQL", 0.0);
            item.put("soLuongNhanSuBoTri", 0.0);
            item.put("daiLuong", chieuDai);
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
            String donVi = "";
            if (lhh.getDonViId() != null) {
                donVi = orgUnitRepository.findById(lhh.getDonViId())
                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                        .orElse("");
            }
            item.put("donViQuanLyVanHanh", donVi);
            arrResult.add(item);
        }
        return arrResult;
    }

    private double parseDoubleSafe(String value) {
        try {
            return value != null && !value.trim().isEmpty() ? Double.parseDouble(value.trim()) : 0.0;
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
