package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.cangben.entity.VungNuoc;
import com.hanghai.kchtg.cangben.entity.LoaiVungNuoc;
import com.hanghai.kchtg.cangben.repository.VungNuocRepository;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class F152ToF154ReportHandler extends BaseReportHandler {

    @Autowired
    private VungNuocRepository vungNuocRepository;

    @Autowired
    private LineObjectRepository lineObjectRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-152".equalsIgnoreCase(reportCode)
                || "F-153".equalsIgnoreCase(reportCode)
                || "F-154".equalsIgnoreCase(reportCode);
    }

    private Set<LoaiVungNuoc> getLoaiVungNuocFilter(String reportCode) {
        Set<LoaiVungNuoc> filterSet = new HashSet<>();
        if ("F-152".equalsIgnoreCase(reportCode)) {
            filterSet.add(LoaiVungNuoc.DON_TRA_HOA_TIEU);
            filterSet.add(LoaiVungNuoc.QUAY_TRO_TAU);
            filterSet.add(LoaiVungNuoc.NEO_DAU);
            filterSet.add(LoaiVungNuoc.TRANH_BAO);
        } else if ("F-153".equalsIgnoreCase(reportCode)) {
            filterSet.add(LoaiVungNuoc.CHUYEN_TAI);
            filterSet.add(LoaiVungNuoc.NEO_DAU);
        } else if ("F-154".equalsIgnoreCase(reportCode)) {
            filterSet.add(LoaiVungNuoc.BEN_PHAO);
            filterSet.add(LoaiVungNuoc.NEO_DAU);
        }
        return filterSet;
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        Set<LoaiVungNuoc> filterSet = getLoaiVungNuocFilter(request.getReportCode());

        List<VungNuoc> vungNuocs = vungNuocRepository.findAll(Sort.unsorted()).stream()
                .filter(v -> filterSet.contains(v.getLoaiVungNuoc()))
                .filter(v -> skipFilter || targetUnitId.equals(v.getDonViId()))
                .filter(v -> v.getCreatedAt() == null || v.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
                "STT", "Chỉ tiêu", "Vị trí, tọa độ", "Hình dạng", "Diện tích (m2)",
                "Cỡ tàu lớn nhất (DWT)", "Đơn vị quản lý khai thác",
                "Độ sâu theo thiết kế (m)", "Độ sâu hiện tại (m)",
                "Đã công bố", "Năm công bố", "Ghi chú"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        for (VungNuoc v : vungNuocs) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Chỉ tiêu", v.getTenVungNuoc() != null ? v.getTenVungNuoc() : "");

            // JOIN khongGianId → LineObject.coordinates
            String coordinates = "";
            if (v.getKhongGianId() != null) {
                Optional<LineObject> lineOpt = lineObjectRepository.findById(v.getKhongGianId());
                if (lineOpt.isPresent() && lineOpt.get().getCoordinates() != null) {
                    coordinates = lineOpt.get().getCoordinates();
                }
            }
            r.put("Vị trí, tọa độ", coordinates);
            r.put("Hình dạng", "");
            r.put("Diện tích (m2)", v.getDienTich() != null ? v.getDienTich().doubleValue() : 0.0);
            r.put("Cỡ tàu lớn nhất (DWT)", 0.0);

            String donVi = "";
            if (v.getDonViId() != null) {
                donVi = orgUnitRepository.findById(v.getDonViId())
                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                        .orElse("");
            }
            r.put("Đơn vị quản lý khai thác", donVi);
            r.put("Độ sâu theo thiết kế (m)", v.getDoSauMax() != null ? v.getDoSauMax().doubleValue() : 0.0);
            r.put("Độ sâu hiện tại (m)", v.getDoSauTrungBinh() != null ? v.getDoSauTrungBinh().doubleValue() : 0.0);
            r.put("Đã công bố", "");
            r.put("Năm công bố", "");
            r.put("Ghi chú", v.getLoaiVungNuoc() != null ? v.getLoaiVungNuoc().name() : "");
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

        Set<LoaiVungNuoc> filterSet = getLoaiVungNuocFilter(request.getReportCode());

        List<VungNuoc> vungNuocs = vungNuocRepository.findAll(Sort.unsorted()).stream()
                .filter(v -> filterSet.contains(v.getLoaiVungNuoc()))
                .filter(v -> skipFilter || targetUnitId.equals(v.getDonViId()))
                .filter(v -> v.getCreatedAt() == null || v.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        for (VungNuoc v : vungNuocs) {
            Map<String, Object> item = new HashMap<>();
            String tenVungNuoc = v.getTenVungNuoc() != null ? v.getTenVungNuoc() : "";
            double dienTich = v.getDienTich() != null ? v.getDienTich().doubleValue() : 0.0;
            double doSauMax = v.getDoSauMax() != null ? v.getDoSauMax().doubleValue() : 0.0;
            double doSauTrungBinh = v.getDoSauTrungBinh() != null ? v.getDoSauTrungBinh().doubleValue() : 0.0;

            item.put("ten", tenVungNuoc);
            item.put("code", v.getMaVungNuoc() != null ? v.getMaVungNuoc() : "");
            item.put("name", tenVungNuoc);
            item.put("description", v.getLoaiVungNuoc() != null ? v.getLoaiVungNuoc().name() : "");
            item.put("unitId", v.getDonViId() != null ? v.getDonViId().toString() : "");
            item.put("status", "");

            item.put("tenCangBien", tenVungNuoc);
            item.put("tenCang", tenVungNuoc);
            item.put("loaiTaiSan", tenVungNuoc);
            item.put("maTuyenLuong", v.getMaVungNuoc() != null ? v.getMaVungNuoc() : "");
            item.put("tenTramQuanLyLuong", tenVungNuoc);
            item.put("tenDiemNeo", tenVungNuoc);

            item.put("soLuongTram", 0.0);
            item.put("dienTich", dienTich);
            item.put("thoiDiemSuaChuaGanNhat", "");
            item.put("thoiDiemCongBo", "");
            item.put("ngaySuaChua", "");
            item.put("nhanSuBoTriTaiTramQlLuong", 0.0);
            item.put("nhanSuBoTriTaiTramQL", 0.0);
            item.put("soLuongNhanSuBoTri", 0.0);
            item.put("daiLuong", 0.0);
            item.put("rongLonNhat", 0.0);
            item.put("rongNhoNhat", 0.0);
            item.put("doSau", doSauMax);
            item.put("doSauThietKe", doSauMax);
            item.put("doSauKhuNuocTheoThietKe", doSauMax);
            item.put("maiDoc", 0.0);
            item.put("doSauHienTai", doSauTrungBinh);
            item.put("khoiLuongNaoVetDuyTu", 0.0);
            item.put("congCong", 0.0);
            item.put("chuyenDung", 0.0);
            item.put("chieuCaoTinhKhong", 0.0);

            String donVi = "";
            if (v.getDonViId() != null) {
                donVi = orgUnitRepository.findById(v.getDonViId())
                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                        .orElse("");
            }
            item.put("donViQuanLyVanHanh", donVi);
            arrResult.add(item);
        }
        return arrResult;
    }
}
