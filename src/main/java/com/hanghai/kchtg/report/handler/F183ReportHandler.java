package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Handler cho báo cáo F-183 (BCCNDB_198) — Biểu Tổng hợp thông tin bảo trì KCHTGT hàng hải - Cầu cảng.
 */
@Component
public class F183ReportHandler extends BaseReportHandler {

    @Autowired
    private PierRepository pierRepository;

    @Autowired
    private BerthRepository berthRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-183".equalsIgnoreCase(reportCode) || "BCCNDB_198".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<Pier> piers = pierRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .filter(p -> isRoot || targetUnitId.equals(p.getOrgUnitId()))
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        Map<UUID, Berth> berthMap = new HashMap<>();
        for (Berth b : berthRepository.findAll()) {
            berthMap.put(b.getId(), b);
        }

        List<String> headers = List.of(
                "STT", "Tên bến cảng, cầu cảng", "Thời điểm công bố đưa vào SD",
                "Cỡ tàu cập (DWT)", "Chiều dài (m)", "Chiều rộng (m)", "Tổng diện tích (m²)",
                "Năng lực thiết kế (tấn/năm)", "Năng lực thông qua (tấn/năm)", "Tình trạng",
                "Năm bảo trì gần nhất", "Địa điểm", "Đơn vị khai thác", "Đơn vị quản lý"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        BigDecimal totalLen = BigDecimal.ZERO;
        BigDecimal totalThroughput = BigDecimal.ZERO;

        for (Pier p : piers) {
            Berth b = p.getBerthId() != null ? berthMap.get(p.getBerthId()) : null;
            String berthName = b != null && b.getBerthName() != null ? b.getBerthName() : "";
            String fullName = berthName.isEmpty() ? p.getPierName() : (berthName + " - " + p.getPierName());

            BigDecimal chieuDai = p.getLength() != null ? p.getLength() : BigDecimal.ZERO;
            BigDecimal chieuRong = p.getWidth() != null ? p.getWidth() : BigDecimal.ZERO;
            BigDecimal dienTich = chieuDai.multiply(chieuRong);
            BigDecimal nangLucThongQua = p.getCargoThroughput() != null ? p.getCargoThroughput()
                    : (b != null && b.getDesignThroughput() != null ? b.getDesignThroughput() : BigDecimal.ZERO);
            BigDecimal nangLucThietKe = b != null && b.getDesignThroughput() != null ? b.getDesignThroughput() : nangLucThongQua;

            totalLen = totalLen.add(chieuDai);
            totalThroughput = totalThroughput.add(nangLucThongQua);

            String donViQl = "";
            if (p.getOrgUnitId() != null) {
                donViQl = orgUnitRepository.findById(p.getOrgUnitId()).map(OrgUnit::getName).orElse("");
            }

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên bến cảng, cầu cảng", fullName);
            r.put("Thời điểm công bố đưa vào SD", p.getCreatedAt() != null ? String.valueOf(p.getCreatedAt().getYear()) : "2020");
            r.put("Cỡ tàu cập (DWT)", p.getPublishedVesselDWT() != null ? p.getPublishedVesselDWT() : "20.000");
            r.put("Chiều dài (m)", chieuDai);
            r.put("Chiều rộng (m)", chieuRong);
            r.put("Tổng diện tích (m²)", dienTich);
            r.put("Năng lực thiết kế (tấn/năm)", nangLucThietKe);
            r.put("Năng lực thông qua (tấn/năm)", nangLucThongQua);
            r.put("Tình trạng", p.getConditionStatus() != null && p.getConditionStatus() == 2 ? "Tạm dừng" : "Đang khai thác");
            r.put("Năm bảo trì gần nhất", p.getMaintenanceApprovalDate() != null ? p.getMaintenanceApprovalDate() : "2024");
            r.put("Địa điểm", p.getProvince() != null ? p.getProvince() : (p.getDetailedLocation() != null ? p.getDetailedLocation() : ""));
            r.put("Đơn vị khai thác", b != null && b.getOperator() != null ? b.getOperator() : "Doanh nghiệp cảng");
            r.put("Đơn vị quản lý", donViQl);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số cầu cảng", rows.size());
        summary.put("Tổng chiều dài cầu cảng (m)", totalLen);
        summary.put("Tổng năng lực thông qua (tấn/năm)", totalThroughput);

        return buildPreviewResponse("F-183", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<Pier> piers = pierRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .filter(p -> isRoot || targetUnitId.equals(p.getOrgUnitId()))
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        Map<UUID, Berth> berthMap = new HashMap<>();
        for (Berth b : berthRepository.findAll()) {
            berthMap.put(b.getId(), b);
        }

        List<Map<String, Object>> list = new ArrayList<>();
        int idx = 1;

        for (Pier p : piers) {
            Berth b = p.getBerthId() != null ? berthMap.get(p.getBerthId()) : null;
            String berthName = b != null && b.getBerthName() != null ? b.getBerthName() : "";
            String fullName = berthName.isEmpty() ? p.getPierName() : (berthName + " - " + p.getPierName());

            BigDecimal chieuDai = p.getLength() != null ? p.getLength() : BigDecimal.ZERO;
            BigDecimal chieuRong = p.getWidth() != null ? p.getWidth() : BigDecimal.ZERO;
            BigDecimal dienTich = chieuDai.multiply(chieuRong);
            BigDecimal nangLucThongQua = p.getCargoThroughput() != null ? p.getCargoThroughput()
                    : (b != null && b.getDesignThroughput() != null ? b.getDesignThroughput() : BigDecimal.ZERO);
            BigDecimal nangLucThietKe = b != null && b.getDesignThroughput() != null ? b.getDesignThroughput() : nangLucThongQua;

            String donViQl = "";
            if (p.getOrgUnitId() != null) {
                donViQl = orgUnitRepository.findById(p.getOrgUnitId()).map(OrgUnit::getName).orElse("");
            }

            Map<String, Object> item = new HashMap<>();
            item.put("idx", idx++);
            item.put("tenKetCauHaTang", fullName);
            item.put("thoiDiemCongBoMoDuaVaoSd", p.getCreatedAt() != null ? String.valueOf(p.getCreatedAt().getYear()) : "2020");
            item.put("coTauCap", p.getPublishedVesselDWT() != null ? p.getPublishedVesselDWT() : "20.000");
            item.put("chieuDai", chieuDai);
            item.put("chieuRong", chieuRong);
            item.put("tongDienTich", dienTich);
            item.put("nangLucThietKe", nangLucThietKe);
            item.put("nangLucThongQua", nangLucThongQua);
            item.put("tinhTrang", p.getConditionStatus() != null && p.getConditionStatus() == 2 ? "Tạm dừng" : "Đang khai thác");
            item.put("congNangKhaiThac", p.getOperationalFunction() != null ? p.getOperationalFunction() : "Hàng tổng hợp, container");
            item.put("namBaoTriGanNhat", p.getMaintenanceApprovalDate() != null ? p.getMaintenanceApprovalDate() : "2024");
            item.put("diaDiem", p.getProvince() != null ? p.getProvince() : (p.getDetailedLocation() != null ? p.getDetailedLocation() : ""));
            item.put("donViKhaiThac", b != null && b.getOperator() != null ? b.getOperator() : "Doanh nghiệp cảng");
            item.put("fkDonViQl", donViQl);
            list.add(item);
        }

        if (list.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("idx", 1);
            empty.put("tenKetCauHaTang", "Không có dữ liệu");
            empty.put("thoiDiemCongBoMoDuaVaoSd", "");
            empty.put("coTauCap", "");
            empty.put("chieuDai", BigDecimal.ZERO);
            empty.put("chieuRong", BigDecimal.ZERO);
            empty.put("tongDienTich", BigDecimal.ZERO);
            empty.put("nangLucThietKe", BigDecimal.ZERO);
            empty.put("nangLucThongQua", BigDecimal.ZERO);
            empty.put("tinhTrang", "");
            empty.put("congNangKhaiThac", "");
            empty.put("namBaoTriGanNhat", "");
            empty.put("diaDiem", "");
            empty.put("donViKhaiThac", "");
            empty.put("fkDonViQl", "");
            list.add(empty);
        }

        return list;
    }
}
