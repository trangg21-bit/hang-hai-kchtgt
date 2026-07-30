package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.port.entity.WaterZone;
import com.hanghai.kchtg.port.entity.WaterZoneType;
import com.hanghai.kchtg.port.repository.WaterZoneRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class F152ToF154ReportHandler extends BaseReportHandler {

    @Autowired
    private WaterZoneRepository waterZoneRepository;

    @Autowired
    private LineObjectRepository lineObjectRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-152".equalsIgnoreCase(reportCode)
                || "F-153".equalsIgnoreCase(reportCode)
                || "F-154".equalsIgnoreCase(reportCode);
    }

    private Set<WaterZoneType> getWaterZoneTypeFilter(String reportCode) {
        Set<WaterZoneType> filterSet = new HashSet<>();
        if ("F-152".equalsIgnoreCase(reportCode)) {
            filterSet.add(WaterZoneType.PILOT_BOARDING);
            filterSet.add(WaterZoneType.TURNING_BASIN);
            filterSet.add(WaterZoneType.ANCHORAGE);
            filterSet.add(WaterZoneType.STORM_SHELTER);
        } else if ("F-153".equalsIgnoreCase(reportCode)) {
            filterSet.add(WaterZoneType.TRANSSHIPMENT);
            filterSet.add(WaterZoneType.ANCHORAGE);
        } else if ("F-154".equalsIgnoreCase(reportCode)) {
            filterSet.add(WaterZoneType.MOORING_BUOY);
            filterSet.add(WaterZoneType.ANCHORAGE);
        }
        return filterSet;
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        Set<WaterZoneType> filterSet = getWaterZoneTypeFilter(request.getReportCode());

        List<WaterZone> waterZones = waterZoneRepository.findAll(Sort.unsorted()).stream()
                .filter(v -> filterSet.contains(v.getWaterZoneType()))
                .filter(v -> skipFilter || targetUnitId.equals(v.getOrgUnitId()))
                .filter(v -> v.getCreatedAt() == null || v.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
                "STT", "Chỉ tiêu", "Vị trí, tọa độ", "Hình dạng", "Diện tích (m2)",
                "Cỡ tàu lớn nhất (DWT)", "Đơn vị quản lý khai thác",
                "Độ sâu theo thiết kế (m)", "Độ sâu hiện tại (m)",
                "Đã công bố", "Năm công bố", "Ghi chú"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int sequenceNo = 1;
        for (WaterZone v : waterZones) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", sequenceNo++);
            r.put("Chỉ tiêu", v.getWaterZoneName() != null ? v.getWaterZoneName() : "");

            // JOIN spatialId → LineObject.coordinates
            String coordinates = "";
            if (v.getSpatialId() != null) {
                Optional<LineObject> lineOpt = lineObjectRepository.findById(v.getSpatialId());
                if (lineOpt.isPresent() && lineOpt.get().getCoordinates() != null) {
                    coordinates = lineOpt.get().getCoordinates();
                }
            }
            r.put("Vị trí, tọa độ", coordinates);
            r.put("Hình dạng", "");
            r.put("Diện tích (m2)", v.getArea() != null ? v.getArea().doubleValue() : 0.0);
            r.put("Cỡ tàu lớn nhất (DWT)", 0.0);

            String donVi = "";
            if (v.getOrgUnitId() != null) {
                donVi = orgUnitRepository.findById(v.getOrgUnitId())
                        .map(OrgUnit::getName)
                        .orElse("");
            }
            r.put("Đơn vị quản lý khai thác", donVi);
            r.put("Độ sâu theo thiết kế (m)", v.getMaxDepth() != null ? v.getMaxDepth().doubleValue() : 0.0);
            r.put("Độ sâu hiện tại (m)", v.getAvgDepth() != null ? v.getAvgDepth().doubleValue() : 0.0);
            r.put("Đã công bố", "");
            r.put("Năm công bố", "");
            r.put("Ghi chú", v.getWaterZoneType() != null ? v.getWaterZoneType().name() : "");
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

        Set<WaterZoneType> filterSet = getWaterZoneTypeFilter(request.getReportCode());

        List<WaterZone> waterZones = waterZoneRepository.findAll(Sort.unsorted()).stream()
                .filter(v -> filterSet.contains(v.getWaterZoneType()))
                .filter(v -> skipFilter || targetUnitId.equals(v.getOrgUnitId()))
                .filter(v -> v.getCreatedAt() == null || v.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        for (WaterZone v : waterZones) {
            Map<String, Object> item = new HashMap<>();
            String waterZoneName = v.getWaterZoneName() != null ? v.getWaterZoneName() : "";
            double area = v.getArea() != null ? v.getArea().doubleValue() : 0.0;
            double maxDepth = v.getMaxDepth() != null ? v.getMaxDepth().doubleValue() : 0.0;
            double avgDepth = v.getAvgDepth() != null ? v.getAvgDepth().doubleValue() : 0.0;

            item.put("ten", waterZoneName);
            item.put("code", v.getWaterZoneCode() != null ? v.getWaterZoneCode() : "");
            item.put("name", waterZoneName);
            item.put("description", v.getWaterZoneType() != null ? v.getWaterZoneType().name() : "");
            item.put("unitId", v.getOrgUnitId() != null ? v.getOrgUnitId().toString() : "");
            item.put("status", "");

            item.put("tenCangBien", waterZoneName);
            item.put("tenCang", waterZoneName);
            item.put("loaiTaiSan", waterZoneName);
            item.put("maTuyenLuong", v.getWaterZoneCode() != null ? v.getWaterZoneCode() : "");
            item.put("tenTramQuanLyLuong", waterZoneName);
            item.put("tenDiemNeo", waterZoneName);

            item.put("soLuongTram", 0.0);
            item.put("dienTich", area);
            item.put("thoiDiemSuaChuaGanNhat", "");
            item.put("thoiDiemCongBo", "");
            item.put("ngaySuaChua", "");
            item.put("nhanSuBoTriTaiTramQlLuong", 0.0);
            item.put("nhanSuBoTriTaiTramQL", 0.0);
            item.put("soLuongNhanSuBoTri", 0.0);
            item.put("daiLuong", 0.0);
            item.put("rongLonNhat", 0.0);
            item.put("rongNhoNhat", 0.0);
            item.put("doSau", maxDepth);
            item.put("doSauThietKe", maxDepth);
            item.put("doSauKhuNuocTheoThietKe", maxDepth);
            item.put("maiDoc", 0.0);
            item.put("doSauHienTai", avgDepth);
            item.put("khoiLuongNaoVetDuyTu", 0.0);
            item.put("congCong", 0.0);
            item.put("chuyenDung", 0.0);
            item.put("chieuCaoTinhKhong", 0.0);

            String donVi = "";
            if (v.getOrgUnitId() != null) {
                donVi = orgUnitRepository.findById(v.getOrgUnitId())
                        .map(OrgUnit::getName)
                        .orElse("");
            }
            item.put("donViQuanLyVanHanh", donVi);
            arrResult.add(item);
        }
        return arrResult;
    }
}
