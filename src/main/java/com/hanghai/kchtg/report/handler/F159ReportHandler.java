package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
import com.hanghai.kchtg.station.repository.CoastalStationHaiphongRepository;
import com.hanghai.kchtg.station.repository.CoastalStationInmarsatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Handler for F-159 / BCKCHT_174:
 * Biểu 12-N: Hệ thống các đài thông tin duyên hải.
 */
@Component
public class F159ReportHandler extends BaseReportHandler {

    @Autowired
    private CoastalStationHaiphongRepository coastalStationHaiphongRepository;

    @Autowired
    private CoastalStationInmarsatRepository coastalStationInmarsatRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-159".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<CoastalItem> items = loadStations(targetUnitId, skipFilter, reportYear);

        List<String> headers = List.of(
                "STT",
                "Tên đài thông tin duyên hải",
                "Địa điểm (Tỉnh/thành phố)",
                "Phạm vi vùng phủ sóng",
                "Dịch vụ cung cấp"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int seq = 1;
        for (CoastalItem item : items) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", seq++);
            r.put("Tên đài thông tin duyên hải", item.name);
            r.put("Địa điểm (Tỉnh/thành phố)", item.location);
            r.put("Phạm vi vùng phủ sóng", item.coverage);
            r.put("Dịch vụ cung cấp", item.services);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số đài thông tin duyên hải", items.size());

        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<CoastalItem> items = loadStations(targetUnitId, skipFilter, reportYear);

        List<Map<String, Object>> arrResult = new ArrayList<>();
        int seq = 1;
        for (CoastalItem item : items) {
            Map<String, Object> m = new HashMap<>();
            m.put("idx", seq++);
            m.put("ten", item.name);
            m.put("diaDiem", item.location);
            m.put("vungPhuSong", item.coverage);
            m.put("dichVuCungCap", item.services);
            arrResult.add(m);
        }

        return arrResult;
    }

    private List<CoastalItem> loadStations(UUID targetUnitId, boolean skipFilter, int reportYear) {
        List<CoastalItem> list = new ArrayList<>();

        List<CoastalStationHaiphong> hpList = coastalStationHaiphongRepository.findByDeletedAtIsNull().stream()
                .filter(s -> skipFilter || targetUnitId.equals(s.getOrgUnitId()) || targetUnitId.equals(s.getOperatingOrgId()))
                .filter(s -> s.getCreatedAt() == null || s.getCreatedAt().getYear() <= reportYear)
                .toList();

        for (CoastalStationHaiphong s : hpList) {
            String name = s.getName() != null ? s.getName() : s.getCode();
            String location = s.getLocationAddress() != null ? s.getLocationAddress() : "";
            if (location.isBlank() && s.getProvinceId() != null) {
                location = "Tỉnh/TP mã " + s.getProvinceId();
            }
            String coverage = s.getDescription() != null && !s.getDescription().isBlank()
                    ? s.getDescription() : "Vùng biển Việt Nam và quốc tế lân cận";
            String services = "Trực canh cấp cứu, an toàn hàng hải, GMDSS, thông tin thời tiết biển";
            list.add(new CoastalItem(name, location, coverage, services));
        }

        List<CoastalStationInmarsat> inmarsatList = coastalStationInmarsatRepository.findByDeletedAtIsNull().stream()
                .filter(s -> skipFilter || targetUnitId.equals(s.getOrgUnitId()) || targetUnitId.equals(s.getOperatingOrgId()))
                .filter(s -> s.getCreatedAt() == null || s.getCreatedAt().getYear() <= reportYear)
                .toList();

        for (CoastalStationInmarsat s : inmarsatList) {
            String name = s.getName() != null ? s.getName() : s.getCode();
            String location = s.getLocationAddress() != null ? s.getLocationAddress() : "";
            if (location.isBlank() && s.getProvinceId() != null) {
                location = "Tỉnh/TP mã " + s.getProvinceId();
            }
            String coverage = "Toàn cầu / Vệ tinh Inmarsat khu vực biển Ấn Độ Dương & Thái Bình Dương";
            String services = "Dịch vụ thông tin vệ tinh Inmarsat-C, báo động cấp cứu vệ tinh";
            list.add(new CoastalItem(name, location, coverage, services));
        }

        return list;
    }

    private static class CoastalItem {
        final String name;
        final String location;
        final String coverage;
        final String services;

        CoastalItem(String name, String location, String coverage, String services) {
            this.name = name != null ? name : "";
            this.location = location != null ? location : "";
            this.coverage = coverage != null ? coverage : "";
            this.services = services != null ? services : "";
        }
    }
}
