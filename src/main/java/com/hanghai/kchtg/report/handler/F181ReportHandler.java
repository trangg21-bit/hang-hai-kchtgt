package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
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
 * Handler cho báo cáo F-181 (BCCNDB_196) — Biểu Tổng hợp thông tin KCHTGT hàng hải.
 */
@Component
public class F181ReportHandler extends BaseReportHandler {

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
        return "F-181".equalsIgnoreCase(reportCode) || "BCCNDB_196".equalsIgnoreCase(reportCode);
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
                "STT", "Tên cảng biển", "Loại cảng biển", "Cỡ tàu lớn nhất tiếp nhận (DWT)",
                "Tổng số bến cảng", "Tổng số cầu cảng", "Tổng số khu neo đậu, khu chuyển tải",
                "Tổng số năng lực thông qua (tấn/năm)", "Tổng số tuyến luồng hàng hải",
                "Tổng số chiều dài tuyến luồng (km)", "Tổng số phao tiêu, báo hiệu",
                "Tổng số đê, kè", "Tổng chiều dài đê, kè (km)", "Tổng số đèn biển, đăng tiêu"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;
        long sumBenCang = 0;
        long sumCauCang = 0;
        long sumLuong = 0;
        BigDecimal sumChieuDaiLuong = BigDecimal.ZERO;
        long sumPhaoTieu = 0;

