package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.entity.InlandWaterwayPortCall;
import com.hanghai.kchtg.report.repository.InlandWaterwayPortCallRepository;
import com.hanghai.kchtg.shipportcall.entity.ShipPortCall;
import com.hanghai.kchtg.shipportcall.repository.ShipPortCallRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

/**
 * Service tính toán và tổng hợp dữ liệu cho phân hệ báo cáo BCDL (F-161 đến F-169).
 * Chuyển đổi logic ngữ nghĩa từ T-SQL (PKG_WEB_BC_COMMON___SP_DETAIL___BCDL_*___CT, SP_GET_DATA_DEFAULT).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class BcdlAggregationService {

    private final ShipPortCallRepository shipPortCallRepository;
    private final InlandWaterwayPortCallRepository inlandWaterwayPortCallRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final PortRepository portRepository;
    private final BerthRepository berthRepository;

    public boolean isOrgUnitRoot(UUID orgUnitId) {
        if (orgUnitId == null) return true;
        return orgUnitRepository.findById(orgUnitId)
                .map(u -> u.getParentId() == null)
                .orElse(false);
    }

    public List<ShipPortCall> getFilteredShipPortCalls(UUID targetUnitId, LocalDate fromDate, LocalDate toDate) {
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        return shipPortCallRepository.findAll().stream()
                .filter(s -> s.getDeletedAt() == null)
                .filter(s -> skipFilter || targetUnitId.equals(s.getOrgUnitId()))
                .filter(s -> {
                    LocalDate d = s.getReportDate() != null ? s.getReportDate()
                            : s.getArrivalDate() != null ? s.getArrivalDate() : s.getDepartureDate();
                    if (d == null) return false;
                    if (fromDate != null && d.isBefore(fromDate)) return false;
                    if (toDate != null && d.isAfter(toDate)) return false;
                    return true;
                })
                .toList();
    }

    public List<InlandWaterwayPortCall> getFilteredInlandPortCalls(UUID targetUnitId, LocalDate fromDate, LocalDate toDate) {
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        return inlandWaterwayPortCallRepository.findAll().stream()
                .filter(s -> s.getDeletedAt() == null)
                .filter(s -> skipFilter || targetUnitId.equals(s.getOrgUnitId()))
                .filter(s -> {
                    LocalDate d = s.getReportDate() != null ? s.getReportDate()
                            : s.getArrivalDate() != null ? s.getArrivalDate() : s.getDepartureDate();
                    if (d == null) return false;
                    if (fromDate != null && d.isBefore(fromDate)) return false;
                    if (toDate != null && d.isAfter(toDate)) return false;
                    return true;
                })
                .toList();
    }

    public boolean isForeignShip(ShipPortCall ship) {
        if (ship == null || ship.getNationality() == null) return false;
        String nat = ship.getNationality().trim().toUpperCase(Locale.ROOT);
        return !nat.equals("VNM") && !nat.equals("VN") && !nat.equals("VIETNAM") && !nat.equals("VIỆT NAM");
    }

    public boolean isVnShip(ShipPortCall ship) {
        if (ship == null) return false;
        return !isForeignShip(ship);
    }

    public boolean isInternationalVoyage(ShipPortCall ship) {
        if (ship == null) return false;
        String dest = ship.getDestinationPort() != null ? ship.getDestinationPort().trim().toUpperCase(Locale.ROOT) : "";
        String last = ship.getLastPortOfCall() != null ? ship.getLastPortOfCall().trim().toUpperCase(Locale.ROOT) : "";
        return dest.contains("QUỐC TẾ") || dest.contains("INT") || last.contains("QUỐC TẾ") || last.contains("INT")
                || isForeignShip(ship)
                || (ship.getExportTons() != null && ship.getExportTons().compareTo(BigDecimal.ZERO) > 0)
                || (ship.getImportTons() != null && ship.getImportTons().compareTo(BigDecimal.ZERO) > 0);
    }

    public boolean isVrSb(InlandWaterwayPortCall boat) {
        if (boat == null || boat.getBoatGrade() == null) return false;
        String grade = boat.getBoatGrade().trim().toUpperCase(Locale.ROOT);
        return grade.equals("1") || grade.contains("VR-SB") || grade.contains("VRSB");
    }

    public boolean isIslandRoute(ShipPortCall ship) {
        if (ship == null) return false;
        return ship.getIslandRoute() != null && ship.getIslandRoute() == ShipPortCall.IslandRoute.YES;
    }

    public boolean isIslandRoute(InlandWaterwayPortCall boat) {
        if (boat == null) return false;
        return boat.getIslandRoute() != null && boat.getIslandRoute() == 1;
    }

    public BigDecimal defaultZero(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    public long defaultZero(Integer val) {
        return val != null ? val.longValue() : 0L;
    }

    // =========================================================================
    // TỔNG HỢP CHO BIỂU 16-T (BCDL_180 / F-165) & BIỂU 16-N (BCDL_181 / F-166)
    // =========================================================================

    public Map<String, BigDecimal> aggregateCargoMetrics(List<ShipPortCall> ships, List<InlandWaterwayPortCall> boats) {
        Map<String, BigDecimal> m = new HashMap<>();

        BigDecimal containerXuatKhauTan = BigDecimal.ZERO;
        BigDecimal containerXuatKhauTeus = BigDecimal.ZERO;
        BigDecimal containerNhapKhauTan = BigDecimal.ZERO;
        BigDecimal containerNhapKhauTeus = BigDecimal.ZERO;
        BigDecimal containerNoiDiaTan = BigDecimal.ZERO;
        BigDecimal containerNoiDiaTeus = BigDecimal.ZERO;

        BigDecimal hangLongXuatKhau = BigDecimal.ZERO;
        BigDecimal hangLongNhapKhau = BigDecimal.ZERO;
        BigDecimal hangLongNoiDia = BigDecimal.ZERO;

        BigDecimal hangKhoTongHopXuatKhau = BigDecimal.ZERO;
        BigDecimal hangKhoTongHopNhapKhau = BigDecimal.ZERO;
        BigDecimal hangKhoTongHopNoiDia = BigDecimal.ZERO;

        BigDecimal hangQuaCanhXepDo = BigDecimal.ZERO;
        BigDecimal hangQuaCanhKhongXepDo = BigDecimal.ZERO;

        BigDecimal hangHoaTauBien = BigDecimal.ZERO;
        BigDecimal hangHoaPttnd = BigDecimal.ZERO;
        BigDecimal hangHoaPttndTruVrSb = BigDecimal.ZERO;
        BigDecimal hangHoaPttndVrSb = BigDecimal.ZERO;
        BigDecimal hangHoaPttndVrSbCbCb = BigDecimal.ZERO;
        BigDecimal hangHoaPttndVrSbCbCtnd = BigDecimal.ZERO;

        BigDecimal hangKhuChuyenTai = BigDecimal.ZERO;
        BigDecimal hangTuyenBoRaDao = BigDecimal.ZERO;

        BigDecimal hanhKhachTauBienVn = BigDecimal.ZERO;
        BigDecimal hanhKhachTauBienNn = BigDecimal.ZERO;
        BigDecimal hanhKhachPttnd = BigDecimal.ZERO;
        BigDecimal hanhKhachBoRaDao = BigDecimal.ZERO;

        for (ShipPortCall s : ships) {
            BigDecimal expTan = defaultZero(s.getExportTons());
            BigDecimal expTeus = defaultZero(s.getExportTeus());
            BigDecimal impTan = defaultZero(s.getImportTons());
            BigDecimal impTeus = defaultZero(s.getImportTeus());
            BigDecimal domInTan = defaultZero(s.getDomesticInTons());
            BigDecimal domInTeus = defaultZero(s.getDomesticInTeus());
            BigDecimal domOutTan = defaultZero(s.getDomesticOutTons());
            BigDecimal domOutTeus = defaultZero(s.getDomesticOutTeus());
            BigDecimal transTan = defaultZero(s.getTransshipmentTons());
            BigDecimal transitHandlingTan = defaultZero(s.getTransitHandlingTons());
            BigDecimal transitNoHandlingTan = defaultZero(s.getTransitNoHandlingTons());

            BigDecimal shipTotalTan = expTan.add(impTan).add(domInTan).add(domOutTan)
                    .add(transTan).add(transitHandlingTan).add(transitNoHandlingTan);
            hangHoaTauBien = hangHoaTauBien.add(shipTotalTan);

            String cargoType = s.getCargoType() != null ? s.getCargoType().trim().toUpperCase(Locale.ROOT) : "";
            boolean isCont = cargoType.contains("CONTAINER") || expTeus.compareTo(BigDecimal.ZERO) > 0 || impTeus.compareTo(BigDecimal.ZERO) > 0;
            boolean isLiquid = cargoType.contains("LỎNG") || cargoType.contains("XĂNG") || cargoType.contains("DẦU") || cargoType.contains("LIQUID");

            if (isCont) {
                containerXuatKhauTan = containerXuatKhauTan.add(expTan);
                containerXuatKhauTeus = containerXuatKhauTeus.add(expTeus);
                containerNhapKhauTan = containerNhapKhauTan.add(impTan);
                containerNhapKhauTeus = containerNhapKhauTeus.add(impTeus);
                containerNoiDiaTan = containerNoiDiaTan.add(domInTan).add(domOutTan);
                containerNoiDiaTeus = containerNoiDiaTeus.add(domInTeus).add(domOutTeus);
            } else if (isLiquid) {
                hangLongXuatKhau = hangLongXuatKhau.add(expTan);
                hangLongNhapKhau = hangLongNhapKhau.add(impTan);
                hangLongNoiDia = hangLongNoiDia.add(domInTan).add(domOutTan);
            } else {
                hangKhoTongHopXuatKhau = hangKhoTongHopXuatKhau.add(expTan);
                hangKhoTongHopNhapKhau = hangKhoTongHopNhapKhau.add(impTan);
                hangKhoTongHopNoiDia = hangKhoTongHopNoiDia.add(domInTan).add(domOutTan);
            }

            hangQuaCanhXepDo = hangQuaCanhXepDo.add(transitHandlingTan);
            hangQuaCanhKhongXepDo = hangQuaCanhKhongXepDo.add(transitNoHandlingTan);
            hangKhuChuyenTai = hangKhuChuyenTai.add(transTan);

            if (isIslandRoute(s)) {
                hangTuyenBoRaDao = hangTuyenBoRaDao.add(shipTotalTan);
            }

            long passArr = defaultZero(s.getPassengersArrival());
            long passDep = defaultZero(s.getPassengersDeparture());
            long passTotal = passArr + passDep;

            if (isIslandRoute(s)) {
                hanhKhachBoRaDao = hanhKhachBoRaDao.add(BigDecimal.valueOf(passTotal));
            } else if (isForeignShip(s)) {
                hanhKhachTauBienNn = hanhKhachTauBienNn.add(BigDecimal.valueOf(passTotal));
            } else {
                hanhKhachTauBienVn = hanhKhachTauBienVn.add(BigDecimal.valueOf(passTotal));
            }
        }

        for (InlandWaterwayPortCall b : boats) {
            BigDecimal expTan = defaultZero(b.getExportTons());
            BigDecimal expTeus = defaultZero(b.getExportTeus());
            BigDecimal impTan = defaultZero(b.getImportTons());
            BigDecimal impTeus = defaultZero(b.getImportTeus());
            BigDecimal domInTan = defaultZero(b.getDomesticInTons());
            BigDecimal domInTeus = defaultZero(b.getDomesticInTeus());
            BigDecimal domOutTan = defaultZero(b.getDomesticOutTons());
            BigDecimal domOutTeus = defaultZero(b.getDomesticOutTeus());
            BigDecimal transTan = defaultZero(b.getTransshipmentTons());
            BigDecimal transitHandlingTan = defaultZero(b.getTransitHandlingTons());
            BigDecimal transitNoHandlingTan = defaultZero(b.getTransitNoHandlingTons());

            BigDecimal boatTotalTan = expTan.add(impTan).add(domInTan).add(domOutTan)
                    .add(transTan).add(transitHandlingTan).add(transitNoHandlingTan);
            hangHoaPttnd = hangHoaPttnd.add(boatTotalTan);

            boolean vrSb = isVrSb(b);
            if (vrSb) {
                hangHoaPttndVrSb = hangHoaPttndVrSb.add(boatTotalTan);
                String last = b.getLastPortOfCall() != null ? b.getLastPortOfCall().toUpperCase(Locale.ROOT) : "";
                String dest = b.getDestinationPort() != null ? b.getDestinationPort().toUpperCase(Locale.ROOT) : "";
                if (last.contains("[TND]") || dest.contains("[TND]")) {
                    hangHoaPttndVrSbCbCtnd = hangHoaPttndVrSbCbCtnd.add(boatTotalTan);
                } else {
                    hangHoaPttndVrSbCbCb = hangHoaPttndVrSbCbCb.add(boatTotalTan);
                }
            } else {
                hangHoaPttndTruVrSb = hangHoaPttndTruVrSb.add(boatTotalTan);
            }

            String cargoType = b.getCargoType() != null ? b.getCargoType().trim().toUpperCase(Locale.ROOT) : "";
            boolean isCont = cargoType.contains("CONTAINER") || expTeus.compareTo(BigDecimal.ZERO) > 0 || impTeus.compareTo(BigDecimal.ZERO) > 0;
            boolean isLiquid = cargoType.contains("LỎNG") || cargoType.contains("XĂNG") || cargoType.contains("DẦU");

            if (isCont) {
                containerXuatKhauTan = containerXuatKhauTan.add(expTan);
                containerXuatKhauTeus = containerXuatKhauTeus.add(expTeus);
                containerNhapKhauTan = containerNhapKhauTan.add(impTan);
                containerNhapKhauTeus = containerNhapKhauTeus.add(impTeus);
                containerNoiDiaTan = containerNoiDiaTan.add(domInTan).add(domOutTan);
                containerNoiDiaTeus = containerNoiDiaTeus.add(domInTeus).add(domOutTeus);
            } else if (isLiquid) {
                hangLongXuatKhau = hangLongXuatKhau.add(expTan);
                hangLongNhapKhau = hangLongNhapKhau.add(impTan);
                hangLongNoiDia = hangLongNoiDia.add(domInTan).add(domOutTan);
            } else {
                hangKhoTongHopXuatKhau = hangKhoTongHopXuatKhau.add(expTan);
                hangKhoTongHopNhapKhau = hangKhoTongHopNhapKhau.add(impTan);
                hangKhoTongHopNoiDia = hangKhoTongHopNoiDia.add(domInTan).add(domOutTan);
            }

            hangQuaCanhXepDo = hangQuaCanhXepDo.add(transitHandlingTan);
            hangQuaCanhKhongXepDo = hangQuaCanhKhongXepDo.add(transitNoHandlingTan);
            hangKhuChuyenTai = hangKhuChuyenTai.add(transTan);

            if (isIslandRoute(b)) {
                hangTuyenBoRaDao = hangTuyenBoRaDao.add(boatTotalTan);
            }

            long passArr = defaultZero(b.getPassengersArrival());
            long passDep = defaultZero(b.getPassengersDeparture());
            long passTotal = passArr + passDep;

            if (isIslandRoute(b)) {
                hanhKhachBoRaDao = hanhKhachBoRaDao.add(BigDecimal.valueOf(passTotal));
            } else {
                hanhKhachPttnd = hanhKhachPttnd.add(BigDecimal.valueOf(passTotal));
            }
        }

        m.put("containerXuatKhauTan", containerXuatKhauTan);
        m.put("containerXuatKhauTeus", containerXuatKhauTeus);
        m.put("containerNhapKhauTan", containerNhapKhauTan);
        m.put("containerNhapKhauTeus", containerNhapKhauTeus);
        m.put("containerNoiDiaTan", containerNoiDiaTan);
        m.put("containerNoiDiaTeus", containerNoiDiaTeus);

        BigDecimal containerTanTong = containerXuatKhauTan.add(containerNhapKhauTan).add(containerNoiDiaTan);
        BigDecimal containerTeusTong = containerXuatKhauTeus.add(containerNhapKhauTeus).add(containerNoiDiaTeus);
        m.put("containerTan", containerTanTong);
        m.put("containerTeus", containerTeusTong);

        m.put("hangLongXuatKhau", hangLongXuatKhau);
        m.put("hangLongNhapKhau", hangLongNhapKhau);
        m.put("hangLongNoiDia", hangLongNoiDia);
        m.put("hangLong", hangLongXuatKhau.add(hangLongNhapKhau).add(hangLongNoiDia));

        m.put("hangKhoTongHopXuatKhau", hangKhoTongHopXuatKhau);
        m.put("hangKhoTongHopNhapKhau", hangKhoTongHopNhapKhau);
        m.put("hangKhoTongHopNoiDia", hangKhoTongHopNoiDia);
        m.put("hangKhoTongHop", hangKhoTongHopXuatKhau.add(hangKhoTongHopNhapKhau).add(hangKhoTongHopNoiDia));

        m.put("hangQuaCanhXepDo", hangQuaCanhXepDo);
        m.put("hangQuaCanhKhongXepDo", hangQuaCanhKhongXepDo);

        BigDecimal hangXuatKhauTong = containerXuatKhauTan.add(hangLongXuatKhau).add(hangKhoTongHopXuatKhau);
        BigDecimal hangNhapKhauTong = containerNhapKhauTan.add(hangLongNhapKhau).add(hangKhoTongHopNhapKhau);
        BigDecimal hangNoiDiaTong = containerNoiDiaTan.add(hangLongNoiDia).add(hangKhoTongHopNoiDia);
        m.put("hangHoaThongQuaCangBienHangXuatKhau", hangXuatKhauTong);
        m.put("hangHoaThongQuaCangBienHangNhapKhau", hangNhapKhauTong);
        m.put("hangHoaThongQuaCangBienHangNoiDia", hangNoiDiaTong);
        m.put("hangHoaThongQuaCangBienHangQuaCanhXepDo", hangQuaCanhXepDo);
        m.put("hangHoaThongQuaCangBienTongSo", hangXuatKhauTong.add(hangNhapKhauTong).add(hangNoiDiaTong).add(hangQuaCanhXepDo));

        m.put("hangHoaThongQuaBangTauBien", hangHoaTauBien);
        m.put("hangHoaThongQuaBangPttnd", hangHoaPttnd);
        m.put("hangVanChuyenBangPttndTruPttndVrSb", hangHoaPttndTruVrSb);
        m.put("hangVanChuyenBangPttndDangKyVrSb", hangHoaPttndVrSb);
        m.put("hangVanChuyenBangPttndDangKyVrSbTuCbCb", hangHoaPttndVrSbCbCb);
        m.put("hangVanChuyenBangPttndDangKyVrSbTuCbCtndVaNguocLai", hangHoaPttndVrSbCbCtnd);

        m.put("tauThuyenTrongTaiTu200TroXuong", hangTuyenBoRaDao);
        m.put("hangHoaTuyenTuBoRaDao", hangTuyenBoRaDao);
        m.put("khuNeoDauChuyenTai", hangKhuChuyenTai);

        m.put("hanhKhachThongQuaBangDoiTauBienVn", hanhKhachTauBienVn);
        m.put("hanhKhachThongQuaBangDoiTauBienNuocNgoai", hanhKhachTauBienNn);
        m.put("hanhKhachThongQuaBangPttnd", hanhKhachPttnd);
        m.put("hanhKhachTuyenTuBoRaDao", hanhKhachBoRaDao);
        m.put("hanhKhachTongSo", hanhKhachTauBienVn.add(hanhKhachTauBienNn).add(hanhKhachPttnd).add(hanhKhachBoRaDao));

        return m;
    }

    // =========================================================================
    // TỔNG HỢP CHO BIỂU 17-T (BCDL_182 / F-167)
    // =========================================================================

    public Map<String, BigDecimal> aggregateShipTurnMetrics(List<ShipPortCall> ships, List<InlandWaterwayPortCall> boats) {
        Map<String, BigDecimal> m = new HashMap<>();

        long tauBienNnLuotVao = 0, tauBienNnLuotRoi = 0;
        BigDecimal tauBienNnGt = BigDecimal.ZERO, tauBienNnDwt = BigDecimal.ZERO;

        long tauBienVnVtkteLuotVao = 0, tauBienVnVtkteLuotRoi = 0;
        BigDecimal tauBienVnVtkteGt = BigDecimal.ZERO, tauBienVnVtkteDwt = BigDecimal.ZERO;

        long tauBienVnVtnoidiaLuotVao = 0, tauBienVnVtnoidiaLuotRoi = 0;
        BigDecimal tauBienVnVtnoidiaGt = BigDecimal.ZERO, tauBienVnVtnoidiaDwt = BigDecimal.ZERO;

        long pttndLuotVao = 0, pttndLuotRoi = 0;
        BigDecimal pttndGt = BigDecimal.ZERO, pttndDwt = BigDecimal.ZERO;

        long pttndVrSbLuotVao = 0, pttndVrSbLuotRoi = 0;
        BigDecimal pttndVrSbGt = BigDecimal.ZERO, pttndVrSbDwt = BigDecimal.ZERO;

        long tauThuyen200LuotVao = 0, tauThuyen200LuotRoi = 0;
        BigDecimal tauThuyen200Gt = BigDecimal.ZERO, tauThuyen200Dwt = BigDecimal.ZERO;

        long tuyenBoRaDaoLuotVao = 0, tuyenBoRaDaoLuotRoi = 0;
        BigDecimal tuyenBoRaDaoGt = BigDecimal.ZERO, tuyenBoRaDaoDwt = BigDecimal.ZERO;

        for (ShipPortCall s : ships) {
            BigDecimal gt = defaultZero(s.getGt());
            BigDecimal dwt = defaultZero(s.getDwt());
            boolean hasArr = s.getArrivalDate() != null;
            boolean hasDep = s.getDepartureDate() != null;

            if (isIslandRoute(s)) {
                if (hasArr) tuyenBoRaDaoLuotVao++;
                if (hasDep) tuyenBoRaDaoLuotRoi++;
                tuyenBoRaDaoGt = tuyenBoRaDaoGt.add(gt);
                tuyenBoRaDaoDwt = tuyenBoRaDaoDwt.add(dwt);
            } else if (isForeignShip(s)) {
                if (hasArr) tauBienNnLuotVao++;
                if (hasDep) tauBienNnLuotRoi++;
                tauBienNnGt = tauBienNnGt.add(gt);
                tauBienNnDwt = tauBienNnDwt.add(dwt);
            } else if (isInternationalVoyage(s)) {
                if (hasArr) tauBienVnVtkteLuotVao++;
                if (hasDep) tauBienVnVtkteLuotRoi++;
                tauBienVnVtkteGt = tauBienVnVtkteGt.add(gt);
                tauBienVnVtkteDwt = tauBienVnVtkteDwt.add(dwt);
            } else {
                if (hasArr) tauBienVnVtnoidiaLuotVao++;
                if (hasDep) tauBienVnVtnoidiaLuotRoi++;
                tauBienVnVtnoidiaGt = tauBienVnVtnoidiaGt.add(gt);
                tauBienVnVtnoidiaDwt = tauBienVnVtnoidiaDwt.add(dwt);
            }

            if (dwt.compareTo(BigDecimal.valueOf(200)) <= 0 && dwt.compareTo(BigDecimal.ZERO) > 0) {
                if (hasArr) tauThuyen200LuotVao++;
                if (hasDep) tauThuyen200LuotRoi++;
                tauThuyen200Gt = tauThuyen200Gt.add(gt);
                tauThuyen200Dwt = tauThuyen200Dwt.add(dwt);
            }
        }

        for (InlandWaterwayPortCall b : boats) {
            BigDecimal gt = defaultZero(b.getGrossTonnage());
            BigDecimal dwt = defaultZero(b.getDwt());
            boolean hasArr = b.getArrivalDate() != null;
            boolean hasDep = b.getDepartureDate() != null;

            if (isIslandRoute(b)) {
                if (hasArr) tuyenBoRaDaoLuotVao++;
                if (hasDep) tuyenBoRaDaoLuotRoi++;
                tuyenBoRaDaoGt = tuyenBoRaDaoGt.add(gt);
                tuyenBoRaDaoDwt = tuyenBoRaDaoDwt.add(dwt);
            } else if (isVrSb(b)) {
                if (hasArr) pttndVrSbLuotVao++;
                if (hasDep) pttndVrSbLuotRoi++;
                pttndVrSbGt = pttndVrSbGt.add(gt);
                pttndVrSbDwt = pttndVrSbDwt.add(dwt);
            } else {
                if (hasArr) pttndLuotVao++;
                if (hasDep) pttndLuotRoi++;
                pttndGt = pttndGt.add(gt);
                pttndDwt = pttndDwt.add(dwt);
            }

            if (dwt.compareTo(BigDecimal.valueOf(200)) <= 0 && dwt.compareTo(BigDecimal.ZERO) > 0) {
                if (hasArr) tauThuyen200LuotVao++;
                if (hasDep) tauThuyen200LuotRoi++;
                tauThuyen200Gt = tauThuyen200Gt.add(gt);
                tauThuyen200Dwt = tauThuyen200Dwt.add(dwt);
            }
        }

        m.put("tauBienNnLuotVao", BigDecimal.valueOf(tauBienNnLuotVao));
        m.put("tauBienNnLuotRoi", BigDecimal.valueOf(tauBienNnLuotRoi));
        m.put("tauBienNnGt", tauBienNnGt);
        m.put("tauBienNnDwt", tauBienNnDwt);

        m.put("tauBienVnVtkteLuotVao", BigDecimal.valueOf(tauBienVnVtkteLuotVao));
        m.put("tauBienVnVtkteLuotRoi", BigDecimal.valueOf(tauBienVnVtkteLuotRoi));
        m.put("tauBienVnVtkteGt", tauBienVnVtkteGt);
        m.put("tauBienVnVtkteDwt", tauBienVnVtkteDwt);

        m.put("tauBienVnVtnoidiaLuotVao", BigDecimal.valueOf(tauBienVnVtnoidiaLuotVao));
        m.put("tauBienVnVtnoidiaLuotRoi", BigDecimal.valueOf(tauBienVnVtnoidiaLuotRoi));
        m.put("tauBienVnVtnoidiaGt", tauBienVnVtnoidiaGt);
        m.put("tauBienVnVtnoidiaDwt", tauBienVnVtnoidiaDwt);

        m.put("pttndLuotVao", BigDecimal.valueOf(pttndLuotVao));
        m.put("pttndLuotRoi", BigDecimal.valueOf(pttndLuotRoi));
        m.put("pttndGt", pttndGt);
        m.put("pttndDwt", pttndDwt);

        m.put("pttndVrSbLuotVao", BigDecimal.valueOf(pttndVrSbLuotVao));
        m.put("pttndVrSbLuotRoi", BigDecimal.valueOf(pttndVrSbLuotRoi));
        m.put("pttndVrSbGt", pttndVrSbGt);
        m.put("pttndVrSbDwt", pttndVrSbDwt);

        m.put("tauThuyenTrongTaiTu200TroXuongLuotVao", BigDecimal.valueOf(tauThuyen200LuotVao));
        m.put("tauThuyenTrongTaiTu200TroXuongLuotRoi", BigDecimal.valueOf(tauThuyen200LuotRoi));
        m.put("tauThuyenTrongTaiTu200TroXuongGt", tauThuyen200Gt);
        m.put("tauThuyenTrongTaiTu200TroXuongDwt", tauThuyen200Dwt);

        m.put("tauThuyenTuyenTuBoRaDaoLuotVao", BigDecimal.valueOf(tuyenBoRaDaoLuotVao));
        m.put("tauThuyenTuyenTuBoRaDaoLuotRoi", BigDecimal.valueOf(tuyenBoRaDaoLuotRoi));
        m.put("tauThuyenTuyenTuBoRaDaoGt", tuyenBoRaDaoGt);
        m.put("tauThuyenTuyenTuBoRaDaoDwt", tuyenBoRaDaoDwt);

        return m;
    }

    // =========================================================================
    // TỔNG HỢP CHO BIỂU 19-T (BCDL_183 / F-168)
    // =========================================================================

    public Map<String, BigDecimal> aggregateFleetMetrics(List<ShipPortCall> ships, List<InlandWaterwayPortCall> boats) {
        Map<String, BigDecimal> m = new HashMap<>();

        BigDecimal tauVnQuocTeContTeus = BigDecimal.ZERO, tauVnQuocTeContTan = BigDecimal.ZERO;
        BigDecimal tauVnQuocTeHangLong = BigDecimal.ZERO, tauVnQuocTeHangKho = BigDecimal.ZERO;

        BigDecimal tauVnNoiDiaContTeus = BigDecimal.ZERO, tauVnNoiDiaContTan = BigDecimal.ZERO;
        BigDecimal tauVnNoiDiaHangLong = BigDecimal.ZERO, tauVnNoiDiaHangKho = BigDecimal.ZERO;

        BigDecimal pttndVrSbContTeus = BigDecimal.ZERO, pttndVrSbContTan = BigDecimal.ZERO;
        BigDecimal pttndVrSbHangLong = BigDecimal.ZERO, pttndVrSbHangKho = BigDecimal.ZERO;

        BigDecimal pttndKhacContTeus = BigDecimal.ZERO, pttndKhacContTan = BigDecimal.ZERO;
        BigDecimal pttndKhacHangLong = BigDecimal.ZERO, pttndKhacHangKho = BigDecimal.ZERO;

        for (ShipPortCall s : ships) {
            if (isForeignShip(s)) continue; // chỉ xét đội tàu biển Việt Nam

            BigDecimal expTan = defaultZero(s.getExportTons());
            BigDecimal expTeus = defaultZero(s.getExportTeus());
            BigDecimal impTan = defaultZero(s.getImportTons());
            BigDecimal impTeus = defaultZero(s.getImportTeus());
            BigDecimal domInTan = defaultZero(s.getDomesticInTons());
            BigDecimal domInTeus = defaultZero(s.getDomesticInTeus());
            BigDecimal domOutTan = defaultZero(s.getDomesticOutTons());
            BigDecimal domOutTeus = defaultZero(s.getDomesticOutTeus());

            String cargoType = s.getCargoType() != null ? s.getCargoType().trim().toUpperCase(Locale.ROOT) : "";
            boolean isCont = cargoType.contains("CONTAINER") || expTeus.compareTo(BigDecimal.ZERO) > 0 || impTeus.compareTo(BigDecimal.ZERO) > 0;
            boolean isLiquid = cargoType.contains("LỎNG") || cargoType.contains("XĂNG") || cargoType.contains("DẦU");

            boolean isInt = isInternationalVoyage(s);

            BigDecimal contTeus = expTeus.add(impTeus).add(domInTeus).add(domOutTeus);
            BigDecimal contTan = expTan.add(impTan).add(domInTan).add(domOutTan);
            BigDecimal liquidTan = expTan.add(impTan).add(domInTan).add(domOutTan);
            BigDecimal dryTan = expTan.add(impTan).add(domInTan).add(domOutTan);

            if (isInt) {
                if (isCont) {
                    tauVnQuocTeContTeus = tauVnQuocTeContTeus.add(contTeus);
                    tauVnQuocTeContTan = tauVnQuocTeContTan.add(contTan);
                } else if (isLiquid) {
                    tauVnQuocTeHangLong = tauVnQuocTeHangLong.add(liquidTan);
                } else {
                    tauVnQuocTeHangKho = tauVnQuocTeHangKho.add(dryTan);
                }
            } else {
                if (isCont) {
                    tauVnNoiDiaContTeus = tauVnNoiDiaContTeus.add(contTeus);
                    tauVnNoiDiaContTan = tauVnNoiDiaContTan.add(contTan);
                } else if (isLiquid) {
                    tauVnNoiDiaHangLong = tauVnNoiDiaHangLong.add(liquidTan);
                } else {
                    tauVnNoiDiaHangKho = tauVnNoiDiaHangKho.add(dryTan);
                }
            }
        }

        for (InlandWaterwayPortCall b : boats) {
            BigDecimal expTan = defaultZero(b.getExportTons());
            BigDecimal expTeus = defaultZero(b.getExportTeus());
            BigDecimal impTan = defaultZero(b.getImportTons());
            BigDecimal impTeus = defaultZero(b.getImportTeus());
            BigDecimal domInTan = defaultZero(b.getDomesticInTons());
            BigDecimal domInTeus = defaultZero(b.getDomesticInTeus());
            BigDecimal domOutTan = defaultZero(b.getDomesticOutTons());
            BigDecimal domOutTeus = defaultZero(b.getDomesticOutTeus());

            String cargoType = b.getCargoType() != null ? b.getCargoType().trim().toUpperCase(Locale.ROOT) : "";
            boolean isCont = cargoType.contains("CONTAINER") || expTeus.compareTo(BigDecimal.ZERO) > 0 || impTeus.compareTo(BigDecimal.ZERO) > 0;
            boolean isLiquid = cargoType.contains("LỎNG") || cargoType.contains("XĂNG") || cargoType.contains("DẦU");

            boolean vrSb = isVrSb(b);

            BigDecimal contTeus = expTeus.add(impTeus).add(domInTeus).add(domOutTeus);
            BigDecimal contTan = expTan.add(impTan).add(domInTan).add(domOutTan);
            BigDecimal liquidTan = expTan.add(impTan).add(domInTan).add(domOutTan);
            BigDecimal dryTan = expTan.add(impTan).add(domInTan).add(domOutTan);

            if (vrSb) {
                if (isCont) {
                    pttndVrSbContTeus = pttndVrSbContTeus.add(contTeus);
                    pttndVrSbContTan = pttndVrSbContTan.add(contTan);
                } else if (isLiquid) {
                    pttndVrSbHangLong = pttndVrSbHangLong.add(liquidTan);
                } else {
                    pttndVrSbHangKho = pttndVrSbHangKho.add(dryTan);
                }
            } else {
                if (isCont) {
                    pttndKhacContTeus = pttndKhacContTeus.add(contTeus);
                    pttndKhacContTan = pttndKhacContTan.add(contTan);
                } else if (isLiquid) {
                    pttndKhacHangLong = pttndKhacHangLong.add(liquidTan);
                } else {
                    pttndKhacHangKho = pttndKhacHangKho.add(dryTan);
                }
            }
        }

        m.put("tauBienVnVtkteHangContainerTeus", tauVnQuocTeContTeus);
        m.put("tauBienVnVtkteHangContainerTan", tauVnQuocTeContTan);
        m.put("tauBienVnVtkteHangLong", tauVnQuocTeHangLong);
        m.put("tauBienVnVtkteHangKhoTongHop", tauVnQuocTeHangKho);

        m.put("tauBienVnVtnoidiaHangContainerTeus", tauVnNoiDiaContTeus);
        m.put("tauBienVnVtnoidiaHangContainerTan", tauVnNoiDiaContTan);
        m.put("tauBienVnVtnoidiaHangLong", tauVnNoiDiaHangLong);
        m.put("tauBienVnVtnoidiaHangKhoTongHop", tauVnNoiDiaHangKho);

        m.put("pttndVrSbHangContainerTeus", pttndVrSbContTeus);
        m.put("pttndVrSbHangContainerTan", pttndVrSbContTan);
        m.put("pttndVrSbHangLong", pttndVrSbHangLong);
        m.put("pttndVrSbHangKhoTongHop", pttndVrSbHangKho);

        m.put("pttndHangContainerTeus", pttndKhacContTeus);
        m.put("pttndHangContainerTan", pttndKhacContTan);
        m.put("pttndHangLong", pttndKhacHangLong);
        m.put("pttndHangKhoTongHop", pttndKhacHangKho);

        return m;
    }

    // =========================================================================
    // TỔNG HỢP CHO BIỂU 20-T (BCDL_184 / F-169) - THEO CẦU/BẾN
    // =========================================================================

    public List<Map<String, Object>> aggregateByPortBerth(UUID targetUnitId, LocalDate fromDate, LocalDate toDate) {
        List<ShipPortCall> ships = getFilteredShipPortCalls(targetUnitId, fromDate, toDate);
        List<InlandWaterwayPortCall> boats = getFilteredInlandPortCalls(targetUnitId, fromDate, toDate);

        Map<String, Map<String, Object>> berthStats = new LinkedHashMap<>();

        // Khởi tạo từ danh mục bến cảng hiện hữu
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        List<Berth> berths = berthRepository.findAll().stream()
                .filter(b -> b.getDeletedAt() == null)
                .filter(b -> skipFilter || targetUnitId.equals(b.getOrgUnitId()))
                .toList();

        for (Berth b : berths) {
            String name = b.getBerthName() != null ? b.getBerthName() : "Bến " + b.getBerthCode();
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("cangBen", name);
            r.put("containerTanThucHienThangBaoCao", BigDecimal.ZERO);
            r.put("containerTeusThucHienThangBaoCao", BigDecimal.ZERO);
            r.put("hangLongThucHienThangBaoCao", BigDecimal.ZERO);
            r.put("hangKhoTongHopThucHienThangBaoCao", BigDecimal.ZERO);
            r.put("hangHoaTongSoThucHienThangBaoCao", BigDecimal.ZERO);
            r.put("tauBienLuotThucHienThangBaoCao", BigDecimal.ZERO);
            r.put("pttndLuotThucHienThangBaoCao", BigDecimal.ZERO);
            berthStats.put(name.toLowerCase(Locale.ROOT), r);
        }

        // Aggregate từ shipPortCall
        for (ShipPortCall s : ships) {
            String portName = s.getArrivalPortName() != null ? s.getArrivalPortName() : "Cảng biển";
            String key = portName.toLowerCase(Locale.ROOT);
            Map<String, Object> r = berthStats.computeIfAbsent(key, k -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("cangBen", portName);
                item.put("containerTanThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("containerTeusThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("hangLongThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("hangKhoTongHopThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("hangHoaTongSoThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("tauBienLuotThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("pttndLuotThucHienThangBaoCao", BigDecimal.ZERO);
                return item;
            });

            BigDecimal expTan = defaultZero(s.getExportTons());
            BigDecimal expTeus = defaultZero(s.getExportTeus());
            BigDecimal impTan = defaultZero(s.getImportTons());
            BigDecimal impTeus = defaultZero(s.getImportTeus());
            BigDecimal domInTan = defaultZero(s.getDomesticInTons());
            BigDecimal domInTeus = defaultZero(s.getDomesticInTeus());
            BigDecimal domOutTan = defaultZero(s.getDomesticOutTons());
            BigDecimal domOutTeus = defaultZero(s.getDomesticOutTeus());

            BigDecimal totalTan = expTan.add(impTan).add(domInTan).add(domOutTan);
            BigDecimal totalTeus = expTeus.add(impTeus).add(domInTeus).add(domOutTeus);

            String cargoType = s.getCargoType() != null ? s.getCargoType().trim().toUpperCase(Locale.ROOT) : "";
            boolean isCont = cargoType.contains("CONTAINER") || totalTeus.compareTo(BigDecimal.ZERO) > 0;
            boolean isLiquid = cargoType.contains("LỎNG") || cargoType.contains("XĂNG") || cargoType.contains("DẦU");

            if (isCont) {
                r.put("containerTanThucHienThangBaoCao", ((BigDecimal) r.get("containerTanThucHienThangBaoCao")).add(totalTan));
                r.put("containerTeusThucHienThangBaoCao", ((BigDecimal) r.get("containerTeusThucHienThangBaoCao")).add(totalTeus));
            } else if (isLiquid) {
                r.put("hangLongThucHienThangBaoCao", ((BigDecimal) r.get("hangLongThucHienThangBaoCao")).add(totalTan));
            } else {
                r.put("hangKhoTongHopThucHienThangBaoCao", ((BigDecimal) r.get("hangKhoTongHopThucHienThangBaoCao")).add(totalTan));
            }
            r.put("hangHoaTongSoThucHienThangBaoCao", ((BigDecimal) r.get("hangHoaTongSoThucHienThangBaoCao")).add(totalTan));
            r.put("tauBienLuotThucHienThangBaoCao", ((BigDecimal) r.get("tauBienLuotThucHienThangBaoCao")).add(BigDecimal.ONE));
        }

        // Aggregate từ inlandWaterwayPortCall
        for (InlandWaterwayPortCall b : boats) {
            String portName = b.getArrivalPortName() != null ? b.getArrivalPortName() : "Bến thủy";
            String key = portName.toLowerCase(Locale.ROOT);
            Map<String, Object> r = berthStats.computeIfAbsent(key, k -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("cangBen", portName);
                item.put("containerTanThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("containerTeusThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("hangLongThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("hangKhoTongHopThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("hangHoaTongSoThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("tauBienLuotThucHienThangBaoCao", BigDecimal.ZERO);
                item.put("pttndLuotThucHienThangBaoCao", BigDecimal.ZERO);
                return item;
            });

            BigDecimal expTan = defaultZero(b.getExportTons());
            BigDecimal expTeus = defaultZero(b.getExportTeus());
            BigDecimal impTan = defaultZero(b.getImportTons());
            BigDecimal impTeus = defaultZero(b.getImportTeus());
            BigDecimal domInTan = defaultZero(b.getDomesticInTons());
            BigDecimal domInTeus = defaultZero(b.getDomesticInTeus());
            BigDecimal domOutTan = defaultZero(b.getDomesticOutTons());
            BigDecimal domOutTeus = defaultZero(b.getDomesticOutTeus());

            BigDecimal totalTan = expTan.add(impTan).add(domInTan).add(domOutTan);
            BigDecimal totalTeus = expTeus.add(impTeus).add(domInTeus).add(domOutTeus);

            String cargoType = b.getCargoType() != null ? b.getCargoType().trim().toUpperCase(Locale.ROOT) : "";
            boolean isCont = cargoType.contains("CONTAINER") || totalTeus.compareTo(BigDecimal.ZERO) > 0;
            boolean isLiquid = cargoType.contains("LỎNG") || cargoType.contains("XĂNG") || cargoType.contains("DẦU");

            if (isCont) {
                r.put("containerTanThucHienThangBaoCao", ((BigDecimal) r.get("containerTanThucHienThangBaoCao")).add(totalTan));
                r.put("containerTeusThucHienThangBaoCao", ((BigDecimal) r.get("containerTeusThucHienThangBaoCao")).add(totalTeus));
            } else if (isLiquid) {
                r.put("hangLongThucHienThangBaoCao", ((BigDecimal) r.get("hangLongThucHienThangBaoCao")).add(totalTan));
            } else {
                r.put("hangKhoTongHopThucHienThangBaoCao", ((BigDecimal) r.get("hangKhoTongHopThucHienThangBaoCao")).add(totalTan));
            }
            r.put("hangHoaTongSoThucHienThangBaoCao", ((BigDecimal) r.get("hangHoaTongSoThucHienThangBaoCao")).add(totalTan));
            r.put("pttndLuotThucHienThangBaoCao", ((BigDecimal) r.get("pttndLuotThucHienThangBaoCao")).add(BigDecimal.ONE));
        }

        return new ArrayList<>(berthStats.values());
    }

    public static BigDecimal calcPercentage(BigDecimal part, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0 || part == null) {
            return BigDecimal.ZERO;
        }
        return part.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
    }
}
