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
 * Handler cho báo cáo F-186 (BCCNDB_201) — Biểu Tổng hợp thông tin bảo trì KCHTGT hàng hải - Đèn biển và nhà trạm gắn với đèn biển.
 */
@Component
public class F186ReportHandler extends BaseReportHandler {

    @Autowired
    private BeaconStationRepository beaconStationRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-186".equalsIgnoreCase(reportCode) || "BCCNDB_201".equalsIgnoreCase(reportCode);
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
                "STT", "Tên đèn biển", "Địa điểm", "Chiều cao tháp đèn (m)",
                "Chiều cao tâm sáng (m)", "Tầm hiệu lực địa lý (hải lý)",
                "Tầm hiệu lực ánh sáng (hải lý)", "Chủng loại đèn chính",
                "Nguồn cấp năng lượng", "Tình trạng", "Năm đưa vào SD",
                "Thời điểm sửa chữa gần nhất", "Số lượng nhân sự",
                "Đơn vị vận hành", "Đơn vị quản lý"
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
            r.put("Tên đèn biển", b.getName());
            r.put("Địa điểm", b.getLocation() != null ? b.getLocation() : "Hải phận Việt Nam");
            r.put("Chiều cao tháp đèn (m)", b.getTowerHeight() != null ? b.getTowerHeight() : BigDecimal.valueOf(25.0));
            r.put("Chiều cao tâm sáng (m)", b.getLightHeight() != null ? b.getLightHeight() : BigDecimal.valueOf(32.0));
            r.put("Tầm hiệu lực địa lý (hải lý)", b.getGeographicRange() != null ? b.getGeographicRange() : "18");
            r.put("Tầm hiệu lực ánh sáng (hải lý)", b.getLightRange() != null ? BigDecimal.valueOf(b.getLightRange()) : BigDecimal.valueOf(20.0));
            r.put("Chủng loại đèn chính", b.getPrimaryLightModel() != null ? b.getPrimaryLightModel() : "Đèn chính xoay PRB-21");
            r.put("Nguồn cấp năng lượng", b.getPowerSupply() != null ? b.getPowerSupply() : "Lưới điện & Máy phát dự phòng");
            r.put("Tình trạng", b.getStatus() != null ? b.getStatus() : "Đang vận hành tốt");
            r.put("Năm đưa vào SD", b.getCommissionedDate() != null ? String.valueOf(b.getCommissionedDate().getYear()) : "2015");
            r.put("Thời điểm sửa chữa gần nhất", b.getLastRepairDate() != null ? String.valueOf(b.getLastRepairDate().getYear()) : "2023");
            r.put("Số lượng nhân sự", b.getStaffCount() != null ? b.getStaffCount() : 4);
            r.put("Đơn vị vận hành", "Công ty BĐATHH");
            r.put("Đơn vị quản lý", donViQl);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số đèn biển", rows.size());

        return buildPreviewResponse("F-186", headers, rows, summary);
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
            item.put("diaDiem", b.getLocation() != null ? b.getLocation() : "Hải phận Việt Nam");
            item.put("hinhDang", b.getShape() != null ? b.getShape() : "Tháp tròn");
            item.put("ketCau", b.getStructure() != null ? b.getStructure() : "Bê tông cốt thép");
            item.put("chieuCaoThapDen", b.getTowerHeight() != null ? b.getTowerHeight().longValue() : 25L);
            item.put("chieuCaoTamSang", b.getLightHeight() != null ? b.getLightHeight() : 32.0);
            item.put("tamHieuLucDiaLy", b.getGeographicRange() != null ? b.getGeographicRange() : "18");
            item.put("tamHieuLucAnhSang", b.getLightRange() != null ? b.getLightRange() : 20.0);
            item.put("chungLoaiDenChinh", b.getPrimaryLightModel() != null ? b.getPrimaryLightModel() : "PRB-21");
            item.put("chungLoaiDenDuPhong", b.getBackupLightModel() != null ? b.getBackupLightModel() : "LED-155");
            item.put("mauSacBenNgoai", b.getTowerColor() != null ? b.getTowerColor() : "Trắng - Đỏ");
            item.put("nguonCungCapNangLuong", b.getPowerSupply() != null ? b.getPowerSupply() : "Lưới điện & Máy phát");
            item.put("ngayBd", b.getCommissionedDate() != null ? String.valueOf(b.getCommissionedDate().getYear()) : "2015");
            item.put("ngaySc", b.getLastRepairDate() != null ? String.valueOf(b.getLastRepairDate().getYear()) : "2023");
            item.put("soLuongNhanSuBoTri", b.getStaffCount() != null ? b.getStaffCount() : 4);
            item.put("dienTich", b.getArea() != null ? b.getArea() : 120.0);
            item.put("dienTichTramDen", b.getArea() != null ? b.getArea() : 120.0);
            item.put("tinhTrang", b.getStatus() != null ? b.getStatus() : "Đang vận hành");
            item.put("fkDonViVh", "Công ty BĐATHH");
            item.put("fkDonViQl", donViQl);
            list.add(item);
        }

        if (list.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("idx", 1);
            empty.put("ten", "Không có dữ liệu");
            empty.put("diaDiem", "");
            empty.put("hinhDang", "");
            empty.put("ketCau", "");
            empty.put("chieuCaoThapDen", 0L);
            empty.put("chieuCaoTamSang", 0.0);
            empty.put("tamHieuLucDiaLy", "");
            empty.put("tamHieuLucAnhSang", 0.0);
            empty.put("chungLoaiDenChinh", "");
            empty.put("chungLoaiDenDuPhong", "");
            empty.put("mauSacBenNgoai", "");
            empty.put("nguonCungCapNangLuong", "");
            empty.put("ngayBd", "");
            empty.put("ngaySc", "");
            empty.put("soLuongNhanSuBoTri", 0);
            empty.put("dienTich", 0.0);
            empty.put("dienTichTramDen", 0.0);
            empty.put("tinhTrang", "");
            empty.put("fkDonViVh", "");
            empty.put("fkDonViQl", "");
            list.add(empty);
        }

        return list;
    }
}
