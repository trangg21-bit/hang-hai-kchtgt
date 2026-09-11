package com.hanghai.kchtg.report.handler;

import com.hanghai.kchtg.port.entity.BuoyBerth;
import com.hanghai.kchtg.port.entity.WaterZone;
import com.hanghai.kchtg.port.entity.WaterZoneType;
import com.hanghai.kchtg.port.repository.BuoyBerthRepository;
import com.hanghai.kchtg.port.repository.WaterZoneRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Handler for F-154 / BCKCHT_169: Biểu 07-N: Thống kê bến phao, khu neo đậu.
 * Ma trận 2 dòng: I. Số lượng khu hiện có, II. Số lượng khu trú tăng thêm.
 */
@Component
public class F154ReportHandler extends BaseReportHandler {

    @Autowired
    private WaterZoneRepository waterZoneRepository;

    @Autowired
    private BuoyBerthRepository buoyBerthRepository;

    @Override
    public boolean supports(String reportCode) {
        return "F-154".equalsIgnoreCase(reportCode);
    }

    @Override
    public ReportResponse getPreview(ReportPreviewRequest request) {
        Counts counts = calculateCounts(request);

        List<String> headers = List.of(
                "STT", "Chỉ tiêu", "Đơn vị tính",
                "Khu chuyển tải có phao neo", "Khu chuyển tải không có phao neo",
                "Khu neo đậu", "Khu tránh bão", "Khu trú bão", "Tổng cộng"
        );

        List<Map<String, Object>> rows = new ArrayList<>();

        long totalHienCo = counts.hienCoChuyenTaiCoPhao + counts.hienCoChuyenTaiKhongPhao
                + counts.hienCoNeoDau + counts.hienCoTranhBao + counts.hienCoTruBao;

        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", "I");
        row1.put("Chỉ tiêu", "Số lượng khu hiện có");
        row1.put("Đơn vị tính", "bến/ vị trí");
        row1.put("Khu chuyển tải có phao neo", counts.hienCoChuyenTaiCoPhao);
        row1.put("Khu chuyển tải không có phao neo", counts.hienCoChuyenTaiKhongPhao);
        row1.put("Khu neo đậu", counts.hienCoNeoDau);
        row1.put("Khu tránh bão", counts.hienCoTranhBao);
        row1.put("Khu trú bão", counts.hienCoTruBao);
        row1.put("Tổng cộng", totalHienCo);
        rows.add(row1);

        long totalTangThem = counts.tangThemChuyenTaiCoPhao + counts.tangThemChuyenTaiKhongPhao
                + counts.tangThemNeoDau + counts.tangThemTranhBao + counts.tangThemTruBao;

        Map<String, Object> row2 = new LinkedHashMap<>();
        row2.put("STT", "II");
        row2.put("Chỉ tiêu", "Số lượng khu trú tăng thêm");
        row2.put("Đơn vị tính", "bến/ vị trí");
        row2.put("Khu chuyển tải có phao neo", counts.tangThemChuyenTaiCoPhao);
        row2.put("Khu chuyển tải không có phao neo", counts.tangThemChuyenTaiKhongPhao);
        row2.put("Khu neo đậu", counts.tangThemNeoDau);
        row2.put("Khu tránh bão", counts.tangThemTranhBao);
        row2.put("Khu trú bão", counts.tangThemTruBao);
        row2.put("Tổng cộng", totalTangThem);
        rows.add(row2);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số khu hiện có", totalHienCo);
        summary.put("Tổng số khu tăng thêm", totalTangThem);

        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }

