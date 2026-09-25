package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Handler cho báo cáo F-180 (BCCNDB_195) — Biểu Tổng hợp thông tin chung.
 */
@Component
public class F180ReportHandler extends BaseReportHandler {

    @Autowired
    private NavigationChannelRepository navigationChannelRepository;

    @Autowired
    private BeaconStationRepository beaconStationRepository;

    @Autowired
    private PierRepository pierRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-180".equalsIgnoreCase(reportCode) || "BCCNDB_195".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<NavigationChannel> allChannels = navigationChannelRepository.findByDeletedAtIsNull(Sort.unsorted()).stream()
                .filter(c -> c.getCreatedAt() == null || c.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<BeaconStation> allBeacons = beaconStationRepository.findAll().stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Pier> allPiers = pierRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<NavigationChannel> targetChannels = isRoot ? allChannels
                : allChannels.stream()
                        .filter(c -> targetUnitId.equals(c.getOrgUnitId()) || targetUnitId.equals(c.getOperatingUnitId()))
                        .toList();

        BigDecimal totalChannelLength = BigDecimal.ZERO;
        for (NavigationChannel nc : targetChannels) {
            if (nc.getChannelRouteDetailList() != null) {
                for (ChannelRouteDetail crd : nc.getChannelRouteDetailList()) {
                    if (crd.getChannelLengthKilometers() != null) {
                        totalChannelLength = totalChannelLength.add(crd.getChannelLengthKilometers());
                    }
                }
            }
        }

        long totalBeacons = isRoot ? allBeacons.size()
                : allBeacons.stream().filter(b -> targetUnitId.equals(b.getOrgUnitId())).count();

        List<Pier> targetPiers = isRoot ? allPiers
                : allPiers.stream().filter(p -> targetUnitId.equals(p.getOrgUnitId())).toList();

        BigDecimal totalPierLength = BigDecimal.ZERO;
        for (Pier p : targetPiers) {
            if (p.getLength() != null) {
                totalPierLength = totalPierLength.add(p.getLength());
            }
        }

        long totalChannels = targetChannels.size();
        long totalPiers = targetPiers.size();

        List<String> headers = List.of(
                "STT", "Hạng mục", "Đơn vị", "Khối lượng"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(Map.of("STT", "1", "Hạng mục", "Tổng số luồng hàng hải", "Đơn vị", "Luồng", "Khối lượng", totalChannels));
        rows.add(Map.of("STT", "2", "Hạng mục", "Tổng số chiều dài tuyến luồng", "Đơn vị", "Km", "Khối lượng", totalChannelLength));
        rows.add(Map.of("STT", "3", "Hạng mục", "Tổng số đèn biển, đăng tiêu độc lập", "Đơn vị", "Đèn biển/đăng tiêu", "Khối lượng", totalBeacons));
        rows.add(Map.of("STT", "4", "Hạng mục", "Tổng số cầu cảng", "Đơn vị", "Cầu cảng", "Khối lượng", totalPiers));
        rows.add(Map.of("STT", "5", "Hạng mục", "Tổng số chiều dài cầu cảng", "Đơn vị", "m", "Khối lượng", totalPierLength));

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số luồng", totalChannels);
        summary.put("Tổng chiều dài luồng (km)", totalChannelLength);
        summary.put("Tổng số đèn biển, đăng tiêu", totalBeacons);
        summary.put("Tổng số cầu cảng", totalPiers);
        summary.put("Tổng chiều dài cầu cảng (m)", totalPierLength);

        return buildPreviewResponse("F-180", headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<NavigationChannel> allChannels = navigationChannelRepository.findByDeletedAtIsNull(Sort.unsorted()).stream()
                .filter(c -> c.getCreatedAt() == null || c.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<BeaconStation> allBeacons = beaconStationRepository.findAll().stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<Pier> allPiers = pierRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<NavigationChannel> targetChannels = isRoot ? allChannels
                : allChannels.stream()
                        .filter(c -> targetUnitId.equals(c.getOrgUnitId()) || targetUnitId.equals(c.getOperatingUnitId()))
                        .toList();

        BigDecimal totalChannelLength = BigDecimal.ZERO;
        for (NavigationChannel nc : targetChannels) {
            if (nc.getChannelRouteDetailList() != null) {
                for (ChannelRouteDetail crd : nc.getChannelRouteDetailList()) {
                    if (crd.getChannelLengthKilometers() != null) {
                        totalChannelLength = totalChannelLength.add(crd.getChannelLengthKilometers());
                    }
                }
            }
        }

        long totalBeacons = isRoot ? allBeacons.size()
                : allBeacons.stream().filter(b -> targetUnitId.equals(b.getOrgUnitId())).count();

        List<Pier> targetPiers = isRoot ? allPiers
                : allPiers.stream().filter(p -> targetUnitId.equals(p.getOrgUnitId())).toList();

        BigDecimal totalPierLength = BigDecimal.ZERO;
        for (Pier p : targetPiers) {
            if (p.getLength() != null) {
                totalPierLength = totalPierLength.add(p.getLength());
            }
        }

        Map<String, Object> item = new HashMap<>();
        item.put("tongSoLuongHh", targetChannels.size());
        item.put("chieuDaiLuong", totalChannelLength);
        item.put("tongSoDenBienDangTieu", totalBeacons);
        item.put("tongSoCauCang", targetPiers.size());
        item.put("chieuDaiCauCang", totalPierLength);

        return List.of(item);
    }
}
