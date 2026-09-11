package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.ChannelRouteDetailRepository;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.station.entity.BuoyStation;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Handler for F-157 / BCKCHT_172:
 * Biểu 10-6T/N: Thống kê chi tiết phao tiêu, báo hiệu trên luồng.
 */
@Component
public class F157ReportHandler extends BaseReportHandler {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

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
        return "F-157".equalsIgnoreCase(reportCode);
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
                "Tên phao tiêu",
                "Vị trí tọa độ",
                "Hình dáng",
                "Kết cấu",
                "Diện tích (m2)",
                "Chiều cao tháp đèn (m)",
                "Chiều cao tâm sáng (m)",
                "Chủng loại đèn",
                "Màu sắc bên ngoài của tháp đèn",
                "Nguồn cung cấp năng lượng",
                "Thời điểm sửa chữa gần nhất",
                "Đơn vị quản lý"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int channelSeq = 1;
        long totalBuoysCount = 0;

        for (NavigationChannel channel : channels) {
            UUID channelId = channel.getId();
            List<ChannelRouteDetail> routes = channelRouteDetailRepository
                    .findByNavigationChannelIdOrderBySequenceNoAsc(channelId);
            Set<String> routeNames = routes.stream()
                    .map(ChannelRouteDetail::getRouteName)
                    .filter(Objects::nonNull)
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());

            List<Buoy> channelBuoys = allBuoys.stream()
                    .filter(b -> channelId.equals(stationToWaterway.get(b.getBuoyStationId()))
                            || (channel.getChannelName() != null && channel.getChannelName().equalsIgnoreCase(b.getLocationDetail()))
                            || (b.getLocationDetail() != null && routeNames.contains(b.getLocationDetail().toLowerCase())))
                    .toList();

            if (channelBuoys.isEmpty() && routes.isEmpty()) {
                continue;
            }

            // Channel Header row
            Map<String, Object> channelRow = new LinkedHashMap<>();
            channelRow.put("STT", String.valueOf(channelSeq++));
            channelRow.put("Tên phao tiêu", channel.getChannelName() != null ? channel.getChannelName() : "Luồng");
            channelRow.put("Vị trí tọa độ", "");
            channelRow.put("Hình dáng", "");
            channelRow.put("Kết cấu", "");
            channelRow.put("Diện tích (m2)", "");
            channelRow.put("Chiều cao tháp đèn (m)", "");
            channelRow.put("Chiều cao tâm sáng (m)", "");
            channelRow.put("Chủng loại đèn", "");
            channelRow.put("Màu sắc bên ngoài của tháp đèn", "");
            channelRow.put("Nguồn cung cấp năng lượng", "");
            channelRow.put("Thời điểm sửa chữa gần nhất", "");
            channelRow.put("Đơn vị quản lý", "");
            channelRow.put("_rowType", "section");
            rows.add(channelRow);

            if (routes.isEmpty()) {
                // Render buoys directly under channel
                int buoyIdx = 1;
                for (Buoy b : channelBuoys) {
                    rows.add(buildBuoyRow(String.valueOf(buoyIdx++), b));
                    totalBuoysCount++;
                }
            } else {
                char routeChar = 'A';
                for (ChannelRouteDetail route : routes) {
                    UUID routeId = route.getId();
                    List<Buoy> routeBuoys = channelBuoys.stream()
                            .filter(b -> routeId.equals(stationToRoute.get(b.getBuoyStationId()))
                                    || route.getRouteName() != null && route.getRouteName().equalsIgnoreCase(b.getLocationDetail()))
                            .toList();

                    // Route subheader row
                    Map<String, Object> routeRow = new LinkedHashMap<>();
                    routeRow.put("STT", String.valueOf(routeChar++));
                    routeRow.put("Tên phao tiêu", "\u00A0\u00A0" + (route.getRouteName() != null ? route.getRouteName() : "Tuyến luồng"));
                    routeRow.put("Vị trí tọa độ", "");
                    routeRow.put("Hình dáng", "");
                    routeRow.put("Kết cấu", "");
                    routeRow.put("Diện tích (m2)", "");
                    routeRow.put("Chiều cao tháp đèn (m)", "");
                    routeRow.put("Chiều cao tâm sáng (m)", "");
                    routeRow.put("Chủng loại đèn", "");
                    routeRow.put("Màu sắc bên ngoài của tháp đèn", "");
                    routeRow.put("Nguồn cung cấp năng lượng", "");
                    routeRow.put("Thời điểm sửa chữa gần nhất", "");
                    routeRow.put("Đơn vị quản lý", "");
                    routeRow.put("_rowType", "section");
                    rows.add(routeRow);

                    int buoyIdx = 1;
                    for (Buoy b : routeBuoys) {
                        rows.add(buildBuoyRow("\u00A0\u00A0\u00A0\u00A0" + buoyIdx++, b));
                        totalBuoysCount++;
                    }
                }
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số bản ghi phao tiêu", totalBuoysCount);

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
            Set<String> routeNames = routes.stream()
                    .map(ChannelRouteDetail::getRouteName)
                    .filter(Objects::nonNull)
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());

