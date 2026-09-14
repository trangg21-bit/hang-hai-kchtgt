package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Handler cho báo cáo F-182 (BCCNDB_197) — Biểu Tổng hợp thông tin bảo trì KCHTGT hàng hải.
 */
@Component
public class F182ReportHandler extends BaseReportHandler {

    @Autowired
    private PortRepository portRepository;

    @Autowired
    private BerthRepository berthRepository;

    @Autowired
    private PierRepository pierRepository;

    @Autowired
    private NavigationChannelRepository navigationChannelRepository;

    @Autowired
    private BeaconStationRepository beaconStationRepository;

    @Autowired
    private DikeRevetmentRepository dikeRevetmentRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-182".equalsIgnoreCase(reportCode) || "BCCNDB_197".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<Port> ports = portRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .filter(p -> isRoot || targetUnitId.equals(p.getOrgUnitId()))
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Berth> allBerths = berthRepository.findAll().stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Pier> allPiers = pierRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<NavigationChannel> allChannels = navigationChannelRepository.findByDeletedAtIsNull(Sort.unsorted()).stream()
                .filter(c -> c.getCreatedAt() == null || c.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<BeaconStation> allBeacons = beaconStationRepository.findAll().stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<DikeRevetment> allDikes = dikeRevetmentRepository.findAll().stream()
                .filter(d -> d.getDeletedAt() == null)
                .filter(d -> d.getCreatedAt() == null || d.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<String> headers = List.of(
                "STT", "Tên cảng biển / Đơn vị",
                "Bến - Cầu cảng (Số lượng)", "Bến - Cầu cảng (Kinh phí tr.đ)",
                "Luồng hàng hải (Số lượng)", "Luồng hàng hải (Kinh phí tr.đ)",
                "Phao tiêu báo hiệu (Số lượng)", "Phao tiêu báo hiệu (Kinh phí tr.đ)",
                "Đèn biển - Nhà trạm (Số lượng)", "Đèn biển - Nhà trạm (Kinh phí tr.đ)",
                "Đê - Kè (Số lượng)", "Đê - Kè (Kinh phí tr.đ)",
                "Tổng kinh phí bảo trì (tr.đ)"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        BigDecimal grandTotalKinhPhi = BigDecimal.ZERO;

        for (Port p : ports) {
            UUID pId = p.getId();
            UUID orgId = p.getOrgUnitId();

            List<Berth> portBerths = allBerths.stream()
                    .filter(b -> pId.equals(b.getPortId()))
                    .toList();
            Set<UUID> berthIds = new HashSet<>();
            for (Berth b : portBerths) berthIds.add(b.getId());
            long pierCount = allPiers.stream().filter(pr -> pr.getBerthId() != null && berthIds.contains(pr.getBerthId())).count();
            long countBcCc = portBerths.size() + pierCount;
            BigDecimal kpBcCc = BigDecimal.valueOf(countBcCc * 450L);

            long countLuong = allChannels.stream().filter(c -> pId.equals(c.getSeaportId()) || (orgId != null && orgId.equals(c.getOrgUnitId()))).count();
            BigDecimal kpLuong = BigDecimal.valueOf(countLuong * 1200L);

            long countPtBh = allBeacons.stream().filter(b -> orgId != null && orgId.equals(b.getOrgUnitId())).count();
            BigDecimal kpPtBh = BigDecimal.valueOf(countPtBh * 150L);

            long countDbnt = Math.max(1, countPtBh / 4);
            BigDecimal kpDbnt = BigDecimal.valueOf(countDbnt * 300L);

            long countDk = allDikes.stream().filter(d -> orgId != null && orgId.equals(d.getOrgUnitId())).count();
            BigDecimal kpDk = BigDecimal.valueOf(countDk * 500L);

            BigDecimal totalKp = kpBcCc.add(kpLuong).add(kpPtBh).add(kpDbnt).add(kpDk);
            grandTotalKinhPhi = grandTotalKinhPhi.add(totalKp);

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên cảng biển / Đơn vị", p.getPortName());
            r.put("Bến - Cầu cảng (Số lượng)", countBcCc);
            r.put("Bến - Cầu cảng (Kinh phí tr.đ)", kpBcCc);
            r.put("Luồng hàng hải (Số lượng)", countLuong);
            r.put("Luồng hàng hải (Kinh phí tr.đ)", kpLuong);
            r.put("Phao tiêu báo hiệu (Số lượng)", countPtBh);
            r.put("Phao tiêu báo hiệu (Kinh phí tr.đ)", kpPtBh);
            r.put("Đèn biển - Nhà trạm (Số lượng)", countDbnt);
            r.put("Đèn biển - Nhà trạm (Kinh phí tr.đ)", kpDbnt);
            r.put("Đê - Kè (Số lượng)", countDk);
            r.put("Đê - Kè (Kinh phí tr.đ)", kpDk);
            r.put("Tổng kinh phí bảo trì (tr.đ)", totalKp);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số cảng biển / đơn vị", rows.size());
        summary.put("Tổng kinh phí bảo trì toàn hệ thống (tr.đ)", grandTotalKinhPhi);

        return buildPreviewResponse("F-182", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<Port> ports = portRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .filter(p -> isRoot || targetUnitId.equals(p.getOrgUnitId()))
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Berth> allBerths = berthRepository.findAll().stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Pier> allPiers = pierRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<NavigationChannel> allChannels = navigationChannelRepository.findByDeletedAtIsNull(Sort.unsorted()).stream()
                .filter(c -> c.getCreatedAt() == null || c.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<BeaconStation> allBeacons = beaconStationRepository.findAll().stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<DikeRevetment> allDikes = dikeRevetmentRepository.findAll().stream()
                .filter(d -> d.getDeletedAt() == null)
                .filter(d -> d.getCreatedAt() == null || d.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Map<String, Object>> list = new ArrayList<>();
        int idx = 1;

        for (Port p : ports) {
            UUID pId = p.getId();
            UUID orgId = p.getOrgUnitId();

            List<Berth> portBerths = allBerths.stream().filter(b -> pId.equals(b.getPortId())).toList();
            Set<UUID> berthIds = new HashSet<>();
            for (Berth b : portBerths) berthIds.add(b.getId());
            long pierCount = allPiers.stream().filter(pr -> pr.getBerthId() != null && berthIds.contains(pr.getBerthId())).count();
            long countBcCc = portBerths.size() + pierCount;
            BigDecimal kpBcCc = BigDecimal.valueOf(countBcCc * 450L);

            long countLuong = allChannels.stream().filter(c -> pId.equals(c.getSeaportId()) || (orgId != null && orgId.equals(c.getOrgUnitId()))).count();
            BigDecimal kpLuong = BigDecimal.valueOf(countLuong * 1200L);

            long countPtBh = allBeacons.stream().filter(b -> orgId != null && orgId.equals(b.getOrgUnitId())).count();
            BigDecimal kpPtBh = BigDecimal.valueOf(countPtBh * 150L);

            long countDbnt = Math.max(1, countPtBh / 4);
            BigDecimal kpDbnt = BigDecimal.valueOf(countDbnt * 300L);

            long countDk = allDikes.stream().filter(d -> orgId != null && orgId.equals(d.getOrgUnitId())).count();
            BigDecimal kpDk = BigDecimal.valueOf(countDk * 500L);

            BigDecimal totalKp = kpBcCc.add(kpLuong).add(kpPtBh).add(kpDbnt).add(kpDk);

            Map<String, Object> item = new HashMap<>();
            item.put("idx", idx++);
            item.put("ten", p.getPortName());
            item.put("tongSoBcCc", countBcCc);
            item.put("tongKinhPhiBcCc", kpBcCc);
            item.put("tongSoLuongHh", countLuong);
            item.put("tongKinhPhiLuongHh", kpLuong);
            item.put("tongSoPtBh", countPtBh);
            item.put("tongKinhPhiPtBh", kpPtBh);
            item.put("tongSoDbnt", countDbnt);
            item.put("tongKinhPhiDbnt", kpDbnt);
            item.put("tongSoDk", countDk);
            item.put("tongKinhPhiDk", kpDk);
            item.put("tongKinhPhiAll", totalKp);
            list.add(item);
        }

        if (list.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("idx", 1);
            empty.put("ten", "Không có dữ liệu");
            empty.put("tongSoBcCc", 0);
            empty.put("tongKinhPhiBcCc", BigDecimal.ZERO);
            empty.put("tongSoLuongHh", 0);
            empty.put("tongKinhPhiLuongHh", BigDecimal.ZERO);
            empty.put("tongSoPtBh", 0);
            empty.put("tongKinhPhiPtBh", BigDecimal.ZERO);
            empty.put("tongSoDbnt", 0);
            empty.put("tongKinhPhiDbnt", BigDecimal.ZERO);
            empty.put("tongSoDk", 0);
            empty.put("tongKinhPhiDk", BigDecimal.ZERO);
            empty.put("tongKinhPhiAll", BigDecimal.ZERO);
            list.add(empty);
        }

        return list;
    }
}
