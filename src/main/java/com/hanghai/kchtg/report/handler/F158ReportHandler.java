package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.vts.entity.HeThongVTS;
import com.hanghai.kchtg.vts.entity.HeThongVTSApprovalStatus;
import com.hanghai.kchtg.vts.repository.HeThongVTSRepository;
import com.hanghai.kchtg.tramradar.entity.TramRadar;
import com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus;
import com.hanghai.kchtg.tramradar.repository.TramRadarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Component
public class F158ReportHandler extends BaseReportHandler {

    @Autowired private HeThongVTSRepository heThongVTSRepository;
    @Autowired private TramRadarRepository tramRadarRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-158".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        // Cache HeThongVTS lookup
        Map<Long, HeThongVTS> vtsCache = new HashMap<>();

        List<TramRadar> tramList = tramRadarRepository.findAll().stream()
                .filter(t -> t.getTrangThai() == TramRadarApprovalStatus.APPROVED)
                .filter(t -> t.getIsDeleted() == null || !t.getIsDeleted())
                .filter(t -> t.getNgaySuaDoi() == null || t.getNgaySuaDoi().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
            "STT", "Tên hệ thống", "Đơn vị quản lý, khai thác",
            "Phạm vi vùng phủ sóng", "Vị trí Trung tâm điều hành",
            "Vị trí, Địa danh", "Chiều cao tháp radar (m)", "Tầm hiệu lực radar"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        Set<Long> seenVtsIds = new HashSet<>();
        for (TramRadar tram : tramList) {
            Long vtsId = tram.getHeThongVtsId();
            if (vtsId == null) continue;

            HeThongVTS vts = vtsCache.computeIfAbsent(vtsId, id ->
                heThongVTSRepository.findById(id).orElse(null));
            if (vts == null) continue;
            if (vts.getTrangThai() != HeThongVTSApprovalStatus.APPROVED) continue;
            if (vts.getIsDeleted() != null && vts.getIsDeleted()) continue;
            if (!skipFilter && !targetUnitId.equals(vts.getOrgUnitId())) continue;
            if (vts.getNgaySuaDoi() != null && vts.getNgaySuaDoi().getYear() > reportYear) continue;

            boolean isFirst = seenVtsIds.add(vtsId);
            String donVi = resolveOrgName(vts.getOrgUnitId());

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên hệ thống", vts.getTenHeThong() != null ? vts.getTenHeThong() : "");
            r.put("Đơn vị quản lý, khai thác", donVi.isEmpty() ? "" : donVi + " - " + donVi);
            r.put("Phạm vi vùng phủ sóng", isFirst ? (vts.getPhamViApDung() != null ? vts.getPhamViApDung() : "") : "");
            r.put("Vị trí Trung tâm điều hành", vts.getViTri() != null ? vts.getViTri() : "");
            r.put("Vị trí, Địa danh", tram.getViTri() != null ? tram.getViTri() : "");
            r.put("Chiều cao tháp radar (m)", formatMeter(tram.getChieuCaoThapRadar(), "m"));
            r.put("Tầm hiệu lực radar", formatMeter(tram.getTamHieuLucRadar(), "Nm"));
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

        Map<Long, HeThongVTS> vtsCache = new HashMap<>();

        List<TramRadar> tramList = tramRadarRepository.findAll().stream()
                .filter(t -> t.getTrangThai() == TramRadarApprovalStatus.APPROVED)
                .filter(t -> t.getIsDeleted() == null || !t.getIsDeleted())
                .filter(t -> t.getNgaySuaDoi() == null || t.getNgaySuaDoi().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> arrResult = new ArrayList<>();
        Set<Long> seenVtsIds = new HashSet<>();
        for (TramRadar tram : tramList) {
            Long vtsId = tram.getHeThongVtsId();
            if (vtsId == null) continue;

            HeThongVTS vts = vtsCache.computeIfAbsent(vtsId, id ->
                heThongVTSRepository.findById(id).orElse(null));
            if (vts == null) continue;
            if (vts.getTrangThai() != HeThongVTSApprovalStatus.APPROVED) continue;
            if (vts.getIsDeleted() != null && vts.getIsDeleted()) continue;
            if (!skipFilter && !targetUnitId.equals(vts.getOrgUnitId())) continue;
            if (vts.getNgaySuaDoi() != null && vts.getNgaySuaDoi().getYear() > reportYear) continue;

            boolean isFirst = seenVtsIds.add(vtsId);

            Map<String, Object> item = new HashMap<>();
            item.put("ten", vts.getTenHeThong() != null ? vts.getTenHeThong() : "");
            item.put("fkDonViQl", vts.getOrgUnitId() != null ? resolveOrgName(vts.getOrgUnitId()) : "");
            item.put("fkDonViKt", vts.getOrgUnitId() != null ? resolveOrgName(vts.getOrgUnitId()) : "");
            item.put("vungPhuSong", isFirst ? (vts.getPhamViApDung() != null ? vts.getPhamViApDung() : "") : "");
            item.put("diaDiem", vts.getViTri() != null ? vts.getViTri() : "");
            item.put("soLuong", "");
            item.put("viTriDiaDanh", tram.getViTri() != null ? tram.getViTri() : "");
            item.put("chieuCaoThapRadar", formatMeter(tram.getChieuCaoThapRadar(), "m"));
            item.put("tamHieuLucRadar", formatMeter(tram.getTamHieuLucRadar(), "Nm"));
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
        return orgUnitRepository.findById(orgUnitId)
                .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                .orElse("");
    }
}