            List<Buoy> channelBuoys = allBuoys.stream()
                    .filter(b -> channelId.equals(stationToWaterway.get(b.getBuoyStationId()))
                            || (channel.getChannelName() != null && channel.getChannelName().equalsIgnoreCase(b.getLocationDetail()))
                            || (b.getLocationDetail() != null && routeNames.contains(b.getLocationDetail().toLowerCase())))
                    .toList();

            if (routes.isEmpty()) {
                for (Buoy b : channelBuoys) {
                    arrResult.add(buildBuoyExportMap(channel.getChannelName(), channel.getChannelName(), b));
                }
            } else {
                for (ChannelRouteDetail route : routes) {
                    UUID routeId = route.getId();
                    List<Buoy> routeBuoys = channelBuoys.stream()
                            .filter(b -> routeId.equals(stationToRoute.get(b.getBuoyStationId()))
                                    || route.getRouteName() != null && route.getRouteName().equalsIgnoreCase(b.getLocationDetail()))
                            .toList();

                    for (Buoy b : routeBuoys) {
                        arrResult.add(buildBuoyExportMap(channel.getChannelName(), route.getRouteName(), b));
                    }
                }
            }
        }

        return arrResult;
    }

    private Map<String, Object> buildBuoyRow(String stt, Buoy b) {
        String donVi = resolveUnitName(b);
        String ngaySc = b.getLastRepairDate() != null ? b.getLastRepairDate().format(DATE_FMT) : "";

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("STT", stt);
        r.put("Tên phao tiêu", b.getName() != null ? b.getName() : "");
        r.put("Vị trí tọa độ", b.getLocationDetail() != null ? b.getLocationDetail() : "");
        r.put("Hình dáng", b.getShape() != null ? b.getShape() : "");
        r.put("Kết cấu", b.getStructure() != null ? b.getStructure() : "");
        r.put("Diện tích (m2)", b.getArea() != null ? b.getArea() : "");
        r.put("Chiều cao tháp đèn (m)", b.getTowerHeight() != null ? b.getTowerHeight() : "");
        r.put("Chiều cao tâm sáng (m)", b.getLightHeight() != null ? b.getLightHeight() : "");
        r.put("Chủng loại đèn", b.getLightModel() != null ? b.getLightModel() : "");
        r.put("Màu sắc bên ngoài của tháp đèn", b.getTowerColor() != null ? b.getTowerColor() : "");
        r.put("Nguồn cung cấp năng lượng", b.getPowerSupply() != null ? b.getPowerSupply() : "");
        r.put("Thời điểm sửa chữa gần nhất", ngaySc);
        r.put("Đơn vị quản lý", donVi);
        return r;
    }

    private Map<String, Object> buildBuoyExportMap(String channelName, String routeName, Buoy b) {
        String donVi = resolveUnitName(b);
        String ngaySc = b.getLastRepairDate() != null ? b.getLastRepairDate().format(DATE_FMT) : "";

        Map<String, Object> item = new HashMap<>();
        item.put("ten", b.getName() != null ? b.getName() : "");
        item.put("viTri", b.getLocationDetail() != null ? b.getLocationDetail() : "");
        item.put("hinhDang", b.getShape() != null ? b.getShape() : "");
        item.put("ketCau", b.getStructure() != null ? b.getStructure() : "");
        item.put("dienTich", b.getArea() != null ? b.getArea() : "");
        item.put("chieuCaoThapDen", b.getTowerHeight() != null ? b.getTowerHeight() : "");
        item.put("chieuCaoTamSang", b.getLightHeight() != null ? b.getLightHeight() : "");
        item.put("chungLoaiDen", b.getLightModel() != null ? b.getLightModel() : "");
        item.put("mauSacBenNgoaiCuaThapDen", b.getTowerColor() != null ? b.getTowerColor() : "");
        item.put("nguonCungCapNangLuongChoDen", b.getPowerSupply() != null ? b.getPowerSupply() : "");
        item.put("ngaySc", ngaySc);
        item.put("fkDonViQl", donVi);
        item.put("fkLuongHh", channelName != null ? channelName : "");
        item.put("fkLuongHhTuyen", routeName != null ? routeName : "");
        return item;
    }

    private String resolveUnitName(Buoy b) {
        UUID uId = b.getUnitId() != null ? b.getUnitId() : b.getOrgUnitId();
        if (uId == null) return "";
        return orgUnitRepository.findById(uId).map(OrgUnit::getName).orElse("");
    }
}