    @Override
    public List<Map<String, Object>> getExportData(ReportPreviewRequest request, int reportYear) {
        Counts counts = calculateCounts(request);

        Map<String, Object> item = new HashMap<>();
        item.put("soLuongHienCoKhuChuyenTaiCoPhaoNeo", counts.hienCoChuyenTaiCoPhao);
        item.put("soLuongHienCoKhuChuyenTaiKhongCoPhaoNeo", counts.hienCoChuyenTaiKhongPhao);
        item.put("soLuongHienCoKhuNeoDau", counts.hienCoNeoDau);
        item.put("soLuongHienCoKhuTranhBao", counts.hienCoTranhBao);
        item.put("soLuongHienCoKhuTruBao", counts.hienCoTruBao);

        item.put("soLuongTangThemKhuChuyenTaiCoPhaoNeo", counts.tangThemChuyenTaiCoPhao);
        item.put("soLuongTangThemKhuChuyenTaiKhongCoPhaoNeo", counts.tangThemChuyenTaiKhongPhao);
        item.put("soLuongTangThemKhuNeoDau", counts.tangThemNeoDau);
        item.put("soLuongTangThemKhuTranhBao", counts.tangThemTranhBao);
        item.put("soLuongTangThemKhuTruBao", counts.tangThemTruBao);

        return List.of(item);
    }

    private Counts calculateCounts(ReportPreviewRequest request) {
        UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean skipFilter = targetUnitId == null || isOrgUnitRoot(targetUnitId);
        int reportYear = getReportYear(request);

        List<WaterZone> waterZones = waterZoneRepository.findAll(Sort.unsorted()).stream()
                .filter(v -> skipFilter || targetUnitId.equals(v.getOrgUnitId()))
                .filter(v -> v.getCreatedAt() == null || v.getCreatedAt().getYear() <= reportYear)
                .toList();

        List<BuoyBerth> buoyBerths = buoyBerthRepository.findAll().stream()
                .filter(b -> skipFilter || targetUnitId.equals(b.getOrgUnitId()))
                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)
                .toList();

        Counts counts = new Counts();

        // 1. Chuyển tải có phao neo & không có phao neo
        long buoyBerthCount = buoyBerths.size();
        long buoyBerthNew = buoyBerths.stream()
                .filter(b -> b.getCreatedAt() != null && b.getCreatedAt().getYear() == reportYear)
                .count();

        List<WaterZone> transshipmentZones = waterZones.stream()
                .filter(v -> v.getWaterZoneType() == WaterZoneType.TRANSSHIPMENT)
                .toList();

        counts.hienCoChuyenTaiCoPhao = buoyBerthCount;
        counts.tangThemChuyenTaiCoPhao = buoyBerthNew;

        counts.hienCoChuyenTaiKhongPhao = transshipmentZones.size();
        counts.tangThemChuyenTaiKhongPhao = transshipmentZones.stream()
                .filter(v -> v.getCreatedAt() != null && v.getCreatedAt().getYear() == reportYear)
                .count();

        // 2. Khu neo đậu
        List<WaterZone> anchorageZones = waterZones.stream()
                .filter(v -> v.getWaterZoneType() == WaterZoneType.ANCHORAGE)
                .toList();
        counts.hienCoNeoDau = anchorageZones.size();
        counts.tangThemNeoDau = anchorageZones.stream()
                .filter(v -> v.getCreatedAt() != null && v.getCreatedAt().getYear() == reportYear)
                .count();

        // 3. Khu tránh bão & trú bão
        List<WaterZone> shelterZones = waterZones.stream()
                .filter(v -> v.getWaterZoneType() == WaterZoneType.STORM_SHELTER)
                .toList();
        counts.hienCoTranhBao = shelterZones.size();
        counts.tangThemTranhBao = shelterZones.stream()
                .filter(v -> v.getCreatedAt() != null && v.getCreatedAt().getYear() == reportYear)
                .count();

        counts.hienCoTruBao = shelterZones.size();
        counts.tangThemTruBao = counts.tangThemTranhBao;

        return counts;
    }

    private static class Counts {
        long hienCoChuyenTaiCoPhao = 0;
        long hienCoChuyenTaiKhongPhao = 0;
        long hienCoNeoDau = 0;
        long hienCoTranhBao = 0;
        long hienCoTruBao = 0;

        long tangThemChuyenTaiCoPhao = 0;
        long tangThemChuyenTaiKhongPhao = 0;
        long tangThemNeoDau = 0;
        long tangThemTranhBao = 0;
        long tangThemTruBao = 0;
    }
}
