package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.ReportEntity;
import com.hanghai.kchtg.report.entity.ReportStatus;
import com.hanghai.kchtg.report.entity.ReportType;
import com.hanghai.kchtg.report.repository.ReportEntityRepository;
import com.hanghai.kchtg.report.repository.ReportRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.checkerframework.checker.nullness.qual.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellReference;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import com.hanghai.kchtg.cangben.repository.PortRepository;
import com.hanghai.kchtg.cangben.repository.BerthRepository;
import com.hanghai.kchtg.cangben.repository.PierRepository;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.nhatram.repository.NhaTramDenRepository;
import com.hanghai.kchtg.report.dto.Bcc157Response;
import com.hanghai.kchtg.report.handler.ReportHandler;
import com.hanghai.kchtg.tsql.entity.TsQl;
import com.hanghai.kchtg.tsql.repository.TsQlRepository;

/**
 * Service core cho quản lý báo cáo M-016 (Báo cáo & Tổng hợp).
 * Cung cấp CRUD, tra cứu, tạo báo cáo và tải file kết quả.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ReportService {
    private final ReportRepository reportRepo;
    private final ReportEntityRepository reportEntityRepo;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final com.hanghai.kchtg.gis.point.repository.PointObjectRepository pointRepository;
    private final com.hanghai.kchtg.orgunit.repository.OrgUnitRepository orgUnitRepository;
    private final PortRepository cangBienRepository;
    private final BerthRepository benCangRepository;
    private final PierRepository cauCangRepository;
    private final LineObjectRepository lineObjectRepository;
    private final PolygonObjectRepository polygonObjectRepository;
    private final NhaTramDenRepository nhaTramDenRepository;
    private final List<ReportHandler> reportHandlers;
    private final Bcc157Service bcc157Service;
    private final TsQlRepository tsQlRepository;

    /**
     * Tạo báo cáo mới với status = PENDING.
     */
    @Transactional
    public ReportEntity createReport(ReportRequest request) {
        ReportEntity entity = ReportEntity.builder()
                .reportType(request.getReportType())
                .status(ReportStatus.PENDING)
                .outputFormat(request.getOutputFormat())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .parameters(Map.of().toString())
                .generatedAt(Instant.now())
                .build();

        entity = reportRepo.save(entity);

        log.info("Created report [{}] type={} status=PENDING",
                entity.getCode(), entity.getReportType());

        return entity;
    }

    /**
     * Cập nhật trạng thái báo cáo theo mã.
     */
    @Transactional
    public void updateReportStatus(String code, ReportStatus status) {
        ReportEntity entity = reportEntityRepo.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Report not found: " + code));

        entity.setStatus(status);

        if (status == ReportStatus.READY) {
            entity.setGeneratedAt(Instant.now());
        }

        reportEntityRepo.save(entity);

        log.info("Updated report [{}] -> {}", code, status);
    }

    /**
     * Tìm báo cáo theo mã (code).
     */
    public ReportEntity findByCode(String code) {
        return reportEntityRepo.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Report not found: " + code));
    }

    /**
     * Lấy danh sách phân trang toàn bộ báo cáo READY.
     */
    public Page<ReportEntity> findAll(Pageable pageable) {
        return reportEntityRepo.findByStatus(ReportStatus.READY, pageable);
    }

    /**
     * Tìm báo cáo theo loại.
     */
    public List<ReportEntity> findByReportType(ReportType type) {
        return reportEntityRepo.findByReportType(type);
    }

    /**
     * Đếm số báo cáo theo trạng thái.
     */
    public long countByStatus(ReportStatus status) {
        return reportEntityRepo.countByStatus(status);
    }

    /**
     * Bắt đầu tác vụ sinh báo cáo (stub/mock).
     */
    @Transactional
    public void generateReport(ReportRequest request) {
        log.info("Generating report async stub...");
    }

    /**
     * Tải file báo cáo (stub/mock).
     */
    public String downloadReport(String code) {
        log.info("Downloading report stub for code={}", code);

        return "/files/report_" + code + ".pdf";
    }

    // ==========================================

    // MAIN ENTRYPOINTS: PREVIEW & EXPORT

    // ==========================================

    /**
     * Xem trước dữ liệu báo cáo động.
     */
    public ReportResponse getPreview(ReportPreviewRequest request) {
        String reportCodeStr = request.getReportCode() != null ? request.getReportCode() : "F-141";

        if ("F-141".equalsIgnoreCase(reportCodeStr)) {
            return getPreviewF141(request);
        } else if ("F-142".equalsIgnoreCase(reportCodeStr)) {
            return getPreviewF142(request);
        } else if ("F-143".equalsIgnoreCase(reportCodeStr)) {
            return getPreviewF143(request);
        } else if ("F-144".equalsIgnoreCase(reportCodeStr)) {
            return getPreviewF144(request);
        } else if ("F-145".equalsIgnoreCase(reportCodeStr)) {
            return getPreviewF145(request);
        } else if ("F-146".equalsIgnoreCase(reportCodeStr)) {
            return getPreviewF146(request);
        } else if ("F-147".equalsIgnoreCase(reportCodeStr)) {
            return getPreviewF147(request);
        } else if ("F-148".equalsIgnoreCase(reportCodeStr)) {
            return getPreviewF148(request);
        } else if ("F-149".equalsIgnoreCase(reportCodeStr)) {
            return getPreviewF149(request);
        } else {
            for (ReportHandler handler : reportHandlers) {
                if (handler.supports(reportCodeStr)) {
                    return handler.getPreview(request);
                }
            }
            return getPreviewGeneric(request);
        }
    }

    /**
     * Xuất file báo cáo động (Excel / PDF).
     */
    public byte[] exportReport(ReportPreviewRequest request) {
        String reportCodeStr = request.getReportCode() != null ? request.getReportCode() : "F-141";
        String templateName = resolveTemplateName(reportCodeStr);
        String pathTemplate = "public/template_export/" + templateName + ".xlsx";

        try {
            if ("F-142".equalsIgnoreCase(reportCodeStr)) {
                return exportStaticReport(request, pathTemplate);
            } else if ("F-143".equalsIgnoreCase(reportCodeStr)) {
                return exportF143Report(request, pathTemplate);
            } else if ("F-144".equalsIgnoreCase(reportCodeStr)) {
                return exportF144Report(request, pathTemplate);
            } else if ("F-145".equalsIgnoreCase(reportCodeStr)) {
                return exportF145Report(request, pathTemplate);
            } else if ("F-146".equalsIgnoreCase(reportCodeStr)) {
                return exportF146Report(request, pathTemplate);
            } else if ("F-147".equalsIgnoreCase(reportCodeStr)) {
                return exportF147Report(request, pathTemplate);
            } else {
                return exportDynamicReport(request, pathTemplate);
            }
        } catch (Exception e) {
            log.error("Error generating report export for code: {}", reportCodeStr, e);

            throw new RuntimeException("Error generating report export: " + e.getMessage(), e);
        }
    }

    // ==========================================

    // REPORT PREVIEW DELEGATES

    // ==========================================

    private ReportResponse getPreviewF141(ReportPreviewRequest request) {
        List<String> headers = new ArrayList<>(List.of(
                "STT", "Mã tài sản", "Tên tài sản", "Loại tài sản", "Đơn vị tính",
                "Số lượng đầu kỳ", "Số lượng tăng", "Số lượng giảm", "Số lượng cuối kỳ",
                "Giá trị đầu kỳ (VNĐ)", "Giá trị tăng (VNĐ)", "Giá trị giảm (VNĐ)", "Giá trị cuối kỳ (VNĐ)"

        ));

        List<Map<String, Object>> rows = new ArrayList<>();

        Map<String, Object> summary = new LinkedHashMap<>();

        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());

        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId,
                LocalDate.now().getYear());
        int stt = 1;
        long totalVal = 0;

        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
            Map<String, Object> r = new HashMap<>();

            r.put("STT", stt++);
            r.put("Mã tài sản", p.getCode());
            r.put("Tên tài sản", p.getName());
            r.put("Loại tài sản", p.getObjectType() != null ? p.getObjectType().name() : "Chưa phân loại");

            String unitName = "";

            if (p.getUnitId() != null) {
                unitName = orgUnitRepository.findById(p.getUnitId())
                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                        .orElse("");
            }

            if (unitName.isEmpty()) {
                unitName = "Cái";
            }

            r.put("Đơn vị tính", unitName);
            r.put("Số lượng đầu kỳ", 1);
            r.put("Số lượng tăng", 0);
            r.put("Số lượng giảm", 0);
            r.put("Số lượng cuối kỳ", 1);

            long val = getPointAssetValue(p);

            r.put("Giá trị đầu kỳ (VNĐ)", val);
            r.put("Giá trị tăng (VNĐ)", 0L);
            r.put("Giá trị giảm (VNĐ)", 0L);
            r.put("Giá trị cuối kỳ (VNĐ)", val);

            totalVal += val;
            rows.add(r);
        }

        summary.put("Tổng số tài sản cuối kỳ", points.size());
        summary.put("Tổng giá trị tài sản cuối kỳ (VNĐ)", totalVal);
        summary.put("Số lượng tài sản tăng", 0);
        summary.put("Số lượng tài sản giảm", 0);

        return buildPreviewResponse("F-141", headers, rows, summary);
    }

    private ReportResponse getPreviewF142(ReportPreviewRequest request) {
        List<String> headers = new ArrayList<>(List.of("STT", "Chỉ tiêu", "Mã số", "TSHT hàng hải", "Tổng cộng"));

        List<Map<String, Object>> rows = new ArrayList<>();

        Map<String, Object> summary = new LinkedHashMap<>();

        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());

        int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();

        // 1. Try to read real data from bcc157_report table (nguonDuLieu='1')
        if (targetUnitId != null) {
            Bcc157Response savedData = bcc157Service.findByOrgUnitIdAndReportYearAndNguonDuLieu(
                    targetUnitId, reportYear, "1");
            if (savedData != null) {
                // Build preview rows from real saved data — matching frontend ReportViewer.tsx lines 182-196
                rows.add(buildF142Row("1", "Nguyên giá - Số dư đầu năm",
                        savedData.getMaSoNguyenGiaSoDuDauNam(), "1.1",
                        savedData.getTaiSanNguyenGiaSoDuDauNam()));
                rows.add(buildF142Row("", "Nguyên giá - Tăng trong năm",
                        savedData.getMaSoNguyenGiaTangTrongNam(), "1.2",
                        savedData.getTaiSanNguyenGiaTangTrongNam()));
                rows.add(buildF142Row("", "Nguyên giá - Giảm trong năm",
                        savedData.getMaSoNguyenGiaGiamTrongNam(), "1.3",
                        savedData.getTaiSanNguyenGiaGiamTrongNam()));
                rows.add(buildF142Row("", "Nguyên giá - Số dư cuối năm",
                        savedData.getMaSoNguyenGiaSoDuCuoiNam(), "1.4",
                        savedData.getTaiSanNguyenGiaSoDuCuoiNam()));
                rows.add(buildF142Row("2", "Giá trị hao mòn lũy kế - Số dư đầu năm",
                        savedData.getMaSoGiaTriHaoMonSoDuDauNam(), "2.1",
                        savedData.getTaiSanGiaTriHaoMonSoDuDauNam()));
                rows.add(buildF142Row("", "Giá trị hao mòn lũy kế - Tăng trong năm",
                        savedData.getMaSoGiaTriHaoMonTangTrongNam(), "2.2",
                        savedData.getTaiSanGiaTriHaoMonTangTrongNam()));
                rows.add(buildF142Row("", "Giá trị hao mòn lũy kế - Giảm trong năm",
                        savedData.getMaSoGiaTriHaoMonGiamTrongNam(), "2.3",
                        savedData.getTaiSanGiaTriHaoMonGiamTrongNam()));
                rows.add(buildF142Row("", "Giá trị hao mòn lũy kế - Số dư cuối năm",
                        savedData.getMaSoGiaTriHaoMonSoDuCuoiNam(), "2.4",
                        savedData.getTaiSanGiaTriHaoMonSoDuCuoiNam()));
                rows.add(buildF142Row("3", "Giá trị còn lại - Đầu năm",
                        savedData.getMaSoGiaTriConLaiTuNgayDauNam(), "3.1",
                        savedData.getTaiSanGiaTriConLaiTuNgayDauNam()));
                rows.add(buildF142Row("", "Giá trị còn lại - Cuối năm",
                        savedData.getMaSoGiaTriConLaiTuNgayCuoiNam(), "3.2",
                        savedData.getTaiSanGiaTriConLaiTuNgayCuoiNam()));

                summary.put("Tổng số tài sản", rows.size() / 4);
                summary.put("Nguyên giá cuối năm",
                        savedData.getTaiSanNguyenGiaSoDuCuoiNam() != null
                                ? savedData.getTaiSanNguyenGiaSoDuCuoiNam().longValue()
                                : 0L);
                summary.put("Giá trị còn lại cuối năm",
                        savedData.getTaiSanGiaTriConLaiTuNgayCuoiNam() != null
                                ? savedData.getTaiSanGiaTriConLaiTuNgayCuoiNam().longValue()
                                : 0L);

                return buildPreviewResponse("F-142", headers, rows, summary);
            }
        }

        // 2. Fallback: existing GIS PointObject auto-generate
        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);
        long totalNguyenGia = 0;

        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
            totalNguyenGia += getPointAssetValue(p);
        }

        long hMonDauNam = (long) (totalNguyenGia * 0.20);
        long hMonTang = (long) (totalNguyenGia * 0.04);
        long hMonCuoiNam = hMonDauNam + hMonTang;

        rows.add(Map.of("STT", "1", "Chỉ tiêu", "Nguyên giá - Số dư đầu năm", "Mã số", "1.1", "TSHT hàng hải",
                totalNguyenGia, "Tổng cộng", totalNguyenGia));
        rows.add(Map.of("STT", "", "Chỉ tiêu", "Nguyên giá - Tăng trong năm", "Mã số", "1.2", "TSHT hàng hải",
                0L, "Tổng cộng", 0L));
        rows.add(Map.of("STT", "", "Chỉ tiêu", "Nguyên giá - Giảm trong năm", "Mã số", "1.3", "TSHT hàng hải",
                0L, "Tổng cộng", 0L));
        rows.add(Map.of("STT", "", "Chỉ tiêu", "Nguyên giá - Số dư cuối năm", "Mã số", "1.4", "TSHT hàng hải",
                totalNguyenGia, "Tổng cộng", totalNguyenGia));
        rows.add(Map.of("STT", "2", "Chỉ tiêu", "Giá trị hao mòn lũy kế - Số dư đầu năm", "Mã số", "2.1",
                "TSHT hàng hải", hMonDauNam, "Tổng cộng", hMonDauNam));
        rows.add(Map.of("STT", "", "Chỉ tiêu", "Giá trị hao mòn lũy kế - Tăng trong năm", "Mã số", "2.2",
                "TSHT hàng hải", hMonTang, "Tổng cộng", hMonTang));
        rows.add(Map.of("STT", "", "Chỉ tiêu", "Giá trị hao mòn lũy kế - Giảm trong năm", "Mã số", "2.3",
                "TSHT hàng hải", 0L, "Tổng cộng", 0L));
        rows.add(Map.of("STT", "", "Chỉ tiêu", "Giá trị hao mòn lũy kế - Số dư cuối năm", "Mã số", "2.4",
                "TSHT hàng hải", hMonCuoiNam, "Tổng cộng", hMonCuoiNam));
        rows.add(Map.of("STT", "3", "Chỉ tiêu", "Giá trị còn lại - Đầu năm", "Mã số", "3.1", "TSHT hàng hải",
                totalNguyenGia - hMonDauNam, "Tổng cộng", totalNguyenGia - hMonDauNam));
        rows.add(Map.of("STT", "", "Chỉ tiêu", "Giá trị còn lại - Cuối năm", "Mã số", "3.2", "TSHT hàng hải",
                totalNguyenGia - hMonCuoiNam, "Tổng cộng", totalNguyenGia - hMonCuoiNam));
        summary.put("Tổng số tài sản", points.size());
        summary.put("Nguyên giá cuối năm", totalNguyenGia);
        summary.put("Giá trị còn lại cuối năm", totalNguyenGia - hMonCuoiNam);

        return buildPreviewResponse("F-142", headers, rows, summary);
    }

    /**
     * Helper to build a single F-142 preview row from Bcc157Response fields.
     * Matches the frontend pattern in ReportViewer.tsx lines 182-196:
     * - Mã số uses the saved maSo* value, falling back to the default code
     * - TSHT hàng hải / Tổng cộng use the saved taiSan* BigDecimal, falling back to 0
     * Both columns carry the same value (B04a/BCTC form — no sub-category breakdown).
     */
    private Map<String, Object> buildF142Row(String stt, String chiTieu, String maSo, String defaultMaSo,
                                              java.math.BigDecimal giaTri) {
        Map<String, Object> row = new HashMap<>();
        row.put("STT", stt);
        row.put("Chỉ tiêu", chiTieu);
        row.put("Mã số", maSo != null ? maSo : defaultMaSo);
        row.put("TSHT hàng hải", giaTri != null ? giaTri.longValue() : 0L);
        row.put("Tổng cộng", giaTri != null ? giaTri.longValue() : 0L);
        return row;
    }

    private ReportResponse getPreviewF143(ReportPreviewRequest request) {
        List<String> headers = new ArrayList<>(List.of(
                "STT", "Danh mục tài sản", "Đơn vị tính", "Số lượng", "Năm xây dựng",
                "Năm sử dụng", "Diện tích đất (m2)", "Diện tích sàn sử dụng (m2)",
                "Nguyên giá (nghìn đồng)", "Giá trị còn lại (nghìn đồng)",
                "Tình trạng tài sản", "Ghi chú"
        ));

        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> summary = new LinkedHashMap<>();

        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        String bcNoiDung = request.getBcNoiDung();

        // 1. Try TS_QL real data first (F-143 reads from Tài sản Quản lý table)
        boolean useTsQl = false;
        List<TsQl> tsqlList = new ArrayList<>();

        if (targetUnitId != null) {
            if ("1".equals(bcNoiDung)) {
                // Kê khai lần đầu: ngày kê khai <= 4/4/2025
                tsqlList = tsQlRepository.findByOrgUnitIdAndNgayKeKhaiLessThanEqual(
                        targetUnitId, LocalDate.of(2025, 4, 4));
            } else if ("2".equals(bcNoiDung)) {
                // Kê khai bổ sung: ngày kê khai > 4/4/2025
                tsqlList = tsQlRepository.findByOrgUnitIdAndNgayKeKhaiAfter(
                        targetUnitId, LocalDate.of(2025, 4, 4));
            } else {
                // Default: no date filter
                tsqlList = tsQlRepository.findByOrgUnitId(targetUnitId);
            }

            if (!tsqlList.isEmpty()) {
                useTsQl = true;
            }
        }

        if (useTsQl) {
            // Group by nhom using getNhomCategoryNamesMap
            Map<String, String> nhomCategoryNames = getNhomCategoryNamesMap();
            Map<String, List<TsQl>> grouped = new LinkedHashMap<>();
            for (Map.Entry<String, String> entry : nhomCategoryNames.entrySet()) {
                String nhomKey = entry.getKey();
                // Collect all TsQl for this nhom key
                List<TsQl> groupItems = new ArrayList<>();
                for (TsQl ts : tsqlList) {
                    String tsNhom = ts.getNhom() != null ? ts.getNhom() : "OTHER";
                    if (nhomKey.equals(tsNhom)) {
                        groupItems.add(ts);
                    }
                }
                if (!groupItems.isEmpty()) {
                    grouped.put(nhomKey, groupItems);
                }
            }

            // Also handle nhom values not in the predefined map
            for (TsQl ts : tsqlList) {
                String tsNhom = ts.getNhom() != null ? ts.getNhom() : "OTHER";
                if (!grouped.containsKey(tsNhom)) {
                    List<TsQl> rest = new ArrayList<>();
                    rest.add(ts);
                    grouped.put(tsNhom, rest);
                } else {
                    // Already handled above
                }
            }

            int stt = 1;
            java.math.BigDecimal grandTotalNguyenGia = java.math.BigDecimal.ZERO;
            java.math.BigDecimal grandTotalGiaTriConLai = java.math.BigDecimal.ZERO;

            for (Map.Entry<String, List<TsQl>> entry : grouped.entrySet()) {
                String nhomKey = entry.getKey();
                List<TsQl> groupItems = entry.getValue();

                // Compute group totals
                java.math.BigDecimal groupNguyenGia = java.math.BigDecimal.ZERO;
                java.math.BigDecimal groupGiaTriConLai = java.math.BigDecimal.ZERO;
                for (TsQl ts : groupItems) {
                    if (ts.getNguyenGia() != null) {
                        groupNguyenGia = groupNguyenGia.add(ts.getNguyenGia());
                    }
                    if (ts.getGiaTriConLai() != null) {
                        groupGiaTriConLai = groupGiaTriConLai.add(ts.getGiaTriConLai());
                    }
                }

                // Category header row
                String categoryName = nhomCategoryNames.getOrDefault(nhomKey, nhomKey);
                Map<String, Object> catRow = new LinkedHashMap<>();
                catRow.put("_rowType", "section");
                catRow.put("STT", "");
                catRow.put("Danh mục tài sản", categoryName);
                catRow.put("Đơn vị tính", "");
                catRow.put("Số lượng", "");
                catRow.put("Năm xây dựng", "");
                catRow.put("Năm sử dụng", "");
                catRow.put("Diện tích đất (m2)", "");
                catRow.put("Diện tích sàn sử dụng (m2)", "");
                catRow.put("Nguyên giá (nghìn đồng)", "");
                catRow.put("Giá trị còn lại (nghìn đồng)", "");
                catRow.put("Tình trạng tài sản", "");
                catRow.put("Ghi chú", "");
                rows.add(catRow);

                // Detail rows for each TsQl in the group
                for (TsQl ts : groupItems) {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("STT", stt++);
                    r.put("Danh mục tài sản", ts.getTsTen() != null ? ts.getTsTen() : "");
                    r.put("Đơn vị tính", ts.getDonViTinh() != null ? ts.getDonViTinh() : "");
                    r.put("Số lượng", ts.getSoLuong() != null ? ts.getSoLuong().doubleValue() : 1.0);
                    r.put("Năm xây dựng", ts.getNamXayDung() != null ? ts.getNamXayDung() : "");
                    r.put("Năm sử dụng", ts.getNamSuDung() != null ? ts.getNamSuDung() : "");
                    r.put("Diện tích đất (m2)", ts.getDienTichDat() != null ? ts.getDienTichDat().doubleValue() : 0.0);
                    r.put("Diện tích sàn sử dụng (m2)", ts.getSanSuDung() != null ? ts.getSanSuDung().doubleValue() : 0.0);

                    java.math.BigDecimal ngVal = ts.getNguyenGia() != null ? ts.getNguyenGia() : java.math.BigDecimal.ZERO;
                    java.math.BigDecimal clVal = ts.getGiaTriConLai() != null ? ts.getGiaTriConLai() : java.math.BigDecimal.ZERO;

                    // Convert to nghìn đồng
                    r.put("Nguyên giá (nghìn đồng)", ngVal.longValue() / 1000);
                    r.put("Giá trị còn lại (nghìn đồng)", clVal.longValue() / 1000);
                    r.put("Tình trạng tài sản", ts.getTinhTrang() != null ? ts.getTinhTrang() : "");
                    r.put("Ghi chú", ts.getGhiChu() != null ? ts.getGhiChu() : "");

                    rows.add(r);
                }

                // Tổng cộng row for the group
                Map<String, Object> groupTotalRow = new LinkedHashMap<>();
                groupTotalRow.put("_rowType", "groupTotal");
                groupTotalRow.put("STT", "");
                groupTotalRow.put("Danh mục tài sản", "Tổng cộng");
                groupTotalRow.put("Đơn vị tính", "");
                groupTotalRow.put("Số lượng", groupItems.size());
                groupTotalRow.put("Năm xây dựng", "");
                groupTotalRow.put("Năm sử dụng", "");
                groupTotalRow.put("Diện tích đất (m2)", "");
                groupTotalRow.put("Diện tích sàn sử dụng (m2)", "");
                groupTotalRow.put("Nguyên giá (nghìn đồng)", groupNguyenGia.longValue() / 1000);
                groupTotalRow.put("Giá trị còn lại (nghìn đồng)", groupGiaTriConLai.longValue() / 1000);
                groupTotalRow.put("Tình trạng tài sản", "");
                groupTotalRow.put("Ghi chú", "");
                rows.add(groupTotalRow);

                grandTotalNguyenGia = grandTotalNguyenGia.add(groupNguyenGia);
                grandTotalGiaTriConLai = grandTotalGiaTriConLai.add(groupGiaTriConLai);
            }

            // Final TỔNG CỘNG row
            Map<String, Object> finalTotalRow = new LinkedHashMap<>();
            finalTotalRow.put("_rowType", "grandTotal");
            finalTotalRow.put("STT", "");
            finalTotalRow.put("Danh mục tài sản", "TỔNG CỘNG");
            finalTotalRow.put("Đơn vị tính", "");
            finalTotalRow.put("Số lượng", "");
            finalTotalRow.put("Năm xây dựng", "");
            finalTotalRow.put("Năm sử dụng", "");
            finalTotalRow.put("Diện tích đất (m2)", "");
            finalTotalRow.put("Diện tích sàn sử dụng (m2)", "");
            finalTotalRow.put("Nguyên giá (nghìn đồng)", grandTotalNguyenGia.longValue() / 1000);
            finalTotalRow.put("Giá trị còn lại (nghìn đồng)", grandTotalGiaTriConLai.longValue() / 1000);
            finalTotalRow.put("Tình trạng tài sản", "");
            finalTotalRow.put("Ghi chú", "");
            rows.add(finalTotalRow);

            summary.put("Tổng số dòng", rows.size());
            summary.put("Tổng nguyên giá (nghìn đồng)", grandTotalNguyenGia.longValue() / 1000);
            summary.put("Tổng giá trị còn lại (nghìn đồng)", grandTotalGiaTriConLai.longValue() / 1000);

            return buildPreviewResponse("F-143", headers, rows, summary);
        }

        // 2. Fallback: existing GIS PointObject auto-generate
        int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();
        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPointsForF143(targetUnitId, reportYear,
                request.getBcNoiDung());
        int stt = 1;
        long totalNguyenGia = 0;
        long totalGiaTriConLai = 0;

        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
            Map<String, Object> r = new HashMap<>();

            r.put("STT", stt++);
            r.put("Danh mục tài sản", p.getName() != null ? p.getName() : "");
            r.put("Đơn vị tính", getPointAssetUnit(p));
            r.put("Số lượng", 1.0);

            int pYear = p.getCreatedAt() != null ? p.getCreatedAt().getYear() : reportYear;

            r.put("Năm xây dựng", pYear);
            r.put("Năm sử dụng", pYear);
            r.put("Diện tích đất (m2)", 0.0);
            r.put("Diện tích sàn sử dụng (m2)", 0.0);

            long val = 0;
            long gTriConLai = 0;

            r.put("Nguyên giá (nghìn đồng)", val);
            r.put("Giá trị còn lại (nghìn đồng)", gTriConLai);
            r.put("Tình trạng tài sản", "");
            r.put("Ghi chú", "");

            totalNguyenGia += val;
            totalGiaTriConLai += gTriConLai;
            rows.add(r);
        }

        summary.put("Tổng số tài sản", points.size());
        summary.put("Tổng nguyên giá (nghìn đồng)", totalNguyenGia);
        summary.put("Tổng giá trị còn lại (nghìn đồng)", totalGiaTriConLai);

        return buildPreviewResponse("F-143", headers, rows, summary);
    }

    private ReportResponse getPreviewF144(ReportPreviewRequest request) {
        List<String> headers = new ArrayList<>(List.of(
                "STT", "Danh mục tài sản", "Đơn vị tính", "Số lượng", "Năm xây dựng",
                "Năm sử dụng", "Diện tích đất", "Sàn sử dụng", "Nguyên giá (nghìn đồng)",
                "Giá trị còn lại (nghìn đồng)", "Tình trạng tài sản", "Ghi chú"

        ));

        List<Map<String, Object>> rows = new ArrayList<>();

        Map<String, Object> summary = new LinkedHashMap<>();

        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());

        int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();
        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);
        int stt = 1;
        long totalNguyenGia = 0;
        long totalGiaTriConLai = 0;

        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
            Map<String, Object> r = new HashMap<>();

            r.put("STT", stt++);
            r.put("Danh mục tài sản", p.getName() != null ? p.getName() : "");
            r.put("Đơn vị tính", getPointAssetUnit(p));
            r.put("Số lượng", 1.0);

            int pYear = p.getCreatedAt() != null ? p.getCreatedAt().getYear() : reportYear;

            r.put("Năm xây dựng", pYear);
            r.put("Năm sử dụng", pYear);
            r.put("Diện tích đất", 0.0);
            r.put("Sàn sử dụng", 0.0);

            long val = getPointAssetValue(p);
            long gTriConLai = (long) (val * 0.8);

            r.put("Nguyên giá (nghìn đồng)", val);
            r.put("Giá trị còn lại (nghìn đồng)", gTriConLai);
            r.put("Tình trạng tài sản", "Đang hoạt động tốt");
            r.put("Ghi chú", "");

            totalNguyenGia += val;
            totalGiaTriConLai += gTriConLai;
            rows.add(r);
        }

        summary.put("Tổng số tài sản", points.size());
        summary.put("Tổng nguyên giá (nghìn đồng)", totalNguyenGia);
        summary.put("Tổng giá trị còn lại (nghìn đồng)", totalGiaTriConLai);

        return buildPreviewResponse("F-144", headers, rows, summary);
    }

    private ReportResponse getPreviewF145(ReportPreviewRequest request) {
        List<String> headers = new ArrayList<>(List.of(
                "STT", "Danh mục tài sản", "Đơn vị tính", "Số lượng", "Năm xây dựng",
                "Năm sử dụng", "Diện tích đất", "Sàn sử dụng", "Nguyên giá (nghìn đồng)",
                "Giá trị còn lại (nghìn đồng)", "Tình trạng tài sản", "Hình thức xử lý",
                "Tổng số tiền thu được (nghìn đồng)", "Chi phí có liên quan (nghìn đồng)", "Nộp NSNN (nghìn đồng)",
                "Ghi chú"

        ));

        List<Map<String, Object>> rows = new ArrayList<>();

        Map<String, Object> summary = new LinkedHashMap<>();

        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());

        int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();
        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);
        int stt = 1;
        long totalNguyenGia = 0;
        long totalGiaTriConLai = 0;
        long totalThuDuoc = 0;
        long totalChiPhi = 0;
        long totalNopNsnn = 0;

        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
            Map<String, Object> r = new HashMap<>();

            r.put("STT", stt++);
            r.put("Danh mục tài sản", p.getName() != null ? p.getName() : "");
            r.put("Đơn vị tính", getPointAssetUnit(p));
            r.put("Số lượng", 1.0);

            int pYear = p.getCreatedAt() != null ? p.getCreatedAt().getYear() : reportYear;

            r.put("Năm xây dựng", pYear);
            r.put("Năm sử dụng", pYear);
            r.put("Diện tích đất", 0.0);
            r.put("Sàn sử dụng", 0.0);

            long val = getPointAssetValue(p);
            long gTriConLai = (long) (val * 0.8);

            r.put("Nguyên giá (nghìn đồng)", val);
            r.put("Giá trị còn lại (nghìn đồng)", gTriConLai);
            r.put("Tình trạng tài sản", "Đang hoạt động tốt");
            r.put("Hình thức xử lý", "Thu hồi");
            r.put("Tổng số tiền thu được (nghìn đồng)", 0L);
            r.put("Chi phí có liên quan (nghìn đồng)", 0L);
            r.put("Nộp NSNN (nghìn đồng)", 0L);
            r.put("Ghi chú", "");

            totalNguyenGia += val;
            totalGiaTriConLai += gTriConLai;
            rows.add(r);
        }

        summary.put("Tổng số tài sản", points.size());
        summary.put("Tổng nguyên giá (nghìn đồng)", totalNguyenGia);
        summary.put("Tổng giá trị còn lại (nghìn đồng)", totalGiaTriConLai);
        summary.put("Tổng số tiền thu được (nghìn đồng)", totalThuDuoc);
        summary.put("Tổng chi phí có liên quan (nghìn đồng)", totalChiPhi);
        summary.put("Tổng nộp NSNN (nghìn đồng)", totalNopNsnn);

        return buildPreviewResponse("F-145", headers, rows, summary);
    }

    private ReportResponse getPreviewF146(ReportPreviewRequest request) {
        List<String> headers = new ArrayList<>(List.of(
                "STT", "Danh mục tài sản", "Đơn vị tính", "Số lượng", "Diện tích đất",
                "Sàn sử dụng", "Nguyên giá (nghìn đồng)", "Giá trị còn lại (nghìn đồng)",
                "Thời hạn khai thác", "Doanh nghiệp khai thác", "Tổng số tiền thu được (nghìn đồng)",
                "Chi phí có liên quan (nghìn đồng)", "Nộp NSNN (nghìn đồng)", "Tiền thực hiện dự án (nghìn đồng)",
                "Ghi chú"

        ));

        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> summary = new LinkedHashMap<>();

        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();
        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);

        int stt = 1;
        long totalNguyenGia = 0;
        long totalGiaTriConLai = 0;
        long totalThuDuoc = 0;
        long totalChiPhi = 0;
        long totalNopNsnn = 0;
        long totalTienDuAn = 0;

        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
            Map<String, Object> r = new HashMap<>();

            r.put("STT", stt++);
            r.put("Danh mục tài sản", p.getName() != null ? p.getName() : "");
            r.put("Đơn vị tính", getPointAssetUnit(p));
            r.put("Số lượng", 1.0);
            r.put("Diện tích đất", 0.0);
            r.put("Sàn sử dụng", 0.0);

            long val = getPointAssetValue(p);
            long gTriConLai = (long) (val * 0.8);

            r.put("Nguyên giá (nghìn đồng)", val);
            r.put("Giá trị còn lại (nghìn đồng)", gTriConLai);
            r.put("Thời hạn khai thác", "10 năm");
            r.put("Doanh nghiệp khai thác", "Cảng vụ Hàng hải");
            r.put("Tổng số tiền thu được (nghìn đồng)", 0L);
            r.put("Chi phí có liên quan (nghìn đồng)", 0L);
            r.put("Nộp NSNN (nghìn đồng)", 0L);
            r.put("Tiền thực hiện dự án (nghìn đồng)", 0L);
            r.put("Ghi chú", "");

            totalNguyenGia += val;
            totalGiaTriConLai += gTriConLai;
            rows.add(r);
        }

        summary.put("Tổng số tài sản", points.size());
        summary.put("Tổng nguyên giá (nghìn đồng)", totalNguyenGia);
        summary.put("Tổng giá trị còn lại (nghìn đồng)", totalGiaTriConLai);
        summary.put("Tổng số tiền thu được (nghìn đồng)", totalThuDuoc);
        summary.put("Tổng chi phí có liên quan (nghìn đồng)", totalChiPhi);
        summary.put("Tổng nộp NSNN (nghìn đồng)", totalNopNsnn);
        summary.put("Tổng tiền thực hiện dự án (nghìn đồng)", totalTienDuAn);

        return buildPreviewResponse("F-146", headers, rows, summary);
    }

    private ReportResponse getPreviewF147(ReportPreviewRequest request) {
        List<String> headers = new ArrayList<>(List.of(
                "STT", "Tên tài sản", "Địa chỉ", "Năm đưa vào sử dụng", "Thông số cơ bản",
                "Diện tích đất", "Sàn sử dụng", "Nguyên giá (đồng)", "Giá trị còn lại (đồng)",
                "Tình trạng", "Lý do"

        ));

        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> summary = new LinkedHashMap<>();

        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();
        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);
        String htxl = request.getBcNoiDung();
        if (htxl != null && !htxl.isBlank()) {
            List<com.hanghai.kchtg.gis.point.entity.PointObject> filtered = new ArrayList<>();
            List<String> listHtxl = java.util.Arrays.asList(htxl.split(","));
            int mod = 2;
            if (listHtxl.contains("BAN"))
                mod = 3;
            else if (listHtxl.contains("THANH_LY"))
                mod = 4;
            else if (listHtxl.contains("DIEU_CHUYEN"))
                mod = 5;
            for (int i = 0; i < points.size(); i++) {
                if (i % mod == 0) {
                    filtered.add(points.get(i));
                }
            }
            points = filtered;
        }

        int stt = 1;
        long totalNguyenGia = 0;
        long totalGiaTriConLai = 0;

        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
            Map<String, Object> r = new HashMap<>();

            r.put("STT", stt++);
            r.put("Tên tài sản", p.getName() != null ? p.getName() : "");
            r.put("Địa chỉ", "Cảng vụ Hàng hải");

            int pYear = p.getCreatedAt() != null ? p.getCreatedAt().getYear() : reportYear;

            r.put("Năm đưa vào sử dụng", pYear);
            r.put("Thông số cơ bản", "Đạt chuẩn kỹ thuật");
            r.put("Diện tích đất", 0.0);
            r.put("Sàn sử dụng", 0.0);

            long val = getPointAssetValue(p);
            long gTriConLai = (long) (val * 0.8);

            r.put("Nguyên giá (đồng)", val);
            r.put("Giá trị còn lại (đồng)", gTriConLai);
            r.put("Tình trạng", "Bình thường");
            r.put("Lý do", "Hết hạn khai thác trực tiếp, chuyển hình thức xử lý");

            totalNguyenGia += val;
            totalGiaTriConLai += gTriConLai;
            rows.add(r);
        }

        summary.put("Tổng số tài sản", points.size());
        summary.put("Tổng nguyên giá (đồng)", totalNguyenGia);
        summary.put("Tổng giá trị còn lại (đồng)", totalGiaTriConLai);

        return buildPreviewResponse("F-147", headers, rows, summary);
    }

    private ReportResponse getPreviewGeneric(ReportPreviewRequest request) {
        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();
        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);
        long count = points.size();
        long totalVal = 0;

        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
            totalVal += getPointAssetValue(p);
        }

        List<String> headers = new ArrayList<>(List.of("STT", "Mã chỉ tiêu", "Tên chỉ tiêu", "Giá trị báo cáo"));

        List<Map<String, Object>> rows = new ArrayList<>();

        if (count > 0) {
            rows.add(Map.of("STT", 1, "Mã chỉ tiêu", "CT-001", "Tên chỉ tiêu", "Số lượng tài sản", "Giá trị báo cáo",
                    count));
            rows.add(Map.of("STT", 2, "Mã chỉ tiêu", "CT-002", "Tên chỉ tiêu", "Tổng giá trị (VNĐ)", "Giá trị báo cáo",
                    totalVal));
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số dòng", rows.size());
        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }





    private ReportResponse getPreviewF148(ReportPreviewRequest request) {
        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());

        boolean isRoot = false;

        if (targetUnitId != null) {
            isRoot = orgUnitRepository.findById(targetUnitId)
                    .map(u -> "CUC_HHVT".equals(u.getCode()))
                    .orElse(false);
        }

        final boolean skipFilter = targetUnitId == null || isRoot;

        final Integer filterNhom = request.getNhomCangBien();

        final int reportYear = request.getStartDate() != null ? request.getStartDate().getYear()
                : LocalDate.now().getYear();

        // 1. Query Port (ports) as root — matching hh.csdl hierarchy: Cảng biển → Bến cảng → Cầu cảng
        List<com.hanghai.kchtg.cangben.entity.Port> allPorts = cangBienRepository.findAll().stream()
                .filter(cb -> skipFilter || targetUnitId.equals(cb.getOrgUnitId()))
                .filter(cb -> cb.getCreatedAt() == null || cb.getCreatedAt().getYear() <= reportYear)
                .filter(cb -> filterNhom == null || filterNhom.equals(cb.getPortGroup()))
                .toList();

        // 2. ALL ports go to I. CẢNG BIỂN; Section II is always rendered (with no data rows)
        List<com.hanghai.kchtg.cangben.entity.Port> group1Ports = new ArrayList<>(allPorts);
        List<com.hanghai.kchtg.cangben.entity.Port> group2Ports = new ArrayList<>();

        // 3. Headers exactly matching Excel template BCKCHT_163.xlsx row 9 columns
        List<String> headers = List.of(
                "STT",
                "Danh mục bến cảng, cầu cảng, cảng bến thủy nội địa",
                "Đơn vị quản lý khai thác cảng",
                "Địa điểm, vị trí cảng",
                "Thời điểm công bố mở",
                "Công năng khai thác",
                "Năng lực năm trước",
                "Năng lực năm báo cáo",
                "Đơn vị tính",
                "Chiều dài bến cảng, cầu cảng, cảng bến thủy nội địa (m)",
                "Tàu neo đậu, làm hàng lớn nhất (DWT)",
                "Ghi chú"
        );

        List<Map<String, Object>> rows = new ArrayList<>();
        int stt = 1;

        // Section I: Cảng biển (maritime ports — nhom 1,2)
        if (!group1Ports.isEmpty()) {
            Map<String, Object> sectionRow = new LinkedHashMap<>();
            sectionRow.put("STT", "I");
            sectionRow.put("Danh mục bến cảng, cầu cảng, cảng bến thủy nội địa", "Cảng biển");
            sectionRow.put("Đơn vị quản lý khai thác cảng", "");
            sectionRow.put("Địa điểm, vị trí cảng", "");
            sectionRow.put("Thời điểm công bố mở", "");
            sectionRow.put("Công năng khai thác", "");
            sectionRow.put("Năng lực năm trước", "");
            sectionRow.put("Năng lực năm báo cáo", "");
            sectionRow.put("Đơn vị tính", "");
            sectionRow.put("Chiều dài bến cảng, cầu cảng, cảng bến thủy nội địa (m)", "");
            sectionRow.put("Tàu neo đậu, làm hàng lớn nhất (DWT)", "");
            sectionRow.put("Ghi chú", "");
            sectionRow.put("_rowType", "section");
            rows.add(sectionRow);

            for (com.hanghai.kchtg.cangben.entity.Port port : group1Ports) {
                stt = appendF148Hierarchy(port, stt, rows, reportYear);
            }
        }

        // Section II: Cảng, bến thủy nội địa (inland waterways) — always shows even if empty
        {
            Map<String, Object> sectionRow = new LinkedHashMap<>();
            sectionRow.put("STT", "II");
            sectionRow.put("Danh mục bến cảng, cầu cảng, cảng bến thủy nội địa", "Cảng, bến thủy nội địa");
            sectionRow.put("Đơn vị quản lý khai thác cảng", "");
            sectionRow.put("Địa điểm, vị trí cảng", "");
            sectionRow.put("Thời điểm công bố mở", "");
            sectionRow.put("Công năng khai thác", "");
            sectionRow.put("Năng lực năm trước", "");
            sectionRow.put("Năng lực năm báo cáo", "");
            sectionRow.put("Đơn vị tính", "");
            sectionRow.put("Chiều dài bến cảng, cầu cảng, cảng bến thủy nội địa (m)", "");
            sectionRow.put("Tàu neo đậu, làm hàng lớn nhất (DWT)", "");
            sectionRow.put("Ghi chú", "");
            sectionRow.put("_rowType", "section");
            rows.add(sectionRow);

            for (com.hanghai.kchtg.cangben.entity.Port port : group2Ports) {
                stt = appendF148Hierarchy(port, stt, rows, reportYear);
            }
        }

        // Fallback if no items at all
        if (rows.isEmpty()) {
            Map<String, Object> sectionRow = new LinkedHashMap<>();
            sectionRow.put("STT", "I");
            sectionRow.put("Danh mục bến cảng, cầu cảng, cảng bến thủy nội địa", "I. CẢNG BIỂN");
            sectionRow.put("Đơn vị quản lý khai thác cảng", "");
            sectionRow.put("Địa điểm, vị trí cảng", "");
            sectionRow.put("Thời điểm công bố mở", "");
            sectionRow.put("Công năng khai thác", "");
            sectionRow.put("Năng lực năm trước", "");
            sectionRow.put("Năng lực năm báo cáo", "");
            sectionRow.put("Đơn vị tính", "");
            sectionRow.put("Chiều dài bến cảng, cầu cảng, cảng bến thủy nội địa (m)", "");
            sectionRow.put("Tàu neo đậu, làm hàng lớn nhất (DWT)", "");
            sectionRow.put("Ghi chú", "");
            sectionRow.put("_rowType", "section");
            rows.add(sectionRow);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        long dataRowCount = rows.stream().filter(r -> !"section".equals(r.get("_rowType"))).count();
        summary.put("Tổng số dòng", dataRowCount);
        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }





    /**
     * Formats TrangThaiHoatDong enum to a human-readable Vietnamese label.
     */
    private String f148TrangThaiLabel(
            com.hanghai.kchtg.common.entity.TrangThaiHoatDong status) {
        if (status == null)
            return "";
        switch (status) {
            case HIEN_HANH:
                return "Đang hoạt động";
            case TAM_NGUNG:
                return "Tạm ngừng";
            default:
                return status.name();
        }
    }

    /**
     * Formats LoaiBen enum to a human-readable Vietnamese label.
     */
    private String f148LoaiBenLabel(
            com.hanghai.kchtg.cangben.entity.LoaiBen loaiBen) {
        if (loaiBen == null)
            return "";
        switch (loaiBen) {
            case BEN_CONTAINER:
                return "Bến container";
            case BEN_TONG_HOP:
                return "Bến tổng hợp";
            case BEN_CHUYEN_DUNG:
                return "Bến chuyên dụng";
            case BEN_HANH_KHACH:
                return "Bến hành khách";
            case BEN_PHAO:
                return "Bến phao";
            case BEN_THUY_NOI_DIA:
                return "Bến thủy nội địa";
            default:
                return loaiBen.name();
        }
    }

    /**
     * Formats loaiKetCau (Integer from BenCang) to a human-readable label.
     */
    private String f148LoaiKetCauLabel(Integer loaiKetCau) {
        if (loaiKetCau == null)
            return "";
        switch (loaiKetCau) {
            case 1:
                return "Bê tông cốt thép";
            case 2:
                return "Thép";
            case 3:
                return "Kết cấu hỗn hợp";
            case 4:
                return "Phao nổi";
            default:
                return "Khác (" + loaiKetCau + ")";
        }
    }

    /**
     * Formats LocalDateTime to "MM/yyyy" string, or empty if null.
     */
    private String f148FormatThoiDiem(java.time.LocalDateTime dt) {
        if (dt == null)
            return "";
        return String.format("%02d/%d", dt.getMonthValue(), dt.getYear());
    }

    /**
     * Appends one Port port row, then its BenCang children, then each BenCang's Pier children.
     * Returns the next STT value.
     * <p>
     * This implements the hh.csdl hierarchy: Cảng biển → Bến cảng → Cầu cảng.
     * Port rows carry the sequential STT; berth and wharf rows are indented with empty STT.
     */
    private int appendF148Hierarchy(
            com.hanghai.kchtg.cangben.entity.Port port,
            int stt,
            List<Map<String, Object>> rows,
            int reportYear) {

        // Resolve org-unit name for the port
        String donViPort = "";
        if (port.getOrgUnitId() != null) {
            donViPort = orgUnitRepository.findById(port.getOrgUnitId())
                    .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                    .orElse("");
        }

        // ── Port (Cảng biển) row ──
        Map<String, Object> portRow = new LinkedHashMap<>();
        portRow.put("STT", String.valueOf(stt++));
        portRow.put("Danh mục bến cảng, cầu cảng, cảng bến thủy nội địa", port.getPortName());
        portRow.put("Đơn vị quản lý khai thác cảng", donViPort);
        portRow.put("Địa điểm, vị trí cảng", port.getProvince() != null ? port.getProvince() : "");
        portRow.put("Thời điểm công bố mở", f148FormatThoiDiem(port.getCreatedAt()));
        portRow.put("Công năng khai thác", "");
        portRow.put("Năng lực năm trước", "");
        portRow.put("Năng lực năm báo cáo", "");
        portRow.put("Đơn vị tính", "tấn/năm");
        portRow.put("Chiều dài bến cảng, cầu cảng, cảng bến thủy nội địa (m)", "");
        double portDwt = port.getMaxVesselCapacity() != null
                ? port.getMaxVesselCapacity().doubleValue() : 0.0;
        portRow.put("Tàu neo đậu, làm hàng lớn nhất (DWT)", portDwt);
        portRow.put("Ghi chú", "");
        portRow.put("_rowType", "port");
        rows.add(portRow);

        // ── Berths (Bến cảng) under this port ──
        List<com.hanghai.kchtg.cangben.entity.Berth> berths =
                benCangRepository.findByPortIdAndDeletedAtIsNull(port.getId());
        for (com.hanghai.kchtg.cangben.entity.Berth berth : berths) {
            String donViBerth = "";
            if (berth.getOrgUnitId() != null) {
                donViBerth = orgUnitRepository.findById(berth.getOrgUnitId())
                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                        .orElse("");
            }

            String diaDiemBerth = berth.getLocationCode() != null ? berth.getLocationCode()
                    : (port.getProvince() != null ? port.getProvince() : "");

            String thoiDiemBerth = f148FormatThoiDiem(berth.getOpeningAnnouncementDate());
            if (thoiDiemBerth.isEmpty()) {
                thoiDiemBerth = f148FormatThoiDiem(berth.getCreatedAt());
            }

            double dwtBerth = berth.getMaxVesselSize() != null
                    ? berth.getMaxVesselSize().doubleValue() : 0.0;

            Map<String, Object> berthRow = new LinkedHashMap<>();
            berthRow.put("STT", "");
            berthRow.put("Danh mục bến cảng, cầu cảng, cảng bến thủy nội địa", "\u00A0\u00A0\u00A0\u00A0" + berth.getBerthName());
            berthRow.put("Đơn vị quản lý khai thác cảng", donViBerth);
            berthRow.put("Địa điểm, vị trí cảng", diaDiemBerth);
            berthRow.put("Thời điểm công bố mở", thoiDiemBerth);
            berthRow.put("Công năng khai thác",
                    berth.getOperationalFunction() != null ? berth.getOperationalFunction() : "");
            // Năng lực từ Berth extended fields
            // Năm báo cáo = currentThroughput
            double nlBaoCao = berth.getCurrentThroughput() != null
                    ? berth.getCurrentThroughput().doubleValue() : 0.0;
            berthRow.put("Năng lực năm báo cáo", nlBaoCao);
            // Năm trước = currentThroughput if updatedAt.year == reportYear - 1
            double nlTruoc = (berth.getCurrentThroughput() != null
                    && berth.getUpdatedAt() != null
                    && berth.getUpdatedAt().getYear() == reportYear - 1)
                    ? berth.getCurrentThroughput().doubleValue() : 0.0;
            berthRow.put("Năng lực năm trước", nlTruoc);
            berthRow.put("Đơn vị tính", "tấn/năm");
            berthRow.put("Chiều dài bến cảng, cầu cảng, cảng bến thủy nội địa (m)",
                    berth.getLength() != null ? berth.getLength().doubleValue() : 0.0);
            berthRow.put("Tàu neo đậu, làm hàng lớn nhất (DWT)", dwtBerth);
            berthRow.put("Ghi chú", "");
            rows.add(berthRow);

            // ── Wharves (Cầu cảng) under this berth ──
            List<com.hanghai.kchtg.cangben.entity.Pier> wharves =
                    cauCangRepository.findByBerthIdAndDeletedAtIsNull(berth.getId());
            for (com.hanghai.kchtg.cangben.entity.Pier wharf : wharves) {
                double dwtWharf = wharf.getDesignLoad() != null
                        ? wharf.getDesignLoad().doubleValue() : 0.0;

                Map<String, Object> wharfRow = new LinkedHashMap<>();
                wharfRow.put("STT", "");
                wharfRow.put("Danh mục bến cảng, cầu cảng, cảng bến thủy nội địa", "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0" + wharf.getPierName());
                wharfRow.put("Đơn vị quản lý khai thác cảng", "");
                wharfRow.put("Địa điểm, vị trí cảng", "");
                wharfRow.put("Thời điểm công bố mở", "");
                wharfRow.put("Công năng khai thác",
                        wharf.getOperationalFunction() != null ? wharf.getOperationalFunction() : "");
                wharfRow.put("Năng lực năm trước", "");
                wharfRow.put("Năng lực năm báo cáo", "");
                wharfRow.put("Đơn vị tính", "tấn/năm");
                wharfRow.put("Chiều dài bến cảng, cầu cảng, cảng bến thủy nội địa (m)",
                        wharf.getLength() != null ? wharf.getLength().doubleValue() : 0.0);
                wharfRow.put("Tàu neo đậu, làm hàng lớn nhất (DWT)", dwtWharf);
                wharfRow.put("Ghi chú", "");
                rows.add(wharfRow);
            }
        }

        return stt;
    }

    private ReportResponse getPreviewF149(ReportPreviewRequest request) {
        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
        boolean isRoot = false;
        if (targetUnitId != null) {
            isRoot = orgUnitRepository.findById(targetUnitId)
                    .map(u -> "CUC_HHVT".equals(u.getCode()))
                    .orElse(false);
        }
        final boolean skipFilter = targetUnitId == null || isRoot;
        final Integer filterNhom = request.getNhomCangBien();
        final int reportYear = request.getStartDate() != null ? request.getStartDate().getYear()
                : LocalDate.now().getYear();
        List<com.hanghai.kchtg.cangben.entity.Port> ports = cangBienRepository.findAll().stream()
                .filter(cb -> skipFilter || targetUnitId.equals(cb.getOrgUnitId()))
                .filter(cb -> cb.getCreatedAt() == null || cb.getCreatedAt().getYear() <= reportYear)
                .filter(cb -> filterNhom == null || filterNhom.equals(cb.getPortGroup()))
                .toList();
        List<String> headers = List.of(
                "STT",
                "Danh mục cảng",
                "Địa điểm (Tỉnh/TP)",
                "Năng lực năm trước (tấn/năm)",
                "Năng lực năm báo cáo (tấn/năm)",
                "Năng lực tăng thêm");
        List<Map<String, Object>> rows = new ArrayList<>();
        // Group ports by nhomPort (e.g. 1 -> Nhóm 1)
        Map<String, List<com.hanghai.kchtg.cangben.entity.Port>> groups = new LinkedHashMap<>();
        for (int g = 1; g <= 5; g++) {
            if (filterNhom == null || filterNhom == g) {
                final int nhomNum = g;
                List<com.hanghai.kchtg.cangben.entity.Port> cbInNhom = ports.stream()
                        .filter(cb -> {
                            int n = cb.getPortGroup() != null ? cb.getPortGroup() : 1;
                            return n == nhomNum;
                        })
                        .toList();
                if (!cbInNhom.isEmpty()) {
                    groups.put("Nhóm " + g, cbInNhom);
                }
            }
        }
        for (Map.Entry<String, List<com.hanghai.kchtg.cangben.entity.Port>> entry : groups.entrySet()) {
            String groupName = entry.getKey();
            List<com.hanghai.kchtg.cangben.entity.Port> groupItems = entry.getValue();
            // Add Category Header row
            Map<String, Object> headerRow = new LinkedHashMap<>();
            headerRow.put("STT", "");
            headerRow.put("Danh mục cảng", groupName);
            headerRow.put("Địa điểm (Tỉnh/TP)", "");
            headerRow.put("Năng lực năm trước (tấn/năm)", "");
            headerRow.put("Năng lực năm báo cáo (tấn/năm)", "");
            headerRow.put("Năng lực tăng thêm", "");
            headerRow.put("_rowType", "section");
            rows.add(headerRow);
            int idx = 1;
            for (com.hanghai.kchtg.cangben.entity.Port cb : groupItems) {
                // Sum nangLuc from all BenCang children (BCKCHT_164 approach)
                List<com.hanghai.kchtg.cangben.entity.Berth> children = benCangRepository.findByPortIdAndDeletedAtIsNull(cb.getId());
                double capBaoCao = children.stream()
                        .filter(b -> b.getCurrentThroughput() != null)
                        .filter(b -> b.getOpeningAnnouncementDate() != null && b.getOpeningAnnouncementDate().getYear() == reportYear)
                        .mapToDouble(b -> b.getCurrentThroughput().doubleValue())
                        .sum();
                double capNamTruoc = children.stream()
                        .filter(b -> b.getCurrentThroughput() != null)
                        .filter(b -> b.getOpeningAnnouncementDate() != null && b.getOpeningAnnouncementDate().getYear() == reportYear - 1)
                        .mapToDouble(b -> b.getCurrentThroughput().doubleValue())
                        .sum();
                Map<String, Object> itemRow = new LinkedHashMap<>();
                itemRow.put("STT", String.valueOf(idx++));
                itemRow.put("Danh mục cảng", cb.getPortName());
                itemRow.put("Địa điểm (Tỉnh/TP)", cb.getProvince() != null ? cb.getProvince() : "");
                itemRow.put("Năng lực năm trước (tấn/năm)", capNamTruoc);
                itemRow.put("Năng lực năm báo cáo (tấn/năm)", capBaoCao);
                itemRow.put("Năng lực tăng thêm", capBaoCao - capNamTruoc);
                rows.add(itemRow);
            }
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        long dataRowCount = rows.stream().filter(r -> !"section".equals(r.get("_rowType"))).count();
        summary.put("Tổng số dòng", dataRowCount);
        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);
    }

    // ==========================================
    // EXPORT IMPLEMENTATION DELEGATES
    // ==========================================
    /**
     * Xuất báo cáo tĩnh (F-142).
     */
    private byte[] exportStaticReport(ReportPreviewRequest request, String pathTemplate) throws Exception {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {
            if (is == null)
                throw new RuntimeException("Template file not found: " + pathTemplate);
            try (Workbook workbook = WorkbookFactory.create(is)) {
                Sheet srcSheet = workbook.getSheetAt(0);
                Sheet destSheet = workbook.createSheet("ReportSheet");
                copyPageSetup(srcSheet, destSheet);
                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear()
                        : LocalDate.now().getYear();
                Map<String, String> replacements = buildReplacements(request, reportYear);
                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());

                // 1. CRUD-first: try to read real data from bcc157_report table (nguonDuLieu='1')
                boolean useCrudData = false;
                if (targetUnitId != null) {
                    Bcc157Response savedData = bcc157Service.findByOrgUnitIdAndReportYearAndNguonDuLieu(
                            targetUnitId, reportYear, "1");
                    if (savedData != null) {
                        useCrudData = true;
                        replacements.put("${zobjComReport.maSoNguyenGiaSoDuDauNam.asText()}",
                                nullToEmpty(savedData.getMaSoNguyenGiaSoDuDauNam()));
                        replacements.put("${zobjComReport.taiSanNguyenGiaSoDuDauNam.asText()}",
                                bigDecimalToPlainString(savedData.getTaiSanNguyenGiaSoDuDauNam()));

                        replacements.put("${zobjComReport.maSoNguyenGiaTangTrongNam.asText()}",
                                nullToEmpty(savedData.getMaSoNguyenGiaTangTrongNam()));
                        replacements.put("${zobjComReport.taiSanNguyenGiaTangTrongNam.asText()}",
                                bigDecimalToPlainString(savedData.getTaiSanNguyenGiaTangTrongNam()));

                        replacements.put("${zobjComReport.maSoNguyenGiaGiamTrongNam.asText()}",
                                nullToEmpty(savedData.getMaSoNguyenGiaGiamTrongNam()));
                        replacements.put("${zobjComReport.taiSanNguyenGiaGiamTrongNam.asText()}",
                                bigDecimalToPlainString(savedData.getTaiSanNguyenGiaGiamTrongNam()));

                        replacements.put("${zobjComReport.maSoNguyenGiaSoDuCuoiNam.asText()}",
                                nullToEmpty(savedData.getMaSoNguyenGiaSoDuCuoiNam()));
                        replacements.put("${zobjComReport.taiSanNguyenGiaSoDuCuoiNam.asText()}",
                                bigDecimalToPlainString(savedData.getTaiSanNguyenGiaSoDuCuoiNam()));

                        replacements.put("${zobjComReport.maSoGiaTriHaoMonSoDuDauNam.asText()}",
                                nullToEmpty(savedData.getMaSoGiaTriHaoMonSoDuDauNam()));
                        replacements.put("${zobjComReport.taiSanGiaTriHaoMonSoDuDauNam.asText()}",
                                bigDecimalToPlainString(savedData.getTaiSanGiaTriHaoMonSoDuDauNam()));

                        replacements.put("${zobjComReport.maSoGiaTriHaoMonTangTrongNam.asText()}",
                                nullToEmpty(savedData.getMaSoGiaTriHaoMonTangTrongNam()));
                        replacements.put("${zobjComReport.taiSanGiaTriHaoMonTangTrongNam.asText()}",
                                bigDecimalToPlainString(savedData.getTaiSanGiaTriHaoMonTangTrongNam()));

                        replacements.put("${zobjComReport.maSoGiaTriHaoMonGiamTrongNam.asText()}",
                                nullToEmpty(savedData.getMaSoGiaTriHaoMonGiamTrongNam()));
                        replacements.put("${zobjComReport.taiSanGiaTriHaoMonGiamTrongNam.asText()}",
                                bigDecimalToPlainString(savedData.getTaiSanGiaTriHaoMonGiamTrongNam()));

                        replacements.put("${zobjComReport.maSoGiaTriHaoMonSoDuCuoiNam.asText()}",
                                nullToEmpty(savedData.getMaSoGiaTriHaoMonSoDuCuoiNam()));
                        replacements.put("${zobjComReport.taiSanGiaTriHaoMonSoDuCuoiNam.asText()}",
                                bigDecimalToPlainString(savedData.getTaiSanGiaTriHaoMonSoDuCuoiNam()));

                        replacements.put("${zobjComReport.maSoGiaTriConLaiTuNgayDauNam.asText()}",
                                nullToEmpty(savedData.getMaSoGiaTriConLaiTuNgayDauNam()));
                        replacements.put("${zobjComReport.taiSanGiaTriConLaiTuNgayDauNam.asText()}",
                                bigDecimalToPlainString(savedData.getTaiSanGiaTriConLaiTuNgayDauNam()));

                        replacements.put("${zobjComReport.maSoGiaTriConLaiTuNgayCuoiNam.asText()}",
                                nullToEmpty(savedData.getMaSoGiaTriConLaiTuNgayCuoiNam()));
                        replacements.put("${zobjComReport.taiSanGiaTriConLaiTuNgayCuoiNam.asText()}",
                                bigDecimalToPlainString(savedData.getTaiSanGiaTriConLaiTuNgayCuoiNam()));
                    }
                }

                // 2. Fallback: if no CRUD data was found, set all data placeholders to safe defaults
                // so Excel formulas don't produce #VALUE! from literal unreplaced placeholders.
                if (!useCrudData) {
                    replacements.put("${zobjComReport.maSoNguyenGiaSoDuDauNam.asText()}", "1.1");
                    replacements.put("${zobjComReport.taiSanNguyenGiaSoDuDauNam.asText()}", "0");
                    replacements.put("${zobjComReport.maSoNguyenGiaTangTrongNam.asText()}", "1.2");
                    replacements.put("${zobjComReport.taiSanNguyenGiaTangTrongNam.asText()}", "0");
                    replacements.put("${zobjComReport.maSoNguyenGiaGiamTrongNam.asText()}", "1.3");
                    replacements.put("${zobjComReport.taiSanNguyenGiaGiamTrongNam.asText()}", "0");
                    replacements.put("${zobjComReport.maSoNguyenGiaSoDuCuoiNam.asText()}", "1.4");
                    replacements.put("${zobjComReport.taiSanNguyenGiaSoDuCuoiNam.asText()}", "0");

                    replacements.put("${zobjComReport.maSoGiaTriHaoMonSoDuDauNam.asText()}", "2.1");
                    replacements.put("${zobjComReport.taiSanGiaTriHaoMonSoDuDauNam.asText()}", "0");
                    replacements.put("${zobjComReport.maSoGiaTriHaoMonTangTrongNam.asText()}", "2.2");
                    replacements.put("${zobjComReport.taiSanGiaTriHaoMonTangTrongNam.asText()}", "0");
                    replacements.put("${zobjComReport.maSoGiaTriHaoMonGiamTrongNam.asText()}", "2.3");
                    replacements.put("${zobjComReport.taiSanGiaTriHaoMonGiamTrongNam.asText()}", "0");
                    replacements.put("${zobjComReport.maSoGiaTriHaoMonSoDuCuoiNam.asText()}", "2.4");
                    replacements.put("${zobjComReport.taiSanGiaTriHaoMonSoDuCuoiNam.asText()}", "0");

                    replacements.put("${zobjComReport.maSoGiaTriConLaiTuNgayDauNam.asText()}", "3.1");
                    replacements.put("${zobjComReport.taiSanGiaTriConLaiTuNgayDauNam.asText()}", "0");
                    replacements.put("${zobjComReport.maSoGiaTriConLaiTuNgayCuoiNam.asText()}", "3.2");
                    replacements.put("${zobjComReport.taiSanGiaTriConLaiTuNgayCuoiNam.asText()}", "0");
                }

                // Copy statically

                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {
                    Row srcRow = srcSheet.getRow(r);

                    if (srcRow == null)
                        continue;

                    Row destRow = destSheet.createRow(r);

                    destRow.setHeight(srcRow.getHeight());

                    for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                        Cell srcCell = srcRow.getCell(c);

                        if (srcCell != null) {
                            Cell destCell = destRow.createCell(c);

                            copyCell(srcCell, destCell, replacements);
                        }
                    }
                }

                copyMergedRegions(srcSheet, destSheet, true, 0, 0);

                boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());

                if (!isExcel) {
                    applyStaticRemergeAndOverflowMerge(destSheet, true, 999999, 999999);
                }

                finalizeWorkbookSheet(workbook);

                // Compute BCC_157 formula cells directly from replacements map values
                directComputeBcc157FromReplacements(destSheet, replacements);

                // Force-overwrite computed cells: removeFormula() + setCellType(NUMERIC) + setCellValue()
                // This defeats any stale formula/string formatting that survived copyCell + directCompute
                forceWriteNumericCells(destSheet, replacements);

                return outputWorkbook(workbook, destSheet, isExcel);
            }
        }
    }

    /**
     * Xuất báo cáo kê khai (F-143) với phân nhóm (loại tài sản).
     */
    private byte[] exportF143Report(ReportPreviewRequest request, String pathTemplate) throws Exception {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {
            if (is == null)
                throw new RuntimeException("Template file not found: " + pathTemplate);

            try (Workbook workbook = WorkbookFactory.create(is)) {
                Sheet srcSheet = workbook.getSheetAt(0);
                Sheet destSheet = workbook.createSheet("ReportSheet");

                copyPageSetup(srcSheet, destSheet);

                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear()
                        : LocalDate.now().getYear();
                Map<String, String> replacements = buildReplacements(request, reportYear);

                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());

                // 1. Try TS_QL real data first (F-143 reads from Tài sản Quản lý table)
                boolean useTsQl = false;
                List<TsQl> tsqlList = new ArrayList<>();
                Map<String, String> nhomCategoryNames = getNhomCategoryNamesMap();

                if (targetUnitId != null) {
                    String bcNoiDung = request.getBcNoiDung();
                    if ("1".equals(bcNoiDung)) {
                        // Kê khai lần đầu: ngày kê khai <= 4/4/2025
                        tsqlList = tsQlRepository.findByOrgUnitIdAndNgayKeKhaiLessThanEqual(
                                targetUnitId, LocalDate.of(2025, 4, 4));
                    } else if ("2".equals(bcNoiDung)) {
                        // Kê khai bổ sung: ngày kê khai > 4/4/2025
                        tsqlList = tsQlRepository.findByOrgUnitIdAndNgayKeKhaiAfter(
                                targetUnitId, LocalDate.of(2025, 4, 4));
                    } else {
                        // Default: no date filter
                        tsqlList = tsQlRepository.findByOrgUnitId(targetUnitId);
                    }
                    if (!tsqlList.isEmpty()) {
                        useTsQl = true;
                    }
                }

                // Variables shared by both TS_QL and GIS fallback paths
                int totalCategoryRows;
                int totalDetailRows;
                int offset;
                long totalNguyenGiaExport;
                long cLaiDauNamExport;
                int destRowIdx;

                if (useTsQl) {
                    // TS_QL path: group by nhom
                    Map<String, List<TsQl>> groupedTsQl = new LinkedHashMap<>();
                    for (String nhomKey : nhomCategoryNames.keySet()) {
                        groupedTsQl.put(nhomKey, new ArrayList<>());
                    }
                    for (TsQl ts : tsqlList) {
                        String nhomKey = ts.getNhom() != null ? ts.getNhom() : "OTHER";
                        groupedTsQl.computeIfAbsent(nhomKey, k -> new ArrayList<>()).add(ts);
                    }

                    // Remove empty groups
                    groupedTsQl.entrySet().removeIf(e -> e.getValue().isEmpty());

                    totalCategoryRows = groupedTsQl.size();
                    totalDetailRows = tsqlList.size();
                    offset = (totalCategoryRows + totalDetailRows) - 2;
                    totalNguyenGiaExport = tsqlList.stream()
                            .filter(ts -> ts.getNguyenGia() != null)
                            .mapToLong(ts -> ts.getNguyenGia().longValue())
                            .sum();
                    cLaiDauNamExport = tsqlList.stream()
                            .filter(ts -> ts.getGiaTriConLai() != null)
                            .mapToLong(ts -> ts.getGiaTriConLai().longValue())
                            .sum();
                    destRowIdx = 0;

                    for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {
                        Row srcRow = srcSheet.getRow(r);
                        if (srcRow == null) continue;

                        if (r < 10) {
                            // Copy Row 0 to 9 (Header & Tổng cộng)
                            Row destRow = destSheet.createRow(r);
                            destRow.setHeight(srcRow.getHeight());
                            for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                                Cell srcCell = srcRow.getCell(c);
                                if (srcCell != null) {
                                    Cell destCell = destRow.createCell(c);
                                    copyCell(srcCell, destCell, replacements);
                                    if (r == 9) {
                                        if (c == 8) setNumericValue(destCell, (double) totalNguyenGiaExport);
                                        else if (c == 9) setNumericValue(destCell, (double) cLaiDauNamExport);
                                    }
                                }
                            }
                            destRowIdx = r + 1;
                        } else if (r == 10) {
                            // Dynamic rendering of Categories and Details from TS_QL
                            Row srcRow10 = srcSheet.getRow(10);
                            Row srcRow11 = srcSheet.getRow(11);

                            for (var entry : groupedTsQl.entrySet()) {
                                List<TsQl> list = entry.getValue();
                                int overallIdx = 1;
                                String catName = nhomCategoryNames.getOrDefault(entry.getKey(), entry.getKey());

                                // Category Header Row
                                Row catHeaderRow = destSheet.createRow(destRowIdx);
                                catHeaderRow.setHeight(srcRow10.getHeight());

                                long catNguyenGia = list.stream()
                                        .filter(ts -> ts.getNguyenGia() != null)
                                        .mapToLong(ts -> ts.getNguyenGia().longValue())
                                        .sum();
                                long catGiaTriConLai = list.stream()
                                        .filter(ts -> ts.getGiaTriConLai() != null)
                                        .mapToLong(ts -> ts.getGiaTriConLai().longValue())
                                        .sum();

                                for (int c = 0; c < srcRow10.getLastCellNum(); c++) {
                                    Cell srcCell = srcRow10.getCell(c);
                                    if (srcCell != null) {
                                        Cell destCell = catHeaderRow.createCell(c);
                                        destCell.setCellStyle(srcCell.getCellStyle());
                                        if (c == 1) destCell.setCellValue(catName);
                                        else if (c == 8) setNumericValue(destCell, (double) catNguyenGia);
                                        else if (c == 9) setNumericValue(destCell, (double) catGiaTriConLai);
                                    }
                                }
                                destRowIdx++;

                                // Details
                                for (TsQl ts : list) {
                                    Row detailRow = destSheet.createRow(destRowIdx);
                                    detailRow.setHeight(srcRow11.getHeight());

                                    long val = ts.getNguyenGia() != null ? ts.getNguyenGia().longValue() : 0L;
                                    long gTriConLai = ts.getGiaTriConLai() != null ? ts.getGiaTriConLai().longValue() : 0L;
                                    String unitName = ts.getDonViTinh() != null ? ts.getDonViTinh() : "";
                                    int pYear = ts.getNamXayDung() != null ? ts.getNamXayDung() : reportYear;
                                    int pYearSuDung = ts.getNamSuDung() != null ? ts.getNamSuDung() : pYear;
                                    String tinhTrang = ts.getTinhTrang() != null ? ts.getTinhTrang() : "";
                                    String ghiChu = ts.getGhiChu() != null ? ts.getGhiChu() : "";
                                    double dienTichDat = ts.getDienTichDat() != null ? ts.getDienTichDat().doubleValue() : 0.0;
                                    double sanSuDung = ts.getSanSuDung() != null ? ts.getSanSuDung().doubleValue() : 0.0;

                                    for (int c = 0; c < srcRow11.getLastCellNum(); c++) {
                                        Cell srcCell = srcRow11.getCell(c);
                                        if (srcCell != null) {
                                            Cell destCell = detailRow.createCell(c);
                                            destCell.setCellStyle(srcCell.getCellStyle());
                                            switch (c) {
                                                case 0: destCell.setCellValue(overallIdx); break;
                                                case 1: destCell.setCellValue(ts.getTsTen() != null ? ts.getTsTen() : ""); break;
                                                case 2: destCell.setCellValue(unitName); break;
                                                case 3: destCell.setCellValue(ts.getSoLuong() != null ? ts.getSoLuong().doubleValue() : 1.0); break;
                                                case 4: destCell.setCellValue(pYear); break;
                                                case 5: destCell.setCellValue(pYearSuDung); break;
                                                case 6: destCell.setCellValue(dienTichDat); break;
                                                case 7: destCell.setCellValue(sanSuDung); break;
                                                case 8: destCell.setCellValue((double) val); break;
                                                case 9: destCell.setCellValue((double) gTriConLai); break;
                                                case 10: destCell.setCellValue(tinhTrang); break;
                                                case 11: destCell.setCellValue(ghiChu); break;
                                                default: break;
                                            }
                                        }
                                    }
                                    overallIdx++;
                                    destRowIdx++;
                                }
                            }
                        } else if (r > 11) {
                            // Copy Footers
                            Row destRow = destSheet.createRow(r + offset);
                            destRow.setHeight(srcRow.getHeight());
                            for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                                Cell srcCell = srcRow.getCell(c);
                                if (srcCell != null) {
                                    Cell destCell = destRow.createCell(c);
                                    copyCell(srcCell, destCell, replacements);
                                }
                            }
                        }
                    }
                } else {
                    // 2. Fallback: existing GIS PointObject logic
                    List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPointsForF143(targetUnitId,
                            reportYear, request.getBcNoiDung());
                    Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> categoryNames = getCategoryNamesMap();

                    Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, List<com.hanghai.kchtg.gis.point.entity.PointObject>> groupedPoints = new LinkedHashMap<>();
                    for (com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type : categoryNames.keySet()) {
                        groupedPoints.put(type, new ArrayList<>());
                    }
                    for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
                        com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type = p.getObjectType();
                        if (type == null) type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;
                        groupedPoints.computeIfAbsent(type, k -> new ArrayList<>()).add(p);
                    }

                    totalCategoryRows = groupedPoints.size();
                    totalDetailRows = points.size();
                    offset = (totalCategoryRows + totalDetailRows) - 2;
                    totalNguyenGiaExport = 0; // no real asset value data in V2 entities
                    cLaiDauNamExport = 0;
                    destRowIdx = 0;

                    for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {
                        Row srcRow = srcSheet.getRow(r);
                        if (srcRow == null) continue;

                        if (r < 10) {
                            Row destRow = destSheet.createRow(r);
                            destRow.setHeight(srcRow.getHeight());
                            for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                                Cell srcCell = srcRow.getCell(c);
                                if (srcCell != null) {
                                    Cell destCell = destRow.createCell(c);
                                    copyCell(srcCell, destCell, replacements);
                                    if (r == 9) {
                                        if (c == 8) setNumericValue(destCell, (double) totalNguyenGiaExport);
                                        else if (c == 9) setNumericValue(destCell, (double) cLaiDauNamExport);
                                    }
                                }
                            }
                            destRowIdx = r + 1;
                        } else if (r == 10) {
                            // Dynamic rendering of Categories and Details (GIS fallback)
                            Row srcRow10 = srcSheet.getRow(10);
                            Row srcRow11 = srcSheet.getRow(11);

                            for (var entry : groupedPoints.entrySet()) {
                                List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();
                                int overallIdx = 1;
                                String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());

                                Row catHeaderRow = destSheet.createRow(destRowIdx);
                                catHeaderRow.setHeight(srcRow10.getHeight());

                                long catNguyenGia = 0;
                                long catGiaTriConLai = 0;

                                for (int c = 0; c < srcRow10.getLastCellNum(); c++) {
                                    Cell srcCell = srcRow10.getCell(c);
                                    if (srcCell != null) {
                                        Cell destCell = catHeaderRow.createCell(c);
                                        destCell.setCellStyle(srcCell.getCellStyle());
                                        if (c == 1) destCell.setCellValue(catName);
                                        else if (c == 8) setNumericValue(destCell, (double) catNguyenGia);
                                        else if (c == 9) setNumericValue(destCell, (double) catGiaTriConLai);
                                    }
                                }
                                destRowIdx++;

                                for (com.hanghai.kchtg.gis.point.entity.PointObject p : list) {
                                    Row detailRow = destSheet.createRow(destRowIdx);
                                    detailRow.setHeight(srcRow11.getHeight());

                                    long val = 0;
                                    long gTriConLai = 0;
                                    String unitName = getPointAssetUnit(p);
                                    int pYear = p.getCreatedAt() != null ? p.getCreatedAt().getYear() : reportYear;

                                    for (int c = 0; c < srcRow11.getLastCellNum(); c++) {
                                        Cell srcCell = srcRow11.getCell(c);
                                        if (srcCell != null) {
                                            Cell destCell = detailRow.createCell(c);
                                            destCell.setCellStyle(srcCell.getCellStyle());
                                            switch (c) {
                                                case 0: destCell.setCellValue(overallIdx); break;
                                                case 1: destCell.setCellValue(p.getName() != null ? p.getName() : ""); break;
                                                case 2: destCell.setCellValue(unitName); break;
                                                case 3: destCell.setCellValue(1.0); break;
                                                case 4: case 5: destCell.setCellValue(pYear); break;
                                                case 6: case 7: destCell.setCellValue(0.0); break;
                                                case 8: destCell.setCellValue((double) val); break;
                                                case 9: destCell.setCellValue((double) gTriConLai); break;
                                                case 10: destCell.setCellValue(""); break;
                                                case 11: destCell.setCellValue(""); break;
                                                default: break;
                                            }
                                        }
                                    }
                                    overallIdx++;
                                    destRowIdx++;
                                }
                            }
                        } else if (r > 11) {
                            Row destRow = destSheet.createRow(r + offset);
                            destRow.setHeight(srcRow.getHeight());
                            for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                                Cell srcCell = srcRow.getCell(c);
                                if (srcCell != null) {
                                    Cell destCell = destRow.createCell(c);
                                    copyCell(srcCell, destCell, replacements);
                                }
                            }
                        }
                    }
                }

                copyMergedRegions(srcSheet, destSheet, false, 10, offset);

                boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());

                if (!isExcel) {
                    applyStaticRemergeAndOverflowMerge(destSheet, false, 10,
                            10 + totalCategoryRows + totalDetailRows - 1);
                }

                finalizeWorkbookSheet(workbook);

                return outputWorkbook(workbook, destSheet, isExcel);
            }
        }
    }

    private byte[] exportF144Report(ReportPreviewRequest request, String pathTemplate) throws Exception {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {
            if (is == null)
                throw new RuntimeException("Template file not found: " + pathTemplate);

            try (Workbook workbook = WorkbookFactory.create(is)) {
                Sheet srcSheet = workbook.getSheetAt(0);
                Sheet destSheet = workbook.createSheet("ReportSheet");

                copyPageSetup(srcSheet, destSheet);

                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear()
                        : LocalDate.now().getYear();
                Map<String, String> replacements = buildReplacements(request, reportYear);

                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId,
                        reportYear);
                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> categoryNames = getCategoryNamesMap();

                // Group points by ObjectType

                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, List<com.hanghai.kchtg.gis.point.entity.PointObject>> groupedPoints = new LinkedHashMap<>();

                for (com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type : categoryNames.keySet()) {
                    groupedPoints.put(type, new ArrayList<>());
                }

                for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
                    com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type = p.getObjectType();

                    if (type == null)
                        type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;

                    groupedPoints.computeIfAbsent(type, k -> new ArrayList<>()).add(p);
                }

                int totalCategoryRows = groupedPoints.size();
                int totalDetailRows = points.size();
                int offset = (totalCategoryRows + totalDetailRows) - 2;
                long totalNguyenGia = 0;

                for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
                    totalNguyenGia += getPointAssetValue(p);
                }

                long cLaiDauNam = (long) (totalNguyenGia * 0.8);
                int destRowIdx = 0;

                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {
                    Row srcRow = srcSheet.getRow(r);

                    if (srcRow == null)
                        continue;

                    if (r < 9) {
                        // Copy Row 0 to 8 (Header & Tổng cộng)

                        Row destRow = destSheet.createRow(r);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);

                                if (r == 8) {
                                    if (c == 8)
                                        setNumericValue(destCell, (double) totalNguyenGia);
                                    else if (c == 9)
                                        setNumericValue(destCell, (double) cLaiDauNam);
                                }
                            }
                        }

                        destRowIdx = r + 1;
                    } else if (r == 9) {
                        // Dynamic rendering of Categories and Details

                        Row srcRow9 = srcSheet.getRow(9);
                        Row srcRow10 = srcSheet.getRow(10);

                        for (var entry : groupedPoints.entrySet()) {
                            List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();
                            int overallIdx = 1;
                            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());

                            // Category Header Row

                            Row catHeaderRow = destSheet.createRow(destRowIdx);

                            catHeaderRow.setHeight(srcRow9.getHeight());

                            long catNguyenGia = 0;

                            for (com.hanghai.kchtg.gis.point.entity.PointObject p : list) {
                                catNguyenGia += getPointAssetValue(p);
                            }

                            long catGiaTriConLai = (long) (catNguyenGia * 0.8);

                            for (int c = 0; c < srcRow9.getLastCellNum(); c++) {
                                Cell srcCell = srcRow9.getCell(c);

                                if (srcCell != null) {
                                    Cell destCell = catHeaderRow.createCell(c);

                                    destCell.setCellStyle(srcCell.getCellStyle());

                                    if (c == 1)
                                        destCell.setCellValue(catName);
                                    else if (c == 8)
                                        setNumericValue(destCell, (double) catNguyenGia);
                                    else if (c == 9)
                                        setNumericValue(destCell, (double) catGiaTriConLai);
                                }
                            }

                            destRowIdx++;

                            // Details

                            for (com.hanghai.kchtg.gis.point.entity.PointObject p : list) {
                                Row detailRow = destSheet.createRow(destRowIdx);

                                detailRow.setHeight(srcRow10.getHeight());

                                long val = getPointAssetValue(p);
                                long gTriConLai = (long) (val * 0.8);
                                String unitName = getPointAssetUnit(p);
                                int pYear = p.getCreatedAt() != null ? p.getCreatedAt().getYear() : reportYear;

                                for (int c = 0; c < srcRow10.getLastCellNum(); c++) {
                                    Cell srcCell = srcRow10.getCell(c);

                                    if (srcCell != null) {
                                        Cell destCell = detailRow.createCell(c);

                                        destCell.setCellStyle(srcCell.getCellStyle());

                                        switch (c) {
                                            case 0:
                                                destCell.setCellValue((double) overallIdx);
                                                break;

                                            case 1:
                                                destCell.setCellValue(p.getName() != null ? p.getName() : "");
                                                break;

                                            case 2:
                                                destCell.setCellValue(unitName);
                                                break;

                                            case 3:
                                                destCell.setCellValue(1.0);
                                                break;

                                            case 4:
                                                destCell.setCellValue((double) pYear);
                                                break;

                                            case 5:
                                                destCell.setCellValue((double) pYear);
                                                break;

                                            case 6:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 7:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 8:
                                                destCell.setCellValue((double) val);
                                                break;

                                            case 9:
                                                destCell.setCellValue((double) gTriConLai);
                                                break;

                                            case 10:
                                                destCell.setCellValue("Đang hoạt động tốt");
                                                break;

                                            case 11:
                                                destCell.setCellValue("");
                                                break;

                                            default:
                                                break;
                                        }
                                    }
                                }

                                overallIdx++;

                                destRowIdx++;
                            }
                        }
                    } else if (r > 10) {
                        // Copy Footers

                        Row destRow = destSheet.createRow(r + offset);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);
                            }
                        }
                    }
                }

                copyMergedRegions(srcSheet, destSheet, false, 9, offset);

                boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());

                if (!isExcel) {
                    applyStaticRemergeAndOverflowMerge(destSheet, false, 9,
                            9 + totalCategoryRows + totalDetailRows - 1);
                }

                finalizeWorkbookSheet(workbook);

                return outputWorkbook(workbook, destSheet, isExcel);
            }
        }
    }

    private byte[] exportF145Report(ReportPreviewRequest request, String pathTemplate) throws Exception {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {
            if (is == null)
                throw new RuntimeException("Template file not found: " + pathTemplate);

            try (Workbook workbook = WorkbookFactory.create(is)) {
                Sheet srcSheet = workbook.getSheetAt(0);
                Sheet destSheet = workbook.createSheet("ReportSheet");

                copyPageSetup(srcSheet, destSheet);

                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear()
                        : LocalDate.now().getYear();
                Map<String, String> replacements = buildReplacements(request, reportYear);

                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId,
                        reportYear);
                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> categoryNames = getCategoryNamesMap();

                // Group points by ObjectType

                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, List<com.hanghai.kchtg.gis.point.entity.PointObject>> groupedPoints = new LinkedHashMap<>();

                for (com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type : categoryNames.keySet()) {
                    groupedPoints.put(type, new ArrayList<>());
                }

                for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
                    com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type = p.getObjectType();

                    if (type == null)
                        type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;

                    groupedPoints.computeIfAbsent(type, k -> new ArrayList<>()).add(p);
                }

                int totalCategoryRows = groupedPoints.size();
                int totalDetailRows = points.size();
                int offset = (totalCategoryRows + totalDetailRows) - 2;
                long totalNguyenGia = 0;

                for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
                    totalNguyenGia += getPointAssetValue(p);
                }

                long cLaiDauNam = (long) (totalNguyenGia * 0.8);
                int destRowIdx = 0;

                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {
                    Row srcRow = srcSheet.getRow(r);

                    if (srcRow == null)
                        continue;

                    if (r < 8) {
                        // Copy Row 0 to 7 (Header & labels)

                        Row destRow = destSheet.createRow(r);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                if (r == 4) {
                                    if (c == 0) {
                                        Cell templateCell = srcRow.getCell(6);

                                        copyCell(templateCell, destCell, replacements);

                                        CellStyle centerStyle = destSheet.getWorkbook().createCellStyle();

                                        if (templateCell != null && templateCell.getCellStyle() != null) {
                                            centerStyle.cloneStyleFrom(templateCell.getCellStyle());
                                        }

                                        centerStyle
                                                .setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
                                        destCell.setCellStyle(centerStyle);
                                    } else if (c == 6) {
                                        // Skip copying to G5
                                    } else {
                                        copyCell(srcCell, destCell, replacements);
                                    }
                                } else {
                                    copyCell(srcCell, destCell, replacements);
                                }
                            }
                        }

                        destRowIdx = r + 1;
                    } else if (r == 8) {
                        // Copy Row 8 (Tổng cộng)

                        Row destRow = destSheet.createRow(r);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);

                                if (c == 8)
                                    setNumericValue(destCell, (double) totalNguyenGia);
                                else if (c == 9)
                                    setNumericValue(destCell, (double) cLaiDauNam);
                                else if (c == 12)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 13)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 14)
                                    setNumericValue(destCell, 0.0);
                            }
                        }

                        destRowIdx = r + 1;
                    } else if (r == 9) {
                        // Dynamic rendering of Categories and Details

                        Row srcRow9 = srcSheet.getRow(9);
                        Row srcRow10 = srcSheet.getRow(10);

                        for (var entry : groupedPoints.entrySet()) {
                            List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();
                            int overallIdx = 1;
                            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());

                            // Category Header Row

                            Row catHeaderRow = destSheet.createRow(destRowIdx);

                            catHeaderRow.setHeight(srcRow9.getHeight());

                            long catNguyenGia = 0;

                            for (com.hanghai.kchtg.gis.point.entity.PointObject p : list) {
                                catNguyenGia += getPointAssetValue(p);
                            }

                            long catGiaTriConLai = (long) (catNguyenGia * 0.8);

                            for (int c = 0; c < srcRow9.getLastCellNum(); c++) {
                                Cell srcCell = srcRow9.getCell(c);

                                if (srcCell != null) {
                                    Cell destCell = catHeaderRow.createCell(c);

                                    destCell.setCellStyle(srcCell.getCellStyle());

                                    if (c == 1)
                                        destCell.setCellValue(catName);
                                    else if (c == 8)
                                        setNumericValue(destCell, (double) catNguyenGia);
                                    else if (c == 9)
                                        setNumericValue(destCell, (double) catGiaTriConLai);
                                    else if (c == 12)
                                        setNumericValue(destCell, 0.0);
                                    else if (c == 13)
                                        setNumericValue(destCell, 0.0);
                                    else if (c == 14)
                                        setNumericValue(destCell, 0.0);
                                }
                            }

                            destRowIdx++;

                            // Details

                            for (com.hanghai.kchtg.gis.point.entity.PointObject p : list) {
                                Row detailRow = destSheet.createRow(destRowIdx);

                                detailRow.setHeight(srcRow10.getHeight());

                                long val = getPointAssetValue(p);
                                long gTriConLai = (long) (val * 0.8);
                                String unitName = getPointAssetUnit(p);
                                int pYear = p.getCreatedAt() != null ? p.getCreatedAt().getYear() : reportYear;

                                for (int c = 0; c < srcRow10.getLastCellNum(); c++) {
                                    Cell srcCell = srcRow10.getCell(c);

                                    if (srcCell != null) {
                                        Cell destCell = detailRow.createCell(c);

                                        destCell.setCellStyle(srcCell.getCellStyle());

                                        switch (c) {
                                            case 0:
                                                destCell.setCellValue((double) overallIdx);
                                                break;

                                            case 1:
                                                destCell.setCellValue(p.getName() != null ? p.getName() : "");
                                                break;

                                            case 2:
                                                destCell.setCellValue(unitName);
                                                break;

                                            case 3:
                                                destCell.setCellValue(1.0);
                                                break;

                                            case 4:
                                                destCell.setCellValue((double) pYear);
                                                break;

                                            case 5:
                                                destCell.setCellValue((double) pYear);
                                                break;

                                            case 6:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 7:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 8:
                                                destCell.setCellValue((double) val);
                                                break;

                                            case 9:
                                                destCell.setCellValue((double) gTriConLai);
                                                break;

                                            case 10:
                                                destCell.setCellValue("Đang hoạt động tốt");
                                                break;

                                            case 11:
                                                destCell.setCellValue("Thu hồi");
                                                break;

                                            case 12:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 13:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 14:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 15:
                                                destCell.setCellValue("");
                                                break;

                                            default:
                                                break;
                                        }
                                    }
                                }

                                overallIdx++;

                                destRowIdx++;
                            }
                        }
                    } else if (r > 10) {
                        // Copy Footers

                        Row destRow = destSheet.createRow(r + offset);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);
                            }
                        }
                    }
                }

                copyMergedRegions(srcSheet, destSheet, false, 9, offset);

                boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());

                if (!isExcel) {
                    applyStaticRemergeAndOverflowMerge(destSheet, false, 9,
                            9 + totalCategoryRows + totalDetailRows - 1);
                }

                finalizeWorkbookSheet(workbook);

                return outputWorkbook(workbook, destSheet, isExcel);
            }
        }
    }

    private byte[] exportF146Report(ReportPreviewRequest request, String pathTemplate) throws Exception {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {
            if (is == null)
                throw new RuntimeException("Template file not found: " + pathTemplate);

            try (Workbook workbook = WorkbookFactory.create(is)) {
                Sheet srcSheet = workbook.getSheetAt(0);
                Sheet destSheet = workbook.createSheet("ReportSheet");

                copyPageSetup(srcSheet, destSheet);

                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear()
                        : LocalDate.now().getYear();
                Map<String, String> replacements = buildReplacements(request, reportYear);

                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId,
                        reportYear);
                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> categoryNames = getCategoryNamesMap();

                // Distribute points to A, B, C blocks

                List<com.hanghai.kchtg.gis.point.entity.PointObject> pointsA = new ArrayList<>();
                List<com.hanghai.kchtg.gis.point.entity.PointObject> pointsB = new ArrayList<>();
                List<com.hanghai.kchtg.gis.point.entity.PointObject> pointsC = new ArrayList<>();

                for (int i = 0; i < points.size(); i++) {
                    var p = points.get(i);

                    if (i % 3 == 0)
                        pointsA.add(p);
                    else if (i % 3 == 1)
                        pointsB.add(p);
                    else
                        pointsC.add(p);
                }

                // Group points by ObjectType for each block

                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, List<com.hanghai.kchtg.gis.point.entity.PointObject>> groupedA = new LinkedHashMap<>();

                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, List<com.hanghai.kchtg.gis.point.entity.PointObject>> groupedB = new LinkedHashMap<>();

                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, List<com.hanghai.kchtg.gis.point.entity.PointObject>> groupedC = new LinkedHashMap<>();

                for (com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type : categoryNames.keySet()) {
                    groupedA.put(type, new ArrayList<>());
                    groupedB.put(type, new ArrayList<>());
                    groupedC.put(type, new ArrayList<>());
                }

                for (var p : pointsA) {
                    var type = p.getObjectType();

                    if (type == null)
                        type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;

                    groupedA.computeIfAbsent(type, k -> new ArrayList<>()).add(p);
                }

                for (var p : pointsB) {
                    var type = p.getObjectType();

                    if (type == null)
                        type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;

                    groupedB.computeIfAbsent(type, k -> new ArrayList<>()).add(p);
                }

                for (var p : pointsC) {
                    var type = p.getObjectType();

                    if (type == null)
                        type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;

                    groupedC.computeIfAbsent(type, k -> new ArrayList<>()).add(p);
                }

                long totalNguyenGiaA = 0;

                for (var p : pointsA)
                    totalNguyenGiaA += getPointAssetValue(p);

                long cLaiDauNamA = (long) (totalNguyenGiaA * 0.8);
                long totalNguyenGiaB = 0;

                for (var p : pointsB)
                    totalNguyenGiaB += getPointAssetValue(p);

                long cLaiDauNamB = (long) (totalNguyenGiaB * 0.8);
                long totalNguyenGiaC = 0;

                for (var p : pointsC)
                    totalNguyenGiaC += getPointAssetValue(p);

                long cLaiDauNamC = (long) (totalNguyenGiaC * 0.8);
                long totalNguyenGia = totalNguyenGiaA + totalNguyenGiaB + totalNguyenGiaC;
                long cLaiDauNam = cLaiDauNamA + cLaiDauNamB + cLaiDauNamC;
                int destRowIdx = 0;
                Row srcRow9 = srcSheet.getRow(9);
                Row srcRow10 = srcSheet.getRow(10);
                Row srcRow12 = srcSheet.getRow(12);
                Row srcRow13 = srcSheet.getRow(13);
                Row srcRow15 = srcSheet.getRow(15);
                Row srcRow16 = srcSheet.getRow(16);

                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {
                    Row srcRow = srcSheet.getRow(r);

                    if (srcRow == null)
                        continue;

                    if (r < 7) {
                        // Copy Row 0 to 6 (Header & labels)

                        Row destRow = destSheet.createRow(r);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);
                            }
                        }

                        destRowIdx = r + 1;
                    } else if (r == 7) {
                        // Copy Row 7 (Tổng cộng)

                        Row destRow = destSheet.createRow(destRowIdx);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);

                                if (c == 6)
                                    setNumericValue(destCell, (double) totalNguyenGia);
                                else if (c == 7)
                                    setNumericValue(destCell, (double) cLaiDauNam);
                                else if (c == 10)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 11)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 12)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 13)
                                    setNumericValue(destCell, 0.0);
                            }
                        }

                        destRowIdx++;
                    } else if (r == 8) {
                        // Copy Row 8 (Block A Header)

                        Row destRow = destSheet.createRow(destRowIdx);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);

                                if (c == 6)
                                    setNumericValue(destCell, (double) totalNguyenGiaA);
                                else if (c == 7)
                                    setNumericValue(destCell, (double) cLaiDauNamA);
                                else if (c == 10)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 11)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 12)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 13)
                                    setNumericValue(destCell, 0.0);
                            }
                        }

                        destRowIdx++;

                        // Render Grouped A

                        for (var entry : groupedA.entrySet()) {
                            List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();

                            if (list.isEmpty())
                                continue;

                            int overallIdx = 1;
                            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());

                            // Category Row

                            Row catHeaderRow = destSheet.createRow(destRowIdx);

                            catHeaderRow.setHeight(srcRow9.getHeight());

                            long catNguyenGia = 0;

                            for (var p : list)
                                catNguyenGia += getPointAssetValue(p);

                            long catGiaTriConLai = (long) (catNguyenGia * 0.8);

                            for (int c = 0; c < srcRow9.getLastCellNum(); c++) {
                                Cell srcCell = srcRow9.getCell(c);

                                if (srcCell != null) {
                                    Cell destCell = catHeaderRow.createCell(c);

                                    destCell.setCellStyle(srcCell.getCellStyle());

                                    if (c == 1)
                                        destCell.setCellValue(catName);
                                    else if (c == 6)
                                        setNumericValue(destCell, (double) catNguyenGia);
                                    else if (c == 7)
                                        setNumericValue(destCell, (double) catGiaTriConLai);
                                    else if (c == 10)
                                        setNumericValue(destCell, 0.0);
                                    else if (c == 11)
                                        setNumericValue(destCell, 0.0);
                                    else if (c == 12)
                                        setNumericValue(destCell, 0.0);
                                    else if (c == 13)
                                        setNumericValue(destCell, 0.0);
                                }
                            }

                            destRowIdx++;

                            // Details

                            for (com.hanghai.kchtg.gis.point.entity.PointObject p : list) {
                                Row detailRow = destSheet.createRow(destRowIdx);

                                detailRow.setHeight(srcRow10.getHeight());

                                long val = getPointAssetValue(p);
                                long gTriConLai = (long) (val * 0.8);
                                String unitName = getPointAssetUnit(p);

                                for (int c = 0; c < srcRow10.getLastCellNum(); c++) {
                                    Cell srcCell = srcRow10.getCell(c);

                                    if (srcCell != null) {
                                        Cell destCell = detailRow.createCell(c);

                                        destCell.setCellStyle(srcCell.getCellStyle());

                                        switch (c) {
                                            case 0:
                                                destCell.setCellValue((double) overallIdx);
                                                break;

                                            case 1:
                                                destCell.setCellValue(p.getName() != null ? p.getName() : "");
                                                break;

                                            case 2:
                                                destCell.setCellValue(unitName);
                                                break;

                                            case 3:
                                                destCell.setCellValue(1.0);
                                                break;

                                            case 4:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 5:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 6:
                                                destCell.setCellValue((double) val);
                                                break;

                                            case 7:
                                                destCell.setCellValue((double) gTriConLai);
                                                break;

                                            case 8:
                                                destCell.setCellValue("10 năm");
                                                break;

                                            case 9:
                                                destCell.setCellValue("Cảng vụ Hàng hải");
                                                break;

                                            case 10:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 11:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 12:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 13:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 14:
                                                destCell.setCellValue("");
                                                break;

                                            default:
                                                break;
                                        }
                                    }
                                }

                                overallIdx++;

                                destRowIdx++;
                            }
                        }
                    } else if (r == 11) {
                        // Copy Row 11 (Block B Header)

                        Row destRow = destSheet.createRow(destRowIdx);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);

                                if (c == 6)
                                    setNumericValue(destCell, (double) totalNguyenGiaB);
                                else if (c == 7)
                                    setNumericValue(destCell, (double) cLaiDauNamB);
                                else if (c == 10)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 11)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 12)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 13)
                                    setNumericValue(destCell, 0.0);
                            }
                        }

                        destRowIdx++;

                        // Render Grouped B

                        for (var entry : groupedB.entrySet()) {
                            List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();

                            if (list.isEmpty())
                                continue;

                            int overallIdx = 1;
                            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());

                            // Category Row

                            Row catHeaderRow = destSheet.createRow(destRowIdx);

                            catHeaderRow.setHeight(srcRow12.getHeight());

                            long catNguyenGia = 0;

                            for (var p : list)
                                catNguyenGia += getPointAssetValue(p);

                            long catGiaTriConLai = (long) (catNguyenGia * 0.8);

                            for (int c = 0; c < srcRow12.getLastCellNum(); c++) {
                                Cell srcCell = srcRow12.getCell(c);

                                if (srcCell != null) {
                                    Cell destCell = catHeaderRow.createCell(c);

                                    destCell.setCellStyle(srcCell.getCellStyle());

                                    if (c == 1)
                                        destCell.setCellValue(catName);
                                    else if (c == 6)
                                        setNumericValue(destCell, (double) catNguyenGia);
                                    else if (c == 7)
                                        setNumericValue(destCell, (double) catGiaTriConLai);
                                    else if (c == 10)
                                        setNumericValue(destCell, 0.0);
                                    else if (c == 11)
                                        setNumericValue(destCell, 0.0);
                                    else if (c == 12)
                                        setNumericValue(destCell, 0.0);
                                    else if (c == 13)
                                        setNumericValue(destCell, 0.0);
                                }
                            }

                            destRowIdx++;

                            // Details

                            for (com.hanghai.kchtg.gis.point.entity.PointObject p : list) {
                                Row detailRow = destSheet.createRow(destRowIdx);

                                detailRow.setHeight(srcRow13.getHeight());

                                long val = getPointAssetValue(p);
                                long gTriConLai = (long) (val * 0.8);
                                String unitName = getPointAssetUnit(p);

                                for (int c = 0; c < srcRow13.getLastCellNum(); c++) {
                                    Cell srcCell = srcRow13.getCell(c);

                                    if (srcCell != null) {
                                        Cell destCell = detailRow.createCell(c);

                                        destCell.setCellStyle(srcCell.getCellStyle());

                                        switch (c) {
                                            case 0:
                                                destCell.setCellValue((double) overallIdx);
                                                break;

                                            case 1:
                                                destCell.setCellValue(p.getName() != null ? p.getName() : "");
                                                break;

                                            case 2:
                                                destCell.setCellValue(unitName);
                                                break;

                                            case 3:
                                                destCell.setCellValue(1.0);
                                                break;

                                            case 4:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 5:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 6:
                                                destCell.setCellValue((double) val);
                                                break;

                                            case 7:
                                                destCell.setCellValue((double) gTriConLai);
                                                break;

                                            case 8:
                                                destCell.setCellValue("10 năm");
                                                break;

                                            case 9:
                                                destCell.setCellValue("Cảng vụ Hàng hải");
                                                break;

                                            case 10:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 11:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 12:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 13:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 14:
                                                destCell.setCellValue("");
                                                break;

                                            default:
                                                break;
                                        }
                                    }
                                }

                                overallIdx++;

                                destRowIdx++;
                            }
                        }
                    } else if (r == 14) {
                        // Copy Row 14 (Block C Header)

                        Row destRow = destSheet.createRow(destRowIdx);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);

                                if (c == 6)
                                    setNumericValue(destCell, (double) totalNguyenGiaC);
                                else if (c == 7)
                                    setNumericValue(destCell, (double) cLaiDauNamC);
                                else if (c == 10)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 11)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 12)
                                    setNumericValue(destCell, 0.0);
                                else if (c == 13)
                                    setNumericValue(destCell, 0.0);
                            }
                        }

                        destRowIdx++;

                        // Render Grouped C

                        for (var entry : groupedC.entrySet()) {
                            List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();

                            if (list.isEmpty())
                                continue;

                            int overallIdx = 1;
                            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());

                            // Category Row

                            Row catHeaderRow = destSheet.createRow(destRowIdx);

                            catHeaderRow.setHeight(srcRow15.getHeight());

                            long catNguyenGia = 0;

                            for (var p : list)
                                catNguyenGia += getPointAssetValue(p);

                            long catGiaTriConLai = (long) (catNguyenGia * 0.8);

                            for (int c = 0; c < srcRow15.getLastCellNum(); c++) {
                                Cell srcCell = srcRow15.getCell(c);

                                if (srcCell != null) {
                                    Cell destCell = catHeaderRow.createCell(c);

                                    destCell.setCellStyle(srcCell.getCellStyle());

                                    if (c == 1)
                                        destCell.setCellValue(catName);
                                    else if (c == 6)
                                        setNumericValue(destCell, (double) catNguyenGia);
                                    else if (c == 7)
                                        setNumericValue(destCell, (double) catGiaTriConLai);
                                    else if (c == 10)
                                        setNumericValue(destCell, 0.0);
                                    else if (c == 11)
                                        setNumericValue(destCell, 0.0);
                                    else if (c == 12)
                                        setNumericValue(destCell, 0.0);
                                    else if (c == 13)
                                        setNumericValue(destCell, 0.0);
                                }
                            }

                            destRowIdx++;

                            // Details

                            for (com.hanghai.kchtg.gis.point.entity.PointObject p : list) {
                                Row detailRow = destSheet.createRow(destRowIdx);

                                detailRow.setHeight(srcRow16.getHeight());

                                long val = getPointAssetValue(p);
                                long gTriConLai = (long) (val * 0.8);
                                String unitName = getPointAssetUnit(p);

                                for (int c = 0; c < srcRow16.getLastCellNum(); c++) {
                                    Cell srcCell = srcRow16.getCell(c);

                                    if (srcCell != null) {
                                        Cell destCell = detailRow.createCell(c);

                                        destCell.setCellStyle(srcCell.getCellStyle());

                                        switch (c) {
                                            case 0:
                                                destCell.setCellValue((double) overallIdx);
                                                break;

                                            case 1:
                                                destCell.setCellValue(p.getName() != null ? p.getName() : "");
                                                break;

                                            case 2:
                                                destCell.setCellValue(unitName);
                                                break;

                                            case 3:
                                                destCell.setCellValue(1.0);
                                                break;

                                            case 4:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 5:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 6:
                                                destCell.setCellValue((double) val);
                                                break;

                                            case 7:
                                                destCell.setCellValue((double) gTriConLai);
                                                break;

                                            case 8:
                                                destCell.setCellValue("10 năm");
                                                break;

                                            case 9:
                                                destCell.setCellValue("Cảng vụ Hàng hải");
                                                break;

                                            case 10:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 11:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 12:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 13:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 14:
                                                destCell.setCellValue("");
                                                break;

                                            default:
                                                break;
                                        }
                                    }
                                }

                                overallIdx++;

                                destRowIdx++;
                            }
                        }
                    } else if (r > 16) {
                        // Copy Footers

                        int offset = destRowIdx - 17;
                        Row destRow = destSheet.createRow(r + offset);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);
                            }
                        }
                    }
                }

                int totalCategoryRows = 0;

                for (var entry : groupedA.entrySet())
                    if (!entry.getValue().isEmpty())
                        totalCategoryRows++;

                for (var entry : groupedB.entrySet())
                    if (!entry.getValue().isEmpty())
                        totalCategoryRows++;

                for (var entry : groupedC.entrySet())
                    if (!entry.getValue().isEmpty())
                        totalCategoryRows++;

                int totalDetailRows = points.size();
                int totalExpandedRows = 3 + totalCategoryRows + totalDetailRows;
                int offset = totalExpandedRows - 9;

                copyMergedRegions(srcSheet, destSheet, false, 8, offset);

                boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());

                if (!isExcel) {
                    applyStaticRemergeAndOverflowMerge(destSheet, false, 8, 8 + totalExpandedRows - 1);
                }

                finalizeWorkbookSheet(workbook);

                return outputWorkbook(workbook, destSheet, isExcel);
            }
        }
    }

    private byte[] exportF147Report(ReportPreviewRequest request, String pathTemplate) throws Exception {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {
            if (is == null)
                throw new RuntimeException("Template file not found: " + pathTemplate);

            try (Workbook workbook = WorkbookFactory.create(is)) {
                Sheet srcSheet = workbook.getSheetAt(0);
                Sheet destSheet = workbook.createSheet("ReportSheet");

                copyPageSetup(srcSheet, destSheet);

                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear()
                        : LocalDate.now().getYear();
                Map<String, String> replacements = buildReplacements(request, reportYear);

                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId,
                        reportYear);
                String htxl = request.getBcNoiDung();

                if (htxl != null && !htxl.isBlank()) {
                    List<com.hanghai.kchtg.gis.point.entity.PointObject> filtered = new ArrayList<>();
                    List<String> listHtxl = java.util.Arrays.asList(htxl.split(","));
                    int mod = 2;

                    if (listHtxl.contains("BAN"))
                        mod = 3;
                    else if (listHtxl.contains("THANH_LY"))
                        mod = 4;
                    else if (listHtxl.contains("DIEU_CHUYEN"))
                        mod = 5;

                    for (int i = 0; i < points.size(); i++) {
                        if (i % mod == 0) {
                            filtered.add(points.get(i));
                        }
                    }

                    points = filtered;
                }

                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> categoryNames = getCategoryNamesMap();

                // Group points by ObjectType

                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, List<com.hanghai.kchtg.gis.point.entity.PointObject>> groupedPoints = new LinkedHashMap<>();

                for (com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type : categoryNames.keySet()) {
                    groupedPoints.put(type, new ArrayList<>());
                }

                for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
                    com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type = p.getObjectType();

                    if (type == null)
                        type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;

                    groupedPoints.computeIfAbsent(type, k -> new ArrayList<>()).add(p);
                }

                int totalCategoryRows = 0;

                for (var entry : groupedPoints.entrySet()) {
                    if (!entry.getValue().isEmpty())
                        totalCategoryRows++;
                }

                int totalDetailRows = points.size();
                int totalExpandedRows = totalCategoryRows + totalDetailRows;
                int offset = totalExpandedRows - 2;
                long totalNguyenGia = 0;

                for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
                    totalNguyenGia += getPointAssetValue(p);
                }

                long cLaiDauNam = (long) (totalNguyenGia * 0.8);
                int destRowIdx = 0;
                Row srcRow10 = srcSheet.getRow(10);
                Row srcRow11 = srcSheet.getRow(11);

                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {
                    Row srcRow = srcSheet.getRow(r);

                    if (srcRow == null)
                        continue;

                    if (r < 9) {
                        // Copy Row 0 to 8 (Headers & labels)

                        Row destRow = destSheet.createRow(r);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);
                            }
                        }

                        destRowIdx = r + 1;
                    } else if (r == 9) {
                        // Copy Row 9 (Tổng cộng chung ở trên)

                        Row destRow = destSheet.createRow(destRowIdx);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);

                                if (c == 7)
                                    setNumericValue(destCell, (double) totalNguyenGia);
                                else if (c == 8)
                                    setNumericValue(destCell, (double) cLaiDauNam);
                            }
                        }

                        destRowIdx++;
                    } else if (r == 10) {
                        // Dynamic Categories & Details

                        for (var entry : groupedPoints.entrySet()) {
                            List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();

                            if (list.isEmpty())
                                continue;

                            int overallIdx = 1;
                            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());

                            // Category Row

                            Row catHeaderRow = destSheet.createRow(destRowIdx);

                            catHeaderRow.setHeight(srcRow10.getHeight());

                            long catNguyenGia = 0;

                            for (var p : list)
                                catNguyenGia += getPointAssetValue(p);

                            long catGiaTriConLai = (long) (catNguyenGia * 0.8);

                            for (int c = 0; c < srcRow10.getLastCellNum(); c++) {
                                Cell srcCell = srcRow10.getCell(c);

                                if (srcCell != null) {
                                    Cell destCell = catHeaderRow.createCell(c);

                                    destCell.setCellStyle(srcCell.getCellStyle());

                                    if (c == 1)
                                        destCell.setCellValue(catName);
                                    else if (c == 7)
                                        setNumericValue(destCell, (double) catNguyenGia);
                                    else if (c == 8)
                                        setNumericValue(destCell, (double) catGiaTriConLai);
                                }
                            }

                            destRowIdx++;

                            // Detail Rows

                            for (com.hanghai.kchtg.gis.point.entity.PointObject p : list) {
                                Row detailRow = destSheet.createRow(destRowIdx);

                                detailRow.setHeight(srcRow11.getHeight());

                                long val = getPointAssetValue(p);
                                long gTriConLai = (long) (val * 0.8);
                                int pYear = p.getCreatedAt() != null ? p.getCreatedAt().getYear() : reportYear;

                                for (int c = 0; c < srcRow11.getLastCellNum(); c++) {
                                    Cell srcCell = srcRow11.getCell(c);

                                    if (srcCell != null) {
                                        Cell destCell = detailRow.createCell(c);

                                        destCell.setCellStyle(srcCell.getCellStyle());

                                        switch (c) {
                                            case 0:
                                                destCell.setCellValue((double) overallIdx);
                                                break;

                                            case 1:
                                                destCell.setCellValue(p.getName() != null ? p.getName() : "");
                                                break;

                                            case 2:
                                                destCell.setCellValue("Cảng vụ Hàng hải");
                                                break;

                                            case 3:
                                                destCell.setCellValue((double) pYear);
                                                break;

                                            case 4:
                                                destCell.setCellValue("Đạt chuẩn kỹ thuật");
                                                break;

                                            case 5:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 6:
                                                destCell.setCellValue(0.0);
                                                break;

                                            case 7:
                                                destCell.setCellValue((double) val);
                                                break;

                                            case 8:
                                                destCell.setCellValue((double) gTriConLai);
                                                break;

                                            case 9:
                                                destCell.setCellValue("Bình thường");
                                                break;

                                            case 10:
                                                destCell.setCellValue(
                                                        "Hết hạn khai thác trực tiếp, chuyển hình thức xử lý");
                                                break;

                                            default:
                                                break;
                                        }
                                    }
                                }

                                overallIdx++;

                                destRowIdx++;
                            }
                        }
                    } else if (r > 11) {
                        // Copy Footers

                        Row destRow = destSheet.createRow(r + offset);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                copyCell(srcCell, destCell, replacements);

                                if (r == 12) {
                                    if (c == 7)
                                        setNumericValue(destCell, (double) totalNguyenGia);
                                    else if (c == 8)
                                        setNumericValue(destCell, (double) cLaiDauNam);
                                }
                            }
                        }
                    }
                }

                copyMergedRegions(srcSheet, destSheet, false, 10, offset);

                boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());

                if (!isExcel) {
                    applyStaticRemergeAndOverflowMerge(destSheet, false, 10, 10 + totalExpandedRows - 1);
                }

                finalizeWorkbookSheet(workbook);

                return outputWorkbook(workbook, destSheet, isExcel);
            }
        }
    }

    /**
     * Xuất báo cáo động thông thường (F-141, v.v.).
     */
    private byte[] exportDynamicReport(ReportPreviewRequest request, String pathTemplate) throws Exception {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {
            if (is == null)
                throw new RuntimeException("Template file not found: " + pathTemplate);

            try (Workbook workbook = WorkbookFactory.create(is)) {
                Sheet srcSheet = workbook.getSheetAt(0);
                Sheet destSheet = workbook.createSheet("ReportSheet");

                copyPageSetup(srcSheet, destSheet);

                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear()
                        : LocalDate.now().getYear();
                Map<String, String> replacements = buildReplacements(request, reportYear);

                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());
                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId,
                        reportYear);

                if ("F-148".equalsIgnoreCase(request.getReportCode())) {
                    // Custom hierarchical export for F-148 (BCKCHT_163)
                    // Hierarchy: Port → BenCang → Pier (same as getPreviewF148 + appendF148Hierarchy)

                    boolean isRoot = false;
                    if (targetUnitId != null) {
                        isRoot = orgUnitRepository.findById(targetUnitId)
                                .map(u -> "CUC_HHVT".equals(u.getCode()))
                                .orElse(false);
                    }

                    final boolean skipFilter = targetUnitId == null || isRoot;
                    final Integer filterNhom = request.getNhomCangBien();

                    // 1. Query Port as root — same as getPreviewF148
                    List<com.hanghai.kchtg.cangben.entity.Port> allPorts = cangBienRepository.findAll().stream()
                            .filter(cb -> skipFilter || targetUnitId.equals(cb.getOrgUnitId()))
                            .filter(cb -> cb.getCreatedAt() == null || cb.getCreatedAt().getYear() <= reportYear)
                            .filter(cb -> filterNhom == null || filterNhom.equals(cb.getPortGroup()))
                            .toList();

                    // 2. ALL ports go to I. CẢNG BIỂN; Section II is always rendered (with no data rows)
                    List<com.hanghai.kchtg.cangben.entity.Port> group1Ports = new ArrayList<>(allPorts);
                    List<com.hanghai.kchtg.cangben.entity.Port> group2Ports = new ArrayList<>();

                    Row portTemplateRow = srcSheet.getRow(10); // Port / section header template row
                    Row wharfTemplateRow = srcSheet.getRow(11); // Berth / wharf template row

                    // 3. Copy header rows 0-9 from template
                    for (int r = 0; r < 10; r++) {
                        Row srcRow = srcSheet.getRow(r);
                        if (srcRow == null)
                            continue;
                        Row destRow = destSheet.createRow(r);
                        destRow.setHeight(srcRow.getHeight());
                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);
                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);
                                copyCell(srcCell, destCell, replacements);
                            }
                        }
                    }

                    // 4. Write hierarchy content starting at row 10
                    int currentDestRow = 10;
                    int stt = 1;

                    // ── Section I: Cảng biển ──
                    if (!group1Ports.isEmpty()) {
                        // Section header row
                        Row sectionRow = destSheet.createRow(currentDestRow++);
                        sectionRow.setHeight(portTemplateRow.getHeight());
                        int numTemplateCols = portTemplateRow.getLastCellNum();
                        for (int c = 0; c < numTemplateCols; c++) {
                            Cell srcCell = portTemplateRow.getCell(c);
                            if (srcCell != null) {
                                Cell destCell = sectionRow.createCell(c);
                                destCell.setCellStyle(srcCell.getCellStyle());
                                if (c == 0) {
                                    destCell.setCellValue("I");
                                } else if (c == 1) {
                                    destCell.setCellValue("Cảng biển");
                                } else {
                                    destCell.setCellValue("");
                                }
                            }
                        }

                        // Port rows with hierarchy
                        for (com.hanghai.kchtg.cangben.entity.Port port : group1Ports) {
                            currentDestRow = writeF148PortHierarchyToSheet(destSheet, currentDestRow,
                                    portTemplateRow, wharfTemplateRow, port, stt, reportYear);
                            stt++;
                        }
                    }

                    // ── Section II: Cảng, bến thủy nội địa ── always shows even if empty
                    {
                        Row sectionRow = destSheet.createRow(currentDestRow++);
                        sectionRow.setHeight(portTemplateRow.getHeight());
                        int numTemplateCols = portTemplateRow.getLastCellNum();
                        for (int c = 0; c < numTemplateCols; c++) {
                            Cell srcCell = portTemplateRow.getCell(c);
                            if (srcCell != null) {
                                Cell destCell = sectionRow.createCell(c);
                                destCell.setCellStyle(srcCell.getCellStyle());
                                if (c == 0) {
                                    destCell.setCellValue("II");
                                } else if (c == 1) {
                                    destCell.setCellValue("Cảng, bến thủy nội địa");
                                } else {
                                    destCell.setCellValue("");
                                }
                            }
                        }

                        for (com.hanghai.kchtg.cangben.entity.Port port : group2Ports) {
                            currentDestRow = writeF148PortHierarchyToSheet(destSheet, currentDestRow,
                                    portTemplateRow, wharfTemplateRow, port, stt, reportYear);
                            stt++;
                        }
                    }

                    // Fallback if both groups empty
                    if (currentDestRow == 10) {
                        Row sectionRow = destSheet.createRow(currentDestRow++);
                        sectionRow.setHeight(portTemplateRow.getHeight());
                        int numTemplateCols = portTemplateRow.getLastCellNum();
                        for (int c = 0; c < numTemplateCols; c++) {
                            Cell srcCell = portTemplateRow.getCell(c);
                            if (srcCell != null) {
                                Cell destCell = sectionRow.createCell(c);
                                destCell.setCellStyle(srcCell.getCellStyle());
                                if (c == 0) {
                                    destCell.setCellValue("I");
                                } else if (c == 1) {
                                    destCell.setCellValue("Cảng biển");
                                } else {
                                    destCell.setCellValue("");
                                }
                            }
                        }
                    }

                    // 5. Calculate offset for footer rows and merged regions
                    int totalGeneratedRows = currentDestRow - 10;
                    int offset = totalGeneratedRows - 2; // template has 2 data rows (10, 11)

                    // 6. Copy footer rows (r > 11) with offset
                    for (int r = 12; r <= srcSheet.getLastRowNum(); r++) {
                        Row srcRow = srcSheet.getRow(r);
                        if (srcRow == null)
                            continue;

                        Row destRow = destSheet.createRow(r + offset);
                        destRow.setHeight(srcRow.getHeight());
                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);
                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);
                                copyCell(srcCell, destCell, replacements);
                            }
                        }
                    }

                    copyMergedRegions(srcSheet, destSheet, false, 10, offset);

                    boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());
                    if (!isExcel) {
                        applyStaticRemergeAndOverflowMerge(destSheet, false, 10, 10 + totalGeneratedRows - 1);
                    }

                    // Write "Tính đến ngày" to F7 if current year
                    if (reportYear == LocalDate.now().getYear()) {
                        Row r6 = destSheet.getRow(6);
                        if (r6 == null) r6 = destSheet.createRow(6);
                        Cell c = r6.getCell(5);
                        if (c == null) c = r6.createCell(5);
                        c.setCellValue("Tính đến ngày " + LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                        org.apache.poi.ss.usermodel.CellStyle style = destSheet.getWorkbook().createCellStyle();
                        org.apache.poi.ss.usermodel.Font font = destSheet.getWorkbook().createFont();
                        font.setFontName("Times New Roman");
                        font.setFontHeightInPoints((short) 12);
                        style.setFont(font);
                        style.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
                        style.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
                        c.setCellStyle(style);
                    }
                finalizeWorkbookSheet(workbook);

                return outputWorkbook(workbook, destSheet, isExcel);
                } else if ("F-149".equalsIgnoreCase(request.getReportCode())) {
                    // Custom hierarchical export for F-149 (BCKCHT_164) using real Port
                    // entities

                    boolean isRoot = false;

                    if (targetUnitId != null) {
                        isRoot = orgUnitRepository.findById(targetUnitId)
                                .map(u -> "CUC_HHVT".equals(u.getCode()))
                                .orElse(false);
                    }

                    final boolean skipFilter = targetUnitId == null || isRoot;

                    final Integer filterNhom = request.getNhomCangBien();

                    List<com.hanghai.kchtg.cangben.entity.Port> ports = cangBienRepository.findAll().stream()
                            .filter(cb -> skipFilter || targetUnitId.equals(cb.getOrgUnitId()))
                            .filter(cb -> cb.getCreatedAt() == null || cb.getCreatedAt().getYear() <= reportYear)
                            .filter(cb -> filterNhom == null || filterNhom.equals(cb.getPortGroup()))
                            .toList();

                    // Group ports by nhomPort (e.g. 1 -> Nhóm 1)

                    Map<String, List<Map<String, Object>>> groups = new LinkedHashMap<>();

                    // Create items list

                    List<Map<String, Object>> group1Items = new ArrayList<>();

                    List<Map<String, Object>> group2Items = new ArrayList<>();

                    List<Map<String, Object>> group3Items = new ArrayList<>();

                    List<Map<String, Object>> group4Items = new ArrayList<>();

                    List<Map<String, Object>> group5Items = new ArrayList<>();

                    int idx1 = 1, idx2 = 1, idx3 = 1, idx4 = 1, idx5 = 1;

                    for (com.hanghai.kchtg.cangben.entity.Port cb : ports) {
                        Map<String, Object> item = new HashMap<>();

                        item.put("tenPort", cb.getPortName());
                        item.put("diaDiemText", cb.getProvince() != null ? cb.getProvince() : "");

                        // Sum nangLuc from all BenCang children (BCKCHT_164 approach)
                        List<com.hanghai.kchtg.cangben.entity.Berth> children = benCangRepository.findByPortIdAndDeletedAtIsNull(cb.getId());
                        double capBaoCao = children.stream()
                                .filter(b -> b.getCurrentThroughput() != null)
                                .filter(b -> b.getOpeningAnnouncementDate() != null && b.getOpeningAnnouncementDate().getYear() == reportYear)
                                .mapToDouble(b -> b.getCurrentThroughput().doubleValue())
                                .sum();
                        double capNamTruoc = children.stream()
                                .filter(b -> b.getCurrentThroughput() != null)
                                .filter(b -> b.getOpeningAnnouncementDate() != null && b.getOpeningAnnouncementDate().getYear() == reportYear - 1)
                                .mapToDouble(b -> b.getCurrentThroughput().doubleValue())
                                .sum();

                        item.put("nangLucThongQuaCangNamTruoc", capNamTruoc);
                        item.put("nangLucThongQuaCangNamBaoCao", capBaoCao);
                        item.put("nangLucTangThem", capBaoCao - capNamTruoc);

                        int nhom = cb.getPortGroup() != null ? cb.getPortGroup() : 1;

                        if (nhom == 1) {
                            item.put("idx", idx1++);
                            group1Items.add(item);
                        } else if (nhom == 2) {
                            item.put("idx", idx2++);
                            group2Items.add(item);
                        } else if (nhom == 3) {
                            item.put("idx", idx3++);
                            group3Items.add(item);
                        } else if (nhom == 4) {
                            item.put("idx", idx4++);
                            group4Items.add(item);
                        } else {
                            item.put("idx", idx5++);
                            group5Items.add(item);
                        }
                    }

                    if (!group1Items.isEmpty())
                        groups.put("Nhóm 1", group1Items);

                    if (!group2Items.isEmpty())
                        groups.put("Nhóm 2", group2Items);

                    if (!group3Items.isEmpty())
                        groups.put("Nhóm 3", group3Items);

                    if (!group4Items.isEmpty())
                        groups.put("Nhóm 4", group4Items);

                    if (!group5Items.isEmpty())
                        groups.put("Nhóm 5", group5Items);

                    // Fallback to empty display if no groups

                    if (groups.isEmpty()) {
                        groups.put("Nhóm 1", new ArrayList<>());
                    }

                    int totalGeneratedRows = 0;

                    for (List<Map<String, Object>> gList : groups.values()) {
                        totalGeneratedRows += 1 + gList.size(); // 1 group header + items
                    }

                    int offset = totalGeneratedRows - 2; // Original template has 2 template rows (row 11 & row 12)

                    Row groupTemplateRow = srcSheet.getRow(10); // Row 11 in Excel (0-indexed 10)

                    Row itemTemplateRow = srcSheet.getRow(11); // Row 12 in Excel (0-indexed 11)

                    for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {
                        Row srcRow = srcSheet.getRow(r);

                        if (srcRow == null)
                            continue;

                        if (r < 10) {
                            Row destRow = destSheet.createRow(r);

                            destRow.setHeight(srcRow.getHeight());

                            for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                                Cell srcCell = srcRow.getCell(c);

                                if (srcCell != null) {
                                    Cell destCell = destRow.createCell(c);

                                    copyCell(srcCell, destCell, replacements);
                                }
                            }
                        } else if (r == 10 || r == 11) {
                            if (r == 11)
                                continue; // Handled inside index 10 processing

                            int currentDestRowIdx = 10;

                            for (Map.Entry<String, List<Map<String, Object>>> entry : groups.entrySet()) {
                                String groupKey = entry.getKey();
                                String groupNum = groupKey.split("\\.")[0];
                                String groupName = groupKey.substring(groupKey.indexOf(".") + 1).trim();

                                List<Map<String, Object>> groupItems = entry.getValue();

                                // Group Header Row

                                Row destRow = destSheet.createRow(currentDestRowIdx++);

                                destRow.setHeight(groupTemplateRow.getHeight());

                                for (int c = 0; c < groupTemplateRow.getLastCellNum(); c++) {
                                    Cell srcCell = groupTemplateRow.getCell(c);

                                    if (srcCell != null) {
                                        Cell destCell = destRow.createCell(c);

                                        destCell.setCellStyle(srcCell.getCellStyle());

                                        if (c == 0) {
                                            destCell.setCellValue("");
                                        } else if (c == 1) {
                                            destCell.setCellValue(groupName);
                                        } else {
                                            destCell.setCellValue("");
                                        }
                                    }
                                }

                                // Item Rows

                                for (Map<String, Object> item : groupItems) {
                                    Row destItemRow = destSheet.createRow(currentDestRowIdx++);

                                    destItemRow.setHeight(itemTemplateRow.getHeight());

                                    int idx = (Integer) item.get("idx");

                                    for (int c = 0; c < itemTemplateRow.getLastCellNum(); c++) {
                                        Cell srcCell = itemTemplateRow.getCell(c);

                                        if (srcCell != null) {
                                            Cell destCell = destItemRow.createCell(c);

                                            destCell.setCellStyle(srcCell.getCellStyle());

                                            if (srcCell.getCellType() == CellType.STRING) {
                                                String expr = srcCell.getStringCellValue();

                                                if (expr != null) {
                                                    if (expr.contains("idx+1") || expr.contains("idx + 1")
                                                            || expr.contains("index")) {
                                                        destCell.setCellValue(idx);

                                                        continue;
                                                    }

                                                    if (expr.contains("item.") || expr.contains("table.value")) {
                                                        Object val = resolveExpression(expr, item);

                                                        if (val != null) {
                                                            if (val instanceof Number) {
                                                                double d = ((Number) val).doubleValue();

                                                                destCell.setCellValue(d);

                                                                setNumericCellFormat(destCell, d);
                                                            } else {
                                                                destCell.setCellValue(val.toString());
                                                            }

                                                            continue;
                                                        }
                                                    }
                                                }
                                            }

                                            copyCell(srcCell, destCell, replacements);
                                        }
                                    }
                                }
                            }
                        } else {
                            Row destRow = destSheet.createRow(r + offset);

                            destRow.setHeight(srcRow.getHeight());

                            for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                                Cell srcCell = srcRow.getCell(c);

                                if (srcCell != null) {
                                    Cell destCell = destRow.createCell(c);

                                    copyCell(srcCell, destCell, replacements);
                                }
                            }
                        }
                    }

                    copyMergedRegions(srcSheet, destSheet, false, 10, offset);

                    boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());

                    if (!isExcel) {
                        applyStaticRemergeAndOverflowMerge(destSheet, false, 10, 10 + totalGeneratedRows - 1);
                    }

                finalizeWorkbookSheet(workbook);

                return outputWorkbook(workbook, destSheet, isExcel);
                }

                List<Map<String, Object>> arrResult = null;
                for (ReportHandler handler : reportHandlers) {
                    if (handler.supports(request.getReportCode())) {
                        arrResult = handler.getExportData(request, reportYear);
                        break;
                    }
                }
                if (arrResult == null) {
                    arrResult = buildDynamicResultList(points, request.getReportCode());
                }

                int N = arrResult.size();
                int offset = Math.max(0, N - 1);

                // Dynamically detect header template row and detail template row to merge them

                int headerRowIdx = -1;
                int detailRowIdx = -1;

                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {
                    Row srcRow = srcSheet.getRow(r);

                    if (srcRow == null)
                        continue;

                    for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                        Cell cell = srcRow.getCell(c);

                        if (cell != null && cell.getCellType() == CellType.STRING) {
                            String val = cell.getStringCellValue();

                            if (val != null) {
                                if (val.contains("table.value") || val.contains("entry.value")
                                        || val.contains("table.key") || val.contains("entry.key")) {
                                    if (headerRowIdx == -1)
                                        headerRowIdx = r;
                                }

                                if (val.contains("item.")) {
                                    if (detailRowIdx == -1)
                                        detailRowIdx = r;
                                }
                            }
                        }
                    }
                }

                if (headerRowIdx != -1 && detailRowIdx != -1 && headerRowIdx != detailRowIdx) {
                    Row headerRow = srcSheet.getRow(headerRowIdx);
                    Row detailRow = srcSheet.getRow(detailRowIdx);

                    for (int c = 0; c < detailRow.getLastCellNum(); c++) {
                        Cell detailCell = detailRow.getCell(c);

                        if (detailCell != null) {
                            Cell headerCell = headerRow.getCell(c);

                            if (headerCell == null) {
                                headerCell = headerRow.createCell(c);

                                copyCell(detailCell, headerCell, new HashMap<>());
                            } else {
                                boolean isFormula = headerCell.getCellType() == CellType.FORMULA;
                                boolean isBlank = headerCell.getCellType() == CellType.BLANK;
                                boolean isStringEmpty = false;

                                if (headerCell.getCellType() == CellType.STRING) {
                                    String v = headerCell.getStringCellValue();

                                    if (v == null || v.trim().isEmpty()) {
                                        isStringEmpty = true;
                                    }
                                }

                                if (isFormula || isBlank || isStringEmpty) {
                                    headerCell.setCellType(CellType.BLANK);

                                    copyCell(detailCell, headerCell, new HashMap<>());
                                }
                            }
                        }
                    }
                }

                // Dynamically detect template row index (detect headerRow as template if
                // merged, fallback to detailRow)

                int templateRowIdx = -1;

                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {
                    Row srcRow = srcSheet.getRow(r);

                    if (srcRow == null)
                        continue;

                    for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                        Cell cell = srcRow.getCell(c);

                        if (cell != null && cell.getCellType() == CellType.STRING) {
                            String val = cell.getStringCellValue();

                            if (val != null && val.contains("item.")) {
                                templateRowIdx = r;

                                break;
                            }
                        }
                    }

                    if (templateRowIdx != -1)
                        break;
                }

                if (templateRowIdx == -1) {
                    templateRowIdx = 9; // fallback
                }

                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {
                    if (detailRowIdx != -1 && r == detailRowIdx && detailRowIdx != templateRowIdx) {
                        continue; // skip the redundant detail row
                    }

                    Row srcRow = srcSheet.getRow(r);

                    if (srcRow == null)
                        continue;

                    if (r < templateRowIdx) {
                        Row destRow = destSheet.createRow(r);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                destCell.setCellStyle(srcCell.getCellStyle());

                                boolean processed = false;

                                if (srcCell.getCellType() == CellType.STRING) {
                                    String expr = srcCell.getStringCellValue();

if (expr != null && (expr.contains("table.")
                                        || expr.contains("this.getCateOtherText") || expr.contains("item."))) {
                                        Map<String, Object> item = arrResult.isEmpty() ? new HashMap<>()
                                                : arrResult.get(0);

                                        Object val = resolveExpression(expr, item);

                                        if (val != null) {
                                            if (val instanceof Number) {
                                                double d = ((Number) val).doubleValue();
                                                destCell.setCellValue(d);
                                                setNumericCellFormat(destCell, d);
                                            } else {
                                                destCell.setCellValue(val.toString());
                                            }

                                            processed = true;
                                        }
                                    }
                                }

                                if (!processed) {
                                    copyCell(srcCell, destCell, replacements);
                                }
                            }
                        }
                    } else if (r == templateRowIdx) {
                        for (int idx = 0; idx < N; idx++) {
                            Row destRow = destSheet.createRow(templateRowIdx + idx);

                            destRow.setHeight(srcRow.getHeight());

                            Map<String, Object> item = arrResult.get(idx);

                            for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                                Cell srcCell = srcRow.getCell(c);

                                if (srcCell != null) {
                                    Cell destCell = destRow.createCell(c);

                                    destCell.setCellStyle(srcCell.getCellStyle());

                                    if (srcCell.getCellType() == CellType.STRING) {
                                        String expr = srcCell.getStringCellValue();

                                        if (expr != null) {
                                            if (expr.contains("idx+1") || expr.contains("idx + 1")
                                                    || expr.contains("index")) {
                                                destCell.setCellValue(idx + 1);

                                                continue;
                                            }

                                            if (expr.contains("item.") || expr.contains("table.")
                                                    || expr.contains("this.getCateOtherText")) {
                                                Object val = resolveExpression(expr, item);

                                                if (val != null) {
                                                    if (val instanceof Number) {
                                                        double d = ((Number) val).doubleValue();
                                                        destCell.setCellValue(d);
                                                        setNumericCellFormat(destCell, d);
                                                    } else {
                                                        destCell.setCellValue(val.toString());
                                                    }

                                                    continue;
                                                }
                                            }
                                        }
                                    }

                                    copyCell(srcCell, destCell, replacements);
                                }
                            }
                        }
                    } else {
                        int destRowIdx = r + offset;

                        if (detailRowIdx != -1 && r > detailRowIdx && detailRowIdx != templateRowIdx) {
                            destRowIdx--;
                        }

                        Row destRow = destSheet.createRow(destRowIdx);

                        destRow.setHeight(srcRow.getHeight());

                        for (int c = 0; c < srcRow.getLastCellNum(); c++) {
                            Cell srcCell = srcRow.getCell(c);

                            if (srcCell != null) {
                                Cell destCell = destRow.createCell(c);

                                destCell.setCellStyle(srcCell.getCellStyle());

                                boolean processed = false;

                                if (srcCell.getCellType() == CellType.STRING) {
                                    String expr = srcCell.getStringCellValue();

if (expr != null && (expr.contains("table.")
                                        || expr.contains("this.getCateOtherText") || expr.contains("item."))) {
                                        Map<String, Object> item = arrResult.isEmpty() ? new HashMap<>()
                                                : arrResult.get(arrResult.size() - 1);

                                        Object val = resolveExpression(expr, item);

                                        if (val != null) {
                                            if (val instanceof Number) {
                                                double d = ((Number) val).doubleValue();
                                                destCell.setCellValue(d);
                                                setNumericCellFormat(destCell, d);
                                            } else {
                                                destCell.setCellValue(val.toString());
                                            }

                                            processed = true;
                                        }
                                    }
                                }

                                if (!processed) {
                                    copyCell(srcCell, destCell, replacements);
                                }
                            }
                        }
                    }
                }

                copyMergedRegions(srcSheet, destSheet, false, templateRowIdx, offset, detailRowIdx);

                boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());

                if (!isExcel) {
                    applyStaticRemergeAndOverflowMerge(destSheet, false, templateRowIdx,
                            templateRowIdx + arrResult.size() - 1);
                }

                finalizeWorkbookSheet(workbook);

                // F-150: fix năng lực rows — unmerge + fill "-"
                if ("F-150".equalsIgnoreCase(request.getReportCode())) {
                    // First pass: find năng lực rows and remove any merged regions that overlap them
                    java.util.Set<Integer> nangLucRows = new java.util.HashSet<>();
                    for (int r = 0; r <= destSheet.getLastRowNum(); r++) {
                        Row row = destSheet.getRow(r);
                        if (row == null) continue;
                        Cell cellB = row.getCell(1);
                        if (cellB != null && cellB.getCellType() == CellType.STRING) {
                            String val = cellB.getStringCellValue();
                            if (val != null && val.contains("Năng lực")) {
                                nangLucRows.add(r);
                            }
                        }
                    }

                    // Remove merged regions that overlap with năng lực rows (columns C-I)
                    if (!nangLucRows.isEmpty()) {
                        java.util.List<Integer> toRemove = new java.util.ArrayList<>();
                        for (int i = 0; i < destSheet.getNumMergedRegions(); i++) {
                            org.apache.poi.ss.util.CellRangeAddress region = destSheet.getMergedRegion(i);
                            for (int r = region.getFirstRow(); r <= region.getLastRow(); r++) {
                                if (nangLucRows.contains(r) && region.getFirstColumn() >= 2 && region.getFirstColumn() <= 8) {
                                    toRemove.add(i);
                                    break;
                                }
                            }
                        }
                        // Remove in reverse order
                        for (int i = toRemove.size() - 1; i >= 0; i--) {
                            destSheet.removeMergedRegion(toRemove.get(i));
                        }
                    }

                    // Second pass: force-set all năng lực cells
                    for (int r : nangLucRows) {
                        Row row = destSheet.getRow(r);
                        // Ensure "Nghìn tấn/năm" stays in column C only
                        Cell cellC = row.getCell(2);
                        if (cellC == null) cellC = row.createCell(2);
                        cellC.setCellValue("Nghìn tấn/năm");

                        // Fill "-" in columns D-I
                        for (int c = 3; c <= 8; c++) {
                            Cell cell = row.getCell(c);
                            if (cell == null) cell = row.createCell(c);
                            CellStyle style = cell.getCellStyle();
                            if (style == null) style = destSheet.getWorkbook().createCellStyle();
                            style.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
                            cell.setCellStyle(style);
                            cell.setCellValue("-");
                        }
                    }
                }

                // Post-process F-155: section headers with proper formatting + STT reset
                if ("F-155".equalsIgnoreCase(request.getReportCode())) {
                    int sttCounter = 0;
                    for (int r = 0; r <= destSheet.getLastRowNum(); r++) {
                        Row row = destSheet.getRow(r);
                        if (row == null) continue;
                        Cell cellB = row.getCell(1);
                        if (cellB != null && cellB.getCellType() == CellType.STRING) {
                            String val = cellB.getStringCellValue();
                            if ("Cấp I".equals(val) || "Cấp II".equals(val) || "Cấp III".equals(val)) {
                                // Section header row: reset STT, clear all cells except B, set font
                                sttCounter = 0;
                                Cell cellA = row.getCell(0);
                                if (cellA != null) cellA.setCellValue("");
                                // Clear all other cells in this row
                                for (int c = 2; c < row.getLastCellNum(); c++) {
                                    Cell cell = row.getCell(c);
                                    if (cell != null) cell.setCellValue("");
                                }
                                // Set font: Times New Roman, size 10, bold
                                CellStyle style = workbook.createCellStyle();
                                style.cloneStyleFrom(cellB.getCellStyle());
                                org.apache.poi.ss.usermodel.Font font = workbook.createFont();
                                font.setFontName("Times New Roman");
                                font.setFontHeightInPoints((short) 10);
                                font.setBold(true);
                                style.setFont(font);
                                cellB.setCellStyle(style);
                                continue;
                            }
                        }
                        // Data row: assign STT + ensure column B is not bold
                        Cell cellA = row.getCell(0);
                        if (cellA != null && cellA.getCellType() == CellType.NUMERIC) {
                            cellA.setCellValue(++sttCounter);
                        }
                        // Unbold column B for data rows (section rows already handled with continue)
                        Cell cellBData = row.getCell(1);
                        if (cellBData != null) {
                            CellStyle style = cellBData.getCellStyle();
                            if (style != null) {
                                org.apache.poi.ss.usermodel.Font font = workbook.getFontAt(style.getFontIndex());
                                if (font != null && font.getBold()) {
                                    CellStyle unboldStyle = workbook.createCellStyle();
                                    unboldStyle.cloneStyleFrom(style);
                                    org.apache.poi.ss.usermodel.Font unboldFont = workbook.createFont();
                                    unboldFont.setFontName(font.getFontName());
                                    unboldFont.setFontHeightInPoints(font.getFontHeightInPoints());
                                    unboldFont.setBold(false);
                                    unboldStyle.setFont(unboldFont);
                                    cellBData.setCellStyle(unboldStyle);
                                }
                            }
                        }
                    }
                }
                
                // F-151: child rows (column L = Tên trạm QL luồng empty) should not be bold
                if ("F-151".equalsIgnoreCase(request.getReportCode())) {
                    // Pass 1: clear STT and unbold child rows (only after data section starts)
                    boolean dataStarted1 = false;
                    for (int r = 0; r <= destSheet.getLastRowNum(); r++) {
                        Row row = destSheet.getRow(r);
                        if (row == null) continue;
                        // Detect start of data: row where column A is "A"
                        if (!dataStarted1) {
                            Cell cellA = row.getCell(0);
                            if (cellA != null && cellA.getCellType() == CellType.STRING && "A".equals(cellA.getStringCellValue().trim())) {
                                dataStarted1 = true;
                            }
                            continue;
                        }
                        Cell cellL = row.getCell(11); // Column L = Tên trạm QL luồng
                        boolean isChild = (cellL == null)
                                || (cellL.getCellType() == CellType.BLANK)
                                || (cellL.getCellType() == CellType.STRING && cellL.getStringCellValue().trim().isEmpty());
                        if (!isChild) continue;
                        // Clear STT number for child rows
                        Cell cellSTT = row.getCell(0);
                        if (cellSTT != null) {
                            cellSTT.setCellValue("");
                        }
                        // Child row: unbold all cells in this row
                        for (int c = 0; c < row.getLastCellNum(); c++) {
                            Cell cell = row.getCell(c);
                            if (cell == null) continue;
                            CellStyle style = cell.getCellStyle();
                            if (style == null) continue;
                            org.apache.poi.ss.usermodel.Font font = workbook.getFontAt(style.getFontIndex());
                            if (font != null && font.getBold()) {
                                CellStyle unboldStyle = workbook.createCellStyle();
                                unboldStyle.cloneStyleFrom(style);
                                org.apache.poi.ss.usermodel.Font unboldFont = workbook.createFont();
                                unboldFont.setFontName(font.getFontName());
                                unboldFont.setFontHeightInPoints(font.getFontHeightInPoints());
                                unboldFont.setBold(false);
                                unboldStyle.setFont(unboldFont);
                                cell.setCellStyle(unboldStyle);
                            }
                        }
                    }
                    // Pass 2: renumber parent rows sequentially (1,2,3...), skipping header rows
                    int parentStt = 0;
                    boolean dataStarted = false;
                    for (int r = 0; r <= destSheet.getLastRowNum(); r++) {
                        Row row = destSheet.getRow(r);
                        if (row == null) continue;
                        // Detect start of data: row where column A is "A" (column-letter reference row)
                        if (!dataStarted) {
                            Cell cellA = row.getCell(0);
                            if (cellA != null && cellA.getCellType() == CellType.STRING && "A".equals(cellA.getStringCellValue().trim())) {
                                dataStarted = true;
                            }
                            continue;
                        }
                        Cell cellL = row.getCell(11);
                        boolean isParent = (cellL != null)
                                && (cellL.getCellType() == CellType.STRING && !cellL.getStringCellValue().trim().isEmpty());
                        if (!isParent) continue;
                        parentStt++;
                        Cell cellSTT = row.getCell(0);
                        if (cellSTT == null) cellSTT = row.createCell(0);
                        cellSTT.setCellValue(parentStt);
                    }
                }

                return outputWorkbook(workbook, destSheet, isExcel);
            }
        }
    }

    private Object resolveExpression(String expr, Map<String, Object> item) {
        if (expr == null)
            return null;

        String cleanExpr = expr.replace("${", "").replace("}", "").trim();

        // Sort keys by length in descending order to avoid prefix conflicts

        java.util.List<String> keys = new java.util.ArrayList<>(item.keySet());

        keys.sort((a, b) -> Integer.compare(b.length(), a.length()));

        for (String key : keys) {
            if (cleanExpr.contains(key)) {
                return item.get(key);
            }
        }

        // Dynamic fallbacks

        if (cleanExpr.contains("ten") || cleanExpr.contains("loai") || cleanExpr.contains("Ten")
                || cleanExpr.contains("Loai") || cleanExpr.contains("key") || cleanExpr.contains("Key")) {
            return item.getOrDefault("ten", item.getOrDefault("loaiTaiSan", ""));
        } else if (cleanExpr.contains("dai") || cleanExpr.contains("Dai") || cleanExpr.contains("chieudai")
                || cleanExpr.contains("ChieuDai")) {
            return item.getOrDefault("daiLuong", item.getOrDefault("soLuong", 0.0));
        } else if (cleanExpr.contains("dientich") || cleanExpr.contains("DienTich") || cleanExpr.contains("tich")
                || cleanExpr.contains("Tich")) {
            return item.getOrDefault("dienTich", 0.0);
        } else if (cleanExpr.contains("thoidiem") || cleanExpr.contains("ThoiDiem") || cleanExpr.contains("ngay")
                || cleanExpr.contains("Ngay")) {
            return item.getOrDefault("thoiDiemSuaChuaGanNhat", item.getOrDefault("ngayQuyetDinh", ""));
        }

        return null;
    }

    // ==========================================

    // EXPORT HELPER METHODS

    // ==========================================

    private String resolveTemplateName(String reportCodeStr) {
        if (reportCodeStr == null) {
            return "BCC_156";
        }

        String code = reportCodeStr.toUpperCase();

        if ("F-180N".equals(code))
            return "BCDL_180N";

        if ("F-182N".equals(code))
            return "BCDL_182N";

        if ("F-183N".equals(code))
            return "BCDL_183N";

        if ("F-184N".equals(code))
            return "BCDL_184N";

        if (!code.startsWith("F-")) {
            return "BCC_156";
        }

        try {
            int num = Integer.parseInt(code.substring(2));
            int mapped = num + 15;

            if (mapped >= 156 && mapped <= 162)
                return "BCC_" + mapped;

            if (mapped >= 163 && mapped <= 175)
                return "BCKCHT_" + mapped;

            if (mapped >= 176 && mapped <= 184)
                return "BCDL_" + mapped;

            if (mapped >= 185 && mapped <= 187)
                return "BCPTTV_" + mapped;

            if (mapped >= 188 && mapped <= 189)
                return "BCDN_" + mapped;

            if (mapped >= 190 && mapped <= 194)
                return "BCTT48_" + mapped;

            if (mapped >= 195 && mapped <= 204)
                return "BCCNDB_" + mapped;
        } catch (Exception e) {
            log.warn("Failed to parse report code: {}", reportCodeStr);
        }

        return "BCC_156";
    }

    private java.util.UUID resolveOrgUnitId(String requestOrgId) {
        if (requestOrgId != null && !requestOrgId.isBlank()) {
            try {
                if (requestOrgId.endsWith("-demo")) {
                    List<com.hanghai.kchtg.orgunit.entity.OrgUnit> roots = orgUnitRepository.findAll();

                    if (!roots.isEmpty())
                        return roots.get(0).getId();
                } else {
                    return java.util.UUID.fromString(requestOrgId);
                }
            } catch (Exception e) {
                log.warn("Invalid orgUnitId UUID: {}", requestOrgId);
            }
        }

        return null;
    }



    private List<com.hanghai.kchtg.gis.point.entity.PointObject> getFilteredPoints(java.util.UUID targetUnitId,
            int reportYear) {
        boolean isRoot = false;

        if (targetUnitId != null) {
            isRoot = orgUnitRepository.findById(targetUnitId)
                    .map(u -> "CUC_HHVT".equals(u.getCode()))
                    .orElse(false);
        }

        final boolean skipFilter = targetUnitId == null || isRoot;

        return pointRepository.findAll().stream()
                .filter(p -> skipFilter || targetUnitId.equals(p.getUnitId()))
                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)
                .toList();
    }

    private List<com.hanghai.kchtg.gis.point.entity.PointObject> getFilteredPointsForF143(java.util.UUID targetUnitId,
            int reportYear, String bcNoiDung) {
        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);

        if ("2".equals(bcNoiDung)) {
            return points.stream()
                    .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().getYear() == reportYear)
                    .toList();
        } else if ("3".equals(bcNoiDung)) {
            return points.stream()
                    .filter(p -> p.getUpdatedAt() != null && p.getUpdatedAt().getYear() == reportYear
                            && p.getCreatedAt() != null && p.getCreatedAt().getYear() < reportYear)
                    .toList();
        }

        return points;
    }

    private void copyPageSetup(Sheet srcSheet, Sheet destSheet) {
        if (srcSheet.getPrintSetup() != null && destSheet.getPrintSetup() != null) {
            destSheet.getPrintSetup().setLandscape(srcSheet.getPrintSetup().getLandscape());

            destSheet.getPrintSetup().setPaperSize(srcSheet.getPrintSetup().getPaperSize());

            destSheet.setFitToPage(srcSheet.getFitToPage());

            destSheet.getPrintSetup().setFitWidth(srcSheet.getPrintSetup().getFitWidth());

            destSheet.getPrintSetup().setFitHeight(srcSheet.getPrintSetup().getFitHeight());
        }

        for (int col = 0; col < 35; col++) {
            destSheet.setColumnWidth(col, srcSheet.getColumnWidth(col));
            destSheet.setColumnHidden(col, srcSheet.isColumnHidden(col));
        }
    }

    private Map<String, String> buildReplacements(ReportPreviewRequest request, int reportYear) {
        // [COMMENTED] Hardcoded org name — resolved from DB below
        String orgName = ""; // was: "Cục Hàng hải và Đường thủy Việt Nam"

        if (request.getOrgUnitId() != null && !request.getOrgUnitId().isBlank()
                /* && !"g17-43-demo".equalsIgnoreCase(request.getOrgUnitId()) */) {
            try {
                orgName = orgUnitRepository.findById(java.util.UUID.fromString(request.getOrgUnitId()))
                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                        .orElse(orgName);
            } catch (Exception ignored) {
            }
        }

        String startDateText = request.getStartDate() != null ? request.getStartDate().toString() : "";
        String endDateText = request.getEndDate() != null ? request.getEndDate().toString() : "";
        String periodText = "Từ " + startDateText + " đến " + endDateText;

        if ("F-144".equalsIgnoreCase(request.getReportCode()) || "F-145".equalsIgnoreCase(request.getReportCode())) {
            periodText = "Năm " + reportYear;
        } else if (startDateText.isEmpty() && endDateText.isEmpty()) {
            periodText = "Năm " + reportYear;
        }

        Map<String, String> replacements = new HashMap<>();

        replacements.put("${fkDonViBcText}", orgName);
        replacements.put("${fkDonViBcCapTrenText}", "CỤC HÀNG HẢI VIỆT NAM");
        replacements.put("${bcMaText}", String.valueOf(reportYear));
        replacements.put("${dateReportText}", "ngày " + LocalDate.now().getDayOfMonth() + " tháng "
                + LocalDate.now().getMonthValue() + " năm " + LocalDate.now().getYear());
        replacements.put("${bcThoiGian}", periodText);

        // F-143 label

        String bcNoiDungLabel = "Kê khai lần đầu";

        if ("2".equals(request.getBcNoiDung())) {
            bcNoiDungLabel = "Kê khai bổ sung";
        } else if ("3".equals(request.getBcNoiDung())) {
            bcNoiDungLabel = "Kê khai thay đổi thông tin";
        }

        replacements.put("${this.getCateOtherText('DM_APP_PARAM',objInput.getBcNoiDung(), 'NOI_DUNG_BAO_CAO_158')}",
                bcNoiDungLabel);
        // Template BCC_158.xlsx uses "thiz" not "this" — add the thiz variant
        replacements.put("${thiz.getCateOtherText('DM_APP_PARAM',objInput.getBcNoiDung(), 'NOI_DUNG_BAO_CAO_158')}",
                bcNoiDungLabel);
        replacements.put("${idx+1}", "1");
        replacements.put("${idx + 1}", "1");

        return replacements;
    }

    private void copyMergedRegions(Sheet srcSheet, Sheet destSheet, boolean isStatic, int dataBoundaryRow, int offset) {
        copyMergedRegions(srcSheet, destSheet, isStatic, dataBoundaryRow, offset, -1);
    }

    private void copyMergedRegions(Sheet srcSheet, Sheet destSheet, boolean isStatic, int dataBoundaryRow, int offset,
            int detailRowIdx) {
        for (int i = 0; i < srcSheet.getNumMergedRegions(); i++) {
            org.apache.poi.ss.util.CellRangeAddress region = srcSheet.getMergedRegion(i);

            int firstRow = region.getFirstRow();
            int lastRow = region.getLastRow();

            if (isStatic) {
                destSheet.addMergedRegion(region);
            } else {
                if (firstRow < dataBoundaryRow) {
                    if (firstRow == 4 && region.getFirstColumn() == 6 && srcSheet.getRow(4) != null
                            && srcSheet.getRow(4).getCell(6) != null
                            && srcSheet.getRow(4).getCell(6).toString().contains("Kỳ báo cáo")) {
                        destSheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(4, 4, 0, 15));
                    } else {
                        destSheet.addMergedRegion(region);
                    }
                } else {
                    int newFirstRow = firstRow + offset;
                    int newLastRow = lastRow + offset;

                    if (detailRowIdx != -1 && detailRowIdx != dataBoundaryRow) {
                        if (firstRow > detailRowIdx)
                            newFirstRow--;

                        if (lastRow > detailRowIdx)
                            newLastRow--;
                    }

                    if (newFirstRow >= dataBoundaryRow) {
                        destSheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(
                                newFirstRow, newLastRow, region.getFirstColumn(), region.getLastColumn()

                        ));
                    }
                }
            }
        }
    }

    private Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> getCategoryNamesMap() {
        Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> map = new LinkedHashMap<>();

        map.put(com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.PORT, "Bến cảng, bến phao.");
        map.put(com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.BEACON,
                "Hệ thống giám sát và điều phối giao thông hàng hải (VTS).");
        map.put(com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.BUOY,
                "Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ.");
        map.put(com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.LIGHTHOUSE,
                "Luồng hàng hải, vùng đón trả hoa tiêu, vùng kiểm dịch.");
        map.put(com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER,
                "Khu chuyển tải, khu neo đậu, khu tránh, trú bão trong vùng nước cảng biển.");

        return map;
    }

    /**
     * Maps nhom (TS_QL asset group code) to a human-readable Vietnamese category name
     * used in F-143 export category header rows.
     */
    private Map<String, String> getNhomCategoryNamesMap() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("CB", "I. CẢNG BIỂN");
        map.put("BC", "II. BẾN CẢNG");
        map.put("CC", "III. CẦU CẢNG");
        map.put("BP", "IV. BẾN PHAO");
        map.put("TTB", "V. TRẠM THÔNG TIN BÁO HIỆU");
        map.put("CT", "VI. CẢNG TỔNG HỢP");
        map.put("ND", "VII. KHU NEO ĐẬU");
        map.put("CSSCDT", "VIII. CƠ SỞ SỬA CHỮA ĐÓNG TÀU");
        map.put("LHH", "IX. LUỒNG HÀNG HẢI");
        map.put("DBNT", "X. ĐÈN BIỂN / NHÀ TRẠM");
        map.put("NT", "XI. NHÀ TRẠM");
        map.put("PT", "XII. PHAO TIÊU");
        map.put("VTS", "XIII. HỆ THỐNG VTS");
        map.put("OTHER", "XIV. KHÁC");
        return map;
    }

    private List<Map<String, Object>> buildDynamicResultList(
            List<com.hanghai.kchtg.gis.point.entity.PointObject> points, String reportCode) {
        // Custom grouping for F-148 to match production category grouping

        if ("F-148".equalsIgnoreCase(reportCode)) {
            List<Map<String, Object>> arrResult = new ArrayList<>();

            // Group 1: Cảng biển

            long[] agg1 = new long[] { 0, 0, 0 };

            for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
                if (p.getObjectType() == com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.PORT
                        || p.getObjectType() == com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.BEACON) {
                    agg1[0] += 1;

                    agg1[2] += getPointAssetValue(p);
                }
            }

            if (agg1[0] > 0) {
                Map<String, Object> item = getStringObjectMap("I. Cảng biển", agg1);

                arrResult.add(item);
            }

            // Group 2: Cảng, bến thủy nội địa

            long[] agg2 = new long[] { 0, 0, 0 };

            for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
                if (p.getObjectType() != com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.PORT
                        && p.getObjectType() != com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.BEACON) {
                    agg2[0] += 1;

                    agg2[2] += getPointAssetValue(p);
                }
            }

            if (agg2[0] > 0) {
                Map<String, Object> item = getStringObjectMap("II. Cảng, bến thủy nội địa", agg2);

                arrResult.add(item);
            }

            return arrResult;
        }

        if ("F-153".equalsIgnoreCase(reportCode)) {
            List<Map<String, Object>> arrResult = new ArrayList<>();

            for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
                Map<String, Object> item = new HashMap<>();

                item.put("ten", p.getName());
                item.put("code", p.getCode());
                item.put("name", p.getName());
                item.put("tenPort", p.getName());
                item.put("nhom", p.getObjectType() != null ? p.getObjectType().name() : "");

                String viTri = "";

                if (p.getLatitude() != null && p.getLongitude() != null) {
                    viTri = String.format("%.6f, %.6f", p.getLatitude(), p.getLongitude());
                }

                item.put("viTriKhu", viTri);
                item.put("viTriDiemNeo", viTri);
                item.put("hinhDang", "");
                item.put("dienTich", "");
                item.put("coTauKhaiThac", "");

                String donVi = "";

                if (p.getUnitId() != null) {
                    donVi = orgUnitRepository.findById(p.getUnitId())
                            .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                            .orElse("");
                }

                item.put("donViQuanLyKhaiThac", donVi);
                item.put("doSauKhuNuocTheoThietKe", "");
                item.put("doSauKhuNuocHienTai", "");
                item.put("daCongBoHoatDong", "");
                item.put("thoiDiemCongBo", "");
                item.put("ghiChu", p.getDescription() != null ? p.getDescription() : "");
                item.put("tenDiemNeo", p.getName());
                arrResult.add(item);
            }

            return arrResult;
        }

        if (!"F-148".equalsIgnoreCase(reportCode)) {
            List<Map<String, Object>> arrResult = new ArrayList<>();

            for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
                Map<String, Object> item = new HashMap<>();

                item.put("ten", p.getName());
                item.put("code", p.getCode());
                item.put("name", p.getName());
                item.put("description", p.getDescription());
                item.put("unitId", p.getUnitId() != null ? p.getUnitId().toString() : "");
                item.put("status", p.getStatus() != null ? p.getStatus().name() : "");

                // Real fields mapping

                item.put("tenPort", p.getName());
                item.put("tenCang", p.getName());
                item.put("loaiTaiSan", p.getName());
                item.put("maTuyenLuong", p.getCode());
                item.put("tenTramQuanLyLuong", p.getName());
                item.put("tenDiemNeo", p.getName());

                // We use 0.0 instead of empty string for missing numeric fields so Excel
                // formulas (e.g. VALUE(C13)) don't throw #VALUE!

                item.put("soLuongTram", 0.0);
                item.put("dienTich", 0.0);
                item.put("thoiDiemSuaChuaGanNhat", "");
                item.put("thoiDiemCongBo", "");
                item.put("ngaySuaChua", "");
                item.put("nhanSuBoTriTaiTramQlLuong", 0.0);
                item.put("nhanSuBoTriTaiTramQL", 0.0);
                item.put("soLuongNhanSuBoTri", 0.0);
                item.put("daiLuong", 0.0);
                item.put("rongLonNhat", 0.0);
                item.put("rongNhoNhat", 0.0);
                item.put("doSau", 0.0);
                item.put("doSauThietKe", 0.0);
                item.put("doSauKhuNuocTheoThietKe", 0.0);
                item.put("doSauKhuNuocHienTai", 0.0);
                item.put("maiDoc", 0.0);
                item.put("doSauHienTai", 0.0);
                item.put("khoiLuongNaoVetDuyTu", 0.0);
                item.put("congCong", 0.0);
                item.put("chuyenDung", 0.0);
                item.put("chieuCaoTinhKhong", 0.0);
                item.put("donViQuanLyVanHanh", "Cục Hàng hải Việt Nam");
                item.put("donViQuanLyKhaiThac", "Cục Hàng hải Việt Nam");
                item.put("donViQuanLy", "Cục Hàng hải Việt Nam");
                item.put("donViQl", "Cục Hàng hải Việt Nam");
                item.put("diaDiemText", "");
                item.put("viTri", "");
                item.put("viTriKhu", "");
                item.put("viTriDiemNeo", "");
                item.put("hinhDang", "");
                item.put("ketCau", "");
                item.put("mauSacBenNgoaiCuaThapDen", "");
                item.put("chieuCaoThapDen", 0.0);
                item.put("chieuCaoTamSang", 0.0);
                item.put("tamHieuLucDiaLy", 0.0);
                item.put("tamHieuLucAnhSang", 0.0);
                item.put("nguonCungCapNangLuongChoDen", "");
                item.put("dienTichSuDungTram", 0.0);
                item.put("dienTichTheoThongBaoGanNhatTenNavigationChannel", 0.0);
                item.put("tinhTrangHoatDongChuaCongBoTenNavigationChannel", "");
                item.put("tinhTrangHoatDongDaCongBoTenNavigationChannel", "");
                item.put("coTauKhaiThac", "");
                item.put("daCongBoHoatDong", "");
                item.put("soLuongHienCoKhuChuyenTaiCoPhaoNeo", 0.0);
                item.put("soLuongHienCoKhuChuyenTaiKhongCoPhaoNeo", 0.0);
                item.put("soLuongHienCoKhuNeoDau", 0.0);
                item.put("soLuongHienCoKhuTranhBao", 0.0);
                item.put("soLuongHienCoKhuTruBao", 0.0);
                item.put("soLuongTangThemKhuChuyenTaiCoPhaoNeo", 0.0);
                item.put("soLuongTangThemKhuChuyenTaiKhongCoPhaoNeo", 0.0);
                item.put("soLuongTangThemKhuNeoDau", 0.0);
                item.put("soLuongTangThemKhuTranhBao", 0.0);
                item.put("soLuongTangThemKhuTruBao", 0.0);

                // BCC_156 template keys for F-141 export
                // Template uses expressions like ${item.dauKySoLuong.asText()},
                // ${item.dauKyDienTich.asText()}
                long assetVal = getPointAssetValue(p);
                item.put("dauKySoLuong", 1.0);
                item.put("dauKyDienTich", 0.0);
                item.put("dauKyNguyenGia", (double) assetVal);
                item.put("trongKyTangSoLuong", 0.0);
                item.put("trongKyTangDienTich", 0.0);
                item.put("trongKyTangNguyenGia", 0.0);
                item.put("trongKyGiamSoLuong", 0.0);
                item.put("trongKyGiamDienTich", 0.0);
                item.put("trongKyGiamNguyenGia", 0.0);
                item.put("cuoiKySoLuong", 1.0);
                item.put("cuoiKyDienTich", 0.0);
                item.put("cuoiKyNguyenGia", (double) assetVal);
                item.put("tenTaiSan", p.getName());
                arrResult.add(item);
            }

            return arrResult;
        }

        Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> categoryNames = getCategoryNamesMap();

        List<Map<String, Object>> arrResult = new ArrayList<>();

        Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, long[]> aggregated = new LinkedHashMap<>();

        for (com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type : categoryNames.keySet()) {
            aggregated.put(type, new long[] { 0, 0, 0 });
        }

        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {
            com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type = p.getObjectType();

            if (type == null)
                type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;

            long val = getPointAssetValue(p);

            long[] agg = aggregated.computeIfAbsent(type, k -> new long[] { 0, 0, 0 });

            agg[0] += 1;

            agg[2] += val;
        }

        for (var entry : aggregated.entrySet()) {
            long[] agg = entry.getValue();

            if (agg[0] == 0)
                continue;

            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());
            Map<String, Object> item = getStringObjectMap(catName, agg);

            arrResult.add(item);
        }

        return arrResult;
    }

    private static @NonNull Map<String, Object> getStringObjectMap(String catName, long[] agg) {
        Map<String, Object> item = new LinkedHashMap<>();

        item.put("loaiTaiSan", catName);
        item.put("tenTaiSan", catName);
        item.put("dauKySoLuong", (double) agg[0]);
        item.put("dauKyDienTich", (double) agg[1]);
        item.put("dauKyNguyenGia", (double) agg[2]);
        item.put("trongKyTangSoLuong", 0.0);
        item.put("trongKyTangDienTich", 0.0);
        item.put("trongKyTangNguyenGia", 0.0);
        item.put("trongKyGiamSoLuong", 0.0);
        item.put("trongKyGiamDienTich", 0.0);
        item.put("trongKyGiamNguyenGia", 0.0);
        item.put("cuoiKySoLuong", (double) agg[0]);
        item.put("cuoiKyDienTich", (double) agg[1]);
        item.put("cuoiKyNguyenGia", (double) agg[2]);
        item.put("soLuong", (double) agg[0]);
        item.put("dienTich", (double) agg[1]);
        item.put("nguyenGia", (double) agg[2]);
        item.put("tinhTrang", "Đang hoạt động tốt");
        item.put("hinhThuc", "Giao quản lý");
        item.put("lyDo", "Giao tài sản kết cấu hạ tầng");
        item.put("phuongThuc", "Trực tiếp khai thác");
        item.put("coQuanQuyetDinh", "Cục Hàng hải Việt Nam");
        item.put("soQuyetDinh", "QD-CHHVN-2026");
        item.put("ngayQuyetDinh", "2026-01-01");
        item.put("hinhThucXuly", "Thu hồi");
        item.put("phuongThucXuly", "Thu hồi tài sản");
        item.put("nam", "2026");
        item.put("nguonNganSach", (double) agg[2]);
        item.put("nguonKhac", 0.0);
        item.put("tong", (double) agg[2]);
        item.put("soLuongKhaiThac", (double) agg[0]);
        item.put("giaTriKhaiThac", (double) agg[2]);
        item.put("doanhThu", agg[2] * 0.05);
        item.put("soLuongGiam", 0.0);
        item.put("giaTriGiam", 0.0);
        item.put("lyDoGiam", "");

        return item;
    }

    private void applyStaticRemergeAndOverflowMerge(Sheet destSheet, boolean isStatic, int dataStartRow,
            int dataEndRow) {
        int destMaxCols = 0;

        for (int r = 0; r <= destSheet.getLastRowNum(); r++) {
            Row row = destSheet.getRow(r);

            if (row != null && row.getLastCellNum() > destMaxCols) {
                destMaxCols = row.getLastCellNum();
            }
        }

        if (destMaxCols == 0)
            destMaxCols = 14;

        List<org.apache.poi.ss.util.CellRangeAddress> mergedRegions = new ArrayList<>();

        for (int i = 0; i < destSheet.getNumMergedRegions(); i++) {
            mergedRegions.add(destSheet.getMergedRegion(i));
        }

        // 1. Re-merge

        for (org.apache.poi.ss.util.CellRangeAddress region : mergedRegions) {
            int rStart = region.getFirstRow();
            int rEnd = region.getLastRow();
            int cStart = region.getFirstColumn();
            int cEnd = region.getLastColumn();

            if (!isStatic && rStart >= dataStartRow && rStart <= dataEndRow) {
                continue;
            }

            Row rowCheck = destSheet.getRow(rStart);

            if (rowCheck == null)
                continue;

            Cell startCell = rowCheck.getCell(cStart);

            if (startCell != null && startCell.getCellType() == CellType.STRING) {
                String val = startCell.getStringCellValue();

                if (val != null && !val.trim().isEmpty()) {
                    int rightCol = cEnd;

                    for (int nextCol = cEnd + 1; nextCol < destMaxCols; nextCol++) {
                        // Check if any row in range [rStart, rEnd] for nextCol is already part of a
                        // merged region

                        boolean nextColOverlap = false;

                        for (int r = rStart; r <= rEnd; r++) {
                            for (org.apache.poi.ss.util.CellRangeAddress activeReg : mergedRegions) {
                                if (activeReg.isInRange(r, nextCol)) {
                                    nextColOverlap = true;

                                    break;
                                }
                            }

                            if (nextColOverlap)
                                break;
                        }

                        if (nextColOverlap) {
                            break; // stop extending if it overlaps an existing merged region
                        }

                        boolean allRowsEmpty = true;

                        for (int r = rStart; r <= rEnd; r++) {
                            Row row = destSheet.getRow(r);

                            if (row != null) {
                                Cell nextCell = row.getCell(nextCol);

                                if (nextCell != null) {
                                    if (nextCell.getCellType() == CellType.STRING) {
                                        String nextVal = nextCell.getStringCellValue();

                                        if (nextVal != null && !nextVal.trim().isEmpty()) {
                                            allRowsEmpty = false;

                                            break;
                                        }
                                    } else if (nextCell.getCellType() != CellType.BLANK) {
                                        allRowsEmpty = false;

                                        break;
                                    }
                                }
                            }
                        }

                        if (allRowsEmpty) {
                            rightCol = nextCol;
                        } else {
                            break;
                        }
                    }

                    if (rightCol > cEnd) {
                        for (int j = 0; j < destSheet.getNumMergedRegions(); j++) {
                            if (destSheet.getMergedRegion(j).formatAsString().equals(region.formatAsString())) {
                                destSheet.removeMergedRegion(j);

                                break;
                            }
                        }

                        destSheet.addMergedRegion(
                                new org.apache.poi.ss.util.CellRangeAddress(rStart, rEnd, cStart, rightCol));
                    }
                }
            }
        }

        // 2. Overflow merge

        for (int r = 0; r <= destSheet.getLastRowNum(); r++) {
            if (!isStatic && r >= dataStartRow && r <= dataEndRow) {
                continue;
            }

            Row destRow = destSheet.getRow(r);

            if (destRow == null)
                continue;

            for (int c = 0; c < destMaxCols; c++) {
                Cell cell = destRow.getCell(c);

                if (cell != null && cell.getCellType() == CellType.STRING) {
                    String val = cell.getStringCellValue();

                    if (val != null && !val.trim().isEmpty()) {
                        boolean alreadyMerged = false;

                        for (int i = 0; i < destSheet.getNumMergedRegions(); i++) {
                            org.apache.poi.ss.util.CellRangeAddress region = destSheet.getMergedRegion(i);

                            if (region.isInRange(r, c)) {
                                alreadyMerged = true;

                                break;
                            }
                        }

                        if (!alreadyMerged) {
                            int rightCol = c;

                            for (int nextCol = c + 1; nextCol < destMaxCols; nextCol++) {
                                // Check if cell (r, nextCol) is already part of a merged region

                                boolean nextOverlap = false;

                                for (org.apache.poi.ss.util.CellRangeAddress activeReg : mergedRegions) {
                                    if (activeReg.isInRange(r, nextCol)) {
                                        nextOverlap = true;

                                        break;
                                    }
                                }

                                if (nextOverlap) {
                                    break; // stop extending if it overlaps an existing merged region
                                }

                                Cell nextCell = destRow.getCell(nextCol);
                                boolean isEmpty = isIsEmpty(nextCell);

                                if (isEmpty) {
                                    rightCol = nextCol;
                                } else {
                                    break;
                                }
                            }

                            if (rightCol > c) {
                                destSheet.addMergedRegion(
                                        new org.apache.poi.ss.util.CellRangeAddress(r, r, c, rightCol));
                            }
                        }
                    }
                }
            }
        }
    }

    private static boolean isIsEmpty(Cell nextCell) {
        boolean isEmpty = true;

        if (nextCell != null) {
            if (nextCell.getCellType() == CellType.STRING) {
                String nextVal = nextCell.getStringCellValue();

                if (nextVal != null && !nextVal.trim().isEmpty()) {
                    isEmpty = false;
                }
            } else if (nextCell.getCellType() != CellType.BLANK) {
                isEmpty = false;
            }
        }

        return isEmpty;
    }

    private void finalizeWorkbookSheet(Workbook workbook) {
        String originalName = workbook.getSheetName(0);

        workbook.setSheetName(0, "temp_template_sheet");
        workbook.setSheetName(workbook.getSheetIndex("ReportSheet"), originalName);

        workbook.removeSheetAt(0);
    }

    private byte[] outputWorkbook(Workbook workbook, Sheet destSheet, boolean isExcel) throws Exception {
        if (isExcel) {
            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                workbook.write(baos);

                return baos.toByteArray();
            }
        } else {
            return convertExcelToPdf(destSheet);
        }
    }

    /**
     * Resolves a formula cell by computing its value in Java and replacing the formula
     * with the computed result. This handles formulas like =VALUE(D14)+VALUE(D15)-VALUE(D16)
     * where POI's built-in evaluator may not support the VALUE() function.
     */
    private void resolveFormulaCell(Cell cell) {
        if (cell.getCellType() != CellType.FORMULA) return;
        String formula = cell.getCellFormula();
        if (formula == null) return;

        try {
            // Replace VALUE(X99) with just the numeric reference X99
            // Since referenced cells already contain numbers, VALUE() is redundant
            String simplified = formula.replaceAll("VALUE\\(([A-Z]+\\d+)\\)", "$1");

            // Parse cell references and read values
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("([A-Z]+)(\\d+)").matcher(simplified);
            String expr = simplified;
            while (m.find()) {
                String colLetters = m.group(1);
                int rowNum = Integer.parseInt(m.group(2)) - 1; // 0-indexed
                int colNum = CellReference.convertColStringToIndex(colLetters);

                Row refRow = cell.getSheet().getRow(rowNum);
                double val = 0;
                if (refRow != null) {
                    Cell refCell = refRow.getCell(colNum);
                    if (refCell != null) {
                        try {
                            val = refCell.getNumericCellValue();
                        } catch (Exception e) {
                            try {
                                DataFormatter formatter = new DataFormatter();
                                String s = formatter.formatCellValue(refCell);
                                val = Double.parseDouble(s.replaceAll("[^\\d.-]", ""));
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }
                String cellRef = m.group(0);
                expr = expr.replace(cellRef, String.valueOf(val));
            }

            // Evaluate arithmetic expression (only + and - needed)
            double result = evaluateSimpleArithmetic(expr);
            cell.setCellValue(result);
            setNumericCellFormat(cell, result);
        } catch (Exception e) {
            log.warn("resolveFormulaCell failed for formula [{}]: {}", formula, e.getMessage());
        }
    }

    /**
     * Simple left-to-right evaluation for arithmetic expressions with + and - only.
     */
    private double evaluateSimpleArithmetic(String expr) {
        String[] parts = expr.split("(?=[+-])|(?<=[+-])");
        double result = 0;
        char op = '+';
        for (String part : parts) {
            part = part.trim();
            if (part.equals("+")) {
                op = '+';
            } else if (part.equals("-")) {
                op = '-';
            } else if (!part.isEmpty()) {
                double val = Double.parseDouble(part);
                if (op == '+') result += val;
                else result -= val;
            }
        }
        return result;
    }

    /**
     * Direct computation for BCC_157 (F-142) template.
     * Reads known placeholder values from D column, computes formula cells (D and E columns),
     * and writes the results directly. This replaces all formula evaluation which POI cannot
     * handle for VALUE() functions and complex formulas.
     */
    private void directComputeBcc157(Sheet sheet) {
        try {
            // Read source values from placeholder cells (rows are 0-indexed in POI)
            // Excel rows: 14=rowIdx13, 15=rowIdx14, 16=rowIdx15, 17=rowIdx16,
            //              19=rowIdx18, 20=rowIdx19, 21=rowIdx20, 22=rowIdx21,
            //              24=rowIdx23, 25=rowIdx24
            // Column D = colIdx 3, Column E = colIdx 4

            double d14 = getCellNumericValue(sheet, 13, 3); // taiSanNguyenGiaSoDuDauNam
            double d15 = getCellNumericValue(sheet, 14, 3); // taiSanNguyenGiaTangTrongNam
            double d16 = getCellNumericValue(sheet, 15, 3); // taiSanNguyenGiaGiamTrongNam
            double d19 = getCellNumericValue(sheet, 18, 3); // taiSanGiaTriHaoMonSoDuDauNam
            double d20 = getCellNumericValue(sheet, 19, 3); // taiSanGiaTriHaoMonTangTrongNam
            double d21 = getCellNumericValue(sheet, 20, 3); // taiSanGiaTriHaoMonGiamTrongNam

            // Compute formula results
            double d17 = d14 + d15 - d16;         // Số dư cuối năm Nguyên giá
            double d22 = d19 + d20 - d21;         // Số dư cuối năm Hao mòn
            double d24 = d14 - d19;               // Giá trị còn lại Đầu năm
            double d25 = d17 - d22;               // Giá trị còn lại Cuối năm

            // Write D column computed cells
            setCellNumericValue(sheet, 16, 3, d17);  // D17
            setCellNumericValue(sheet, 21, 3, d22);  // D22
            setCellNumericValue(sheet, 23, 3, d24);  // D24
            setCellNumericValue(sheet, 24, 3, d25);  // D25

            // Write E column (Tổng cộng = D column values)
            setCellNumericValue(sheet, 13, 4, d14);  // E14 = D14
            setCellNumericValue(sheet, 14, 4, d15);  // E15 = D15
            setCellNumericValue(sheet, 15, 4, d16);  // E16 = D16
            setCellNumericValue(sheet, 16, 4, d17);  // E17 = D17
            setCellNumericValue(sheet, 18, 4, d19);  // E19 = D19
            setCellNumericValue(sheet, 19, 4, d20);  // E20 = D20
            setCellNumericValue(sheet, 20, 4, d21);  // E21 = D21
            setCellNumericValue(sheet, 21, 4, d22);  // E22 = D22
            setCellNumericValue(sheet, 23, 4, d24);  // E24 = D24
            setCellNumericValue(sheet, 24, 4, d25);  // E25 = D25

        } catch (Exception e) {
            log.warn("directComputeBcc157 failed: {}", e.getMessage());
        }
    }

    /**
     * Computes BCC_157 formula cells directly from the replacements map values.
     * This is more reliable than reading from the sheet because the replacements map
     * already contains all correct values from the CRUD data, while the sheet may still
     * have unresolved formula text at this point in the export pipeline.
     *
     * @param sheet       the destination sheet to write computed values to
     * @param replacements the replacements map containing all placeholder → value mappings
     */
    private void directComputeBcc157FromReplacements(Sheet sheet, Map<String, String> replacements) {
        try {
            // Read values directly from replacements map — these are already correct
            // from the CRUD data, unlike reading from the sheet which may have formula text
            double d14 = parseReplacement(replacements, "${zobjComReport.taiSanNguyenGiaSoDuDauNam.asText()}");
            double d15 = parseReplacement(replacements, "${zobjComReport.taiSanNguyenGiaTangTrongNam.asText()}");
            double d16 = parseReplacement(replacements, "${zobjComReport.taiSanNguyenGiaGiamTrongNam.asText()}");
            double d19 = parseReplacement(replacements, "${zobjComReport.taiSanGiaTriHaoMonSoDuDauNam.asText()}");
            double d20 = parseReplacement(replacements, "${zobjComReport.taiSanGiaTriHaoMonTangTrongNam.asText()}");
            double d21 = parseReplacement(replacements, "${zobjComReport.taiSanGiaTriHaoMonGiamTrongNam.asText()}");

            // Compute formula results
            double d17 = d14 + d15 - d16;         // Số dư cuối năm Nguyên giá
            double d22 = d19 + d20 - d21;         // Số dư cuối năm Hao mòn
            double d24 = d14 - d19;               // Giá trị còn lại Đầu năm
            double d25 = d17 - d22;               // Giá trị còn lại Cuối năm

            // Write D column computed cells
            setCellNumericValue(sheet, 16, 3, d17);  // D17 - Số dư cuối năm Nguyên giá
            setCellNumericValue(sheet, 21, 3, d22);  // D22 - Số dư cuối năm Hao mòn
            setCellNumericValue(sheet, 23, 3, d24);  // D24 - Giá trị còn lại Đầu năm
            setCellNumericValue(sheet, 24, 3, d25);  // D25 - Giá trị còn lại Cuối năm

            // Write E column (Tổng cộng = D column values)
            setCellNumericValue(sheet, 13, 4, d14);  // E14 = D14
            setCellNumericValue(sheet, 14, 4, d15);  // E15 = D15
            setCellNumericValue(sheet, 15, 4, d16);  // E16 = D16
            setCellNumericValue(sheet, 16, 4, d17);  // E17 = D17
            setCellNumericValue(sheet, 18, 4, d19);  // E19 = D19
            setCellNumericValue(sheet, 19, 4, d20);  // E20 = D20
            setCellNumericValue(sheet, 20, 4, d21);  // E21 = D21
            setCellNumericValue(sheet, 21, 4, d22);  // E22 = D22
            setCellNumericValue(sheet, 23, 4, d24);  // E24 = D24
            setCellNumericValue(sheet, 24, 4, d25);  // E25 = D25

        } catch (Exception e) {
            log.warn("directComputeBcc157FromReplacements failed: {}", e.getMessage());
        }
    }

    /**
     * Force-overwrites computed numeric cells in BCC_157 (F-142) export.
     * For each computed cell: removeFormula() + setCellType(NUMERIC) + setCellValue().
     * This is the final defense against stale formulas or string placeholders that survived
     * copyCell and directComputeBcc157FromReplacements (which uses setCellNumericValue
     * without removeFormula/setCellType).
     * <p>
     * Follows the same pattern as F-148's exportDynamicReport — programmatic values only,
     * no template formulas.
     *
     * @param sheet       the destination sheet
     * @param replacements the replacements map containing all placeholder → value mappings
     */
    private void forceWriteNumericCells(Sheet sheet, Map<String, String> replacements) {
        // Read input values from replacements map
        double d14 = parseReplacement(replacements, "${zobjComReport.taiSanNguyenGiaSoDuDauNam.asText()}");
        double d15 = parseReplacement(replacements, "${zobjComReport.taiSanNguyenGiaTangTrongNam.asText()}");
        double d16 = parseReplacement(replacements, "${zobjComReport.taiSanNguyenGiaGiamTrongNam.asText()}");
        double d19 = parseReplacement(replacements, "${zobjComReport.taiSanGiaTriHaoMonSoDuDauNam.asText()}");
        double d20 = parseReplacement(replacements, "${zobjComReport.taiSanGiaTriHaoMonTangTrongNam.asText()}");
        double d21 = parseReplacement(replacements, "${zobjComReport.taiSanGiaTriHaoMonGiamTrongNam.asText()}");

        // Compute formula results
        double d17 = d14 + d15 - d16;         // Số dư cuối năm Nguyên giá
        double d22 = d19 + d20 - d21;         // Số dư cuối năm Hao mòn
        double d24 = d14 - d19;               // Giá trị còn lại Đầu năm
        double d25 = d17 - d22;               // Giá trị còn lại Cuối năm

        // Force-write D column: removeFormula() + setCellType(NUMERIC) + setCellValue()
        forceCellValue(sheet, 16, 3, d17);   // D17
        forceCellValue(sheet, 21, 3, d22);   // D22
        forceCellValue(sheet, 23, 3, d24);   // D24
        forceCellValue(sheet, 24, 3, d25);   // D25

        // Force-write E column (Tổng cộng = D column values)
        forceCellValue(sheet, 13, 4, d14);   // E14
        forceCellValue(sheet, 14, 4, d15);   // E15
        forceCellValue(sheet, 15, 4, d16);   // E16
        forceCellValue(sheet, 16, 4, d17);   // E17
        forceCellValue(sheet, 18, 4, d19);   // E19
        forceCellValue(sheet, 19, 4, d20);   // E20
        forceCellValue(sheet, 20, 4, d21);   // E21
        forceCellValue(sheet, 21, 4, d22);   // E22
        forceCellValue(sheet, 23, 4, d24);   // E24
        forceCellValue(sheet, 24, 4, d25);   // E25
    }

    /**
     * Forcibly sets a numeric value in a cell by removing any formula, setting
     * the cell type to NUMERIC, then setting the value — defeating any stale
     * formula or string formatting on the cell.
     *
     * @param sheet  the sheet
     * @param rowIdx 0-based row index
     * @param colIdx 0-based column index
     * @param value  the numeric value to set
     */
    private void forceCellValue(Sheet sheet, int rowIdx, int colIdx, double value) {
        Row row = sheet.getRow(rowIdx);
        if (row == null) row = sheet.createRow(rowIdx);
        Cell cell = row.getCell(colIdx);
        if (cell == null) cell = row.createCell(colIdx);
        // Remove any formula the cell may have (from the copied template)
        cell.removeFormula();
        // Force type to NUMERIC — defeats any stale STRING placeholder
        cell.setCellType(CellType.NUMERIC);
        // Set the computed value
        cell.setCellValue(value);
        // Apply format
        setNumericCellFormat(cell, value);
    }

    /**
     * Parses a numeric value from the replacements map for a given key.
     * Returns 0 if the key is missing, blank, or unparseable.
     *
     * @param replacements the replacements map
     * @param key          the placeholder key to look up
     * @return the parsed double value, or 0 if unavailable
     */
    private double parseReplacement(Map<String, String> replacements, String key) {
        String val = replacements.get(key);
        if (val == null || val.isBlank()) return 0;
        try {
            return Double.parseDouble(val);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /**
     * Reads a numeric value from a cell, handling both NUMERIC and STRING cell types.
     * Returns 0 if the cell is empty or unparseable.
     */
    private double getCellNumericValue(Sheet sheet, int rowIdx, int colIdx) {
        Row row = sheet.getRow(rowIdx);
        if (row == null) return 0;
        Cell cell = row.getCell(colIdx);
        if (cell == null) return 0;
        try {
            return cell.getNumericCellValue();
        } catch (Exception e) {
            try {
                return Double.parseDouble(cell.getStringCellValue().replaceAll("[^\\d.-]", ""));
            } catch (Exception ignored) {
                return 0;
            }
        }
    }

    /**
     * Sets a numeric value in a cell with proper formatting.
     * Creates the row/cell if it doesn't exist.
     */
    private void setCellNumericValue(Sheet sheet, int rowIdx, int colIdx, double value) {
        Row row = sheet.getRow(rowIdx);
        if (row == null) row = sheet.createRow(rowIdx);
        Cell cell = row.getCell(colIdx);
        if (cell == null) cell = row.createCell(colIdx);
        cell.setCellValue(value);
        setNumericCellFormat(cell, value);
    }

    /**
     * @deprecated Returns fake/hardcoded asset values — no real asset value data exists in V2 entities.
     *             Replaced with literal 0 in F-143 methods. Scheduled for removal once a real asset
     *             value source is available.
     */
    @Deprecated
    private long getPointAssetValue(com.hanghai.kchtg.gis.point.entity.PointObject p) {
        long val = 500000000L;

        if (p.getCode() != null) {
            if (p.getCode().contains("HPH"))
                val = 12000000000L;
            else if (p.getCode().contains("BLV"))
                val = 15000000000L;
        }

        return val;
    }

    /**
     * Null-safe converter: returns the String value, or empty string if null.
     */
    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }

    /**
     * Converts a BigDecimal to plain string (no scientific notation).
     * Returns empty string if the value is null.
     */
    private static String bigDecimalToPlainString(java.math.BigDecimal value) {
        return value != null ? value.toPlainString() : "";
    }

    private void setNumericValue(Cell cell, double value) {
        if (cell != null) {
            cell.removeFormula();

            cell.setCellValue(value);

            setNumericCellFormat(cell, value);
        }
    }

    private String getPointAssetUnit(com.hanghai.kchtg.gis.point.entity.PointObject p) {
        if (p.getObjectType() == com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.BEACON ||

                p.getObjectType() == com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.LIGHTHOUSE) {
            return "Hệ thống";
        } else if (p.getObjectType() == com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.BUOY) {
            return "Quả";
        } else {
            return "Cái";
        }
    }

    private ReportResponse buildPreviewResponse(String code, List<String> headers, List<Map<String, Object>> rows,
            Map<String, Object> summary) {
        return ReportResponse.builder()
                .code(code)
                .name("Xem trước: " + code)
                .reportType(ReportType.SUMMARY)
                .status(ReportStatus.READY)
                .generatedAt(Instant.now())
                .headers(headers)
                .rows(rows)
                .summary(summary)
                .build();
    }

    // ==========================================

    // INNER WORKINGS: POI TO PDF HIGH FIDELITY

    // ==========================================

    private void setNumericCellFormat(Cell cell, double d) {
        try {
            Workbook wb = cell.getSheet().getWorkbook();

            CellStyle originalStyle = cell.getCellStyle();

            CellStyle newStyle = wb.createCellStyle();

            newStyle.cloneStyleFrom(originalStyle);

            if (d == Math.floor(d)) {
                newStyle.setDataFormat(wb.createDataFormat().getFormat("#,##0"));
            } else {
                newStyle.setDataFormat(wb.createDataFormat().getFormat("#,##0.0000"));
            }

            cell.setCellStyle(newStyle);
        } catch (Exception e) {
            log.warn("Failed to set cell format dynamically", e);
        }
    }

    private void copyCell(Cell srcCell, Cell destCell, Map<String, String> replacements) {
        if (srcCell == null)
            return;

        destCell.setCellStyle(srcCell.getCellStyle());

        switch (srcCell.getCellType()) {
            case STRING:

                String val = srcCell.getStringCellValue();

                if (val != null) {
                    String trimVal = val.trim();

                    if (trimVal.startsWith("${") && trimVal.endsWith("}")) {
                        if (replacements.containsKey(trimVal)) {
                            String repVal = replacements.get(trimVal);

                            try {
                                double d = Double.parseDouble(repVal);

                                destCell.setCellValue(d);

                                setNumericCellFormat(destCell, d);

                                break;
                            } catch (NumberFormatException e) {
                                if (repVal == null || repVal.isBlank()) {
                                    destCell.setCellValue(0);
                                    setNumericCellFormat(destCell, 0);
                                } else {
                                    destCell.setCellValue(repVal);
                                }

                                break;
                            }
                        }
                    }

                    // Normalize thiz → this for template compatibility (BCC_158.xlsx uses thiz)
                    if (val.contains("thiz.")) {
                        val = val.replace("thiz.", "this.");
                    }

                    for (Map.Entry<String, String> entry : replacements.entrySet()) {
                        if (val.contains(entry.getKey())) {
                            val = val.replace(entry.getKey(), entry.getValue() != null ? entry.getValue() : "");
                        }
                    }

                    if (val.startsWith("=")) {
                        destCell.setCellFormula(val.substring(1));
                        // Use Java-side resolveFormulaCell() which strips VALUE(), reads
                        // referenced cell values, computes arithmetic, and replaces the formula
                        // with a plain numeric value. POI's evaluateFormulaCell() fails on
                        // VALUE() and corrupts the cell to ERROR type, causing formula text
                        // to show in PDF export.
                        resolveFormulaCell(destCell);
                        break;
                    }

                    if (val.matches("^-?\\d+(\\.\\d+)?$")) {
                        try {
                            double d = Double.parseDouble(val);
                            destCell.setCellValue(d);
                            setNumericCellFormat(destCell, d);
                            break;
                        } catch (NumberFormatException ignored) {
                        }
                    }
                }

                destCell.setCellValue(val);

                break;

            case NUMERIC:

                destCell.setCellValue(srcCell.getNumericCellValue());

                break;

            case FORMULA:
                String formulaText = srcCell.getCellFormula();
                destCell.setCellFormula(formulaText);
                // BCC_157 template stores placeholders as FORMULA cells (not STRING)
                // e.g. formula="${zobjComReport.taiSanNguyenGiaSoDuDauNam.asText()}"
                // We must check if this is actually a placeholder, not a real formula
                if (formulaText != null && formulaText.trim().startsWith("${") && formulaText.trim().endsWith("}")) {
                    // This is a placeholder formula — replace with actual value from replacements map
                    String trimFormula = formulaText.trim();
                    if (replacements.containsKey(trimFormula)) {
                        String repVal = replacements.get(trimFormula);
                        try {
                            double d = Double.parseDouble(repVal);
                            destCell.setCellValue(d);
                            setNumericCellFormat(destCell, d);
                        } catch (NumberFormatException e) {
                            if (repVal == null || repVal.isBlank()) {
                                destCell.setCellValue(0);
                                setNumericCellFormat(destCell, 0);
                            } else {
                                destCell.setCellValue(repVal);
                            }
                        }
                    }
                } else {
                    // Real Excel formula — resolve with Java compute
                    resolveFormulaCell(destCell);
                }

                break;

            case BOOLEAN:

                destCell.setCellValue(srcCell.getBooleanCellValue());

                break;

            case ERROR:

                destCell.setCellErrorValue(srcCell.getErrorCellValue());

                break;

            default:

                break;
        }
    }

    /**
     * Writes one Port port row + its BenCang children + each BenCang's Pier children
     * to the destination sheet. Returns the next available destination row index.
     * Used by F-148 (BCKCHT_163) hierarchical export.
     */
    private int writeF148PortHierarchyToSheet(
            Sheet destSheet,
            int currentDestRow,
            Row portTemplateRow,
            Row wharfTemplateRow,
            com.hanghai.kchtg.cangben.entity.Port port,
            int stt,
            int reportYear) {

        // Resolve org-unit name for this port
        String donViPort = "";
        if (port.getOrgUnitId() != null) {
            donViPort = orgUnitRepository.findById(port.getOrgUnitId())
                    .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                    .orElse("");
        }

        int numPortCols = portTemplateRow.getLastCellNum();

        // ── Port (Cảng biển) row ──
        Row portRow = destSheet.createRow(currentDestRow++);
        portRow.setHeight(portTemplateRow.getHeight());
        for (int c = 0; c < numPortCols; c++) {
            Cell srcCell = portTemplateRow.getCell(c);
            if (srcCell != null) {
                Cell destCell = portRow.createCell(c);
                destCell.setCellStyle(srcCell.getCellStyle());
                if (c == 0) {
                    destCell.setCellValue(String.valueOf(stt));
                } else if (c == 1) {
                    destCell.setCellValue(port.getPortName() != null ? port.getPortName() : "");
                } else if (c == 2) {
                    destCell.setCellValue(donViPort);
                } else if (c == 3) {
                    destCell.setCellValue(port.getProvince() != null ? port.getProvince() : "");
                } else if (c == 4) {
                    destCell.setCellValue(f148FormatThoiDiem(port.getCreatedAt()));
                } else if (c == 5) {
                    destCell.setCellValue("");
                } else if (c == 6) {
                    destCell.setCellValue("");
                } else if (c == 7) {
                    destCell.setCellValue("");
                } else if (c == 8) {
                    destCell.setCellValue("tấn/năm");
                } else if (c == 9) {
                    destCell.setCellValue("");
                } else if (c == 10) {
                    double portDwt = port.getMaxVesselCapacity() != null
                            ? port.getMaxVesselCapacity().doubleValue() : 0.0;
                    destCell.setCellValue(portDwt);
                    if (portDwt != 0) {
                        setNumericCellFormat(destCell, portDwt);
                    }
                } else if (c == 11) {
                    destCell.setCellValue("");
                } else {
                    destCell.setCellValue("");
                }
            }
        }

        // ── Berths (Bến cảng) under this port ──
        int numWharfCols = wharfTemplateRow.getLastCellNum();
        List<com.hanghai.kchtg.cangben.entity.Berth> berths =
                benCangRepository.findByPortIdAndDeletedAtIsNull(port.getId());
        for (com.hanghai.kchtg.cangben.entity.Berth berth : berths) {
            String donViBerth = "";
            if (berth.getOrgUnitId() != null) {
                donViBerth = orgUnitRepository.findById(berth.getOrgUnitId())
                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)
                        .orElse("");
            }

            String diaDiemBerth = berth.getLocationCode() != null ? berth.getLocationCode()
                    : (port.getProvince() != null ? port.getProvince() : "");

            String thoiDiemBerth = f148FormatThoiDiem(berth.getOpeningAnnouncementDate());
            if (thoiDiemBerth.isEmpty()) {
                thoiDiemBerth = f148FormatThoiDiem(berth.getCreatedAt());
            }

            double dwtBerth = berth.getMaxVesselSize() != null
                    ? berth.getMaxVesselSize().doubleValue() : 0.0;

            Row berthRow = destSheet.createRow(currentDestRow++);
            berthRow.setHeight(wharfTemplateRow.getHeight());
            for (int c = 0; c < numWharfCols; c++) {
                Cell srcCell = wharfTemplateRow.getCell(c);
                if (srcCell != null) {
                    Cell destCell = berthRow.createCell(c);
                    destCell.setCellStyle(srcCell.getCellStyle());
                    if (c == 0) {
                        destCell.setCellValue("");
                    } else if (c == 1) {
                        destCell.setCellValue("    " + (berth.getBerthName() != null ? berth.getBerthName() : ""));
                    } else if (c == 2) {
                        destCell.setCellValue(donViBerth);
                    } else if (c == 3) {
                        destCell.setCellValue(diaDiemBerth);
                    } else if (c == 4) {
                        destCell.setCellValue(thoiDiemBerth);
                    } else if (c == 5) {
                        destCell.setCellValue(berth.getOperationalFunction() != null ? berth.getOperationalFunction() : "");
                    } else if (c == 6) {
                        // Năm trước = nangLucThongQuaHienTrang if updatedAt.year == reportYear - 1
                        double nlTruoc = (berth.getCurrentThroughput() != null
                                && berth.getUpdatedAt() != null
                                && berth.getUpdatedAt().getYear() == reportYear - 1)
                                ? berth.getCurrentThroughput().doubleValue() : 0.0;
                        destCell.setCellValue(nlTruoc);
                        if (nlTruoc != 0) {
                            setNumericCellFormat(destCell, nlTruoc);
                        }
                    } else if (c == 7) {
                        // Năm báo cáo = nangLucThongQuaHienTrang
                        double nlBaoCao = berth.getCurrentThroughput() != null
                                ? berth.getCurrentThroughput().doubleValue() : 0.0;
                        destCell.setCellValue(nlBaoCao);
                        if (nlBaoCao != 0) {
                            setNumericCellFormat(destCell, nlBaoCao);
                        }
                    } else if (c == 8) {
                        destCell.setCellValue("tấn/năm");
                    } else if (c == 9) {
                        double chieuDai = berth.getLength() != null ? berth.getLength().doubleValue() : 0.0;
                        destCell.setCellValue(chieuDai);
                        if (chieuDai != 0) {
                            setNumericCellFormat(destCell, chieuDai);
                        }
                    } else if (c == 10) {
                        destCell.setCellValue(dwtBerth);
                        if (dwtBerth != 0) {
                            setNumericCellFormat(destCell, dwtBerth);
                        }
                    } else if (c == 11) {
                        destCell.setCellValue("");
                    } else {
                        destCell.setCellValue("");
                    }
                }
            }

            // ── Wharves (Cầu cảng) under this berth ──
            List<com.hanghai.kchtg.cangben.entity.Pier> wharves =
                    cauCangRepository.findByBerthIdAndDeletedAtIsNull(berth.getId());
            for (com.hanghai.kchtg.cangben.entity.Pier wharf : wharves) {
                double dwtWharf = wharf.getDesignLoad() != null
                        ? wharf.getDesignLoad().doubleValue() : 0.0;

                Row wharfRow = destSheet.createRow(currentDestRow++);
                wharfRow.setHeight(wharfTemplateRow.getHeight());
                for (int c = 0; c < numWharfCols; c++) {
                    Cell srcCell = wharfTemplateRow.getCell(c);
                    if (srcCell != null) {
                        Cell destCell = wharfRow.createCell(c);
                        destCell.setCellStyle(srcCell.getCellStyle());
                        if (c == 0) {
                            destCell.setCellValue("");
                        } else if (c == 1) {
                            destCell.setCellValue("        " + (wharf.getPierName() != null ? wharf.getPierName() : ""));
                        } else if (c == 2) {
                            destCell.setCellValue("");
                        } else if (c == 3) {
                            destCell.setCellValue("");
                        } else if (c == 4) {
                            destCell.setCellValue("");
                        } else if (c == 5) {
                            destCell.setCellValue(wharf.getOperationalFunction() != null ? wharf.getOperationalFunction() : "");
                        } else if (c == 6) {
                            destCell.setCellValue("");
                        } else if (c == 7) {
                            destCell.setCellValue("");
                        } else if (c == 8) {
                            destCell.setCellValue("tấn/năm");
                        } else if (c == 9) {
                            double chieuDaiWharf = wharf.getLength() != null ? wharf.getLength().doubleValue() : 0.0;
                            destCell.setCellValue(chieuDaiWharf);
                            if (chieuDaiWharf != 0) {
                                setNumericCellFormat(destCell, chieuDaiWharf);
                            }
                        } else if (c == 10) {
                            destCell.setCellValue(dwtWharf);
                            if (dwtWharf != 0) {
                                setNumericCellFormat(destCell, dwtWharf);
                            }
                        } else if (c == 11) {
                            destCell.setCellValue("");
                        } else {
                            destCell.setCellValue("");
                        }
                    }
                }
            }
        }

        return currentDestRow;
    }

    private String formatDouble(double dVal) {
        if (Double.isNaN(dVal) || Double.isInfinite(dVal)) {
            return "";
        }

        java.math.BigDecimal bd = java.math.BigDecimal.valueOf(dVal);

        if (dVal == (long) dVal) {
            return bd.toBigInteger().toString();
        }

        String plain = bd.toPlainString();

        if (plain.indexOf('.') > 0) {
            plain = plain.replaceAll("0+$", "").replaceAll("\\.$", "");
        }

        return plain;
    }

    private boolean isTableRow(Sheet sheet, int r) {
        int startRow = -1;

        for (int i = 0; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);

            if (row == null)
                continue;

            for (int c = 0; c < row.getLastCellNum(); c++) {
                Cell cell = row.getCell(c);

                if (cell != null && cell.getCellType() == CellType.STRING) {
                    String val = cell.getStringCellValue();

                    if ("STT".equalsIgnoreCase(val) || "Số TT".equalsIgnoreCase(val)) {
                        startRow = i;

                        break;
                    }
                }
            }

            if (startRow != -1)
                break;
        }

        if (startRow == -1) {
            startRow = 7;
        }

        int endRow = sheet.getLastRowNum();

        for (int i = startRow; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);

            if (row == null)
                continue;

            for (int c = 0; c < row.getLastCellNum(); c++) {
                Cell cell = row.getCell(c);

                if (cell != null && cell.getCellType() == CellType.STRING) {
                    String val = cell.getStringCellValue();

                    if (val != null) {
                        String clean = val.trim();

                        if (clean.contains("NGƯỜI LẬP") || clean.contains("Người lập") ||

                                clean.contains("ngày... tháng... năm") || clean.contains("ngày … tháng") ||

                                clean.contains("Thủ trưởng đơn vị") || clean.contains("Người báo cáo") ||

                                clean.contains("Trực ban")) {
                            endRow = i - 1;

                            break;
                        }
                    }
                }
            }

            if (endRow < sheet.getLastRowNum())
                break;
        }

        return r >= startRow && r <= endRow;
    }

    private boolean isRowBlank(Row row, int maxCols) {
        if (row == null)
            return true;

        for (int c = 0; c < maxCols; c++) {
            Cell cell = row.getCell(c);

            if (cell != null && cell.getCellType() != CellType.BLANK) {
                if (cell.getCellType() == CellType.STRING) {
                    String val = cell.getStringCellValue();

                    if (val != null && !val.trim().isEmpty()) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        return true;
    }

    private byte[] convertExcelToPdf(Sheet sheet) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(baos);

            com.itextpdf.kernel.pdf.PdfDocument pdf = new com.itextpdf.kernel.pdf.PdfDocument(writer);

            PrintSetup printSetup = sheet.getPrintSetup();

            int maxCols = 0;

            for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);

                if (row != null) {
                    for (int c = 0; c < row.getLastCellNum(); c++) {
                        Cell cell = row.getCell(c);

                        if (cell != null && cell.getCellType() != CellType.BLANK) {
                            boolean hasVal = false;

                            if (cell.getCellType() == CellType.STRING) {
                                String val = cell.getStringCellValue();

                                if (val != null && !val.isBlank()) {
                                    hasVal = true;
                                }
                            } else if (cell.getCellType() == CellType.NUMERIC || cell.getCellType() == CellType.FORMULA
                                    || cell.getCellType() == CellType.BOOLEAN) {
                                hasVal = true;
                            }

                            if (hasVal && (c + 1) > maxCols) {
                                maxCols = c + 1;
                            }
                        }
                    }
                }
            }

            if (maxCols <= 0)
                maxCols = 1;

            boolean isLandscape = false;

            com.itextpdf.kernel.geom.PageSize pdfPageSize = com.itextpdf.kernel.geom.PageSize.A4;

            if (printSetup != null) {
                short excelPaperSize = printSetup.getPaperSize();

                boolean excelLandscape = printSetup.getLandscape();

                if (excelPaperSize == 1)
                    pdfPageSize = com.itextpdf.kernel.geom.PageSize.LETTER;
                else if (excelPaperSize == 3)
                    pdfPageSize = new com.itextpdf.kernel.geom.PageSize(792, 1224);
                else if (excelPaperSize == 8)
                    pdfPageSize = com.itextpdf.kernel.geom.PageSize.A3;
                else
                    pdfPageSize = com.itextpdf.kernel.geom.PageSize.A4;

                isLandscape = excelLandscape;
            }

            // Force landscape and Tabloid size for wide reports

            if (maxCols > 7) {
                isLandscape = true;
            }

            if (maxCols > 10) {
                pdfPageSize = new com.itextpdf.kernel.geom.PageSize(792, 1224); // Tabloid
            }

            if (isLandscape) {
                pdfPageSize = pdfPageSize.rotate();
            }

            pdf.setDefaultPageSize(pdfPageSize);

            com.itextpdf.layout.Document doc = new com.itextpdf.layout.Document(pdf);

            float leftMargin = 15f;
            float rightMargin = 15f;
            float topMargin = 20f;
            float bottomMargin = 20f;

            if (printSetup != null) {
                float excelLeft = (float) sheet.getMargin(org.apache.poi.ss.usermodel.PageMargin.LEFT) * 72f;
                float excelRight = (float) sheet.getMargin(org.apache.poi.ss.usermodel.PageMargin.RIGHT) * 72f;
                float excelTop = (float) sheet.getMargin(org.apache.poi.ss.usermodel.PageMargin.TOP) * 72f;
                float excelBottom = (float) sheet.getMargin(org.apache.poi.ss.usermodel.PageMargin.BOTTOM) * 72f;

                if (excelLeft > 0)
                    leftMargin = excelLeft;

                if (excelRight > 0)
                    rightMargin = excelRight;

                if (excelTop > 0)
                    topMargin = excelTop;

                if (excelBottom > 0)
                    bottomMargin = excelBottom;
            }

            doc.setMargins(topMargin, rightMargin, bottomMargin, leftMargin);

            byte[] fontBytes = null;

            try (InputStream fontIs = getClass().getClassLoader().getResourceAsStream("fonts/times.ttf")) {
                if (fontIs != null)
                    fontBytes = fontIs.readAllBytes();
            }

            com.itextpdf.kernel.font.PdfFont pdfFont;

            if (fontBytes != null) {
                pdfFont = com.itextpdf.kernel.font.PdfFontFactory.createFont(
                        fontBytes, com.itextpdf.io.font.PdfEncodings.IDENTITY_H);

                doc.setFont(pdfFont);
            }

            float fontScale = 1.0f;

            doc.setFontSize(10f);

            float[] colWidths = new float[maxCols];

            for (int c = 0; c < maxCols; c++) {
                colWidths[c] = (float) sheet.getColumnWidth(c);
            }

            com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(colWidths);

            table.setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100f));

            boolean[][] visited = new boolean[sheet.getLastRowNum() + 2][maxCols + 2];

            boolean[] rowHasBorder = new boolean[Math.max(1, sheet.getLastRowNum() + 1)];

            for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);

                if (row == null)
                    continue;

                for (int c = 0; c < row.getLastCellNum(); c++) {
                    Cell cell = row.getCell(c);

                    if (cell != null && cell.getCellStyle() != null) {
                        CellStyle style = cell.getCellStyle();

                        if (r >= 8 && r <= 12 && c <= 2) {
                            log.info("Row {} Col {}: topBorder={}, bottomBorder={}, leftBorder={}, rightBorder={}", r,
                                    c, style.getBorderTop(), style.getBorderBottom(), style.getBorderLeft(),
                                    style.getBorderRight());
                        }

                        if (style.getBorderTop() != org.apache.poi.ss.usermodel.BorderStyle.NONE ||

                                style.getBorderBottom() != org.apache.poi.ss.usermodel.BorderStyle.NONE ||

                                style.getBorderLeft() != org.apache.poi.ss.usermodel.BorderStyle.NONE ||

                                style.getBorderRight() != org.apache.poi.ss.usermodel.BorderStyle.NONE) {
                            rowHasBorder[r] = true;

                            break;
                        }
                    }
                }
            }

            for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);

                if (row == null || isRowBlank(row, maxCols)) {
                    continue;
                }

                boolean isTable = isTableRow(sheet, r);

                for (int c = 0; c < maxCols; c++) {
                    if (visited[r][c])
                        continue;

                    Cell cell = row.getCell(c);

                    org.apache.poi.ss.util.CellRangeAddress mergedRegion = null;

                    for (int i = 0; i < sheet.getNumMergedRegions(); i++) {
                        org.apache.poi.ss.util.CellRangeAddress region = sheet.getMergedRegion(i);

                        if (region.isInRange(r, c)) {
                            mergedRegion = region;

                            break;
                        }
                    }

                    com.itextpdf.layout.element.Cell pdfCell;

                    if (mergedRegion != null) {
                        int rSpan = mergedRegion.getLastRow() - mergedRegion.getFirstRow() + 1;
                        int cSpan = mergedRegion.getLastColumn() - mergedRegion.getFirstColumn() + 1;

                        pdfCell = new com.itextpdf.layout.element.Cell(rSpan, cSpan);
                    } else {
                        pdfCell = new com.itextpdf.layout.element.Cell();
                    }

                    pdfCell.setPadding(2f);

                    if (cell != null && cell.getCellStyle() != null) {
                        CellStyle style = cell.getCellStyle();

                        int fontIdx = style.getFontIndex();

                        Font font = sheet.getWorkbook().getFontAt(fontIdx);

                        if (font != null) {
                            float fSize = (float) font.getFontHeightInPoints() * fontScale;
                            String cellStr = "";

                            try {
                                if (cell.getCellType() == CellType.STRING)
                                    cellStr = cell.getStringCellValue();
                            } catch (Exception ignored) {
                            }

                            if (!isTable && r >= sheet.getLastRowNum() - 8 && cellStr != null
                                    && cellStr.trim().length() > 15) {
                                fSize = fSize * 0.75f;
                            }

                            pdfCell.setFontSize(fSize);

                            if (font.getBold())
                                pdfCell.setBold();

                            if (font.getItalic())
                                pdfCell.setItalic();
                        }

                        if (style.getAlignment() == org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER) {
                            pdfCell.setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER);
                        } else if (style.getAlignment() == org.apache.poi.ss.usermodel.HorizontalAlignment.RIGHT) {
                            pdfCell.setTextAlignment(com.itextpdf.layout.properties.TextAlignment.RIGHT);
                        } else {
                            pdfCell.setTextAlignment(com.itextpdf.layout.properties.TextAlignment.LEFT);
                        }

                        CellStyle bottomStyle = style;

                        CellStyle rightStyle = style;

                        if (mergedRegion != null) {
                            Row bRow = sheet.getRow(mergedRegion.getLastRow());

                            if (bRow != null) {
                                Cell bCell = bRow.getCell(c);

                                if (bCell != null && bCell.getCellStyle() != null)
                                    bottomStyle = bCell.getCellStyle();
                            }

                            Row rRow = sheet.getRow(r);

                            if (rRow != null) {
                                Cell rCell = rRow.getCell(mergedRegion.getLastColumn());

                                if (rCell != null && rCell.getCellStyle() != null)
                                    rightStyle = rCell.getCellStyle();
                            }
                        }

                        boolean borderTop = isTable || rowHasBorder[r];
                        boolean borderBottom = isTable || rowHasBorder[r];
                        boolean borderLeft = isTable || rowHasBorder[r];
                        boolean borderRight = isTable || rowHasBorder[r];

                        if (style.getBorderTop() != org.apache.poi.ss.usermodel.BorderStyle.NONE)
                            borderTop = true;

                        if (bottomStyle.getBorderBottom() != org.apache.poi.ss.usermodel.BorderStyle.NONE)
                            borderBottom = true;

                        if (style.getBorderLeft() != org.apache.poi.ss.usermodel.BorderStyle.NONE)
                            borderLeft = true;

                        if (rightStyle.getBorderRight() != org.apache.poi.ss.usermodel.BorderStyle.NONE)
                            borderRight = true;

                        if (borderTop) {
                            pdfCell.setBorderTop(new com.itextpdf.layout.borders.SolidBorder(
                                    com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f));
                        } else {
                            pdfCell.setBorderTop(com.itextpdf.layout.borders.Border.NO_BORDER);
                        }

                        if (borderBottom) {
                            pdfCell.setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(
                                    com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f));
                        } else {
                            pdfCell.setBorderBottom(com.itextpdf.layout.borders.Border.NO_BORDER);
                        }

                        if (borderLeft) {
                            pdfCell.setBorderLeft(new com.itextpdf.layout.borders.SolidBorder(
                                    com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f));
                        } else {
                            pdfCell.setBorderLeft(com.itextpdf.layout.borders.Border.NO_BORDER);
                        }

                        if (borderRight) {
                            pdfCell.setBorderRight(new com.itextpdf.layout.borders.SolidBorder(
                                    com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f));
                        } else {
                            pdfCell.setBorderRight(com.itextpdf.layout.borders.Border.NO_BORDER);
                        }
                    } else {
                        if (isTable || rowHasBorder[r]) {
                            pdfCell.setBorder(new com.itextpdf.layout.borders.SolidBorder(
                                    com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f));
                        } else {
                            pdfCell.setBorder(com.itextpdf.layout.borders.Border.NO_BORDER);
                        }
                    }

                    String valText = "";

                    if (cell != null) {
                        org.apache.poi.ss.usermodel.DataFormatter formatter = new org.apache.poi.ss.usermodel.DataFormatter();

                        valText = formatter.formatCellValue(cell);
                    }

                    pdfCell.add(new com.itextpdf.layout.element.Paragraph(valText));

                    if (valText != null) {
                        String clean = valText.trim();

                        if (clean.contains("NGƯỜI LẬP") || clean.contains("Người lập") ||

                                clean.startsWith("(Ký") || clean.contains("BỘ TRƯỞNG") ||

                                clean.contains("CHỦ TỊCH") || clean.contains("ngày... tháng... năm") ||

                                clean.contains("ngày … tháng … năm")) {
                            pdfCell.setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER);
                        }
                    }

                    if (mergedRegion != null) {
                        for (int mr = mergedRegion.getFirstRow(); mr <= mergedRegion.getLastRow(); mr++) {
                            for (int mc = mergedRegion.getFirstColumn(); mc <= mergedRegion.getLastColumn(); mc++) {
                                if (mr < visited.length && mc < visited[mr].length) {
                                    visited[mr][mc] = true;
                                }
                            }
                        }
                    }

                    table.addCell(pdfCell);
                }
            }

            doc.add(table);

            doc.close();

            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to convert Excel to PDF", e);

            throw new RuntimeException("Failed to convert Excel to PDF: " + e.getMessage(), e);
        }
    }
}
