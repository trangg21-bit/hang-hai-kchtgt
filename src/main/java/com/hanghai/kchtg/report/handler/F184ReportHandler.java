package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Handler cho báo cáo F-184 (BCCNDB_199) — Biểu Tổng hợp thông tin bảo trì KCHTGT hàng hải - Luồng hàng hải.
 */
@Component
public class F184ReportHandler extends BaseReportHandler {

    @Autowired
    private NavigationChannelRepository navigationChannelRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-184".equalsIgnoreCase(reportCode) || "BCCNDB_199".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<NavigationChannel> channels = navigationChannelRepository.findByDeletedAtIsNull(Sort.unsorted()).stream()
                .filter(c -> isRoot || targetUnitId.equals(c.getOrgUnitId()) || targetUnitId.equals(c.getOperatingUnitId()))
                .filter(c -> c.getCreatedAt() == null || c.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
                "STT", "Tên tuyến luồng", "Loại tuyến luồng", "Chiều dài thiết kế (km)",
                "Chiều rộng TK lớn nhất (m)", "Chiều rộng TK nhỏ nhất (m)", "Độ sâu thiết kế (m)",
                "Độ sâu hiện tại (m)", "Mái dốc thiết kế", "Khối lượng nạo vét (m³)",
                "Năm bảo trì gần nhất", "Tình trạng", "Trạm quản lý luồng", "Đơn vị quản lý"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        BigDecimal totalChieuDai = BigDecimal.ZERO;
        BigDecimal totalNaoVet = BigDecimal.ZERO;

        for (NavigationChannel nc : channels) {
            String donViQl = "";
            if (nc.getOrgUnitId() != null) {
                donViQl = orgUnitRepository.findById(nc.getOrgUnitId()).map(OrgUnit::getName).orElse("");
            }

            BigDecimal chieuDai = BigDecimal.ZERO;
            BigDecimal rongMax = BigDecimal.ZERO;
            BigDecimal rongMin = BigDecimal.ZERO;
            BigDecimal doSauTk = BigDecimal.ZERO;
            BigDecimal doSauHt = BigDecimal.ZERO;
            BigDecimal maiDoc = BigDecimal.valueOf(5.0);
            BigDecimal naoVet = nc.getLatestDredgingVolumeCubicMeters() != null ? nc.getLatestDredgingVolumeCubicMeters() : BigDecimal.ZERO;

            if (nc.getChannelRouteDetailList() != null && !nc.getChannelRouteDetailList().isEmpty()) {
                for (ChannelRouteDetail crd : nc.getChannelRouteDetailList()) {
                    if (crd.getChannelLengthKilometers() != null) {
                        chieuDai = chieuDai.add(crd.getChannelLengthKilometers());
                    }
                    if (crd.getMaximumDesignWidthMeters() != null && crd.getMaximumDesignWidthMeters().compareTo(rongMax) > 0) {
                        rongMax = crd.getMaximumDesignWidthMeters();
                    }
                    if (crd.getMinimumDesignWidthMeters() != null && (rongMin.compareTo(BigDecimal.ZERO) == 0 || crd.getMinimumDesignWidthMeters().compareTo(rongMin) < 0)) {
                        rongMin = crd.getMinimumDesignWidthMeters();
                    }
                    if (crd.getDesignDepthMeters() != null) doSauTk = crd.getDesignDepthMeters();
                    if (crd.getCurrentDepthMeters() != null) doSauHt = crd.getCurrentDepthMeters();
                    if (crd.getDesignSlope() != null) maiDoc = crd.getDesignSlope();
                    if (crd.getRouteLatestDredgingVolumeCubicMeters() != null) {
                        naoVet = naoVet.add(crd.getRouteLatestDredgingVolumeCubicMeters());
                    }
                }
            }

            totalChieuDai = totalChieuDai.add(chieuDai);
            totalNaoVet = totalNaoVet.add(naoVet);

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên tuyến luồng", nc.getChannelName());
            r.put("Loại tuyến luồng", "Luồng công cộng");
            r.put("Chiều dài thiết kế (km)", chieuDai);
            r.put("Chiều rộng TK lớn nhất (m)", rongMax);
            r.put("Chiều rộng TK nhỏ nhất (m)", rongMin);
            r.put("Độ sâu thiết kế (m)", doSauTk);
            r.put("Độ sâu hiện tại (m)", doSauHt);
            r.put("Mái dốc thiết kế", maiDoc);
            r.put("Khối lượng nạo vét (m³)", naoVet);
            r.put("Năm bảo trì gần nhất", nc.getLatestMaintenanceYear() != null ? String.valueOf(nc.getLatestMaintenanceYear()) : "2024");
            r.put("Tình trạng", nc.getConditionStatus() != null ? nc.getConditionStatus().name() : "Hoạt động bình thường");
            r.put("Trạm quản lý luồng", nc.getManagementStation() != null ? nc.getManagementStation() : "Trạm QLLHH");
            r.put("Đơn vị quản lý", donViQl);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tuyến luồng", rows.size());
        summary.put("Tổng chiều dài thiết kế (km)", totalChieuDai);
        summary.put("Tổng khối lượng nạo vét (m³)", totalNaoVet);

        return buildPreviewResponse("F-184", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<NavigationChannel> channels = navigationChannelRepository.findByDeletedAtIsNull(Sort.unsorted()).stream()
                .filter(c -> isRoot || targetUnitId.equals(c.getOrgUnitId()) || targetUnitId.equals(c.getOperatingUnitId()))
                .filter(c -> c.getCreatedAt() == null || c.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> list = new ArrayList<>();
        int idx = 1;

        for (NavigationChannel nc : channels) {
            String donViQl = "";
            if (nc.getOrgUnitId() != null) {
                donViQl = orgUnitRepository.findById(nc.getOrgUnitId()).map(OrgUnit::getName).orElse("");
            }

            BigDecimal chieuDai = BigDecimal.ZERO;
            BigDecimal rongMax = BigDecimal.ZERO;
            BigDecimal rongMin = BigDecimal.ZERO;
            BigDecimal doSauTk = BigDecimal.ZERO;
            BigDecimal doSauHt = BigDecimal.ZERO;
            BigDecimal maiDoc = BigDecimal.valueOf(5.0);
            BigDecimal naoVet = nc.getLatestDredgingVolumeCubicMeters() != null ? nc.getLatestDredgingVolumeCubicMeters() : BigDecimal.ZERO;

            if (nc.getChannelRouteDetailList() != null && !nc.getChannelRouteDetailList().isEmpty()) {
                for (ChannelRouteDetail crd : nc.getChannelRouteDetailList()) {
                    if (crd.getChannelLengthKilometers() != null) chieuDai = chieuDai.add(crd.getChannelLengthKilometers());
                    if (crd.getMaximumDesignWidthMeters() != null && crd.getMaximumDesignWidthMeters().compareTo(rongMax) > 0) rongMax = crd.getMaximumDesignWidthMeters();
                    if (crd.getMinimumDesignWidthMeters() != null && (rongMin.compareTo(BigDecimal.ZERO) == 0 || crd.getMinimumDesignWidthMeters().compareTo(rongMin) < 0)) rongMin = crd.getMinimumDesignWidthMeters();
                    if (crd.getDesignDepthMeters() != null) doSauTk = crd.getDesignDepthMeters();
                    if (crd.getCurrentDepthMeters() != null) doSauHt = crd.getCurrentDepthMeters();
                    if (crd.getDesignSlope() != null) maiDoc = crd.getDesignSlope();
                    if (crd.getRouteLatestDredgingVolumeCubicMeters() != null) naoVet = naoVet.add(crd.getRouteLatestDredgingVolumeCubicMeters());
                }
            }

            Map<String, Object> item = new HashMap<>();
            item.put("idx", idx++);
            item.put("tenTuyenLuong", nc.getChannelName());
            item.put("loaiTuyenLuong", "Luồng công cộng");
            item.put("chieuDaiThietKe", chieuDai);
            item.put("chieuRongThietKeLonNhat", rongMax);
            item.put("chieuRongThietKeNhoNhat", rongMin);
            item.put("doSauThietKe", doSauTk);
            item.put("doSauHienTai", doSauHt);
            item.put("maiDocThietKe", maiDoc);
            item.put("khoiLuongNaoVet", naoVet);
            item.put("tenLuong", nc.getChannelName());
            item.put("tramQuanLyLuong", nc.getManagementStation() != null ? nc.getManagementStation() : "Trạm QLLHH");
            item.put("namBaoTriGanNhat", nc.getLatestMaintenanceYear() != null ? String.valueOf(nc.getLatestMaintenanceYear()) : "2024");
            item.put("tinhTrang", nc.getConditionStatus() != null ? nc.getConditionStatus().name() : "Hoạt động bình thường");
            item.put("ngayRaQuyetDinhCongBo", nc.getAnnouncementDecisionDate() != null ? nc.getAnnouncementDecisionDate().toString() : "");
            item.put("fkDonViQl", donViQl);
            list.add(item);
        }

        if (list.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("idx", 1);
            empty.put("tenTuyenLuong", "Không có dữ liệu");
            empty.put("loaiTuyenLuong", "");
            empty.put("chieuDaiThietKe", BigDecimal.ZERO);
            empty.put("chieuRongThietKeLonNhat", BigDecimal.ZERO);
            empty.put("chieuRongThietKeNhoNhat", BigDecimal.ZERO);
            empty.put("doSauThietKe", BigDecimal.ZERO);
            empty.put("doSauHienTai", BigDecimal.ZERO);
            empty.put("maiDocThietKe", BigDecimal.ZERO);
            empty.put("khoiLuongNaoVet", BigDecimal.ZERO);
            empty.put("tenLuong", "");
            empty.put("tramQuanLyLuong", "");
            empty.put("namBaoTriGanNhat", "");
            empty.put("tinhTrang", "");
            empty.put("ngayRaQuyetDinhCongBo", "");
            empty.put("fkDonViQl", "");
            list.add(empty);
        }

        return list;
    }
}
