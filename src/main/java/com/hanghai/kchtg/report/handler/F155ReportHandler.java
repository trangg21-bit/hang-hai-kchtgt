package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class F155ReportHandler extends BaseReportHandler {

    @Autowired
    private BeaconStationRepository beaconStationRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-155".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<BeaconStation> beacons = beaconStationRepository.findAll().stream()
                .filter(b -> "APPROVED_L2".equals(b.getStatus()))
                .filter(b -> b.getIsActive() != null && b.getIsActive())
                .filter(b -> skipFilter || targetUnitId.equals(b.getUnitId()))
                .filter(b -> b.getUpdatedAt() == null || b.getUpdatedAt().getYear() <= reportYear)
                .toList();

        // Group by type
        Map<String, List<BeaconStation>> grouped = new LinkedHashMap<>();
        for (BeaconStation b : beacons) {
            grouped.computeIfAbsent(b.getType(), k -> new ArrayList<>()).add(b);
        }

        List<String> headers = List.of(
            "STT", "Tên đèn biển", "Địa điểm đặt trạm đèn", "Hình dáng", "Kết cấu",
            "Diện tích (m2)", "Chiều cao tháp đèn (m)", "Chiều cao tâm sáng (m)",
            "Tầm hiệu lực địa lý (Hải lý)", "Tầm hiệu lực ánh sáng (Hải lý)",
            "Đèn chính", "Đèn dự phòng", "Màu sắc bên ngoài của tháp đèn",
            "Nguồn cung cấp năng lượng", "Thời điểm sửa chữa gần nhất",
            "Nhân sự bố trí (người)", "Diện tích sử dụng trạm (m2)", "Đơn vị quản lý"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Map.Entry<String, List<BeaconStation>> entry : grouped.entrySet()) {
            String capLabel;
            if ("LIGHTHOUSE".equals(entry.getKey())) capLabel = "Cấp I";
            else if ("BEACON_LIGHT".equals(entry.getKey())) capLabel = "Cấp II";
            else if ("BEACON_MARK".equals(entry.getKey())) capLabel = "Cấp III";
            else capLabel = entry.getKey();

            // Section header row
            Map<String, Object> headerRow = new LinkedHashMap<>();
            headerRow.put("STT", ""); // Empty — section label only in "Tên đèn biển" column
            headerRow.put("Tên đèn biển", capLabel);
            headerRow.put("Địa điểm đặt trạm đèn", "");
            headerRow.put("Hình dáng", "");
            headerRow.put("Kết cấu", "");
            headerRow.put("Diện tích (m2)", "");
            headerRow.put("Chiều cao tháp đèn (m)", "");
            headerRow.put("Chiều cao tâm sáng (m)", "");
            headerRow.put("Tầm hiệu lực địa lý (Hải lý)", "");
            headerRow.put("Tầm hiệu lực ánh sáng (Hải lý)", "");
            headerRow.put("Đèn chính", "");
            headerRow.put("Đèn dự phòng", "");
            headerRow.put("Màu sắc bên ngoài của tháp đèn", "");
            headerRow.put("Nguồn cung cấp năng lượng", "");
            headerRow.put("Thời điểm sửa chữa gần nhất", "");
            headerRow.put("Nhân sự bố trí (người)", "");
            headerRow.put("Diện tích sử dụng trạm (m2)", "");
            headerRow.put("Đơn vị quản lý", "");
            rows.add(headerRow);

            // Data rows
            int sequenceNo = 1;
            for (BeaconStation b : entry.getValue()) {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("STT", sequenceNo++);
                r.put("Tên đèn biển", b.getName() != null ? b.getName() : "");
                r.put("Địa điểm đặt trạm đèn", b.getLocation() != null ? b.getLocation() : "");
                r.put("Hình dáng", b.getShape() != null ? b.getShape() : "");
                r.put("Kết cấu", b.getStructure() != null ? b.getStructure() : "");
                r.put("Diện tích (m2)", b.getArea() != null ? b.getArea() : "");
                r.put("Chiều cao tháp đèn (m)", b.getTowerHeight() != null ? b.getTowerHeight() : "");
                r.put("Chiều cao tâm sáng (m)", b.getLightHeight() != null ? b.getLightHeight() : "");
                r.put("Tầm hiệu lực địa lý (Hải lý)", b.getGeographicRange() != null ? b.getGeographicRange() : "");
                r.put("Tầm hiệu lực ánh sáng (Hải lý)", b.getLightRange() != null ? b.getLightRange() : "");
                r.put("Đèn chính", b.getPrimaryLightModel() != null ? b.getPrimaryLightModel() : "");
                r.put("Đèn dự phòng", b.getBackupLightModel() != null ? b.getBackupLightModel() : "");
                r.put("Màu sắc bên ngoài của tháp đèn", b.getTowerColor() != null ? b.getTowerColor() : "");
                r.put("Nguồn cung cấp năng lượng", b.getPowerSupply() != null ? b.getPowerSupply() : "");
                r.put("Thời điểm sửa chữa gần nhất", b.getLastRepairDate() != null ? b.getLastRepairDate().toString() : "");
                r.put("Nhân sự bố trí (người)", b.getStaffCount() != null ? b.getStaffCount() : "");
                r.put("Diện tích sử dụng trạm (m2)", b.getStationArea() != null ? b.getStationArea() : "");
                String donVi = "";
                if (b.getUnitId() != null) {
                    donVi = orgUnitRepository.findById(b.getUnitId())
                            .map(OrgUnit::getName)
                            .orElse("");
                }
                r.put("Đơn vị quản lý", donVi);
                rows.add(r);
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số bản ghi", beacons.size());

        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<BeaconStation> beacons = beaconStationRepository.findAll().stream()
                .filter(b -> "APPROVED_L2".equals(b.getStatus()))
                .filter(b -> b.getIsActive() != null && b.getIsActive())
                .filter(b -> skipFilter || targetUnitId.equals(b.getUnitId()))
                .filter(b -> b.getUpdatedAt() == null || b.getUpdatedAt().getYear() <= reportYear)
                .toList();

        // Group by type
        Map<String, List<BeaconStation>> grouped = new LinkedHashMap<>();
        for (BeaconStation b : beacons) {
            grouped.computeIfAbsent(b.getType(), k -> new ArrayList<>()).add(b);
        }

        List<Map<String, Object>> arrResult = new ArrayList<>();
        for (Map.Entry<String, List<BeaconStation>> entry : grouped.entrySet()) {
            // Section header as a regular data item
            String capLabel;
            if ("LIGHTHOUSE".equals(entry.getKey())) capLabel = "Cấp I";
            else if ("BEACON_LIGHT".equals(entry.getKey())) capLabel = "Cấp II";
            else if ("BEACON_MARK".equals(entry.getKey())) capLabel = "Cấp III";
            else capLabel = entry.getKey();

            Map<String, Object> headerItem = new HashMap<>();
            headerItem.put("ten", capLabel);
            headerItem.put("code", null);
            headerItem.put("name", capLabel);
            headerItem.put("description", null);
            headerItem.put("unitId", null);
            headerItem.put("status", null);
            headerItem.put("diaDiem", null);
            headerItem.put("shape", null);
            headerItem.put("structure", null);
            headerItem.put("area", null);
            headerItem.put("towerHeight", null);
            headerItem.put("lightHeight", null);
            headerItem.put("geographicRange", null);
            headerItem.put("lightRange", null);
            headerItem.put("primaryLightModel", null);
            headerItem.put("backupLightModel", null);
            headerItem.put("towerColor", null);
            headerItem.put("powerSupply", null);
            headerItem.put("lastRepairDate", null);
            headerItem.put("staffCount", null);
            headerItem.put("dienTichTram", null);
            headerItem.put("donViQuanLy", null);
            headerItem.put("key", capLabel);
            arrResult.add(headerItem);

            // Data items
            for (BeaconStation b : entry.getValue()) {
                Map<String, Object> item = new HashMap<>();
                item.put("ten", b.getName() != null ? b.getName() : "");
                item.put("code", b.getCode() != null ? b.getCode() : "");
                item.put("name", b.getName() != null ? b.getName() : "");
                item.put("description", b.getLocation() != null ? b.getLocation() : "");
                item.put("unitId", b.getUnitId() != null ? b.getUnitId().toString() : "");
                item.put("status", b.getStatus() != null ? b.getStatus() : "");
                item.put("diaDiem", b.getLocation() != null ? b.getLocation() : "");
                item.put("shape", b.getShape() != null ? b.getShape() : "");
                item.put("structure", b.getStructure() != null ? b.getStructure() : "");
                item.put("area", b.getArea() != null ? b.getArea() : 0.0);
                item.put("towerHeight", b.getTowerHeight() != null ? b.getTowerHeight() : 0.0);
                item.put("lightHeight", b.getLightHeight() != null ? b.getLightHeight() : 0.0);
                item.put("geographicRange", b.getGeographicRange() != null ? b.getGeographicRange() : "");
                item.put("lightRange", b.getLightRange() != null ? b.getLightRange() : 0.0);
                item.put("primaryLightModel", b.getPrimaryLightModel() != null ? b.getPrimaryLightModel() : "");
                item.put("backupLightModel", b.getBackupLightModel() != null ? b.getBackupLightModel() : "");
                item.put("towerColor", b.getTowerColor() != null ? b.getTowerColor() : "");
                item.put("powerSupply", b.getPowerSupply() != null ? b.getPowerSupply() : "");
                item.put("lastRepairDate", b.getLastRepairDate() != null ? b.getLastRepairDate().toString() : "");
                item.put("staffCount", b.getStaffCount() != null ? b.getStaffCount() : 0);
                item.put("dienTichTram", b.getStationArea() != null ? b.getStationArea() : 0.0);
                String donVi = "";
                if (b.getUnitId() != null) {
                    donVi = orgUnitRepository.findById(b.getUnitId())
                            .map(OrgUnit::getName)
                            .orElse("");
                }
                item.put("donViQuanLy", donVi);
                item.put("key", b.getName() != null ? b.getName() : "");
                arrResult.add(item);
            }
        }
        return arrResult;
    }
}
