package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
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

        List<OrgUnit> units;
        if (isRoot) {
            units = orgUnitRepository.findAll().stream()
                    .filter(u -> u.getParentId() != null)
                    .toList();
        } else {
            units = orgUnitRepository.findById(targetUnitId).map(List::of).orElse(Collections.emptyList());
        }

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

        List<String> headers = List.of(
                "STT", "Tên Cảng vụ / Đơn vị", "Tổng số luồng hàng hải",
                "Tổng số chiều dài tuyến luồng (km)", "Tổng số đèn biển, đăng tiêu độc lập",
                "Tổng số cầu cảng", "Tổng số chiều dài cầu cảng (m)"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        long totalChannels = 0;
        BigDecimal totalChannelLength = BigDecimal.ZERO;
        long totalBeacons = 0;
        long totalPiers = 0;
        BigDecimal totalPierLength = BigDecimal.ZERO;

        for (OrgUnit u : units) {
            UUID uId = u.getId();

            List<NavigationChannel> uChannels = allChannels.stream()
                    .filter(c -> uId.equals(c.getOrgUnitId()) || uId.equals(c.getOperatingUnitId()))
                    .toList();

            BigDecimal uChannelLength = BigDecimal.ZERO;
            for (NavigationChannel nc : uChannels) {
                if (nc.getChannelRouteDetailList() != null) {
                    for (ChannelRouteDetail crd : nc.getChannelRouteDetailList()) {
                        if (crd.getChannelLengthKilometers() != null) {
                            uChannelLength = uChannelLength.add(crd.getChannelLengthKilometers());
                        }
                    }
                }
            }

            long uBeaconCount = allBeacons.stream()
                    .filter(b -> uId.equals(b.getOrgUnitId()))
                    .count();

            List<Pier> uPiers = allPiers.stream()
                    .filter(p -> uId.equals(p.getOrgUnitId()))
                    .toList();

            BigDecimal uPierLength = BigDecimal.ZERO;
            for (Pier p : uPiers) {
                if (p.getLength() != null) {
                    uPierLength = uPierLength.add(p.getLength());
                }
            }

            totalChannels += uChannels.size();
            totalChannelLength = totalChannelLength.add(uChannelLength);
            totalBeacons += uBeaconCount;
            totalPiers += uPiers.size();
            totalPierLength = totalPierLength.add(uPierLength);

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên Cảng vụ / Đơn vị", u.getName());
            r.put("Tổng số luồng hàng hải", uChannels.size());
            r.put("Tổng số chiều dài tuyến luồng (km)", uChannelLength);
            r.put("Tổng số đèn biển, đăng tiêu độc lập", uBeaconCount);
            r.put("Tổng số cầu cảng", uPiers.size());
            r.put("Tổng số chiều dài cầu cảng (m)", uPierLength);
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số đơn vị", rows.size());
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

        List<OrgUnit> units;
        if (isRoot) {
            units = orgUnitRepository.findAll().stream()
                    .filter(u -> u.getParentId() != null)
                    .toList();
        } else {
            units = orgUnitRepository.findById(targetUnitId).map(List::of).orElse(Collections.emptyList());
        }

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

        List<Map<String, Object>> list = new ArrayList<>();
        int idx = 1;
        for (OrgUnit u : units) {
            UUID uId = u.getId();

            List<NavigationChannel> uChannels = allChannels.stream()
                    .filter(c -> uId.equals(c.getOrgUnitId()) || uId.equals(c.getOperatingUnitId()))
                    .toList();

            BigDecimal uChannelLength = BigDecimal.ZERO;
            for (NavigationChannel nc : uChannels) {
                if (nc.getChannelRouteDetailList() != null) {
                    for (ChannelRouteDetail crd : nc.getChannelRouteDetailList()) {
                        if (crd.getChannelLengthKilometers() != null) {
                            uChannelLength = uChannelLength.add(crd.getChannelLengthKilometers());
                        }
                    }
                }
            }

            long uBeaconCount = allBeacons.stream()
                    .filter(b -> uId.equals(b.getOrgUnitId()))
                    .count();

            List<Pier> uPiers = allPiers.stream()
                    .filter(p -> uId.equals(p.getOrgUnitId()))
                    .toList();

            BigDecimal uPierLength = BigDecimal.ZERO;
            for (Pier p : uPiers) {
                if (p.getLength() != null) {
                    uPierLength = uPierLength.add(p.getLength());
                }
            }

            Map<String, Object> item = new HashMap<>();
            item.put("idx", idx++);
            item.put("ten", u.getName());
            item.put("tongSoLuongHh", uChannels.size());
            item.put("chieuDaiLuong", uChannelLength);
            item.put("tongSoDenBienDangTieu", uBeaconCount);
            item.put("tongSoCauCang", uPiers.size());
            item.put("chieuDaiCauCang", uPierLength);
            list.add(item);
        }

        if (list.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("idx", 1);
            empty.put("ten", "Không có dữ liệu");
            empty.put("tongSoLuongHh", 0);
            empty.put("chieuDaiLuong", BigDecimal.ZERO);
            empty.put("tongSoDenBienDangTieu", 0);
            empty.put("tongSoCauCang", 0);
            empty.put("chieuDaiCauCang", BigDecimal.ZERO);
            list.add(empty);
        }

        return list;
    }
}