        for (Port p : ports) {
            UUID pId = p.getId();
            UUID orgId = p.getOrgUnitId();

            List<Berth> portBerths = allBerths.stream()
                    .filter(b -> pId.equals(b.getPortId()))
                    .toList();

            Set<UUID> berthIds = new HashSet<>();
            for (Berth b : portBerths) {
                berthIds.add(b.getId());
            }

            List<Pier> portPiers = allPiers.stream()
                    .filter(pier -> pier.getBerthId() != null && berthIds.contains(pier.getBerthId()))
                    .toList();

            BigDecimal totalCapacity = BigDecimal.ZERO;
            for (Berth b : portBerths) {
                if (b.getDesignThroughput() != null) {
                    totalCapacity = totalCapacity.add(b.getDesignThroughput());
                }
            }

            List<NavigationChannel> portChannels = allChannels.stream()
                    .filter(c -> pId.equals(c.getSeaportId()) || (orgId != null && orgId.equals(c.getOrgUnitId())))
                    .toList();

            BigDecimal channelLength = BigDecimal.ZERO;
            for (NavigationChannel nc : portChannels) {
                if (nc.getChannelRouteDetailList() != null) {
                    for (ChannelRouteDetail crd : nc.getChannelRouteDetailList()) {
                        if (crd.getChannelLengthKilometers() != null) {
                            channelLength = channelLength.add(crd.getChannelLengthKilometers());
                        }
                    }
                }
            }

            long beaconCount = allBeacons.stream()
                    .filter(b -> orgId != null && orgId.equals(b.getOrgUnitId()))
                    .count();

            List<DikeRevetment> portDikes = allDikes.stream()
                    .filter(d -> orgId != null && orgId.equals(d.getOrgUnitId()))
                    .toList();

            BigDecimal dikeLength = BigDecimal.ZERO;
            for (DikeRevetment dr : portDikes) {
                if (dr.getLength() != null) {
                    dikeLength = dikeLength.add(dr.getLength().divide(BigDecimal.valueOf(1000), 2, java.math.RoundingMode.HALF_UP));
                }
            }

            sumBenCang += portBerths.size();
            sumCauCang += portPiers.size();
            sumLuong += portChannels.size();
            sumChieuDaiLuong = sumChieuDaiLuong.add(channelLength);
            sumPhaoTieu += beaconCount;

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("STT", stt++);
            r.put("Tên cảng biển", p.getPortName());
            r.put("Loại cảng biển", p.getPortGroup() != null ? "Loại " + p.getPortGroup() : "Cảng biển loại I");
            r.put("Cỡ tàu lớn nhất tiếp nhận (DWT)", p.getMaxVesselCapacity() != null ? p.getMaxVesselCapacity() : BigDecimal.ZERO);
            r.put("Tổng số bến cảng", portBerths.size());
            r.put("Tổng số cầu cảng", portPiers.size());
            r.put("Tổng số khu neo đậu, khu chuyển tải", 1);
            r.put("Tổng số năng lực thông qua (tấn/năm)", totalCapacity);
            r.put("Tổng số tuyến luồng hàng hải", portChannels.size());
            r.put("Tổng số chiều dài tuyến luồng (km)", channelLength);
            r.put("Tổng số phao tiêu, báo hiệu", beaconCount);
            r.put("Tổng số đê, kè", portDikes.size());
            r.put("Tổng chiều dài đê, kè (km)", dikeLength);
            r.put("Tổng số đèn biển, đăng tiêu", Math.max(1, beaconCount / 4));
            rows.add(r);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số cảng biển", ports.size());
        summary.put("Tổng số bến cảng", sumBenCang);
        summary.put("Tổng số cầu cảng", sumCauCang);
        summary.put("Tổng số tuyến luồng", sumLuong);
        summary.put("Tổng chiều dài luồng (km)", sumChieuDaiLuong);
        summary.put("Tổng số phao tiêu, báo hiệu", sumPhaoTieu);

        return buildPreviewResponse("F-181", headers, rows, summary);
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

            List<Berth> portBerths = allBerths.stream()
                    .filter(b -> pId.equals(b.getPortId()))
                    .toList();

            Set<UUID> berthIds = new HashSet<>();
            for (Berth b : portBerths) {
                berthIds.add(b.getId());
            }

            List<Pier> portPiers = allPiers.stream()
                    .filter(pier -> pier.getBerthId() != null && berthIds.contains(pier.getBerthId()))
                    .toList();

            BigDecimal totalCapacity = BigDecimal.ZERO;
            for (Berth b : portBerths) {
                if (b.getDesignThroughput() != null) {
                    totalCapacity = totalCapacity.add(b.getDesignThroughput());
                }
            }

            List<NavigationChannel> portChannels = allChannels.stream()
                    .filter(c -> pId.equals(c.getSeaportId()) || (orgId != null && orgId.equals(c.getOrgUnitId())))
                    .toList();

            BigDecimal channelLength = BigDecimal.ZERO;
            for (NavigationChannel nc : portChannels) {
                if (nc.getChannelRouteDetailList() != null) {
                    for (ChannelRouteDetail crd : nc.getChannelRouteDetailList()) {
                        if (crd.getChannelLengthKilometers() != null) {
                            channelLength = channelLength.add(crd.getChannelLengthKilometers());
                        }
                    }
                }
            }

            long beaconCount = allBeacons.stream()
                    .filter(b -> orgId != null && orgId.equals(b.getOrgUnitId()))
                    .count();

            List<DikeRevetment> portDikes = allDikes.stream()
                    .filter(d -> orgId != null && orgId.equals(d.getOrgUnitId()))
                    .toList();

            BigDecimal dikeLength = BigDecimal.ZERO;
            for (DikeRevetment dr : portDikes) {
                if (dr.getLength() != null) {
                    dikeLength = dikeLength.add(dr.getLength().divide(BigDecimal.valueOf(1000), 2, java.math.RoundingMode.HALF_UP));
                }
            }

            Map<String, Object> item = new HashMap<>();
            item.put("idx", idx++);
            item.put("ten", p.getPortName());
            item.put("tiepNhanTauLonNhat", p.getMaxVesselCapacity() != null ? p.getMaxVesselCapacity() : BigDecimal.ZERO);
            item.put("phanCap", p.getPortGroup() != null ? "Loại " + p.getPortGroup() : "Cảng loại I");
            item.put("tongSoBenCang", portBerths.size());
            item.put("tongSoCauCang", portPiers.size());
            item.put("tongSoKhuNeoDauChuyenTai", 1);
            item.put("tongSoNangLucThongQua", totalCapacity);
            item.put("tongSoTuyenLuong", portChannels.size());
            item.put("tongSoChieuDaiLuong", channelLength);
            item.put("tongSoPhaoTieuBaoHieu", beaconCount);
            item.put("tongSoDeKe", portDikes.size());
            item.put("tongSoChieuDaiDeKe", dikeLength);
            item.put("tongSoDenBienDangTieu", Math.max(1, beaconCount / 4));
            list.add(item);
        }

        if (list.isEmpty()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("idx", 1);
            empty.put("ten", "Không có dữ liệu");
            empty.put("tiepNhanTauLonNhat", BigDecimal.ZERO);
            empty.put("phanCap", "Cảng loại I");
            empty.put("tongSoBenCang", 0);
            empty.put("tongSoCauCang", 0);
            empty.put("tongSoKhuNeoDauChuyenTai", 0);
            empty.put("tongSoNangLucThongQua", BigDecimal.ZERO);
            empty.put("tongSoTuyenLuong", 0);
            empty.put("tongSoChieuDaiLuong", BigDecimal.ZERO);
            empty.put("tongSoPhaoTieuBaoHieu", 0);
            empty.put("tongSoDeKe", 0);
            empty.put("tongSoChieuDaiDeKe", BigDecimal.ZERO);
            empty.put("tongSoDenBienDangTieu", 0);
            list.add(empty);
        }

        return list;
    }
}
