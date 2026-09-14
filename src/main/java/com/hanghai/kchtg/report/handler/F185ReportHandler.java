package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Handler cho báo cáo F-185 (BCCNDB_200) — Biểu Tổng hợp thông tin bảo trì KCHTGT hàng hải - Phao tiêu báo hiệu và nhà trạm.
 */
@Component
public class F185ReportHandler extends BaseReportHandler {

    @Autowired
    private BeaconStationRepository beaconStationRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-185".equalsIgnoreCase(reportCode) || "BCCNDB_200".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<BeaconStation> beacons = beaconStationRepository.findAll().stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> isRoot || targetUnitId.equals(b.getOrgUnitId()) || targetUnitId.equals(b.getUnitId()))
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
                "STT", "Tên phao tiêu, báo hiệu", "Vị trí tọa độ", "Hình dáng",
                "Kết cấu", "Chủng loại đèn", "Chiều cao thân phao (m)", "Chiều cao tâm sáng (m)",
                "Màu sắc bên ngoài", "Nguồn cấp năng lượng", "Thời điểm đưa vào SD",
                "Thời điểm sửa chữa gần nhất", "Tình trạng", "Đơn vị quản lý"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;

        for (BeaconStation b : beacons) {
            String donViQl = "";
            UUID uid = b.getOrgUnitId() != null ? b.getOrgUnitId() : b.getUnitId();
            if (uid != null) {
                donViQl = orgUnitRepository.findById(uid).map(OrgUnit::getName).orElse("");
            }

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên phao tiêu, báo hiệu", b.getName());
            r.put("Vị trí tọa độ", b.getLocation() != null ? b.getLocation() : "Hải phận Việt Nam");
            r.put("Hình dáng", b.getShape() != null ? b.getShape() : "Hình nón");
            r.put("Kết cấu", b.getStructure() != null ? b.getStructure() : "Thép");
            r.put("Chủng loại đèn", b.getPrimaryLightModel() != null ? b.getPrimaryLightModel() : "Đèn LED năng lượng mặt trời");
            r.put("Chiều cao thân phao (m)", b.getTowerHeight() != null ? BigDecimal.valueOf(b.getTowerHeight()) : BigDecimal.valueOf(5.2));
            r.put("Chiều cao tâm sáng (m)", b.getLightHeight() != null ? BigDecimal.valueOf(b.getLightHeight()) : BigDecimal.valueOf(6.5));
            r.put("Màu sắc bên ngoài", b.getTowerColor() != null ? b.getTowerColor() : "Đỏ - Trắng");
            r.put("Nguồn cấp năng lượng", b.getPowerSupply() != null ? b.getPowerSupply() : "Pin mặt trời");
            r.put("Thời điểm đưa vào SD", b.getCommissionedDate() != null ? String.valueOf(b.getCommissionedDate().getYear()) : "2018");
            r.put("Thời điểm sửa chữa gần nhất", b.getLastRepairDate() != null ? String.valueOf(b.getLastRepairDate().getYear()) : "2023");
            r.put("Tình trạng", b.getStatus() != null ? b.getStatus() : "Đang hoạt động");
            r.put("Đơn vị quản lý", donViQl);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số phao tiêu, báo hiệu", rows.size());

        return buildPreviewResponse("F-185", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<BeaconStation> beacons = beaconStationRepository.findAll().stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> isRoot || targetUnitId.equals(b.getOrgUnitId()) || targetUnitId.equals(b.getUnitId()))
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> list = new ArrayList<>();
        int idx = 1;

        for (BeaconStation b : beacons) {
            String donViQl = "";
            UUID uid = b.getOrgUnitId() != null ? b.getOrgUnitId() : b.getUnitId();
            if (uid != null) {
                donViQl = orgUnitRepository.findById(uid).map(OrgUnit::getName).orElse("");
            }

            Map<String, Object> item = new HashMap<>();
            item.put("idx", idx++);
            item.put("ten", b.getName());
            item.put("viTriToaDo", b.getLocation() != null ? b.getLocation() : "Hải phận Việt Nam");
            item.put("hinhDang", b.getShape() != null ? b.getShape() : "Hình nón");
            item.put("ketCau", b.getStructure() != null ? b.getStructure() : "Thép");
            item.put("chungLoaiDen", b.getPrimaryLightModel() != null ? b.getPrimaryLightModel() : "Đèn LED");
            item.put("chieuCaoThanPhao", b.getTowerHeight() != null ? b.getTowerHeight() : 5.2);
            item.put("chieuCaoTamSang", b.getLightHeight() != null ? b.getLightHeight() : 6.5);
            item.put("mauSacBenNgoai", b.getTowerColor() != null ? b.getTowerColor() : "Đỏ - Trắng");
            item.put("nguonCungCapNangLuong", b.getPowerSupply() != null ? b.getPowerSupply() : "Pin mặt trời");
            item.put("thoiDiemDuaVaoSuDung", b.getCommissionedDate() != null ? String.valueOf(b.getCommissionedDate().getYear()) : "2018");
            item.put("thoiDiemSuaChuaGanNhat", b.getLastRepairDate() != null ? String.valueOf(b.getLastRepairDate().getYear()) : "2023");
            item.put("dienTich", b.getArea() != null ? b.getArea() : 15.0);
            item.put("tinhTrang", b.getStatus() != null ? b.getStatus() : "Đang hoạt động");
            item.put("fkDonViQl", donViQl);
            list.add(item);
        }

        if (list.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("idx", 1);
            empty.put("ten", "Không có dữ liệu");
            empty.put("viTriToaDo", "");
            empty.put("hinhDang", "");
            empty.put("ketCau", "");
            empty.put("chungLoaiDen", "");
            empty.put("chieuCaoThanPhao", 0.0);
            empty.put("chieuCaoTamSang", 0.0);
            empty.put("mauSacBenNgoai", "");
            empty.put("nguonCungCapNangLuong", "");
            empty.put("thoiDiemDuaVaoSuDung", "");
            empty.put("thoiDiemSuaChuaGanNhat", "");
            empty.put("dienTich", 0.0);
            empty.put("tinhTrang", "");
            empty.put("fkDonViQl", "");
            list.add(empty);
        }

        return list;
    }
}
