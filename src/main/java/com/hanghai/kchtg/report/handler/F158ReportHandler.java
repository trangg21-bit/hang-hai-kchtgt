package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Component
public class F158ReportHandler extends BaseReportHandler {

    @Autowired private VtsSystemRepository vtsSystemRepository;
    @Autowired private RadarStationRepository radarStationRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-158".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        // Cache VtsSystem lookup
        Map<UUID, VtsSystem> vtsCache = new HashMap<>();

        List<RadarStation> stationList = radarStationRepository.findAll().stream()
                .filter(t -> t.getApprovalStatus() == ApprovalStatus.APPROVED)
                .filter(t -> t.getDeletedAt() == null)
                .filter(t -> t.getUpdatedAt() == null || t.getUpdatedAt().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
            "STT", "Tên hệ thống", "Đơn vị quản lý, khai thác",
            "Phạm vi vùng phủ sóng", "Vị trí Trung tâm điều hành",
            "Vị trí, Địa danh", "Chiều cao tháp radar (m)", "Tầm hiệu lực radar"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int sequenceNo = 1;
        Set<UUID> seenVtsIds = new HashSet<>();
        for (RadarStation station : stationList) {
            UUID vtsId = station.getVtsSystemId();
            if (vtsId == null) continue;

            VtsSystem vts = vtsCache.computeIfAbsent(vtsId, id ->
                vtsSystemRepository.findById(id).orElse(null));
            if (vts == null) continue;
            if (!"APPROVED".equals(vts.getApprovalStatus())) continue;
            if (vts.getDeletedAt() != null) continue;
            if (!skipFilter && !targetUnitId.equals(vts.getOrgUnitId())) continue;
            if (vts.getUpdatedAt() != null && vts.getUpdatedAt().getYear() > reportYear) continue;

            boolean isFirst = seenVtsIds.add(vtsId);
            String donVi = resolveOrgName(vts.getOrgUnitId());

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", sequenceNo++);
            r.put("Tên hệ thống", vts.getSystemName() != null ? vts.getSystemName() : "");
            r.put("Đơn vị quản lý, khai thác", donVi.isEmpty() ? "" : donVi + " - " + donVi);
            r.put("Phạm vi vùng phủ sóng", isFirst ? (vts.getScope() != null ? vts.getScope() : "") : "");
            r.put("Vị trí Trung tâm điều hành", vts.getAddress() != null ? vts.getAddress() : (vts.getProvinceId() != null ? String.valueOf(vts.getProvinceId()) : ""));
            r.put("Vị trí, Địa danh", station.getLocation() != null ? station.getLocation() : "");
            r.put("Chiều cao tháp radar (m)", formatMeter(station.getTowerHeight(), "m"));
            r.put("Tầm hiệu lực radar", formatMeter(station.getRadarRange(), "Nm"));
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

        Map<UUID, VtsSystem> vtsCache = new HashMap<>();

        List<RadarStation> stationList = radarStationRepository.findAll().stream()
                .filter(t -> t.getApprovalStatus() == ApprovalStatus.APPROVED)
                .filter(t -> t.getDeletedAt() == null)
                .filter(t -> t.getUpdatedAt() == null || t.getUpdatedAt().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        Set<UUID> seenVtsIds = new HashSet<>();
        for (RadarStation station : stationList) {
            UUID vtsId = station.getVtsSystemId();
            if (vtsId == null) continue;

            VtsSystem vts = vtsCache.computeIfAbsent(vtsId, id ->
                vtsSystemRepository.findById(id).orElse(null));
            if (vts == null) continue;
            if (!"APPROVED".equals(vts.getApprovalStatus())) continue;
            if (vts.getDeletedAt() != null) continue;
            if (!skipFilter && !targetUnitId.equals(vts.getOrgUnitId())) continue;
            if (vts.getUpdatedAt() != null && vts.getUpdatedAt().getYear() > reportYear) continue;

            boolean isFirst = seenVtsIds.add(vtsId);

            Map<String, Object> item = new HashMap<>();
            item.put("ten", vts.getSystemName() != null ? vts.getSystemName() : "");
            item.put("fkDonViQl", vts.getOrgUnitId() != null ? resolveOrgName(vts.getOrgUnitId()) : "");
            item.put("fkDonViKt", vts.getOrgUnitId() != null ? resolveOrgName(vts.getOrgUnitId()) : "");
            item.put("vungPhuSong", isFirst ? (vts.getScope() != null ? vts.getScope() : "") : "");
            item.put("diaDiem", vts.getAddress() != null ? vts.getAddress() : (vts.getProvinceId() != null ? String.valueOf(vts.getProvinceId()) : ""));
            item.put("soLuong", "");
            item.put("viTriDiaDanh", station.getLocation() != null ? station.getLocation() : "");
            item.put("chieuCaoThapRadar", formatMeter(station.getTowerHeight(), "m"));
            item.put("tamHieuLucRadar", formatMeter(station.getRadarRange(), "Nm"));
            item.put("donViQuanLyKhaiThac", resolveOrgName(vts.getOrgUnitId()));
            arrResult.add(item);
        }
        return arrResult;
    }

    private String formatMeter(BigDecimal value, String unit) {
        if (value == null) return "";
        String plain = value.stripTrailingZeros().toPlainString();
        return plain.replace('.', ',') + unit;
    }

    private String resolveOrgName(UUID orgUnitId) {
        if (orgUnitId == null) return "";
        String name = orgUnitCacheService.getName(orgUnitId);
        return name != null ? name : "";
    }
}
