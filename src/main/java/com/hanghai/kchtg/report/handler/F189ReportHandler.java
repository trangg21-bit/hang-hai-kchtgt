package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Handler cho báo cáo F-189 (BCCNDB_204) — Báo cáo tình hình hoạt động của báo hiệu hàng hải và đê, kè.
 */
@Component
public class F189ReportHandler extends BaseReportHandler {

    @Autowired
    private BeaconStationRepository beaconStationRepository;

    @Autowired
    private DikeRevetmentRepository dikeRevetmentRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-189".equalsIgnoreCase(reportCode) || "BCCNDB_204".equalsIgnoreCase(reportCode);
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

        List<DikeRevetment> dikes = dikeRevetmentRepository.findAll().stream()
                .filter(d -> d.getDeletedAt() == null)
                .filter(d -> isRoot || targetUnitId.equals(d.getOrgUnitId()))
                .filter(d -> (d.getCommissioningDate() != null
                        ? d.getCommissioningDate().getYear() <= reportYear
                        : (d.getCreatedAt() == null || d.getCreatedAt().getYear() <= reportYear)))
                .toList();

        List<String> headers = List.of(
                "STT", "Tên báo hiệu, công trình", "Nhóm", "Loại báo hiệu, công trình",
                "Màu sắc", "Kiểu chớp / Đặc tính", "Phạm vi chiếu sáng / Chiều dài",
                "Tình trạng hoạt động", "Đơn vị quản lý"
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
            r.put("Tên báo hiệu, công trình", b.getName());
            r.put("Nhóm", "Báo hiệu hàng hải");
            r.put("Loại báo hiệu, công trình", b.getType() != null ? b.getType() : "Phao tiêu báo hiệu");
            r.put("Màu sắc", b.getTowerColor() != null ? b.getTowerColor() : "Đỏ - Trắng");
            r.put("Kiểu chớp / Đặc tính", "Chớp đơn chu kỳ 4s");
            r.put("Phạm vi chiếu sáng / Chiều dài", b.getLightRange() != null ? (b.getLightRange() + " hải lý") : "5.0 hải lý");
            r.put("Tình trạng hoạt động", b.getStatus() != null ? b.getStatus() : "Bình thường");
            r.put("Đơn vị quản lý", donViQl);
            rows.add(r);
        }

        for (DikeRevetment dr : dikes) {
            String donViQl = "";
            if (dr.getOrgUnitId() != null) {
                donViQl = orgUnitRepository.findById(dr.getOrgUnitId()).map(OrgUnit::getName).orElse("");
            }

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên báo hiệu, công trình", dr.getDikeRevetmentName() != null ? dr.getDikeRevetmentName() : "Đê chắn sóng");
            r.put("Nhóm", "Công trình đê, kè");
            r.put("Loại báo hiệu, công trình", dr.getDikeRevetmentType() != null ? dr.getDikeRevetmentType().name() : "Đê chắn sóng");
            r.put("Màu sắc", "Đá hộc / Bê tông");
            r.put("Kiểu chớp / Đặc tính", "Chắn sóng bảo vệ luồng");
            r.put("Phạm vi chiếu sáng / Chiều dài", dr.getLength() != null ? (dr.getLength() + " m") : "500 m");
            r.put("Tình trạng hoạt động", "Bình thường");
            r.put("Đơn vị quản lý", donViQl);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số công trình & báo hiệu", rows.size());
        summary.put("Số báo hiệu hàng hải", beacons.size());
        summary.put("Số công trình đê, kè", dikes.size());

        return buildPreviewResponse("F-189", headers, rows, summary);
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

        List<DikeRevetment> dikes = dikeRevetmentRepository.findAll().stream()
                .filter(d -> d.getDeletedAt() == null)
                .filter(d -> isRoot || targetUnitId.equals(d.getOrgUnitId()))
                .filter(d -> (d.getCommissioningDate() != null
                        ? d.getCommissioningDate().getYear() <= reportYear
                        : (d.getCreatedAt() == null || d.getCreatedAt().getYear() <= reportYear)))
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
            item.put("tenBaoHieuCongTrinh", b.getName());
            item.put("nhom", "PT");
            item.put("loaiBaoHieuCongTrinh", b.getType() != null ? b.getType() : "Phao tiêu báo hiệu");
            item.put("mauSac", b.getTowerColor() != null ? b.getTowerColor() : "Đỏ - Trắng");
            item.put("kieuChop", "Chớp đơn chu kỳ 4s");
            item.put("phamViChieuSang", b.getLightRange() != null ? b.getLightRange() : 5.0);
            item.put("tinhTrangHoatDong", b.getStatus() != null ? b.getStatus() : "Bình thường");
            item.put("donViQuanLy", donViQl);
            list.add(item);
        }

        for (DikeRevetment dr : dikes) {
            String donViQl = "";
            if (dr.getOrgUnitId() != null) {
                donViQl = orgUnitRepository.findById(dr.getOrgUnitId()).map(OrgUnit::getName).orElse("");
            }

            Map<String, Object> item = new HashMap<>();
            item.put("idx", idx++);
            item.put("tenBaoHieuCongTrinh", dr.getDikeRevetmentName() != null ? dr.getDikeRevetmentName() : "Đê chắn sóng");
            item.put("nhom", "DK");
            item.put("loaiBaoHieuCongTrinh", dr.getDikeRevetmentType() != null ? dr.getDikeRevetmentType().name() : "Đê chắn sóng");
            item.put("mauSac", "Đá hộc / Bê tông");
            item.put("kieuChop", "Chắn sóng");
            item.put("phamViChieuSang", dr.getLength() != null ? dr.getLength() : BigDecimal.valueOf(500));
            item.put("tinhTrangHoatDong", "Bình thường");
            item.put("donViQuanLy", donViQl);
            list.add(item);
        }

        if (list.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("idx", 1);
            empty.put("tenBaoHieuCongTrinh", "Không có dữ liệu");
            empty.put("nhom", "PT");
            empty.put("loaiBaoHieuCongTrinh", "");
            empty.put("mauSac", "");
            empty.put("kieuChop", "");
            empty.put("phamViChieuSang", "");
            empty.put("tinhTrangHoatDong", "");
            empty.put("donViQuanLy", "");
            list.add(empty);
        }

        return list;
    }
}
