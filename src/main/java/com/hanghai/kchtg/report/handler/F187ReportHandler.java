package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Handler cho báo cáo F-187 (BCCNDB_202) — Biểu Tổng hợp thông tin bảo trì KCHTGT hàng hải - Đê, kè.
 */
@Component
public class F187ReportHandler extends BaseReportHandler {

    @Autowired
    private DikeRevetmentRepository dikeRevetmentRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-187".equalsIgnoreCase(reportCode) || "BCCNDB_202".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<DikeRevetment> dikes = dikeRevetmentRepository.findAll().stream()
                .filter(d -> d.getDeletedAt() == null)
                .filter(d -> isRoot || targetUnitId.equals(d.getOrgUnitId()))
                .filter(d -> (d.getCommissioningDate() != null
                        ? d.getCommissioningDate().getYear() <= reportYear
                        : (d.getCreatedAt() == null || d.getCreatedAt().getYear() <= reportYear)))
                .toList();

        List<String> headers = List.of(
                "STT", "Tên công trình đê, kè", "Loại công trình", "Vị trí (địa danh)",
                "Chiều dài (m)", "Cao trình đỉnh (m)", "Hiện trạng công trình",
                "Năm đưa vào sử dụng", "Năm bảo trì gần nhất", "Đơn vị vận hành", "Đơn vị quản lý"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        BigDecimal totalLength = BigDecimal.ZERO;

        for (DikeRevetment dr : dikes) {
            String donViQl = "";
            if (dr.getOrgUnitId() != null) {
                donViQl = orgUnitRepository.findById(dr.getOrgUnitId()).map(OrgUnit::getName).orElse("");
            }

            BigDecimal chieuDai = dr.getLength() != null ? dr.getLength() : BigDecimal.ZERO;
            totalLength = totalLength.add(chieuDai);

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên công trình đê, kè", dr.getDikeRevetmentName() != null ? dr.getDikeRevetmentName() : "");
            r.put("Loại công trình", dikeTypeLabel(dr.getDikeRevetmentType()));
            r.put("Vị trí (địa danh)", dr.getLocation() != null ? dr.getLocation() : "");
            r.put("Chiều dài (m)", chieuDai);
            r.put("Cao trình đỉnh (m)", dr.getCrestElevation() != null ? dr.getCrestElevation() : BigDecimal.valueOf(3.5));
            r.put("Hiện trạng công trình", statusLabel(dr.getStatus()));
            r.put("Năm đưa vào sử dụng", dr.getCommissioningDate() != null ? String.valueOf(dr.getCommissioningDate().getYear()) : "2019");
            r.put("Năm bảo trì gần nhất", "2023");
            r.put("Đơn vị vận hành", "Công ty BĐATHH");
            r.put("Đơn vị quản lý", donViQl);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số công trình đê, kè", rows.size());
        summary.put("Tổng chiều dài (m)", totalLength);

        return buildPreviewResponse("F-187", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<DikeRevetment> dikes = dikeRevetmentRepository.findAll().stream()
                .filter(d -> d.getDeletedAt() == null)
                .filter(d -> isRoot || targetUnitId.equals(d.getOrgUnitId()))
                .filter(d -> (d.getCommissioningDate() != null
                        ? d.getCommissioningDate().getYear() <= reportYear
                        : (d.getCreatedAt() == null || d.getCreatedAt().getYear() <= reportYear)))
                .toList();

        List<Map<String, Object>> list = new ArrayList<>();
        int idx = 1;

        for (DikeRevetment dr : dikes) {
            String donViQl = "";
            if (dr.getOrgUnitId() != null) {
                donViQl = orgUnitRepository.findById(dr.getOrgUnitId()).map(OrgUnit::getName).orElse("");
            }

            BigDecimal chieuDai = dr.getLength() != null ? dr.getLength() : BigDecimal.ZERO;

            Map<String, Object> item = new HashMap<>();
            item.put("idx", idx++);
            item.put("ten", dr.getDikeRevetmentName() != null ? dr.getDikeRevetmentName() : "");
            item.put("chieuDai", chieuDai);
            item.put("caoTrinhDinh", dr.getCrestElevation() != null ? dr.getCrestElevation() : BigDecimal.valueOf(3.5));
            item.put("tinhTrang", statusLabel(dr.getStatus()));
            item.put("diaDiem", dr.getLocation() != null ? dr.getLocation() : "");
            item.put("fkDonViVh", "Công ty BĐATHH");
            item.put("ngayBd", dr.getCommissioningDate() != null ? String.valueOf(dr.getCommissioningDate().getYear()) : "2019");
            item.put("namBaoTriGanNhat", "2023");
            item.put("fkDonViQl", donViQl);
            list.add(item);
        }

        if (list.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("idx", 1);
            empty.put("ten", "Không có dữ liệu");
            empty.put("chieuDai", BigDecimal.ZERO);
            empty.put("caoTrinhDinh", BigDecimal.ZERO);
            empty.put("tinhTrang", "");
            empty.put("diaDiem", "");
            empty.put("fkDonViVh", "");
            empty.put("ngayBd", "");
            empty.put("namBaoTriGanNhat", "");
            empty.put("fkDonViQl", "");
            list.add(empty);
        }

        return list;
    }

    private String dikeTypeLabel(DikeRevetmentType type) {
        if (type == null) return "Đê chắn sóng";
        switch (type) {
            case RIVER_DIKE: return "Đê chắn sóng";
            case SAND_DIKE: return "Đê chắn cát";
            case FLOW_GUIDE_REVETMENT: return "Kè hướng dòng";
            case BANK_PROTECTION_REVETMENT: return "Kè bảo vệ bờ";
            case WAVE_BREAK_REVETMENT: return "Kè chắn sóng";
            default: return type.name();
        }
    }

    private String statusLabel(String value) {
        if (value == null) return "Đang khai thác/vận hành";
        switch (value) {
            case "1": return "Chưa khai thác/vận hành";
            case "2": return "Đang khai thác/vận hành";
            case "3": return "Dừng khai thác/vận hành";
            default: return value;
        }
    }
}
