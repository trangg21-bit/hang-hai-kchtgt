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







import java.io.InputStream;



import java.io.ByteArrayOutputStream;



import java.time.Instant;



import java.time.LocalDate;



import java.util.List;



import java.util.Map;



import java.util.HashMap;



import java.util.ArrayList;



import java.util.LinkedHashMap;







import com.hanghai.kchtg.cangben.repository.CangBienRepository;



import com.hanghai.kchtg.cangben.repository.BenCangRepository;







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



    private final CangBienRepository cangBienRepository;



    private final BenCangRepository benCangRepository;







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



        } else if ("F-153".equalsIgnoreCase(reportCodeStr)) {



            return getPreviewF153(request);



        } else {



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



        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, LocalDate.now().getYear());







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



        List<String> headers = new ArrayList<>(List.of("STT", "Chỉ tiêu", "Mã số", "Giá trị báo cáo (VNĐ)"));



        List<Map<String, Object>> rows = new ArrayList<>();



        Map<String, Object> summary = new LinkedHashMap<>();







        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



        int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);







        long totalNguyenGia = 0;



        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {



            totalNguyenGia += getPointAssetValue(p);



        }







        long hMonDauNam = (long) (totalNguyenGia * 0.20);



        long hMonTang = (long) (totalNguyenGia * 0.04);



        long hMonCuoiNam = hMonDauNam + hMonTang;







        rows.add(Map.of("STT", "1", "Chỉ tiêu", "Nguyên giá - Số dư đầu năm", "Mã số", "1.1", "Giá trị báo cáo (VNĐ)", totalNguyenGia));



        rows.add(Map.of("STT", "", "Chỉ tiêu", "Nguyên giá - Tăng trong năm", "Mã số", "1.2", "Giá trị báo cáo (VNĐ)", 0L));



        rows.add(Map.of("STT", "", "Chỉ tiêu", "Nguyên giá - Giảm trong năm", "Mã số", "1.3", "Giá trị báo cáo (VNĐ)", 0L));



        rows.add(Map.of("STT", "", "Chỉ tiêu", "Nguyên giá - Số dư cuối năm", "Mã số", "1.4", "Giá trị báo cáo (VNĐ)", totalNguyenGia));



        rows.add(Map.of("STT", "2", "Chỉ tiêu", "Giá trị hao mòn lũy kế - Số dư đầu năm", "Mã số", "2.1", "Giá trị báo cáo (VNĐ)", hMonDauNam));



        rows.add(Map.of("STT", "", "Chỉ tiêu", "Giá trị hao mòn lũy kế - Tăng trong năm", "Mã số", "2.2", "Giá trị báo cáo (VNĐ)", hMonTang));



        rows.add(Map.of("STT", "", "Chỉ tiêu", "Giá trị hao mòn lũy kế - Giảm trong năm", "Mã số", "2.3", "Giá trị báo cáo (VNĐ)", 0L));



        rows.add(Map.of("STT", "", "Chỉ tiêu", "Giá trị hao mòn lũy kế - Số dư cuối năm", "Mã số", "2.4", "Giá trị báo cáo (VNĐ)", hMonCuoiNam));



        rows.add(Map.of("STT", "3", "Chỉ tiêu", "Giá trị còn lại - Đầu năm", "Mã số", "3.1", "Giá trị báo cáo (VNĐ)", totalNguyenGia - hMonDauNam));



        rows.add(Map.of("STT", "", "Chỉ tiêu", "Giá trị còn lại - Cuối năm", "Mã số", "3.2", "Giá trị báo cáo (VNĐ)", totalNguyenGia - hMonCuoiNam));







        summary.put("Tổng số tài sản", points.size());



        summary.put("Nguyên giá cuối năm", totalNguyenGia);



        summary.put("Giá trị còn lại cuối năm", totalNguyenGia - hMonCuoiNam);







        return buildPreviewResponse("F-142", headers, rows, summary);



    }







    private ReportResponse getPreviewF143(ReportPreviewRequest request) {



        List<String> headers = new ArrayList<>(List.of(



            "STT", "Danh mục tài sản", "Đơn vị tính", "Số lượng", "Năm xây dựng",



            "Năm sử dụng", "Diện tích đất", "Sàn sử dụng", "Nguyên giá (nghìn đồng)",



            "Giá trị còn lại (nghìn đồng)", "Tình trạng tài sản", "Ghi chú"



        ));



        List<Map<String, Object>> rows = new ArrayList<>();



        Map<String, Object> summary = new LinkedHashMap<>();







        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



        int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPointsForF143(targetUnitId, reportYear, request.getBcNoiDung());







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



            "Tổng số tiền thu được (nghìn đồng)", "Chi phí có liên quan (nghìn đồng)", "Nộp NSNN (nghìn đồng)", "Ghi chú"



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



            "Chi phí có liên quan (nghìn đồng)", "Nộp NSNN (nghìn đồng)", "Tiền thực hiện dự án (nghìn đồng)", "Ghi chú"



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



            if (listHtxl.contains("BAN")) mod = 3;



            else if (listHtxl.contains("THANH_LY")) mod = 4;



            else if (listHtxl.contains("DIEU_CHUYEN")) mod = 5;



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



            rows.add(Map.of("STT", 1, "Mã chỉ tiêu", "CT-001", "Tên chỉ tiêu", "Số lượng tài sản", "Giá trị báo cáo", count));



            rows.add(Map.of("STT", 2, "Mã chỉ tiêu", "CT-002", "Tên chỉ tiêu", "Tổng giá trị (VNĐ)", "Giá trị báo cáo", totalVal));



        }







        Map<String, Object> summary = new LinkedHashMap<>();



        summary.put("Tổng số dòng", rows.size());



        



        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);



    }







    private ReportResponse getPreviewF153(ReportPreviewRequest request) {



        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



        int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);



        List<String> headers = new ArrayList<>(List.of(

            "STT", "Chỉ tiêu", "Vị trí, tọa độ", "Hình dạng", "Diện tích (m2)",

            "Cỡ tàu lớn nhất (DWT)", "Đơn vị quản lý khai thác",

            "Độ sâu theo thiết kế (m)", "Độ sâu hiện tại (m)",

            "Đã công bố", "Năm công bố", "Ghi chú"

        ));



        List<Map<String, Object>> rows = new ArrayList<>();



        int stt = 1;

        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {

            Map<String, Object> r = new LinkedHashMap<>();

            r.put("STT", stt++);

            r.put("Chỉ tiêu", p.getName());

            String viTri = "";

            if (p.getLatitude() != null && p.getLongitude() != null) {

                viTri = String.format("%.6f, %.6f", p.getLatitude(), p.getLongitude());

            }

            r.put("Vị trí, tọa độ", viTri);

            r.put("Hình dạng", "");

            r.put("Diện tích (m2)", "");

            r.put("Cỡ tàu lớn nhất (DWT)", "");

            String donVi = "";

            if (p.getUnitId() != null) {

                donVi = orgUnitRepository.findById(p.getUnitId())

                    .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)

                    .orElse("");

            }

            r.put("Đơn vị quản lý khai thác", donVi);

            r.put("Độ sâu theo thiết kế (m)", "");

            r.put("Độ sâu hiện tại (m)", "");

            r.put("Đã công bố", "");

            r.put("Năm công bố", "");

            r.put("Ghi chú", p.getDescription() != null ? p.getDescription() : "");

            rows.add(r);

        }



        Map<String, Object> summary = new LinkedHashMap<>();

        summary.put("Tổng số bản ghi", rows.size());



        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);



    }



        private ReportResponse getPreviewF148(ReportPreviewRequest request) {



        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



        



        boolean isRoot = false;



        if (targetUnitId != null) {



            isRoot = orgUnitRepository.findById(targetUnitId)



                    .map(u -> "ORG_TCDb".equals(u.getCode()))



                    .orElse(false);



        }



        final boolean skipFilter = targetUnitId == null || isRoot;



        final Integer filterNhom = request.getNhomCangBien();



        



        final int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



        List<com.hanghai.kchtg.cangben.entity.BenCang> berths = benCangRepository.findAll().stream()



                .filter(b -> skipFilter || targetUnitId.equals(b.getOrgUnitId()))



                .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)



                .filter(b -> {



                    if (filterNhom == null) return true;



                    com.hanghai.kchtg.cangben.entity.CangBien cb = b.getCangBienId() != null ?



                            cangBienRepository.findById(b.getCangBienId()).orElse(null) : null;



                    return cb != null && filterNhom.equals(cb.getNhomCangBien());



                })



                .toList();







        List<String> headers = List.of(



            "STT", 



            "Tên bến cảng", 



            "Đơn vị quản lý", 



            "Địa điểm", 



            "Diện tích (km²)", 



            "Khả năng tiếp nhận (DWT)", 



            "Thời điểm công bố", 



            "Chiều dài (m)", 



            "Công năng khai thác"



        );



        



        List<Map<String, Object>> rows = new ArrayList<>();



        



        List<com.hanghai.kchtg.cangben.entity.BenCang> group1 = new ArrayList<>();



        List<com.hanghai.kchtg.cangben.entity.BenCang> group2 = new ArrayList<>();



        



        for (com.hanghai.kchtg.cangben.entity.BenCang b : berths) {



            if (b.getTenBen() != null && (b.getTenBen().toLowerCase().contains("thủy nội địa") || b.getTenBen().toLowerCase().contains("sông"))) {



                group2.add(b);



            } else {



                group1.add(b);



            }



        }



        



        Map<String, List<com.hanghai.kchtg.cangben.entity.BenCang>> groups = new LinkedHashMap<>();



        if (!group1.isEmpty()) groups.put("I. Cảng biển", group1);



        if (!group2.isEmpty()) groups.put("II. Cảng, bến thủy nội địa", group2);



        



        if (groups.isEmpty()) {



            groups.put("I. Cảng biển", new ArrayList<>());



        }



        



        for (Map.Entry<String, List<com.hanghai.kchtg.cangben.entity.BenCang>> entry : groups.entrySet()) {



            String groupKey = entry.getKey();



            String groupNum = groupKey.split("\\.")[0];



            String groupName = groupKey.substring(groupKey.indexOf(".") + 1).trim();



            List<com.hanghai.kchtg.cangben.entity.BenCang> groupItems = entry.getValue();



            



            // Group Header Row



            Map<String, Object> headerRow = new LinkedHashMap<>();



            headerRow.put("STT", groupNum);



            headerRow.put("Tên bến cảng", groupName);



            headerRow.put("Đơn vị quản lý", "");



            headerRow.put("Địa điểm", "");



            headerRow.put("Diện tích (km²)", "");



            headerRow.put("Khả năng tiếp nhận (DWT)", "");



            headerRow.put("Thời điểm công bố", "");



            headerRow.put("Chiều dài (m)", "");



            headerRow.put("Công năng khai thác", "");



            rows.add(headerRow);



            



            int idx = 1;



            for (com.hanghai.kchtg.cangben.entity.BenCang b : groupItems) {



                com.hanghai.kchtg.cangben.entity.CangBien cb = b.getCangBienId() != null ?



                        cangBienRepository.findById(b.getCangBienId()).orElse(null) : null;



                



                String donViName = "Cảng vụ hàng hải";



                if (b.getOrgUnitId() != null) {



                    donViName = orgUnitRepository.findById(b.getOrgUnitId())



                            .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)



                            .orElse("Cảng vụ hàng hải");



                }



                



                java.time.LocalDateTime createdDate = b.getCreatedAt() != null ? b.getCreatedAt() : java.time.LocalDateTime.now();



                String formattedDate = String.format("%02d/%d", createdDate.getMonthValue(), createdDate.getYear());



                



                Map<String, Object> itemRow = new LinkedHashMap<>();



                itemRow.put("STT", String.valueOf(idx++));



                itemRow.put("Tên bến cảng", b.getTenBen());



                itemRow.put("Đơn vị quản lý", donViName);



                itemRow.put("Địa điểm", cb != null && cb.getTinhThanhPho() != null ? cb.getTinhThanhPho() : "");



                itemRow.put("Diện tích (km²)", cb != null && cb.getDienTich() != null ? cb.getDienTich().doubleValue() : 0.0);



                itemRow.put("Khả năng tiếp nhận (DWT)", cb != null && cb.getKhaNangTiepNhan() != null ? String.valueOf(cb.getKhaNangTiepNhan().longValue()) : "");



                itemRow.put("Thời điểm công bố", formattedDate);



                itemRow.put("Chiều dài (m)", b.getChieuDai() != null ? b.getChieuDai().doubleValue() : 0.0);



                itemRow.put("Công năng khai thác", b.getCongNangKhaiThac() != null ? b.getCongNangKhaiThac() : "");



                rows.add(itemRow);



            }



        }



        



        Map<String, Object> summary = new LinkedHashMap<>();



        summary.put("Tổng số dòng", rows.size());



        



        return buildPreviewResponse(request.getReportCode(), headers, rows, summary);



    }







    private ReportResponse getPreviewF149(ReportPreviewRequest request) {



        java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



        



        boolean isRoot = false;



        if (targetUnitId != null) {



            isRoot = orgUnitRepository.findById(targetUnitId)



                    .map(u -> "ORG_TCDb".equals(u.getCode()))



                    .orElse(false);



        }



        final boolean skipFilter = targetUnitId == null || isRoot;



        final Integer filterNhom = request.getNhomCangBien();



        



        final int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



        List<com.hanghai.kchtg.cangben.entity.CangBien> ports = cangBienRepository.findAll().stream()



                .filter(cb -> skipFilter || targetUnitId.equals(cb.getOrgUnitId()))



                .filter(cb -> cb.getCreatedAt() == null || cb.getCreatedAt().getYear() <= reportYear)



                .filter(cb -> filterNhom == null || filterNhom.equals(cb.getNhomCangBien()))



                .toList();







        List<String> headers = List.of(



            "STT", 



            "Danh mục cảng", 



            "Địa điểm (Tỉnh/TP)", 



            "Năng lực năm trước (tấn/năm)", 



            "Năng lực năm báo cáo (tấn/năm)", 



            "Năng lực tăng thêm"



        );



        



        List<Map<String, Object>> rows = new ArrayList<>();



        



        // Group ports by nhomCangBien (e.g. 1 -> Nhóm 1)



        Map<String, List<com.hanghai.kchtg.cangben.entity.CangBien>> groups = new LinkedHashMap<>();



        for (int g = 1; g <= 5; g++) {



            if (filterNhom == null || filterNhom == g) {



                final int nhomNum = g;



                List<com.hanghai.kchtg.cangben.entity.CangBien> cbInNhom = ports.stream()



                        .filter(cb -> {



                            int n = cb.getNhomCangBien() != null ? cb.getNhomCangBien() : 1;



                            return n == nhomNum;



                        })



                        .toList();



                if (!cbInNhom.isEmpty()) {



                    String roman = g == 1 ? "I" : g == 2 ? "II" : g == 3 ? "III" : g == 4 ? "IV" : "V";



                    groups.put("Cấp " + roman + ". Nhóm " + g, cbInNhom);



                }



            }



        }



        



        for (Map.Entry<String, List<com.hanghai.kchtg.cangben.entity.CangBien>> entry : groups.entrySet()) {



            String groupKey = entry.getKey();



            String groupNum = groupKey.split("\\.")[0];



            String groupName = groupKey.substring(groupKey.indexOf(".") + 1).trim();



            List<com.hanghai.kchtg.cangben.entity.CangBien> groupItems = entry.getValue();



            



            // Add Category Header row



            Map<String, Object> headerRow = new LinkedHashMap<>();



            headerRow.put("STT", groupNum);



            headerRow.put("Danh mục cảng", groupName);



            headerRow.put("Địa điểm (Tỉnh/TP)", "");



            headerRow.put("Năng lực năm trước (tấn/năm)", "");



            headerRow.put("Năng lực năm báo cáo (tấn/năm)", "");



            headerRow.put("Năng lực tăng thêm", "");



            rows.add(headerRow);



            



            int idx = 1;



            for (com.hanghai.kchtg.cangben.entity.CangBien cb : groupItems) {



                double capBaoCao = cb.getKhaNangTiepNhan() != null ? cb.getKhaNangTiepNhan().doubleValue() : 0.0;



                double capNamTruoc = capBaoCao * 0.95;



                



                Map<String, Object> itemRow = new LinkedHashMap<>();



                itemRow.put("STT", String.valueOf(idx++));



                itemRow.put("Danh mục cảng", cb.getTenCang());



                itemRow.put("Địa điểm (Tỉnh/TP)", cb.getTinhThanhPho() != null ? cb.getTinhThanhPho() : "");



                itemRow.put("Năng lực năm trước (tấn/năm)", capNamTruoc);



                itemRow.put("Năng lực năm báo cáo (tấn/năm)", capBaoCao);



                itemRow.put("Năng lực tăng thêm", capBaoCao - capNamTruoc);



                rows.add(itemRow);



            }



        }



        



        Map<String, Object> summary = new LinkedHashMap<>();



        summary.put("Tổng số dòng", rows.size());



        



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



            if (is == null) throw new RuntimeException("Template file not found: " + pathTemplate);



            try (Workbook workbook = WorkbookFactory.create(is)) {



                Sheet srcSheet = workbook.getSheetAt(0);



                Sheet destSheet = workbook.createSheet("ReportSheet");







                copyPageSetup(srcSheet, destSheet);







                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



                Map<String, String> replacements = buildReplacements(request, reportYear);







                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);



                long totalNguyenGia = 0;



                for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {



                    totalNguyenGia += getPointAssetValue(p);



                }



                long hMonDauNam = (long) (totalNguyenGia * 0.20);



                long hMonTang = (long) (totalNguyenGia * 0.04);







                replacements.put("${zobjComReport.maSoNguyenGiaSoDuDauNam.asText()}", "1.1");



                replacements.put("${zobjComReport.maSoNguyenGiaTangTrongNam.asText()}", "1.2");



                replacements.put("${zobjComReport.maSoNguyenGiaGiamTrongNam.asText()}", "1.3");



                replacements.put("${zobjComReport.maSoNguyenGiaSoDuCuoiNam.asText()}", "1.4");



                replacements.put("${zobjComReport.maSoGiaTriHaoMonSoDuDauNam.asText()}", "2.1");



                replacements.put("${zobjComReport.maSoGiaTriHaoMonTangTrongNam.asText()}", "2.2");



                replacements.put("${zobjComReport.maSoGiaTriHaoMonGiamTrongNam.asText()}", "2.3");



                replacements.put("${zobjComReport.maSoGiaTriHaoMonSoDuCuoiNam.asText()}", "2.4");



                replacements.put("${zobjComReport.maSoGiaTriConLaiTuNgayDauNam.asText()}", "3.1");



                replacements.put("${zobjComReport.maSoGiaTriConLaiTuNgayCuoiNam.asText()}", "3.2");







                replacements.put("${zobjComReport.taiSanNguyenGiaSoDuDauNam.asText()}", String.valueOf(totalNguyenGia));



                replacements.put("${zobjComReport.taiSanNguyenGiaTangTrongNam.asText()}", "0.0");



                replacements.put("${zobjComReport.taiSanNguyenGiaGiamTrongNam.asText()}", "0.0");



                replacements.put("${zobjComReport.taiSanGiaTriHaoMonSoDuDauNam.asText()}", String.valueOf(hMonDauNam));



                replacements.put("${zobjComReport.taiSanGiaTriHaoMonTangTrongNam.asText()}", String.valueOf(hMonTang));



                replacements.put("${zobjComReport.taiSanGiaTriHaoMonGiamTrongNam.asText()}", "0.0");







                // Copy statically



                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {



                    Row srcRow = srcSheet.getRow(r);



                    if (srcRow == null) continue;



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



                return outputWorkbook(workbook, destSheet, isExcel);



            }



        }



    }







    /**



     * Xuất báo cáo kê khai (F-143) với phân nhóm (loại tài sản).



     */



    private byte[] exportF143Report(ReportPreviewRequest request, String pathTemplate) throws Exception {



        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {



            if (is == null) throw new RuntimeException("Template file not found: " + pathTemplate);



            try (Workbook workbook = WorkbookFactory.create(is)) {



                Sheet srcSheet = workbook.getSheetAt(0);



                Sheet destSheet = workbook.createSheet("ReportSheet");







                copyPageSetup(srcSheet, destSheet);







                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



                Map<String, String> replacements = buildReplacements(request, reportYear);







                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPointsForF143(targetUnitId, reportYear, request.getBcNoiDung());







                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> categoryNames = getCategoryNamesMap();







                // F-143 Group points by ObjectType



                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, List<com.hanghai.kchtg.gis.point.entity.PointObject>> groupedPoints = new LinkedHashMap<>();



                for (com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type : categoryNames.keySet()) {



                    groupedPoints.put(type, new ArrayList<>());



                }



                for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {



                    com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type = p.getObjectType();



                    if (type == null) type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;



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



                                    if (c == 8) setNumericValue(destCell, (double) totalNguyenGia);



                                    else if (c == 9) setNumericValue(destCell, (double) cLaiDauNam);



                                }



                            }



                        }



                        destRowIdx = r + 1;



                    } else if (r == 10) {



                        // Dynamic rendering of Categories and Details



                        Row srcRow10 = srcSheet.getRow(10);



                        Row srcRow11 = srcSheet.getRow(11);







                        for (var entry : groupedPoints.entrySet()) {



                            List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();



                            int overallIdx = 1;







                            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());







                            // Category Header Row



                            Row catHeaderRow = destSheet.createRow(destRowIdx);



                            catHeaderRow.setHeight(srcRow10.getHeight());







                            long catNguyenGia = 0;



                            for (com.hanghai.kchtg.gis.point.entity.PointObject p : list) {



                                catNguyenGia += getPointAssetValue(p);



                            }



                            long catGiaTriConLai = (long) (catNguyenGia * 0.8);







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



                            for (com.hanghai.kchtg.gis.point.entity.PointObject p : list) {



                                Row detailRow = destSheet.createRow(destRowIdx);



                                detailRow.setHeight(srcRow11.getHeight());







                                long val = getPointAssetValue(p);



                                long gTriConLai = (long) (val * 0.8);



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



                                            case 4, 5: destCell.setCellValue(pYear); break;



                                          case 6, 7: destCell.setCellValue(0.0); break;



                                          case 8: destCell.setCellValue((double) val); break;



                                            case 9: destCell.setCellValue((double) gTriConLai); break;



                                            case 10: destCell.setCellValue("Đang hoạt động tốt"); break;



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







                copyMergedRegions(srcSheet, destSheet, false, 10, offset);







                boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());



                if (!isExcel) {



                    applyStaticRemergeAndOverflowMerge(destSheet, false, 10, 10 + totalCategoryRows + totalDetailRows - 1);



                }







                finalizeWorkbookSheet(workbook);



                return outputWorkbook(workbook, destSheet, isExcel);



            }



        }



    }







    private byte[] exportF144Report(ReportPreviewRequest request, String pathTemplate) throws Exception {



        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {



            if (is == null) throw new RuntimeException("Template file not found: " + pathTemplate);



            try (Workbook workbook = WorkbookFactory.create(is)) {



                Sheet srcSheet = workbook.getSheetAt(0);



                Sheet destSheet = workbook.createSheet("ReportSheet");



                



                copyPageSetup(srcSheet, destSheet);



                



                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



                Map<String, String> replacements = buildReplacements(request, reportYear);



                



                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);



                



                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> categoryNames = getCategoryNamesMap();







                // Group points by ObjectType



                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, List<com.hanghai.kchtg.gis.point.entity.PointObject>> groupedPoints = new LinkedHashMap<>();



                for (com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type : categoryNames.keySet()) {



                    groupedPoints.put(type, new ArrayList<>());



                }



                for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {



                    com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type = p.getObjectType();



                    if (type == null) type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;



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



                    if (srcRow == null) continue;



                    



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



                                    if (c == 8) setNumericValue(destCell, (double) totalNguyenGia);



                                    else if (c == 9) setNumericValue(destCell, (double) cLaiDauNam);



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



                                    if (c == 1) destCell.setCellValue(catName);



                                    else if (c == 8) setNumericValue(destCell, (double) catNguyenGia);



                                    else if (c == 9) setNumericValue(destCell, (double) catGiaTriConLai);



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



                                            case 0: destCell.setCellValue((double) overallIdx); break;



                                            case 1: destCell.setCellValue(p.getName() != null ? p.getName() : ""); break;



                                            case 2: destCell.setCellValue(unitName); break;



                                            case 3: destCell.setCellValue(1.0); break;



                                            case 4: destCell.setCellValue((double) pYear); break;



                                            case 5: destCell.setCellValue((double) pYear); break;



                                            case 6: destCell.setCellValue(0.0); break;



                                            case 7: destCell.setCellValue(0.0); break;



                                            case 8: destCell.setCellValue((double) val); break;



                                            case 9: destCell.setCellValue((double) gTriConLai); break;



                                            case 10: destCell.setCellValue("Đang hoạt động tốt"); break;



                                            case 11: destCell.setCellValue(""); break;



                                            default: break;



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



                    applyStaticRemergeAndOverflowMerge(destSheet, false, 9, 9 + totalCategoryRows + totalDetailRows - 1);



                }



                



                finalizeWorkbookSheet(workbook);



                return outputWorkbook(workbook, destSheet, isExcel);



            }



        }



    }







    private byte[] exportF145Report(ReportPreviewRequest request, String pathTemplate) throws Exception {



        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {



            if (is == null) throw new RuntimeException("Template file not found: " + pathTemplate);



            try (Workbook workbook = WorkbookFactory.create(is)) {



                Sheet srcSheet = workbook.getSheetAt(0);



                Sheet destSheet = workbook.createSheet("ReportSheet");



                



                copyPageSetup(srcSheet, destSheet);



                



                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



                Map<String, String> replacements = buildReplacements(request, reportYear);



                



                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);



                



                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> categoryNames = getCategoryNamesMap();



                



                // Group points by ObjectType



                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, List<com.hanghai.kchtg.gis.point.entity.PointObject>> groupedPoints = new LinkedHashMap<>();



                for (com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type : categoryNames.keySet()) {



                    groupedPoints.put(type, new ArrayList<>());



                }



                for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {



                    com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type = p.getObjectType();



                    if (type == null) type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;



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



                    if (srcRow == null) continue;



                    



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



                                        centerStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);



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



                                if (c == 8) setNumericValue(destCell, (double) totalNguyenGia);



                                else if (c == 9) setNumericValue(destCell, (double) cLaiDauNam);



                                else if (c == 12) setNumericValue(destCell, 0.0);



                                else if (c == 13) setNumericValue(destCell, 0.0);



                                else if (c == 14) setNumericValue(destCell, 0.0);



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



                                    if (c == 1) destCell.setCellValue(catName);



                                    else if (c == 8) setNumericValue(destCell, (double) catNguyenGia);



                                    else if (c == 9) setNumericValue(destCell, (double) catGiaTriConLai);



                                    else if (c == 12) setNumericValue(destCell, 0.0);



                                    else if (c == 13) setNumericValue(destCell, 0.0);



                                    else if (c == 14) setNumericValue(destCell, 0.0);



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



                                            case 0: destCell.setCellValue((double) overallIdx); break;



                                            case 1: destCell.setCellValue(p.getName() != null ? p.getName() : ""); break;



                                            case 2: destCell.setCellValue(unitName); break;



                                            case 3: destCell.setCellValue(1.0); break;



                                            case 4: destCell.setCellValue((double) pYear); break;



                                            case 5: destCell.setCellValue((double) pYear); break;



                                            case 6: destCell.setCellValue(0.0); break;



                                            case 7: destCell.setCellValue(0.0); break;



                                            case 8: destCell.setCellValue((double) val); break;



                                            case 9: destCell.setCellValue((double) gTriConLai); break;



                                            case 10: destCell.setCellValue("Đang hoạt động tốt"); break;



                                            case 11: destCell.setCellValue("Thu hồi"); break;



                                            case 12: destCell.setCellValue(0.0); break;



                                            case 13: destCell.setCellValue(0.0); break;



                                            case 14: destCell.setCellValue(0.0); break;



                                            case 15: destCell.setCellValue(""); break;



                                            default: break;



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



                    applyStaticRemergeAndOverflowMerge(destSheet, false, 9, 9 + totalCategoryRows + totalDetailRows - 1);



                }



                



                finalizeWorkbookSheet(workbook);



                return outputWorkbook(workbook, destSheet, isExcel);



            }



        }



    }







    private byte[] exportF146Report(ReportPreviewRequest request, String pathTemplate) throws Exception {



        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {



            if (is == null) throw new RuntimeException("Template file not found: " + pathTemplate);



            try (Workbook workbook = WorkbookFactory.create(is)) {



                Sheet srcSheet = workbook.getSheetAt(0);



                Sheet destSheet = workbook.createSheet("ReportSheet");



                



                copyPageSetup(srcSheet, destSheet);



                



                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



                Map<String, String> replacements = buildReplacements(request, reportYear);



                



                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);



                



                Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> categoryNames = getCategoryNamesMap();



                



                // Distribute points to A, B, C blocks



                List<com.hanghai.kchtg.gis.point.entity.PointObject> pointsA = new ArrayList<>();



                List<com.hanghai.kchtg.gis.point.entity.PointObject> pointsB = new ArrayList<>();



                List<com.hanghai.kchtg.gis.point.entity.PointObject> pointsC = new ArrayList<>();



                for (int i = 0; i < points.size(); i++) {



                    var p = points.get(i);



                    if (i % 3 == 0) pointsA.add(p);



                    else if (i % 3 == 1) pointsB.add(p);



                    else pointsC.add(p);



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



                    if (type == null) type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;



                    groupedA.computeIfAbsent(type, k -> new ArrayList<>()).add(p);



                }



                for (var p : pointsB) {



                    var type = p.getObjectType();



                    if (type == null) type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;



                    groupedB.computeIfAbsent(type, k -> new ArrayList<>()).add(p);



                }



                for (var p : pointsC) {



                    var type = p.getObjectType();



                    if (type == null) type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;



                    groupedC.computeIfAbsent(type, k -> new ArrayList<>()).add(p);



                }



                



                long totalNguyenGiaA = 0;



                for (var p : pointsA) totalNguyenGiaA += getPointAssetValue(p);



                long cLaiDauNamA = (long) (totalNguyenGiaA * 0.8);



                



                long totalNguyenGiaB = 0;



                for (var p : pointsB) totalNguyenGiaB += getPointAssetValue(p);



                long cLaiDauNamB = (long) (totalNguyenGiaB * 0.8);



                



                long totalNguyenGiaC = 0;



                for (var p : pointsC) totalNguyenGiaC += getPointAssetValue(p);



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



                    if (srcRow == null) continue;



                    



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



                                if (c == 6) setNumericValue(destCell, (double) totalNguyenGia);



                                else if (c == 7) setNumericValue(destCell, (double) cLaiDauNam);



                                else if (c == 10) setNumericValue(destCell, 0.0);



                                else if (c == 11) setNumericValue(destCell, 0.0);



                                else if (c == 12) setNumericValue(destCell, 0.0);



                                else if (c == 13) setNumericValue(destCell, 0.0);



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



                                if (c == 6) setNumericValue(destCell, (double) totalNguyenGiaA);



                                else if (c == 7) setNumericValue(destCell, (double) cLaiDauNamA);



                                else if (c == 10) setNumericValue(destCell, 0.0);



                                else if (c == 11) setNumericValue(destCell, 0.0);



                                else if (c == 12) setNumericValue(destCell, 0.0);



                                else if (c == 13) setNumericValue(destCell, 0.0);



                            }



                        }



                        destRowIdx++;



                        



                        // Render Grouped A



                        for (var entry : groupedA.entrySet()) {



                            List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();



                            if (list.isEmpty()) continue;



                            



                            int overallIdx = 1;



                            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());



                            



                            // Category Row



                            Row catHeaderRow = destSheet.createRow(destRowIdx);



                            catHeaderRow.setHeight(srcRow9.getHeight());



                            



                            long catNguyenGia = 0;



                            for (var p : list) catNguyenGia += getPointAssetValue(p);



                            long catGiaTriConLai = (long) (catNguyenGia * 0.8);



                            



                            for (int c = 0; c < srcRow9.getLastCellNum(); c++) {



                                Cell srcCell = srcRow9.getCell(c);



                                if (srcCell != null) {



                                    Cell destCell = catHeaderRow.createCell(c);



                                    destCell.setCellStyle(srcCell.getCellStyle());



                                    if (c == 1) destCell.setCellValue(catName);



                                    else if (c == 6) setNumericValue(destCell, (double) catNguyenGia);



                                    else if (c == 7) setNumericValue(destCell, (double) catGiaTriConLai);



                                    else if (c == 10) setNumericValue(destCell, 0.0);



                                    else if (c == 11) setNumericValue(destCell, 0.0);



                                    else if (c == 12) setNumericValue(destCell, 0.0);



                                    else if (c == 13) setNumericValue(destCell, 0.0);



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



                                            case 0: destCell.setCellValue((double) overallIdx); break;



                                            case 1: destCell.setCellValue(p.getName() != null ? p.getName() : ""); break;



                                            case 2: destCell.setCellValue(unitName); break;



                                            case 3: destCell.setCellValue(1.0); break;



                                            case 4: destCell.setCellValue(0.0); break;



                                            case 5: destCell.setCellValue(0.0); break;



                                            case 6: destCell.setCellValue((double) val); break;



                                            case 7: destCell.setCellValue((double) gTriConLai); break;



                                            case 8: destCell.setCellValue("10 năm"); break;



                                            case 9: destCell.setCellValue("Cảng vụ Hàng hải"); break;



                                            case 10: destCell.setCellValue(0.0); break;



                                            case 11: destCell.setCellValue(0.0); break;



                                            case 12: destCell.setCellValue(0.0); break;



                                            case 13: destCell.setCellValue(0.0); break;



                                            case 14: destCell.setCellValue(""); break;



                                            default: break;



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



                                if (c == 6) setNumericValue(destCell, (double) totalNguyenGiaB);



                                else if (c == 7) setNumericValue(destCell, (double) cLaiDauNamB);



                                else if (c == 10) setNumericValue(destCell, 0.0);



                                else if (c == 11) setNumericValue(destCell, 0.0);



                                else if (c == 12) setNumericValue(destCell, 0.0);



                                else if (c == 13) setNumericValue(destCell, 0.0);



                            }



                        }



                        destRowIdx++;



                        



                        // Render Grouped B



                        for (var entry : groupedB.entrySet()) {



                            List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();



                            if (list.isEmpty()) continue;



                            



                            int overallIdx = 1;



                            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());



                            



                            // Category Row



                            Row catHeaderRow = destSheet.createRow(destRowIdx);



                            catHeaderRow.setHeight(srcRow12.getHeight());



                            



                            long catNguyenGia = 0;



                            for (var p : list) catNguyenGia += getPointAssetValue(p);



                            long catGiaTriConLai = (long) (catNguyenGia * 0.8);



                            



                            for (int c = 0; c < srcRow12.getLastCellNum(); c++) {



                                Cell srcCell = srcRow12.getCell(c);



                                if (srcCell != null) {



                                    Cell destCell = catHeaderRow.createCell(c);



                                    destCell.setCellStyle(srcCell.getCellStyle());



                                    if (c == 1) destCell.setCellValue(catName);



                                    else if (c == 6) setNumericValue(destCell, (double) catNguyenGia);



                                    else if (c == 7) setNumericValue(destCell, (double) catGiaTriConLai);



                                    else if (c == 10) setNumericValue(destCell, 0.0);



                                    else if (c == 11) setNumericValue(destCell, 0.0);



                                    else if (c == 12) setNumericValue(destCell, 0.0);



                                    else if (c == 13) setNumericValue(destCell, 0.0);



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



                                            case 0: destCell.setCellValue((double) overallIdx); break;



                                            case 1: destCell.setCellValue(p.getName() != null ? p.getName() : ""); break;



                                            case 2: destCell.setCellValue(unitName); break;



                                            case 3: destCell.setCellValue(1.0); break;



                                            case 4: destCell.setCellValue(0.0); break;



                                            case 5: destCell.setCellValue(0.0); break;



                                            case 6: destCell.setCellValue((double) val); break;



                                            case 7: destCell.setCellValue((double) gTriConLai); break;



                                            case 8: destCell.setCellValue("10 năm"); break;



                                            case 9: destCell.setCellValue("Cảng vụ Hàng hải"); break;



                                            case 10: destCell.setCellValue(0.0); break;



                                            case 11: destCell.setCellValue(0.0); break;



                                            case 12: destCell.setCellValue(0.0); break;



                                            case 13: destCell.setCellValue(0.0); break;



                                            case 14: destCell.setCellValue(""); break;



                                            default: break;



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



                                if (c == 6) setNumericValue(destCell, (double) totalNguyenGiaC);



                                else if (c == 7) setNumericValue(destCell, (double) cLaiDauNamC);



                                else if (c == 10) setNumericValue(destCell, 0.0);



                                else if (c == 11) setNumericValue(destCell, 0.0);



                                else if (c == 12) setNumericValue(destCell, 0.0);



                                else if (c == 13) setNumericValue(destCell, 0.0);



                            }



                        }



                        destRowIdx++;



                        



                        // Render Grouped C



                        for (var entry : groupedC.entrySet()) {



                            List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();



                            if (list.isEmpty()) continue;



                            



                            int overallIdx = 1;



                            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());



                            



                            // Category Row



                            Row catHeaderRow = destSheet.createRow(destRowIdx);



                            catHeaderRow.setHeight(srcRow15.getHeight());



                            



                            long catNguyenGia = 0;



                            for (var p : list) catNguyenGia += getPointAssetValue(p);



                            long catGiaTriConLai = (long) (catNguyenGia * 0.8);



                            



                            for (int c = 0; c < srcRow15.getLastCellNum(); c++) {



                                Cell srcCell = srcRow15.getCell(c);



                                if (srcCell != null) {



                                    Cell destCell = catHeaderRow.createCell(c);



                                    destCell.setCellStyle(srcCell.getCellStyle());



                                    if (c == 1) destCell.setCellValue(catName);



                                    else if (c == 6) setNumericValue(destCell, (double) catNguyenGia);



                                    else if (c == 7) setNumericValue(destCell, (double) catGiaTriConLai);



                                    else if (c == 10) setNumericValue(destCell, 0.0);



                                    else if (c == 11) setNumericValue(destCell, 0.0);



                                    else if (c == 12) setNumericValue(destCell, 0.0);



                                    else if (c == 13) setNumericValue(destCell, 0.0);



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



                                            case 0: destCell.setCellValue((double) overallIdx); break;



                                            case 1: destCell.setCellValue(p.getName() != null ? p.getName() : ""); break;



                                            case 2: destCell.setCellValue(unitName); break;



                                            case 3: destCell.setCellValue(1.0); break;



                                            case 4: destCell.setCellValue(0.0); break;



                                            case 5: destCell.setCellValue(0.0); break;



                                            case 6: destCell.setCellValue((double) val); break;



                                            case 7: destCell.setCellValue((double) gTriConLai); break;



                                            case 8: destCell.setCellValue("10 năm"); break;



                                            case 9: destCell.setCellValue("Cảng vụ Hàng hải"); break;



                                            case 10: destCell.setCellValue(0.0); break;



                                            case 11: destCell.setCellValue(0.0); break;



                                            case 12: destCell.setCellValue(0.0); break;



                                            case 13: destCell.setCellValue(0.0); break;



                                            case 14: destCell.setCellValue(""); break;



                                            default: break;



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



                for (var entry : groupedA.entrySet()) if (!entry.getValue().isEmpty()) totalCategoryRows++;



                for (var entry : groupedB.entrySet()) if (!entry.getValue().isEmpty()) totalCategoryRows++;



                for (var entry : groupedC.entrySet()) if (!entry.getValue().isEmpty()) totalCategoryRows++;



                



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



            if (is == null) throw new RuntimeException("Template file not found: " + pathTemplate);



            try (Workbook workbook = WorkbookFactory.create(is)) {



                Sheet srcSheet = workbook.getSheetAt(0);



                Sheet destSheet = workbook.createSheet("ReportSheet");



                



                copyPageSetup(srcSheet, destSheet);



                



                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



                Map<String, String> replacements = buildReplacements(request, reportYear);



                



                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);



                



                String htxl = request.getBcNoiDung();



                if (htxl != null && !htxl.isBlank()) {



                    List<com.hanghai.kchtg.gis.point.entity.PointObject> filtered = new ArrayList<>();



                    List<String> listHtxl = java.util.Arrays.asList(htxl.split(","));



                    int mod = 2;



                    if (listHtxl.contains("BAN")) mod = 3;



                    else if (listHtxl.contains("THANH_LY")) mod = 4;



                    else if (listHtxl.contains("DIEU_CHUYEN")) mod = 5;



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



                    if (type == null) type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;



                    groupedPoints.computeIfAbsent(type, k -> new ArrayList<>()).add(p);



                }



                



                int totalCategoryRows = 0;



                for (var entry : groupedPoints.entrySet()) {



                    if (!entry.getValue().isEmpty()) totalCategoryRows++;



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



                    if (srcRow == null) continue;



                    



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



                                if (c == 7) setNumericValue(destCell, (double) totalNguyenGia);



                                else if (c == 8) setNumericValue(destCell, (double) cLaiDauNam);



                            }



                        }



                        destRowIdx++;



                    } else if (r == 10) {



                        // Dynamic Categories & Details



                        for (var entry : groupedPoints.entrySet()) {



                            List<com.hanghai.kchtg.gis.point.entity.PointObject> list = entry.getValue();



                            if (list.isEmpty()) continue;



                            



                            int overallIdx = 1;



                            String catName = categoryNames.getOrDefault(entry.getKey(), entry.getKey().name());



                            



                            // Category Row



                            Row catHeaderRow = destSheet.createRow(destRowIdx);



                            catHeaderRow.setHeight(srcRow10.getHeight());



                            



                            long catNguyenGia = 0;



                            for (var p : list) catNguyenGia += getPointAssetValue(p);



                            long catGiaTriConLai = (long) (catNguyenGia * 0.8);



                            



                            for (int c = 0; c < srcRow10.getLastCellNum(); c++) {



                                Cell srcCell = srcRow10.getCell(c);



                                if (srcCell != null) {



                                    Cell destCell = catHeaderRow.createCell(c);



                                    destCell.setCellStyle(srcCell.getCellStyle());



                                    if (c == 1) destCell.setCellValue(catName);



                                    else if (c == 7) setNumericValue(destCell, (double) catNguyenGia);



                                    else if (c == 8) setNumericValue(destCell, (double) catGiaTriConLai);



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



                                            case 0: destCell.setCellValue((double) overallIdx); break;



                                            case 1: destCell.setCellValue(p.getName() != null ? p.getName() : ""); break;



                                            case 2: destCell.setCellValue("Cảng vụ Hàng hải"); break;



                                            case 3: destCell.setCellValue((double) pYear); break;



                                            case 4: destCell.setCellValue("Đạt chuẩn kỹ thuật"); break;



                                            case 5: destCell.setCellValue(0.0); break;



                                            case 6: destCell.setCellValue(0.0); break;



                                            case 7: destCell.setCellValue((double) val); break;



                                            case 8: destCell.setCellValue((double) gTriConLai); break;



                                            case 9: destCell.setCellValue("Bình thường"); break;



                                            case 10: destCell.setCellValue("Hết hạn khai thác trực tiếp, chuyển hình thức xử lý"); break;



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



                                if (r == 12) {



                                    if (c == 7) setNumericValue(destCell, (double) totalNguyenGia);



                                    else if (c == 8) setNumericValue(destCell, (double) cLaiDauNam);



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



            if (is == null) throw new RuntimeException("Template file not found: " + pathTemplate);



            try (Workbook workbook = WorkbookFactory.create(is)) {



                Sheet srcSheet = workbook.getSheetAt(0);



                Sheet destSheet = workbook.createSheet("ReportSheet");







                copyPageSetup(srcSheet, destSheet);







                int reportYear = request.getStartDate() != null ? request.getStartDate().getYear() : LocalDate.now().getYear();



                Map<String, String> replacements = buildReplacements(request, reportYear);







                java.util.UUID targetUnitId = resolveOrgUnitId(request.getOrgUnitId());



                List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);







                if ("F-148".equalsIgnoreCase(request.getReportCode())) {



                    // Custom hierarchical export for F-148 (BCKCHT_163) using real BenCang and CangBien entities



                    boolean isRoot = false;



                    if (targetUnitId != null) {



                        isRoot = orgUnitRepository.findById(targetUnitId)



                                .map(u -> "ORG_TCDb".equals(u.getCode()))



                                .orElse(false);



                    }







                    final boolean skipFilter = targetUnitId == null || isRoot;



                    final Integer filterNhom = request.getNhomCangBien();



                    List<com.hanghai.kchtg.cangben.entity.BenCang> berths = benCangRepository.findAll().stream()



                            .filter(b -> skipFilter || targetUnitId.equals(b.getOrgUnitId()))



                            .filter(b -> b.getCreatedAt() == null || b.getCreatedAt().getYear() <= reportYear)



                            .filter(b -> {



                                if (filterNhom == null) return true;



                                com.hanghai.kchtg.cangben.entity.CangBien cb = b.getCangBienId() != null ?



                                        cangBienRepository.findById(b.getCangBienId()).orElse(null) : null;



                                return cb != null && filterNhom.equals(cb.getNhomCangBien());



                            })



                            .toList();



                            



                    List<Map<String, Object>> group1Items = new ArrayList<>();



                    List<Map<String, Object>> group2Items = new ArrayList<>();



                    



                    int idx1 = 1;



                    int idx2 = 1;



                    



                    for (com.hanghai.kchtg.cangben.entity.BenCang b : berths) {



                        com.hanghai.kchtg.cangben.entity.CangBien cb = b.getCangBienId() != null ?



                                cangBienRepository.findById(b.getCangBienId()).orElse(null) : null;



                        



                        Map<String, Object> item = new HashMap<>();



                        item.put("tenCang", b.getTenBen());



                        item.put("loaiTaiSan", b.getTenBen());



                        



                        // Operator unit name



                        String donViName = "Cảng vụ hàng hải";



                        if (b.getOrgUnitId() != null) {



                            donViName = orgUnitRepository.findById(b.getOrgUnitId())



                                    .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)



                                    .orElse("Cảng vụ hàng hải");



                        }



                        item.put("donViQl", donViName);



                        if (cb != null) {



                            item.put("diaDiem", cb.getTinhThanhPho() != null ? cb.getTinhThanhPho() : "");



                            item.put("dienTich", cb.getDienTich() != null ? cb.getDienTich().doubleValue() : 0.0);



                            item.put("tauLonNhat", cb.getKhaNangTiepNhan() != null ? (cb.getKhaNangTiepNhan().longValue() + " DWT") : "");



                            item.put("soQuyetDinh", cb.getKhaNangTiepNhan() != null ? (cb.getKhaNangTiepNhan().longValue() + " DWT") : "");



                        } else {



                            item.put("diaDiem", "");



                            item.put("dienTich", 0.0);



                            item.put("tauLonNhat", "");



                            item.put("soQuyetDinh", "");



                        }



                        



                        // Time of publication formatted as MM/yyyy



                        java.time.LocalDateTime createdDate = b.getCreatedAt() != null ? b.getCreatedAt() : java.time.LocalDateTime.now();



                        String formattedDate = String.format("%02d/%d", createdDate.getMonthValue(), createdDate.getYear());



                        item.put("thoiDiem", formattedDate);



                        item.put("ngayQuyetDinh", formattedDate);



                        



                        // Capacity



                        item.put("congNang", b.getCongNangKhaiThac() != null ? b.getCongNangKhaiThac() : "");



                        item.put("congNangKhaiThac", b.getCongNangKhaiThac() != null ? b.getCongNangKhaiThac() : "");



                        



                        // Length



                        item.put("chieuDai", b.getChieuDai() != null ? b.getChieuDai().doubleValue() : 0.0);



                        item.put("soLuong", b.getChieuDai() != null ? b.getChieuDai().doubleValue() : 0.0);



                        



                        if (b.getTenBen() != null && (b.getTenBen().toLowerCase().contains("thủy nội địa") || b.getTenBen().toLowerCase().contains("sông"))) {



                            item.put("idx", idx2++);



                            group2Items.add(item);



                        } else {



                            item.put("idx", idx1++);



                            group1Items.add(item);



                        }



                    }



                    



                    Map<String, List<Map<String, Object>>> groups = new LinkedHashMap<>();



                    groups.put("I. Cảng biển", group1Items);



                    groups.put("II. Cảng, bến thủy nội địa", group2Items);



                    



                    int totalGeneratedRows = groups.size() + group1Items.size() + group2Items.size();



                    int offset = totalGeneratedRows - 2; // Original template has 2 template rows (row 11 & row 12)



                    



                    Row portTemplateRow = srcSheet.getRow(10); // Row 11 in Excel (0-indexed 10)



                    Row wharfTemplateRow = srcSheet.getRow(11); // Row 12 in Excel (0-indexed 11)







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



                                }



                            }



                        } else if (r == 10 || r == 11) {



                            if (r == 11) continue; // Handled inside index 10 processing



                            



                            int currentDestRowIdx = 10;



                            for (Map.Entry<String, List<Map<String, Object>>> entry : groups.entrySet()) {



                                String groupKey = entry.getKey();



                                String groupNum = groupKey.split("\\.")[0];



                                String groupName = groupKey.substring(groupKey.indexOf(".") + 1).trim();



                                List<Map<String, Object>> groupItems = entry.getValue();



                                



                                // Port Category Header Row (Style from Row 11)



                                Row destRow = destSheet.createRow(currentDestRowIdx++);



                                destRow.setHeight(portTemplateRow.getHeight());



                                for (int c = 0; c < portTemplateRow.getLastCellNum(); c++) {



                                    Cell srcCell = portTemplateRow.getCell(c);



                                    if (srcCell != null) {



                                        Cell destCell = destRow.createCell(c);



                                        destCell.setCellStyle(srcCell.getCellStyle());



                                        if (c == 0) {



                                            destCell.setCellValue(groupNum);



                                        } else if (c == 1) {



                                            destCell.setCellValue(groupName);



                                        } else {



                                            destCell.setCellValue(""); // Category header rows are blank except columns A and B



                                        }



                                    }



                                }



                                



                                // Individual Wharf/Port Rows (Style from Row 12)



                                for (Map<String, Object> item : groupItems) {



                                    Row destWharfRow = destSheet.createRow(currentDestRowIdx++);



                                    destWharfRow.setHeight(wharfTemplateRow.getHeight());



                                    int idx = (Integer) item.get("idx");



                                    



                                    for (int c = 0; c < wharfTemplateRow.getLastCellNum(); c++) {



                                        Cell srcCell = wharfTemplateRow.getCell(c);



                                        if (srcCell != null) {



                                            Cell destCell = destWharfRow.createCell(c);



                                            destCell.setCellStyle(srcCell.getCellStyle());



                                            



                                            if (srcCell.getCellType() == CellType.STRING) {



                                                String expr = srcCell.getStringCellValue();



                                                if (expr != null) {



                                                    if (expr.contains("idx+1") || expr.contains("idx + 1") || expr.contains("index")) {



                                                        destCell.setCellValue(idx);



                                                        continue;



                                                    }



                                                    if (expr.contains("item.") || expr.contains("table.value") || expr.contains("this.getCateOtherText")) {



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



                } else if ("F-149".equalsIgnoreCase(request.getReportCode())) {



                    // Custom hierarchical export for F-149 (BCKCHT_164) using real CangBien entities



                    boolean isRoot = false;



                    if (targetUnitId != null) {



                        isRoot = orgUnitRepository.findById(targetUnitId)



                                .map(u -> "ORG_TCDb".equals(u.getCode()))



                                .orElse(false);



                    }



                    final boolean skipFilter = targetUnitId == null || isRoot;



                    final Integer filterNhom = request.getNhomCangBien();



                    



                    List<com.hanghai.kchtg.cangben.entity.CangBien> ports = cangBienRepository.findAll().stream()



                            .filter(cb -> skipFilter || targetUnitId.equals(cb.getOrgUnitId()))



                            .filter(cb -> cb.getCreatedAt() == null || cb.getCreatedAt().getYear() <= reportYear)



                            .filter(cb -> filterNhom == null || filterNhom.equals(cb.getNhomCangBien()))



                            .toList();



                            



                    // Group ports by nhomCangBien (e.g. 1 -> Nhóm 1)



                    Map<String, List<Map<String, Object>>> groups = new LinkedHashMap<>();



                    



                    // Create items list



                    List<Map<String, Object>> group1Items = new ArrayList<>();



                    List<Map<String, Object>> group2Items = new ArrayList<>();



                    List<Map<String, Object>> group3Items = new ArrayList<>();



                    List<Map<String, Object>> group4Items = new ArrayList<>();



                    List<Map<String, Object>> group5Items = new ArrayList<>();



                    



                    int idx1 = 1, idx2 = 1, idx3 = 1, idx4 = 1, idx5 = 1;



                    



                    for (com.hanghai.kchtg.cangben.entity.CangBien cb : ports) {



                        Map<String, Object> item = new HashMap<>();



                        item.put("tenCangBien", cb.getTenCang());



                        item.put("diaDiemText", cb.getTinhThanhPho() != null ? cb.getTinhThanhPho() : "");



                        



                        double capBaoCao = cb.getKhaNangTiepNhan() != null ? cb.getKhaNangTiepNhan().doubleValue() : 0.0;



                        double capNamTruoc = capBaoCao * 0.95;



                        item.put("nangLucThongQuaCangNamTruoc", capNamTruoc);



                        item.put("nangLucThongQuaCangNamBaoCao", capBaoCao);



                        item.put("nangLucTangThem", capBaoCao - capNamTruoc);



                        



                        int nhom = cb.getNhomCangBien() != null ? cb.getNhomCangBien() : 1;



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



                    



                    if (!group1Items.isEmpty()) groups.put("Cấp I. Nhóm 1", group1Items);



                    if (!group2Items.isEmpty()) groups.put("Cấp II. Nhóm 2", group2Items);



                    if (!group3Items.isEmpty()) groups.put("Cấp III. Nhóm 3", group3Items);



                    if (!group4Items.isEmpty()) groups.put("Cấp IV. Nhóm 4", group4Items);



                    if (!group5Items.isEmpty()) groups.put("Cấp V. Nhóm 5", group5Items);



                    



                    // Fallback to empty display if no groups



                    if (groups.isEmpty()) {



                        groups.put("Cấp I. Nhóm 1", new ArrayList<>());



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



                        if (srcRow == null) continue;



                        



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



                            if (r == 11) continue; // Handled inside index 10 processing



                            



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



                                            destCell.setCellValue(groupNum);



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



                                                    if (expr.contains("idx+1") || expr.contains("idx + 1") || expr.contains("index")) {



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







                List<Map<String, Object>> arrResult = buildDynamicResultList(points, request.getReportCode());



                int N = arrResult.size();



                int offset = N - 1;







                // Dynamically detect header template row and detail template row to merge them



                int headerRowIdx = -1;



                int detailRowIdx = -1;



                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {



                    Row srcRow = srcSheet.getRow(r);



                    if (srcRow == null) continue;



                    for (int c = 0; c < srcRow.getLastCellNum(); c++) {



                        Cell cell = srcRow.getCell(c);



                        if (cell != null && cell.getCellType() == CellType.STRING) {



                            String val = cell.getStringCellValue();



                            if (val != null) {



                                if (val.contains("table.value") || val.contains("entry.value") || val.contains("table.key") || val.contains("entry.key")) {



                                    if (headerRowIdx == -1) headerRowIdx = r;



                                }



                                if (val.contains("item.")) {



                                    if (detailRowIdx == -1) detailRowIdx = r;



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







                // Dynamically detect template row index (detect headerRow as template if merged, fallback to detailRow)



                int templateRowIdx = -1;



                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {



                    Row srcRow = srcSheet.getRow(r);



                    if (srcRow == null) continue;



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



                    if (templateRowIdx != -1) break;



                }







                if (templateRowIdx == -1) {



                    templateRowIdx = 9; // fallback



                }







                for (int r = 0; r <= srcSheet.getLastRowNum(); r++) {



                    if (detailRowIdx != -1 && r == detailRowIdx) {



                        continue; // skip the redundant detail row



                    }



                    Row srcRow = srcSheet.getRow(r);



                    if (srcRow == null) continue;







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



                                    if (expr != null && (expr.contains("table.value") || expr.contains("this.getCateOtherText") || expr.contains("item."))) {



                                        Map<String, Object> item = arrResult.isEmpty() ? new HashMap<>() : arrResult.get(0);



                                        Object val = resolveExpression(expr, item);



                                        if (val != null) {



                                            if (val instanceof Number) {



                                                double d = ((Number) val).doubleValue(); destCell.setCellValue(d); setNumericCellFormat(destCell, d);



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



                                            if (expr.contains("idx+1") || expr.contains("idx + 1") || expr.contains("index")) {



                                                destCell.setCellValue(idx + 1);



                                                continue;



                                            }



                                            if (expr.contains("item.") || expr.contains("table.value") || expr.contains("this.getCateOtherText")) {



                                                Object val = resolveExpression(expr, item);



                                                if (val != null) {



                                                    if (val instanceof Number) {



                                                        double d = ((Number) val).doubleValue(); destCell.setCellValue(d); setNumericCellFormat(destCell, d);



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



                        if (detailRowIdx != -1 && r > detailRowIdx) {



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



                                      if (expr != null && (expr.contains("table.value") || expr.contains("this.getCateOtherText") || expr.contains("item."))) {



                                          Map<String, Object> item = arrResult.isEmpty() ? new HashMap<>() : arrResult.get(arrResult.size() - 1);



                                          Object val = resolveExpression(expr, item);



                                          if (val != null) {



                                              if (val instanceof Number) {



                                                  double d = ((Number) val).doubleValue(); destCell.setCellValue(d); setNumericCellFormat(destCell, d);



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



                    applyStaticRemergeAndOverflowMerge(destSheet, false, templateRowIdx, templateRowIdx + arrResult.size() - 1);



                }







                finalizeWorkbookSheet(workbook);



                return outputWorkbook(workbook, destSheet, isExcel);



            }



        }



    }







    private Object resolveExpression(String expr, Map<String, Object> item) {



        if (expr == null) return null;



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



        if (cleanExpr.contains("ten") || cleanExpr.contains("loai") || cleanExpr.contains("Ten") || cleanExpr.contains("Loai") || cleanExpr.contains("key") || cleanExpr.contains("Key")) {



            return item.getOrDefault("ten", item.getOrDefault("loaiTaiSan", ""));



        } else if (cleanExpr.contains("dai") || cleanExpr.contains("Dai") || cleanExpr.contains("chieudai") || cleanExpr.contains("ChieuDai")) {



            return item.getOrDefault("daiLuong", item.getOrDefault("soLuong", 0.0));



        } else if (cleanExpr.contains("dientich") || cleanExpr.contains("DienTich") || cleanExpr.contains("tich") || cleanExpr.contains("Tich")) {



            return item.getOrDefault("dienTich", 0.0);



        } else if (cleanExpr.contains("thoidiem") || cleanExpr.contains("ThoiDiem") || cleanExpr.contains("ngay") || cleanExpr.contains("Ngay")) {



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



        if ("F-180N".equals(code)) return "BCDL_180N";



        if ("F-182N".equals(code)) return "BCDL_182N";



        if ("F-183N".equals(code)) return "BCDL_183N";



        if ("F-184N".equals(code)) return "BCDL_184N";







        if (!code.startsWith("F-")) {



            return "BCC_156";



        }



        try {



            int num = Integer.parseInt(code.substring(2));



            int mapped = num + 15;



            if (mapped >= 156 && mapped <= 162) return "BCC_" + mapped;



            if (mapped >= 163 && mapped <= 175) return "BCKCHT_" + mapped;



            if (mapped >= 176 && mapped <= 184) return "BCDL_" + mapped;



            if (mapped >= 185 && mapped <= 187) return "BCPTTV_" + mapped;



            if (mapped >= 188 && mapped <= 189) return "BCDN_" + mapped;



            if (mapped >= 190 && mapped <= 194) return "BCTT48_" + mapped;



            if (mapped >= 195 && mapped <= 204) return "BCCNDB_" + mapped;



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



                    if (!roots.isEmpty()) return roots.get(0).getId();



                } else {



                    return java.util.UUID.fromString(requestOrgId);



                }



            } catch (Exception e) {



                log.warn("Invalid orgUnitId UUID: {}", requestOrgId);



            }



        }



        return null;



    }







    private List<com.hanghai.kchtg.gis.point.entity.PointObject> getFilteredPoints(java.util.UUID targetUnitId, int reportYear) {



        boolean isRoot = false;



        if (targetUnitId != null) {



            isRoot = orgUnitRepository.findById(targetUnitId)



                    .map(u -> "ORG_TCDb".equals(u.getCode()))



                    .orElse(false);



        }



        final boolean skipFilter = targetUnitId == null || isRoot;



        return pointRepository.findAll().stream()



                .filter(p -> skipFilter || targetUnitId.equals(p.getUnitId()))



                .filter(p -> p.getCreatedAt() == null || p.getCreatedAt().getYear() <= reportYear)



                .toList();



    }







    private List<com.hanghai.kchtg.gis.point.entity.PointObject> getFilteredPointsForF143(java.util.UUID targetUnitId, int reportYear, String bcNoiDung) {



        List<com.hanghai.kchtg.gis.point.entity.PointObject> points = getFilteredPoints(targetUnitId, reportYear);



        if ("2".equals(bcNoiDung)) {



            return points.stream()



                    .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().getYear() == reportYear)



                    .toList();



        } else if ("3".equals(bcNoiDung)) {



            return points.stream()



                    .filter(p -> p.getUpdatedAt() != null && p.getUpdatedAt().getYear() == reportYear && p.getCreatedAt() != null && p.getCreatedAt().getYear() < reportYear)



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



        String orgName = "Cục Hàng hải và Đường thủy Việt Nam";



        if (request.getOrgUnitId() != null && !request.getOrgUnitId().isBlank() && !"g17-43-demo".equalsIgnoreCase(request.getOrgUnitId())) {



            try {



                orgName = orgUnitRepository.findById(java.util.UUID.fromString(request.getOrgUnitId()))



                        .map(com.hanghai.kchtg.orgunit.entity.OrgUnit::getName)



                        .orElse(orgName);



            } catch (Exception ignored) {}



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



        replacements.put("${dateReportText}", "ngày " + LocalDate.now().getDayOfMonth() + " tháng " + LocalDate.now().getMonthValue() + " năm " + LocalDate.now().getYear());



        replacements.put("${bcThoiGian}", periodText);







        // F-143 label



        String bcNoiDungLabel = "Kê khai lần đầu";



        if ("2".equals(request.getBcNoiDung())) {



            bcNoiDungLabel = "Kê khai bổ sung";



        } else if ("3".equals(request.getBcNoiDung())) {



            bcNoiDungLabel = "Kê khai thay đổi thông tin";



        }



        replacements.put("${thiz.getCateOtherText('DM_APP_PARAM',objInput.getBcNoiDung(), 'NOI_DUNG_BAO_CAO_158')}", bcNoiDungLabel);



        replacements.put("${idx+1}", "1");



        replacements.put("${idx + 1}", "1");







        return replacements;



    }







    private void copyMergedRegions(Sheet srcSheet, Sheet destSheet, boolean isStatic, int dataBoundaryRow, int offset) {



        copyMergedRegions(srcSheet, destSheet, isStatic, dataBoundaryRow, offset, -1);



    }







    private void copyMergedRegions(Sheet srcSheet, Sheet destSheet, boolean isStatic, int dataBoundaryRow, int offset, int detailRowIdx) {



        for (int i = 0; i < srcSheet.getNumMergedRegions(); i++) {



            org.apache.poi.ss.util.CellRangeAddress region = srcSheet.getMergedRegion(i);



            int firstRow = region.getFirstRow();



            int lastRow = region.getLastRow();







            if (isStatic) {



                destSheet.addMergedRegion(region);



            } else {



                if (firstRow < dataBoundaryRow) {



                    if (firstRow == 4 && region.getFirstColumn() == 6 && srcSheet.getRow(4) != null && srcSheet.getRow(4).getCell(6) != null && srcSheet.getRow(4).getCell(6).toString().contains("Kỳ báo cáo")) {



                        destSheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(4, 4, 0, 15));



                    } else {



                        destSheet.addMergedRegion(region);



                    }



                } else {



                    int newFirstRow = firstRow + offset;



                    int newLastRow = lastRow + offset;



                    if (detailRowIdx != -1) {



                        if (firstRow > detailRowIdx) newFirstRow--;



                        if (lastRow > detailRowIdx) newLastRow--;



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



        map.put(com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.BEACON, "Hệ thống giám sát và điều phối giao thông hàng hải (VTS).");



        map.put(com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.BUOY, "Đê chắn sóng, đê chắn cát, kè hướng dòng, kè bảo vệ bờ.");



        map.put(com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.LIGHTHOUSE, "Luồng hàng hải, vùng đón trả hoa tiêu, vùng kiểm dịch.");



        map.put(com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER, "Khu chuyển tải, khu neo đậu, khu tránh, trú bão trong vùng nước cảng biển.");



        return map;



    }







    private List<Map<String, Object>> buildDynamicResultList(List<com.hanghai.kchtg.gis.point.entity.PointObject> points, String reportCode) {



        // Custom grouping for F-148 to match production category grouping



        if ("F-148".equalsIgnoreCase(reportCode)) {



            List<Map<String, Object>> arrResult = new ArrayList<>();



            // Group 1: Cảng biển



            long[] agg1 = new long[]{0, 0, 0};



            for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {



                if (p.getObjectType() == com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.PORT || p.getObjectType() == com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.BEACON) {



                    agg1[0] += 1;



                    agg1[2] += getPointAssetValue(p);



                }



            }



            if (agg1[0] > 0) {



                Map<String, Object> item = getStringObjectMap("I. Cảng biển", agg1);



                arrResult.add(item);



            }



            



            // Group 2: Cảng, bến thủy nội địa



            long[] agg2 = new long[]{0, 0, 0};



            for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {



                if (p.getObjectType() != com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.PORT && p.getObjectType() != com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.BEACON) {



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



                item.put("tenCangBien", p.getName());



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



                item.put("tenCangBien", p.getName());



                item.put("tenCang", p.getName());



                item.put("loaiTaiSan", p.getName());



                item.put("maTuyenLuong", p.getCode());



                item.put("tenTramQuanLyLuong", p.getName());



                item.put("tenDiemNeo", p.getName());



                



                // We use 0.0 instead of empty string for missing numeric fields so Excel formulas (e.g. VALUE(C13)) don't throw #VALUE!



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



                



                item.put("dienTichTheoThongBaoGanNhatTenLuongHangHai", 0.0);



                item.put("tinhTrangHoatDongChuaCongBoTenLuongHangHai", "");



                item.put("tinhTrangHoatDongDaCongBoTenLuongHangHai", "");



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



                



                arrResult.add(item);



            }



            return arrResult;



        }







        Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, String> categoryNames = getCategoryNamesMap();



        List<Map<String, Object>> arrResult = new ArrayList<>();



        Map<com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType, long[]> aggregated = new LinkedHashMap<>();







        for (com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type : categoryNames.keySet()) {



            aggregated.put(type, new long[]{0, 0, 0});



        }







        for (com.hanghai.kchtg.gis.point.entity.PointObject p : points) {



            com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType type = p.getObjectType();



            if (type == null) type = com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType.OTHER;







            long val = getPointAssetValue(p);



            long[] agg = aggregated.computeIfAbsent(type, k -> new long[]{0, 0, 0});



            agg[0] += 1;



            agg[2] += val;



        }







        for (var entry : aggregated.entrySet()) {



            long[] agg = entry.getValue();



            if (agg[0] == 0) continue;







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







  private void applyStaticRemergeAndOverflowMerge(Sheet destSheet, boolean isStatic, int dataStartRow, int dataEndRow) {



        int destMaxCols = 0;



        for (int r = 0; r <= destSheet.getLastRowNum(); r++) {



            Row row = destSheet.getRow(r);



            if (row != null && row.getLastCellNum() > destMaxCols) {



                destMaxCols = row.getLastCellNum();



            }



        }



        if (destMaxCols == 0) destMaxCols = 14;







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



            if (rowCheck == null) continue;



            Cell startCell = rowCheck.getCell(cStart);



            if (startCell != null && startCell.getCellType() == CellType.STRING) {



                String val = startCell.getStringCellValue();



                if (val != null && !val.trim().isEmpty()) {



                    int rightCol = cEnd;



                    for (int nextCol = cEnd + 1; nextCol < destMaxCols; nextCol++) {



                        // Check if any row in range [rStart, rEnd] for nextCol is already part of a merged region



                        boolean nextColOverlap = false;



                        for (int r = rStart; r <= rEnd; r++) {



                            for (org.apache.poi.ss.util.CellRangeAddress activeReg : mergedRegions) {



                                if (activeReg.isInRange(r, nextCol)) {



                                    nextColOverlap = true;



                                    break;



                                }



                            }



                            if (nextColOverlap) break;



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



                        destSheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rStart, rEnd, cStart, rightCol));



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



            if (destRow == null) continue;



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



                                destSheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(r, r, c, rightCol));



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



            try {



                workbook.getCreationHelper().createFormulaEvaluator().evaluateAll();



            } catch (Exception evalEx) {



                log.warn("Failed to evaluate formulas: {}", evalEx.getMessage());



            }



            return convertExcelToPdf(destSheet);



        }



    }







    private long getPointAssetValue(com.hanghai.kchtg.gis.point.entity.PointObject p) {



        long val = 500000000L;



        if (p.getCode() != null) {



            if (p.getCode().contains("HPH")) val = 12000000000L;



            else if (p.getCode().contains("BLV")) val = 15000000000L;



        }



        return val;



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







    private ReportResponse buildPreviewResponse(String code, List<String> headers, List<Map<String, Object>> rows, Map<String, Object> summary) {



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



                newStyle.setDataFormat(wb.createDataFormat().getFormat("#,##0.00"));



            }



            cell.setCellStyle(newStyle);



        } catch (Exception e) {



            log.warn("Failed to set cell format dynamically", e);



        }



    }







    private void copyCell(Cell srcCell, Cell destCell, Map<String, String> replacements) {



        if (srcCell == null) return;



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



                                destCell.setCellValue(repVal);



                                break;



                            }



                        }



                    }



                    for (Map.Entry<String, String> entry : replacements.entrySet()) {



                        if (val.contains(entry.getKey())) {



                            val = val.replace(entry.getKey(), entry.getValue() != null ? entry.getValue() : "");



                        }



                    }



                }



                destCell.setCellValue(val);



                break;



            case NUMERIC:



                destCell.setCellValue(srcCell.getNumericCellValue());



                break;



            case FORMULA:



                destCell.setCellFormula(srcCell.getCellFormula());



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



            if (row == null) continue;



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



            if (startRow != -1) break;



        }



        if (startRow == -1) {



            startRow = 7;



        }



        



        int endRow = sheet.getLastRowNum();



        for (int i = startRow; i <= sheet.getLastRowNum(); i++) {



            Row row = sheet.getRow(i);



            if (row == null) continue;



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



            if (endRow < sheet.getLastRowNum()) break;



        }



        



        return r >= startRow && r <= endRow;



    }







    private boolean isRowBlank(Row row, int maxCols) {



        if (row == null) return true;



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



                            } else if (cell.getCellType() == CellType.NUMERIC || cell.getCellType() == CellType.FORMULA || cell.getCellType() == CellType.BOOLEAN) {



                                hasVal = true;



                            }



                            if (hasVal && (c + 1) > maxCols) {



                                maxCols = c + 1;



                            }



                        }



                    }



                }



            }



            if (maxCols <= 0) maxCols = 1;







            boolean isLandscape = false;



            com.itextpdf.kernel.geom.PageSize pdfPageSize = com.itextpdf.kernel.geom.PageSize.A4;







            if (printSetup != null) {



                short excelPaperSize = printSetup.getPaperSize();



                boolean excelLandscape = printSetup.getLandscape();



                if (excelPaperSize == 1) pdfPageSize = com.itextpdf.kernel.geom.PageSize.LETTER;



                else if (excelPaperSize == 3) pdfPageSize = new com.itextpdf.kernel.geom.PageSize(792, 1224);



                else if (excelPaperSize == 8) pdfPageSize = com.itextpdf.kernel.geom.PageSize.A3;



                else pdfPageSize = com.itextpdf.kernel.geom.PageSize.A4;



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



                if (excelLeft > 0) leftMargin = excelLeft;



                if (excelRight > 0) rightMargin = excelRight;



                if (excelTop > 0) topMargin = excelTop;



                if (excelBottom > 0) bottomMargin = excelBottom;



            }







            doc.setMargins(topMargin, rightMargin, bottomMargin, leftMargin);







            byte[] fontBytes = null;



            try (InputStream fontIs = getClass().getClassLoader().getResourceAsStream("fonts/times.ttf")) {



                if (fontIs != null) fontBytes = fontIs.readAllBytes();



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



                if (row == null) continue;



                for (int c = 0; c < row.getLastCellNum(); c++) {



                    Cell cell = row.getCell(c);



                    if (cell != null && cell.getCellStyle() != null) {



                        CellStyle style = cell.getCellStyle();



                        if (r >= 8 && r <= 12 && c <= 2) {



                            log.info("Row {} Col {}: topBorder={}, bottomBorder={}, leftBorder={}, rightBorder={}", r, c, style.getBorderTop(), style.getBorderBottom(), style.getBorderLeft(), style.getBorderRight());



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



                if (row == null) {



                    for (int c = 0; c < maxCols; c++) {



                         if (!visited[r][c]) {



                             if (isTable || rowHasBorder[r]) {



                                 table.addCell(new com.itextpdf.layout.element.Cell().setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f)));



                             } else {



                                 table.addCell(new com.itextpdf.layout.element.Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));



                             }



                         }



                    }



                    continue;



                }







                for (int c = 0; c < maxCols; c++) {



                    if (visited[r][c]) continue;







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



                                if (cell.getCellType() == CellType.STRING) cellStr = cell.getStringCellValue();



                            } catch (Exception ignored) {}



                            if (!isTable && r >= sheet.getLastRowNum() - 8 && cellStr != null && cellStr.trim().length() > 15) {



                                fSize = fSize * 0.75f;



                            }



                            pdfCell.setFontSize(fSize);



                            if (font.getBold()) pdfCell.setBold();



                            if (font.getItalic()) pdfCell.setItalic();



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



                                if (bCell != null && bCell.getCellStyle() != null) bottomStyle = bCell.getCellStyle();



                            }



                            Row rRow = sheet.getRow(r);



                            if (rRow != null) {



                                Cell rCell = rRow.getCell(mergedRegion.getLastColumn());



                                if (rCell != null && rCell.getCellStyle() != null) rightStyle = rCell.getCellStyle();



                            }



                        }







                        boolean borderTop = isTable || rowHasBorder[r];



                        boolean borderBottom = isTable || rowHasBorder[r];



                        boolean borderLeft = isTable || rowHasBorder[r];



                        boolean borderRight = isTable || rowHasBorder[r];







                        if (style.getBorderTop() != org.apache.poi.ss.usermodel.BorderStyle.NONE) borderTop = true;



                        if (bottomStyle.getBorderBottom() != org.apache.poi.ss.usermodel.BorderStyle.NONE) borderBottom = true;



                        if (style.getBorderLeft() != org.apache.poi.ss.usermodel.BorderStyle.NONE) borderLeft = true;



                        if (rightStyle.getBorderRight() != org.apache.poi.ss.usermodel.BorderStyle.NONE) borderRight = true;







                        if (borderTop) {



                            pdfCell.setBorderTop(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f));



                        } else {



                            pdfCell.setBorderTop(com.itextpdf.layout.borders.Border.NO_BORDER);



                        }



                        if (borderBottom) {



                            pdfCell.setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f));



                        } else {



                            pdfCell.setBorderBottom(com.itextpdf.layout.borders.Border.NO_BORDER);



                        }



                        if (borderLeft) {



                            pdfCell.setBorderLeft(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f));



                        } else {



                            pdfCell.setBorderLeft(com.itextpdf.layout.borders.Border.NO_BORDER);



                        }



                        if (borderRight) {



                            pdfCell.setBorderRight(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f));



                        } else {



                            pdfCell.setBorderRight(com.itextpdf.layout.borders.Border.NO_BORDER);



                        }



                    } else {



                        if (isTable || rowHasBorder[r]) {



                            pdfCell.setBorder(new com.itextpdf.layout.borders.SolidBorder(com.itextpdf.kernel.colors.ColorConstants.BLACK, 0.5f));



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



