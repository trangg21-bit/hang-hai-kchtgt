package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.ChannelRouteDetailRepository;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.station.entity.BuoyStation;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Handler for F-156 / BCKCHT_171:
 * Biểu 09-6T/N: Thống kê về hệ thống phao tiêu, báo hiệu trên luồng.
 */
@Component
public class F156ReportHandler extends BaseReportHandler {

    @Autowired
    private NavigationChannelRepository navigationChannelRepository;

    @Autowired
    private ChannelRouteDetailRepository channelRouteDetailRepository;

    @Autowired
    private BuoyRepository buoyRepository;

    @Autowired
    private BuoyStationRepository buoyStationRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-156".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<NavigationChannel> channels = navigationChannelRepository.findByDeletedAtIsNull(Sort.unsorted()).stream()
                .filter(nc -> skipFilter || targetUnitId.equals(nc.getOrgUnitId()))
                .filter(nc -> (nc.getUpdatedAt() == null && nc.getCreatedAt() == null)
                        || (nc.getUpdatedAt() != null && nc.getUpdatedAt().getYear() <= reportYear)
                        || (nc.getCreatedAt() != null && nc.getCreatedAt().getYear() <= reportYear))
                .toList();

        List<Buoy> allBuoys = buoyRepository.findAll().stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> skipFilter || targetUnitId.equals(b.getUnitId()) || targetUnitId.equals(b.getOrgUnitId()))
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<BuoyStation> allStations = buoyStationRepository.findAll().stream()
                .filter(s -> s.getDeletedAt() == null)
                .toList();

        // Index stationId -> waterwayId
        Map<UUID, UUID> stationToWaterway = new HashMap<>();
        Map<UUID, UUID> stationToRoute = new HashMap<>();
        for (BuoyStation s : allStations) {
            if (s.getId() != null) {
                if (s.getWaterwayId() != null) stationToWaterway.put(s.getId(), s.getWaterwayId());
                if (s.getWaterwayRouteId() != null) stationToRoute.put(s.getId(), s.getWaterwayRouteId());
            }
        }

        List<String> headers = List.of(
                "STT",
                "Danh mục luồng, tuyến luồng hàng hải",
                "Phao báo hiệu có đèn",
                "Phao báo hiệu không đèn",
                "Tổng phao báo hiệu",
                "Tiêu có đèn",
                "Tiêu không đèn",
                "Chập tiêu có đèn",
                "Chập tiêu không đèn",
                "Tổng tiêu"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int seq = 1;
        long grandTotalPhao = 0;
        long grandTotalTieu = 0;

        for (NavigationChannel channel : channels) {
            UUID channelId = channel.getId();
            List<ChannelRouteDetail> routes = channelRouteDetailRepository
                    .findByNavigationChannelIdOrderBySequenceNoAsc(channelId);

            // Buoys for this entire channel
            List<Buoy> channelBuoys = allBuoys.stream()
                    .filter(b -> channelId.equals(stationToWaterway.get(b.getBuoyStationId()))
                            || channel.getChannelName() != null && channel.getChannelName().equalsIgnoreCase(b.getLocationDetail()))
                    .toList();

            BuoyStats channelStats = calculateBuoyStats(channelBuoys);

            // Parent row for Channel
            Map<String, Object> parentRow = new LinkedHashMap<>();
            parentRow.put("STT", String.valueOf(seq++));
            parentRow.put("Danh mục luồng, tuyến luồng hàng hải", channel.getChannelName() != null ? channel.getChannelName() : "Luồng chưa đặt tên");
            parentRow.put("Phao báo hiệu có đèn", channelStats.phaoCoDen);
            parentRow.put("Phao báo hiệu không đèn", channelStats.phaoKhongDen);
            parentRow.put("Tổng phao báo hiệu", channelStats.phaoCoDen + channelStats.phaoKhongDen);
            parentRow.put("Tiêu có đèn", channelStats.tieuCoDen);
            parentRow.put("Tiêu không đèn", channelStats.tieuKhongDen);
            parentRow.put("Chập tiêu có đèn", channelStats.chapTieuCoDen);
            parentRow.put("Chập tiêu không đèn", channelStats.chapTieuKhongDen);
            parentRow.put("Tổng tiêu", channelStats.tieuCoDen + channelStats.tieuKhongDen + channelStats.chapTieuCoDen + channelStats.chapTieuKhongDen);
            parentRow.put("_rowType", "section");
            rows.add(parentRow);

            grandTotalPhao += channelStats.phaoCoDen + channelStats.phaoKhongDen;
            grandTotalTieu += channelStats.tieuCoDen + channelStats.tieuKhongDen + channelStats.chapTieuCoDen + channelStats.chapTieuKhongDen;

            // Child routes
            for (ChannelRouteDetail route : routes) {
                UUID routeId = route.getId();
                List<Buoy> routeBuoys = channelBuoys.stream()
                        .filter(b -> routeId.equals(stationToRoute.get(b.getBuoyStationId()))
                                || route.getRouteName() != null && route.getRouteName().equalsIgnoreCase(b.getLocationDetail()))
                        .toList();

                BuoyStats routeStats = calculateBuoyStats(routeBuoys);

                Map<String, Object> childRow = new LinkedHashMap<>();
                childRow.put("STT", "");
                childRow.put("Danh mục luồng, tuyến luồng hàng hải", "\u00A0\u00A0\u00A0\u00A0" + (route.getRouteName() != null ? route.getRouteName() : "Tuyến luồng"));
                childRow.put("Phao báo hiệu có đèn", routeStats.phaoCoDen);
                childRow.put("Phao báo hiệu không đèn", routeStats.phaoKhongDen);
                childRow.put("Tổng phao báo hiệu", routeStats.phaoCoDen + routeStats.phaoKhongDen);
                childRow.put("Tiêu có đèn", routeStats.tieuCoDen);
                childRow.put("Tiêu không đèn", routeStats.tieuKhongDen);
                childRow.put("Chập tiêu có đèn", routeStats.chapTieuCoDen);
                childRow.put("Chập tiêu không đèn", routeStats.chapTieuKhongDen);
                childRow.put("Tổng tiêu", routeStats.tieuCoDen + routeStats.tieuKhongDen + routeStats.chapTieuCoDen + routeStats.chapTieuKhongDen);
                rows.add(childRow);
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số luồng", channels.size());
        summary.put("Tổng phao báo hiệu", grandTotalPhao);
        summary.put("Tổng tiêu báo hiệu", grandTotalTieu);

        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);

        List<NavigationChannel> channels = navigationChannelRepository.findByDeletedAtIsNull(Sort.unsorted()).stream()
                .filter(nc -> skipFilter || targetUnitId.equals(nc.getOrgUnitId()))
                .filter(nc -> (nc.getUpdatedAt() == null && nc.getCreatedAt() == null)
                        || (nc.getUpdatedAt() != null && nc.getUpdatedAt().getYear() <= reportYear)
                        || (nc.getCreatedAt() != null && nc.getCreatedAt().getYear() <= reportYear))
                .toList();

        List<Buoy> allBuoys = buoyRepository.findAll().stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> skipFilter || targetUnitId.equals(b.getUnitId()) || targetUnitId.equals(b.getOrgUnitId()))
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<BuoyStation> allStations = buoyStationRepository.findAll().stream()
                .filter(s -> s.getDeletedAt() == null)
                .toList();

        Map<UUID, UUID> stationToWaterway = new HashMap<>();
        Map<UUID, UUID> stationToRoute = new HashMap<>();
        for (BuoyStation s : allStations) {
            if (s.getId() != null) {
                if (s.getWaterwayId() != null) stationToWaterway.put(s.getId(), s.getWaterwayId());
                if (s.getWaterwayRouteId() != null) stationToRoute.put(s.getId(), s.getWaterwayRouteId());
            }
        }

        List<Map<String, Object>> arrResult = new ArrayList<>();

        for (NavigationChannel channel : channels) {
            UUID channelId = channel.getId();
            List<ChannelRouteDetail> routes = channelRouteDetailRepository
                    .findByNavigationChannelIdOrderBySequenceNoAsc(channelId);

            List<Buoy> channelBuoys = allBuoys.stream()
                    .filter(b -> channelId.equals(stationToWaterway.get(b.getBuoyStationId()))
                            || channel.getChannelName() != null && channel.getChannelName().equalsIgnoreCase(b.getLocationDetail()))
                    .toList();

            BuoyStats channelStats = calculateBuoyStats(channelBuoys);

            // If channel has no routes, generate at least 1 entry for the channel
            if (routes.isEmpty()) {
                Map<String, Object> item = new HashMap<>();
                item.put("ten", channel.getChannelName() != null ? channel.getChannelName() : "");
                item.put("fkLuongHhTuyen", channel.getChannelName() != null ? channel.getChannelName() : "");
                item.put("tongSoLuongPhaoBaoHieuCoDen", channelStats.phaoCoDen);
                item.put("tongSoLuongPhaoBaoHieuKhongDen", channelStats.phaoKhongDen);
                item.put("tongSoLuongTieuCoDen", channelStats.tieuCoDen);
                item.put("tongSoLuongTieuKhongDen", channelStats.tieuKhongDen);
                item.put("tongSoLuongChapTieuCoDen", channelStats.chapTieuCoDen);
                item.put("tongSoLuongChapTieuKhongDen", channelStats.chapTieuKhongDen);

                long tongPhao = channelStats.phaoCoDen + channelStats.phaoKhongDen;
                long tongTieu = channelStats.tieuCoDen + channelStats.tieuKhongDen + channelStats.chapTieuCoDen + channelStats.chapTieuKhongDen;
                item.put("tongSoLuongPhaoBaoHieu", tongPhao);
                item.put("tongSoLuongTieu", tongTieu);

                item.put("soLuongPhaoBaoHieuCoDen", channelStats.phaoCoDen);
                item.put("soLuongPhaoBaoHieuKhongDen", channelStats.phaoKhongDen);
                item.put("soLuongTieuCoDen", channelStats.tieuCoDen);
                item.put("soLuongTieuKhongDen", channelStats.tieuKhongDen);
                item.put("soLuongChapTieuCoDen", channelStats.chapTieuCoDen);
                item.put("soLuongChapTieuKhongDen", channelStats.chapTieuKhongDen);
                item.put("soLuongPhaoBaoHieu", tongPhao);
                item.put("soLuongTieu", tongTieu);
                item.put("tongSo", tongPhao);
                item.put("tongCong", tongTieu);

                arrResult.add(item);
            } else {
                for (ChannelRouteDetail route : routes) {
                    UUID routeId = route.getId();
                    List<Buoy> routeBuoys = channelBuoys.stream()
                            .filter(b -> routeId.equals(stationToRoute.get(b.getBuoyStationId()))
                                    || route.getRouteName() != null && route.getRouteName().equalsIgnoreCase(b.getLocationDetail()))
                            .toList();

                    BuoyStats routeStats = calculateBuoyStats(routeBuoys);

                    Map<String, Object> item = new HashMap<>();
                    item.put("ten", channel.getChannelName() != null ? channel.getChannelName() : "");
                    item.put("fkLuongHhTuyen", route.getRouteName() != null ? route.getRouteName() : "");
                    item.put("tongSoLuongPhaoBaoHieuCoDen", channelStats.phaoCoDen);
                    item.put("tongSoLuongPhaoBaoHieuKhongDen", channelStats.phaoKhongDen);
                    item.put("tongSoLuongTieuCoDen", channelStats.tieuCoDen);
                    item.put("tongSoLuongTieuKhongDen", channelStats.tieuKhongDen);
                    item.put("tongSoLuongChapTieuCoDen", channelStats.chapTieuCoDen);
                    item.put("tongSoLuongChapTieuKhongDen", channelStats.chapTieuKhongDen);

                    long tongPhaoChannel = channelStats.phaoCoDen + channelStats.phaoKhongDen;
                    long tongTieuChannel = channelStats.tieuCoDen + channelStats.tieuKhongDen + channelStats.chapTieuCoDen + channelStats.chapTieuKhongDen;
                    item.put("tongSoLuongPhaoBaoHieu", tongPhaoChannel);
                    item.put("tongSoLuongTieu", tongTieuChannel);

                    long tongPhaoRoute = routeStats.phaoCoDen + routeStats.phaoKhongDen;
                    long tongTieuRoute = routeStats.tieuCoDen + routeStats.tieuKhongDen + routeStats.chapTieuCoDen + routeStats.chapTieuKhongDen;
                    item.put("soLuongPhaoBaoHieuCoDen", routeStats.phaoCoDen);
                    item.put("soLuongPhaoBaoHieuKhongDen", routeStats.phaoKhongDen);
                    item.put("soLuongTieuCoDen", routeStats.tieuCoDen);
                    item.put("soLuongTieuKhongDen", routeStats.tieuKhongDen);
                    item.put("soLuongChapTieuCoDen", routeStats.chapTieuCoDen);
                    item.put("soLuongChapTieuKhongDen", routeStats.chapTieuKhongDen);
                    item.put("soLuongPhaoBaoHieu", tongPhaoRoute);
                    item.put("soLuongTieu", tongTieuRoute);
                    item.put("tongSo", tongPhaoRoute);
                    item.put("tongCong", tongTieuRoute);

                    arrResult.add(item);
                }
            }
        }

        return arrResult;
    }

    private BuoyStats calculateBuoyStats(List<Buoy> buoys) {
        BuoyStats s = new BuoyStats();
        for (Buoy b : buoys) {
            boolean hasLight = isBuoyLighted(b);
            String kind = classifyBuoyKind(b);
            if ("CHAP_TIEU".equals(kind)) {
                if (hasLight) s.chapTieuCoDen++;
                else s.chapTieuKhongDen++;
            } else if ("TIEU".equals(kind)) {
                if (hasLight) s.tieuCoDen++;
                else s.tieuKhongDen++;
            } else {
                if (hasLight) s.phaoCoDen++;
                else s.phaoKhongDen++;
            }
        }
        return s;
    }

    private boolean isBuoyLighted(Buoy b) {
        if ("1".equals(b.getBeaconLight()) || "true".equalsIgnoreCase(b.getBeaconLight())) return true;
        if (b.getLightCharacteristic() != null && !b.getLightCharacteristic().isBlank()) return true;
        if (b.getLightModel() != null && !b.getLightModel().isBlank()) return true;
        if (b.getLightColor() != null && !b.getLightColor().isBlank()) return true;
        return false;
    }

    private String classifyBuoyKind(Buoy b) {
        String c = (b.getClassification() != null ? b.getClassification() : "")
                + " " + (b.getClassificationMark() != null ? b.getClassificationMark() : "")
                + " " + (b.getType() != null ? b.getType() : "");
        c = c.toLowerCase(Locale.ROOT);
        if (c.contains("chập tiêu") || c.contains("chap tieu") || c.contains("lead")) {
            return "CHAP_TIEU";
        }
        if (c.contains("tiêu") || c.contains("tieu") || c.contains("mark") || c.contains("beacon")) {
            return "TIEU";
        }
        return "PHAO";
    }

    private static class BuoyStats {
        long phaoCoDen = 0;
        long phaoKhongDen = 0;
        long tieuCoDen = 0;
        long tieuKhongDen = 0;
        long chapTieuCoDen = 0;
        long chapTieuKhongDen = 0;
    }
}
