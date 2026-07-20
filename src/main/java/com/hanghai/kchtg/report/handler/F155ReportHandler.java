package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.beacon.entity.BeaconLight;
import com.hanghai.kchtg.beacon.entity.BeaconApprovalStatus;
import com.hanghai.kchtg.beacon.entity.BeaconStatus;
import com.hanghai.kchtg.beacon.entity.BeaconLightType;
import com.hanghai.kchtg.beacon.repository.BeaconLightRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class F155ReportHandler extends BaseReportHandler {

    @Autowired
    private BeaconLightRepository beaconLightRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-155".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<BeaconLight> beacons = beaconLightRepository.findAll().stream()
                .filter(b -> b.getStatus() == BeaconStatus.APPROVED_L2)
                .filter(b -> b.getIsActive() != null && b.getIsActive())
                .filter(b -> skipFilter || targetUnitId.equals(b.getUnitId()))
                .filter(b -> b.getUpdatedAt() == null || b.getUpdatedAt().getYear() <= reportYear)
                .toList();

        // Group by type
        Map<BeaconLightType, List<BeaconLight>> grouped = new LinkedHashMap<>();
        for (BeaconLight b : beacons) {
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
        for (Map.Entry<BeaconLightType, List<BeaconLight>> entry : grouped.entrySet()) {
            String capLabel;
            if (entry.getKey() == BeaconLightType.LIGHTHOUSE) capLabel = "Cấp I";
            else if (entry.getKey() == BeaconLightType.BEACON_LIGHT) capLabel = "Cấp II";
            else if (entry.getKey() == BeaconLightType.BEACON_MARK) capLabel = "Cấp III";
            else capLabel = entry.getKey().name();

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
            int stt = 1;
            for (BeaconLight b : entry.getValue()) {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("STT", stt++);
                r.put("Tên đèn biển", b.getName() != null ? b.getName() : "");
                r.put("Địa điểm đặt trạm đèn", b.getDescription() != null ? b.getDescription() : "");
                r.put("Hình dáng", b.getHinhDang() != null ? b.getHinhDang() : "");
                r.put("Kết cấu", b.getKetCau() != null ? b.getKetCau() : "");
                r.put("Diện tích (m2)", b.getRange() != null ? b.getRange() : "");
                r.put("Chiều cao tháp đèn (m)", b.getChieuCaoThapDen() != null ? b.getChieuCaoThapDen() : "");
                r.put("Chiều cao tâm sáng (m)", b.getChieuCaoTamSang() != null ? b.getChieuCaoTamSang() : "");
                r.put("Tầm hiệu lực địa lý (Hải lý)", b.getTamHieuLucDiaLy() != null ? b.getTamHieuLucDiaLy() : "");
                r.put("Tầm hiệu lực ánh sáng (Hải lý)", b.getLightRange() != null ? b.getLightRange() : "");
                r.put("Đèn chính", b.getLightCharacteristic() != null ? b.getLightCharacteristic() : "");
                r.put("Đèn dự phòng", b.getChungLoaiDenDuPhong() != null ? b.getChungLoaiDenDuPhong() : "");
                r.put("Màu sắc bên ngoài của tháp đèn", b.getLightColor() != null ? b.getLightColor() : "");
                r.put("Nguồn cung cấp năng lượng", b.getNguonCungCapNangLuongChoDen() != null ? b.getNguonCungCapNangLuongChoDen() : "");
                r.put("Thời điểm sửa chữa gần nhất", b.getLastMaintenanceDate() != null ? b.getLastMaintenanceDate().toString() : "");
                r.put("Nhân sự bố trí (người)", b.getSoLuongNhanSuBoTri() != null ? b.getSoLuongNhanSuBoTri() : "");
                r.put("Diện tích sử dụng trạm (m2)", b.getDienTichSuDungTram() != null ? b.getDienTichSuDungTram() : "");
                String donVi = "";
                if (b.getUnitId() != null) {
                    donVi = orgUnitRepository.findById(b.getUnitId())
                            .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
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

        List<BeaconLight> beacons = beaconLightRepository.findAll().stream()
                .filter(b -> b.getStatus() == BeaconStatus.APPROVED_L2)
                .filter(b -> b.getIsActive() != null && b.getIsActive())
                .filter(b -> skipFilter || targetUnitId.equals(b.getUnitId()))
                .filter(b -> b.getUpdatedAt() == null || b.getUpdatedAt().getYear() <= reportYear)
                .toList();

        // Group by type for section headers
        Map<BeaconLightType, List<BeaconLight>> grouped = new LinkedHashMap<>();
        for (BeaconLight b : beacons) {
            grouped.computeIfAbsent(b.getType(), k -> new ArrayList<>()).add(b);
        }

        List<Map<String, Object>> arrResult = new ArrayList<>();
        for (Map.Entry<BeaconLightType, List<BeaconLight>> entry : grouped.entrySet()) {
            // Section header as a regular data item
            String capLabel;
            if (entry.getKey() == BeaconLightType.LIGHTHOUSE) capLabel = "Cấp I";
            else if (entry.getKey() == BeaconLightType.BEACON_LIGHT) capLabel = "Cấp II";
            else if (entry.getKey() == BeaconLightType.BEACON_MARK) capLabel = "Cấp III";
            else capLabel = entry.getKey().name();

            Map<String, Object> headerItem = new HashMap<>();
            headerItem.put("ten", capLabel);
            headerItem.put("code", null);
            headerItem.put("name", capLabel);
            headerItem.put("description", null);
            headerItem.put("unitId", null);
            headerItem.put("status", null);
            headerItem.put("diaDiemDatTramDen", null);
            headerItem.put("hinhDang", null);
            headerItem.put("ketCau", null);
            headerItem.put("dienTich", null);
            headerItem.put("chieuCaoThapDen", null);
            headerItem.put("chieuCaoTamSang", null);
            headerItem.put("tamHieuLucDiaLy", null);
            headerItem.put("tamHieuLucAnhSang", null);
            headerItem.put("chungLoaiDenChinh", null);
            headerItem.put("chungLoaiDenDuPhong", null);
            headerItem.put("mauSacBenNgoaiCuaThapDen", null);
            headerItem.put("nguonCungCapNangLuongChoDen", null);
            headerItem.put("ngaySuaChua", null);
            headerItem.put("soLuongNhanSuBoTri", null);
            headerItem.put("dienTichSuDungTram", null);
            headerItem.put("donViQuanLy", null);
            headerItem.put("key", capLabel);
            arrResult.add(headerItem);

            // Data items
            for (BeaconLight b : entry.getValue()) {
                Map<String, Object> item = new HashMap<>();
                item.put("ten", b.getName() != null ? b.getName() : "");
                item.put("code", b.getCode() != null ? b.getCode() : "");
                item.put("name", b.getName() != null ? b.getName() : "");
                item.put("description", b.getDescription() != null ? b.getDescription() : "");
                item.put("unitId", b.getUnitId() != null ? b.getUnitId().toString() : "");
                item.put("status", b.getStatus() != null ? b.getStatus().name() : "");
                item.put("diaDiemDatTramDen", b.getDescription() != null ? b.getDescription() : "");
                item.put("hinhDang", b.getHinhDang() != null ? b.getHinhDang() : "");
                item.put("ketCau", b.getKetCau() != null ? b.getKetCau() : "");
                item.put("dienTich", b.getRange() != null ? b.getRange() : 0.0);
                item.put("chieuCaoThapDen", b.getChieuCaoThapDen() != null ? b.getChieuCaoThapDen() : 0.0);
                item.put("chieuCaoTamSang", b.getChieuCaoTamSang() != null ? b.getChieuCaoTamSang() : 0.0);
                item.put("tamHieuLucDiaLy", b.getTamHieuLucDiaLy() != null ? b.getTamHieuLucDiaLy() : "");
                item.put("tamHieuLucAnhSang", b.getLightRange() != null ? b.getLightRange() : 0.0);
                item.put("chungLoaiDenChinh", b.getLightCharacteristic() != null ? b.getLightCharacteristic() : "");
                item.put("chungLoaiDenDuPhong", b.getChungLoaiDenDuPhong() != null ? b.getChungLoaiDenDuPhong() : "");
                item.put("mauSacBenNgoaiCuaThapDen", b.getLightColor() != null ? b.getLightColor() : "");
                item.put("nguonCungCapNangLuongChoDen", b.getNguonCungCapNangLuongChoDen() != null ? b.getNguonCungCapNangLuongChoDen() : "");
                item.put("ngaySuaChua", b.getLastMaintenanceDate() != null ? b.getLastMaintenanceDate().toString() : "");
                item.put("soLuongNhanSuBoTri", b.getSoLuongNhanSuBoTri() != null ? b.getSoLuongNhanSuBoTri() : 0);
                item.put("dienTichSuDungTram", b.getDienTichSuDungTram() != null ? b.getDienTichSuDungTram() : 0.0);
                String donVi = "";
                if (b.getUnitId() != null) {
                    donVi = orgUnitRepository.findById(b.getUnitId())
                            .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
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
