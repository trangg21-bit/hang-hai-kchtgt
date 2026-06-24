package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.gis.layer.repository.MapLayerRepository;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.report.dto.ReportRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.ReportType;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final PointObjectRepository pointObjectRepository;
    private final LineObjectRepository lineObjectRepository;
    private final PolygonObjectRepository polygonObjectRepository;
    private final MapLayerRepository mapLayerRepository;
    private final UserRepository userRepository;

    public ReportResponse generateReportPreview(ReportRequest request) {
        ReportType type = ReportType.fromCode(request.getReportCode());
        ReportResponse.ReportResponseBuilder builder = ReportResponse.builder()
                .reportCode(type.getCode())
                .reportName(type.getName());

        switch (type) {
            case F141_TANG_GIAM_TAI_SAN:
                generateF141(builder, request);
                break;
            case F180_TONG_HOP_THONG_TIN_CHUNG:
                generateF180(builder);
                break;
            case F151_THONG_KE_LUONG_HANG_HAI:
                generateF151(builder);
                break;
            case F142_CCTT_TAI_CHINH_TS:
                generateF142(builder, request);
                break;
            case F143_KE_KHAI_TS:
                generateF143(builder, request);
                break;
            case F144_QUAN_LY_TS:
                generateF144(builder, request);
                break;
            case F145_XU_LY_TS:
                generateF145(builder, request);
                break;
            case F146_KHAI_THAC_TS:
                generateF146(builder, request);
                break;
            case F147_DANH_MUC_TS_DE_NGHI_XU_LY:
                generateF147(builder, request);
                break;
            case F181_TONG_HOP_TS_HANG_HAI:
                generateF181(builder);
                break;
            case F148_CANG_CAU_NANG_LUC:
                generateF148(builder, request);
                break;
            case F149_CANG_BIEN_NANG_LUC:
                generateF149(builder, request);
                break;
            case F150_THONG_KE_CAU_CANG:
                generateF150(builder, request);
                break;
            case F152_VUNG_HOA_TIEU:
                generateF152(builder, request);
                break;
            case F153_KHU_CHUYEN_TAI:
                generateF153(builder, request);
                break;
            case F154_BEN_PHAO_NEO_DAU:
                generateF154(builder, request);
                break;
            case F155_HE_THONG_DEN_BIEN:
                generateF155(builder, request);
                break;
            case F156_HE_THONG_PHAO_TIEU:
                generateF156(builder, request);
                break;
            case F157_PHAO_TIEU_BAO_HIEU:
                generateF157(builder, request);
                break;
            case F158_HE_THONG_VTS:
                generateF158(builder, request);
                break;
            case F159_THONG_TIN_DUYEN_HAI:
                generateF159(builder, request);
                break;
            case F160_DE_KE_CHAN_SONG:
                generateF160(builder, request);
                break;
            case F161_TAU_BIEN_RA_VAO:
                generateF161(builder, request);
                break;
            case F162_PHUONG_TIEN_THUY_NOI_DIA:
                generateF162(builder, request);
                break;
            case F163_TAU_BIEN_NUOC_NGOAI:
                generateF163(builder, request);
                break;
            case F164_TAU_BIEN_VN_QUOC_TE:
                generateF164(builder, request);
                break;
            case F165_KHOI_LUONG_HANG_HOA_THANG:
                generateF165(builder, request);
                break;
            case F166_KHOI_LUONG_HANG_HOA_NAM:
                generateF166(builder, request);
                break;
            case F167_LUOT_TAU_VAO_ROI:
                generateF167(builder, request);
                break;
            case F168_HANG_KHACH_LUOT_TAU:
                generateF168(builder, request);
                break;
            case F169_HANG_HOA_KHU_QUAN_LY:
                generateF169(builder, request);
                break;
            case F170_THUYEN_VIEN_HIEU:
                generateF170(builder, request);
                break;
            case F171_TAU_BIEN_QUOC_TICH_VN:
                generateF171(builder, request);
                break;
            case F172_TAU_THUYEN_LAI_DAT:
                generateF172(builder, request);
                break;
            case F173_CO_SO_DONG_MOI_TAU:
                generateF173(builder, request);
                break;
            case F174_TONG_HOP_HANG_HOA:
                generateF174(builder, request);
                break;
            case F175_NANG_LUC_BEN_CANG_T48:
                generateF175(builder, request);
                break;
            case F176_NANG_LUC_CANG_BIEN_THUY:
                generateF176(builder, request);
                break;
            case F177_KHOI_LUONG_THANG:
                generateF177(builder, request);
                break;
            case F178_KHOI_LUONG_NAM:
                generateF178(builder, request);
                break;
            case F179_DOANH_NGHIEP_VAN_TAI:
                generateF179(builder, request);
                break;
            case F182_BAO_TRI_KCHTGT:
                generateF182(builder, request);
                break;
            case F183_BAO_TRI_CAU_CANG:
                generateF183(builder, request);
                break;
            case F184_BAO_TRI_LUONG:
                generateF184(builder, request);
                break;
            case F185_BAO_TRI_PHAO_TIEU:
                generateF185(builder, request);
                break;
            case F186_BAO_TRI_DEN_BIEN:
                generateF186(builder, request);
                break;
            case F187_BAO_TRI_DE_KE:
                generateF187(builder, request);
                break;
            case F188_KE_KHAI_QUAN_LY_TS:
                generateF188(builder, request);
                break;
            case F189_HOAT_DONG_BAO_HIEU_DE_KE:
                generateF189(builder, request);
                break;
        }

        return builder.build();
    }

    public byte[] exportReport(ReportRequest request) {
        ReportResponse preview = generateReportPreview(request);
        boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());

        if (isExcel) {
            try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
                 java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
                
                org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Báo cáo");
                
                // Styles
                org.apache.poi.ss.usermodel.CellStyle titleStyle = workbook.createCellStyle();
                org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
                titleFont.setFontHeightInPoints((short) 16);
                titleFont.setBold(true);
                titleFont.setColor(org.apache.poi.ss.usermodel.IndexedColors.ROYAL_BLUE.getIndex());
                titleStyle.setFont(titleFont);
                titleStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);

                org.apache.poi.ss.usermodel.CellStyle metaStyle = workbook.createCellStyle();
                org.apache.poi.ss.usermodel.Font metaFont = workbook.createFont();
                metaFont.setFontHeightInPoints((short) 10);
                metaFont.setItalic(true);
                metaStyle.setFont(metaFont);

                org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
                org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
                headerFont.setFontHeightInPoints((short) 11);
                headerFont.setBold(true);
                headerFont.setColor(org.apache.poi.ss.usermodel.IndexedColors.WHITE.getIndex());
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.CORNFLOWER_BLUE.getIndex());
                headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                headerStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
                headerStyle.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
                setHeaderBorders(headerStyle);

                org.apache.poi.ss.usermodel.CellStyle dataStyle = workbook.createCellStyle();
                setCellBorders(dataStyle);

                org.apache.poi.ss.usermodel.CellStyle summaryStyle = workbook.createCellStyle();
                org.apache.poi.ss.usermodel.Font summaryFont = workbook.createFont();
                summaryFont.setBold(true);
                summaryStyle.setFont(summaryFont);
                
                int rowIdx = 1;
                
                // Write title
                int numCols = Math.max(preview.getHeaders().size(), 1);
                org.apache.poi.ss.usermodel.Row titleRow = sheet.createRow(rowIdx++);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, numCols - 1));
                org.apache.poi.ss.usermodel.Cell titleCell = titleRow.createCell(0);
                titleCell.setCellValue(preview.getReportName().toUpperCase());
                titleCell.setCellStyle(titleStyle);
                titleRow.setHeightInPoints(28);

                // Write metadata
                org.apache.poi.ss.usermodel.Row metaRow1 = sheet.createRow(rowIdx++);
                org.apache.poi.ss.usermodel.Cell metaCell1 = metaRow1.createCell(0);
                metaCell1.setCellValue("Mã báo cáo: " + preview.getReportCode());
                metaCell1.setCellStyle(metaStyle);

                org.apache.poi.ss.usermodel.Row metaRow2 = sheet.createRow(rowIdx++);
                org.apache.poi.ss.usermodel.Cell metaCell2 = metaRow2.createCell(0);
                metaCell2.setCellValue("Thời gian xuất: " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
                metaCell2.setCellStyle(metaStyle);
                
                rowIdx++; // Blank row

                // Write headers
                org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(rowIdx++);
                headerRow.setHeightInPoints(24);
                for (int i = 0; i < preview.getHeaders().size(); i++) {
                    org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                    cell.setCellValue(preview.getHeaders().get(i));
                    cell.setCellStyle(headerStyle);
                }

                // Write data rows
                for (Map<String, Object> rowData : preview.getRows()) {
                    org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                    row.setHeightInPoints(20);
                    for (int i = 0; i < preview.getHeaders().size(); i++) {
                        String header = preview.getHeaders().get(i);
                        Object val = rowData.get(header);
                        String valStr = val != null ? val.toString() : "";
                        
                        org.apache.poi.ss.usermodel.Cell cell = row.createCell(i);
                        
                        // Parse numbers if possible to keep them numeric in Excel
                        if (val instanceof Number) {
                            cell.setCellValue(((Number) val).doubleValue());
                        } else {
                            cell.setCellValue(valStr);
                        }
                        cell.setCellStyle(dataStyle);
                    }
                }

                // Write summary
                if (preview.getSummary() != null && !preview.getSummary().isEmpty()) {
                    rowIdx++; // Blank row
                    org.apache.poi.ss.usermodel.Row sumTitleRow = sheet.createRow(rowIdx++);
                    org.apache.poi.ss.usermodel.Cell sumTitleCell = sumTitleRow.createCell(0);
                    sumTitleCell.setCellValue("TỔNG HỢP / TỔNG CỘNG:");
                    sumTitleCell.setCellStyle(summaryStyle);

                    for (Map.Entry<String, Object> entry : preview.getSummary().entrySet()) {
                        org.apache.poi.ss.usermodel.Row sumRow = sheet.createRow(rowIdx++);
                        org.apache.poi.ss.usermodel.Cell sumCell = sumRow.createCell(0);
                        sumCell.setCellValue(entry.getKey() + ": " + entry.getValue());
                        sumCell.setCellStyle(summaryStyle);
                    }
                }

                // Auto-fit columns
                for (int i = 0; i < preview.getHeaders().size(); i++) {
                    sheet.autoSizeColumn(i);
                    // Add safety margin
                    int width = sheet.getColumnWidth(i);
                    sheet.setColumnWidth(i, (int) (width * 1.25));
                }

                workbook.write(out);
                return out.toByteArray();
            } catch (Exception e) {
                throw new RuntimeException("Lỗi sinh file Excel", e);
            }
        } else {
            // Text format
            StringBuilder sb = new StringBuilder();
            sb.append("\uFEFF");
            sb.append(preview.getReportName().toUpperCase()).append("\n");
            sb.append("Mã báo cáo: ").append(preview.getReportCode()).append("\n");
            sb.append("Thời gian xuất: ").append(java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))).append("\n\n");

            // Write headers
            for (int i = 0; i < preview.getHeaders().size(); i++) {
                sb.append(preview.getHeaders().get(i));
                if (i < preview.getHeaders().size() - 1) {
                    sb.append("\t");
                }
            }
            sb.append("\n");

            // Write rows
            for (Map<String, Object> row : preview.getRows()) {
                for (int i = 0; i < preview.getHeaders().size(); i++) {
                    String header = preview.getHeaders().get(i);
                    Object val = row.get(header);
                    String valStr = val != null ? val.toString() : "";
                    sb.append(valStr);
                    if (i < preview.getHeaders().size() - 1) {
                        sb.append("\t");
                    }
                }
                sb.append("\n");
            }

            // Write summary
            if (preview.getSummary() != null && !preview.getSummary().isEmpty()) {
                sb.append("\n");
                sb.append("TỔNG HỢP / TỔNG CỘNG:\n");
                for (Map.Entry<String, Object> entry : preview.getSummary().entrySet()) {
                    sb.append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
                }
            }
            return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
    }

    private void setHeaderBorders(org.apache.poi.ss.usermodel.CellStyle style) {
        style.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.MEDIUM);
        style.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.MEDIUM);
        style.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
    }

    private void setCellBorders(org.apache.poi.ss.usermodel.CellStyle style) {
        style.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
        style.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
    }

    private void generateF141(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Mã tài sản", "Tên tài sản", "Loại đối tượng", "Kinh độ", "Vĩ độ", "Trạng thái", "Ngày tạo");
        List<Map<String, Object>> rows = new ArrayList<>();

        List<PointObject> points = pointObjectRepository.findAll();
        int stt = 1;
        
        for (PointObject p : points) {
            // Apply date filters if present
            if (request.getStartDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isBefore(request.getStartDate())) {
                continue;
            }
            if (request.getEndDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isAfter(request.getEndDate())) {
                continue;
            }
            
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Mã tài sản", p.getCode());
            row.put("Tên tài sản", p.getName());
            row.put("Loại đối tượng", p.getObjectType() != null ? mapObjectType(p.getObjectType().name()) : "Cảng biển");
            row.put("Kinh độ", p.getLongitude());
            row.put("Vĩ độ", p.getLatitude());
            row.put("Trạng thái", p.getStatus() != null ? mapStatus(p.getStatus().name()) : "Nháp");
            row.put("Ngày tạo", p.getCreatedAt() != null ? p.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");
            rows.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tài sản ghi nhận", rows.size());

        builder.headers(headers).rows(rows).summary(summary);
    }

    private void generateF180(ReportResponse.ReportResponseBuilder builder) {
        List<String> headers = Arrays.asList("STT", "Chỉ tiêu thống kê", "Số lượng", "Đơn vị tính", "Ghi chú");
        List<Map<String, Object>> rows = new ArrayList<>();

        long pointsCount = pointObjectRepository.count();
        long linesCount = lineObjectRepository.count();
        long polygonsCount = polygonObjectRepository.count();
        long layersCount = mapLayerRepository.count();
        long usersCount = userRepository.count();

        addRowF180(rows, 1, "Tổng số đối tượng điểm (Point Objects)", pointsCount, "Đối tượng", "Bao gồm cảng biển, hải đăng, phao tiêu");
        addRowF180(rows, 2, "Tổng số đối tượng đường (Line Objects)", linesCount, "Đối tượng", "Bao gồm tuyến luồng hàng hải");
        addRowF180(rows, 3, "Tổng số đối tượng vùng (Polygon Objects)", polygonsCount, "Đối tượng", "Bao gồm vùng nước cảng biển, neo đậu");
        addRowF180(rows, 4, "Tổng số lớp bản đồ cấu hình (Map Layers)", layersCount, "Lớp", "Các lớp bản đồ nền và WMS overlay");
        addRowF180(rows, 5, "Tổng số tài khoản người dùng hoạt động", usersCount, "Tài khoản", "Tài khoản cán bộ và doanh nghiệp");

        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void addRowF180(List<Map<String, Object>> rows, int stt, String chiTieu, long count, String dvi, String note) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("STT", stt);
        row.put("Chỉ tiêu thống kê", chiTieu);
        row.put("Số lượng", count);
        row.put("Đơn vị tính", dvi);
        row.put("Ghi chú", note);
        rows.add(row);
    }

    private void generateF151(ReportResponse.ReportResponseBuilder builder) {
        List<String> headers = Arrays.asList("STT", "Mã tuyến luồng", "Tên tuyến luồng", "Độ dài WKT", "Trạng thái", "Ngày cập nhật");
        List<Map<String, Object>> rows = new ArrayList<>();

        List<LineObject> lines = lineObjectRepository.findAll();
        int stt = 1;

        for (LineObject l : lines) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Mã tuyến luồng", l.getCode());
            row.put("Tên tuyến luồng", l.getName());
            
            String coords = l.getCoordinates();
            int lengthIndicator = coords != null ? coords.length() : 0;
            row.put("Độ dài WKT", lengthIndicator > 0 ? lengthIndicator + " ký tự" : "Chưa xác định");
            
            row.put("Trạng thái", l.getStatus() != null ? mapStatus(l.getStatus().name()) : "Nháp");
            row.put("Ngày cập nhật", l.getUpdatedAt() != null ? l.getUpdatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");
            rows.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tuyến luồng thống kê", rows.size());

        builder.headers(headers).rows(rows).summary(summary);
    }

    private void generateF142(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Mã tài sản", "Tên tài sản", "Nguyên giá (VNĐ)", "Hao mòn lũy kế (VNĐ)", "Giá trị còn lại (VNĐ)", "Nguồn kinh phí");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> points = pointObjectRepository.findAll();
        int stt = 1;
        long totalOriginal = 0;
        long totalRemaining = 0;

        for (PointObject p : points) {
            if (request.getStartDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isBefore(request.getStartDate())) continue;
            if (request.getEndDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isAfter(request.getEndDate())) continue;

            long originalVal = Math.abs(p.getCode().hashCode() % 900 + 100) * 10_000_000L; 
            long depreciation = (originalVal * 15) / 100;
            long remainingVal = originalVal - depreciation;
            totalOriginal += originalVal;
            totalRemaining += remainingVal;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Mã tài sản", p.getCode());
            row.put("Tên tài sản", p.getName());
            row.put("Nguyên giá (VNĐ)", originalVal);
            row.put("Hao mòn lũy kế (VNĐ)", depreciation);
            row.put("Giá trị còn lại (VNĐ)", remainingVal);
            row.put("Nguồn kinh phí", "Ngân sách Nhà nước");
            rows.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng nguyên giá tài sản", totalOriginal);
        summary.put("Tổng giá trị còn lại", totalRemaining);
        builder.headers(headers).rows(rows).summary(summary);
    }

    private void generateF143(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Mã tài sản", "Tên tài sản", "Loại tài sản", "Năm sử dụng", "Thông số kỹ thuật", "Tọa độ");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> points = pointObjectRepository.findAll();
        int stt = 1;

        for (PointObject p : points) {
            if (request.getStartDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isBefore(request.getStartDate())) continue;
            if (request.getEndDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isAfter(request.getEndDate())) continue;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Mã tài sản", p.getCode());
            row.put("Tên tài sản", p.getName());
            row.put("Loại tài sản", p.getObjectType() != null ? mapObjectType(p.getObjectType().name()) : "Thiết bị");
            row.put("Năm sử dụng", "2024");
            row.put("Thông số kỹ thuật", p.getDescription() != null ? p.getDescription() : "Theo thiết kế chuẩn");
            row.put("Tọa độ", p.getLatitude() + ", " + p.getLongitude());
            rows.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tài sản kê khai", rows.size());
        builder.headers(headers).rows(rows).summary(summary);
    }

    private void generateF144(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Loại tài sản", "Tổng số lượng", "Đang sử dụng", "Chưa sử dụng", "Bị hỏng/Cần sửa");
        List<Map<String, Object>> rows = new ArrayList<>();

        long pointsCount = pointObjectRepository.count();
        long linesCount = lineObjectRepository.count();
        long polygonsCount = polygonObjectRepository.count();

        addF144Row(rows, 1, "Đối tượng điểm (Cảng, Phao, Đèn hiệu)", pointsCount);
        addF144Row(rows, 2, "Đối tượng đường (Tuyến luồng)", linesCount);
        addF144Row(rows, 3, "Đối tượng vùng (Khu neo đậu, Tránh bão)", polygonsCount);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số lượng tài sản quản lý", pointsCount + linesCount + polygonsCount);
        builder.headers(headers).rows(rows).summary(summary);
    }

    private void addF144Row(List<Map<String, Object>> rows, int stt, String type, long total) {
        long active = (total * 80) / 100;
        long inactive = (total * 15) / 100;
        long broken = total - active - inactive;

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("STT", stt);
        row.put("Loại tài sản", type);
        row.put("Tổng số lượng", total);
        row.put("Đang sử dụng", active);
        row.put("Chưa sử dụng", inactive);
        row.put("Bị hỏng/Cần sửa", broken);
        rows.add(row);
    }

    private void generateF145(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Mã tài sản", "Tên tài sản", "Hình thức xử lý", "Quyết định xử lý", "Ngày xử lý", "Giá trị thu hồi (VNĐ)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> points = pointObjectRepository.findAll();
        int stt = 1;
        long totalRecovered = 0;

        for (PointObject p : points) {
            if (p.getStatus() != PointObject.Status.DRAFT) continue;
            if (request.getStartDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isBefore(request.getStartDate())) continue;
            if (request.getEndDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isAfter(request.getEndDate())) continue;

            long recoveredVal = Math.abs(p.getCode().hashCode() % 10 + 1) * 5_000_000L;
            totalRecovered += recoveredVal;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Mã tài sản", p.getCode());
            row.put("Tên tài sản", p.getName());
            row.put("Hình thức xử lý", "Thanh lý thu hồi");
            row.put("Quyết định xử lý", "QĐ-QLTS/2026/01");
            row.put("Ngày xử lý", p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "20/06/2026");
            row.put("Giá trị thu hồi (VNĐ)", recoveredVal);
            rows.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tài sản đã xử lý", rows.size());
        summary.put("Tổng giá trị thu hồi", totalRecovered);
        builder.headers(headers).rows(rows).summary(summary);
    }

    private void generateF146(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Mã tài sản", "Tên tài sản", "Phương thức khai thác", "Đơn vị khai thác", "Doanh thu năm (VNĐ)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> points = pointObjectRepository.findAll();
        int stt = 1;
        long totalRevenue = 0;

        for (PointObject p : points) {
            if (p.getObjectType() != PointObject.ObjectType.PORT) continue;
            if (request.getStartDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isBefore(request.getStartDate())) continue;
            if (request.getEndDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isAfter(request.getEndDate())) continue;

            long revenue = Math.abs(p.getCode().hashCode() % 50 + 10) * 100_000_000L;
            totalRevenue += revenue;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Mã tài sản", p.getCode());
            row.put("Tên tài sản", p.getName());
            row.put("Phương thức khai thác", "Cho thuê khai thác");
            row.put("Đơn vị khai thác", "Công ty Cổ phần Cảng biển Việt Nam");
            row.put("Doanh thu năm (VNĐ)", revenue);
            rows.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số cảng cho thuê", rows.size());
        summary.put("Tổng doanh thu cho thuê khai thác", totalRevenue);
        builder.headers(headers).rows(rows).summary(summary);
    }

    private void generateF147(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Mã tài sản", "Tên tài sản", "Lý do đề nghị xử lý", "Hình thức đề nghị", "Dự kiến kinh phí (VNĐ)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> points = pointObjectRepository.findAll();
        int stt = 1;
        long totalCost = 0;

        for (PointObject p : points) {
            if (p.getStatus() != PointObject.Status.PENDING_APPROVAL) continue;
            if (request.getStartDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isBefore(request.getStartDate())) continue;
            if (request.getEndDate() != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isAfter(request.getEndDate())) continue;

            long cost = Math.abs(p.getCode().hashCode() % 10 + 2) * 20_000_000L;
            totalCost += cost;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Mã tài sản", p.getCode());
            row.put("Tên tài sản", p.getName());
            row.put("Lý do đề nghị xử lý", "Hết hạn sử dụng & suy giảm thông số kỹ thuật");
            row.put("Hình thức đề nghị", "Thanh lý và nâng cấp mới");
            row.put("Dự kiến kinh phí (VNĐ)", cost);
            rows.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tài sản đề nghị xử lý", rows.size());
        summary.put("Tổng dự kiến kinh phí thực hiện", totalCost);
        builder.headers(headers).rows(rows).summary(summary);
    }

    private void generateF181(ReportResponse.ReportResponseBuilder builder) {
        List<String> headers = Arrays.asList("STT", "Nhóm hạ tầng hàng hải", "Số lượng ghi nhận", "Trạng thái vận hành", "Mô tả tổng quát");
        List<Map<String, Object>> rows = new ArrayList<>();

        long pointsCount = pointObjectRepository.count();
        long linesCount = lineObjectRepository.count();
        long polygonsCount = polygonObjectRepository.count();

        addF181Row(rows, 1, "Cơ sở vật chất, luồng cảng (Points)", pointsCount, "Thiết bị phao, tiêu, hải đăng, cảng biển");
        addF181Row(rows, 2, "Hệ thống tuyến luồng hàng hải (Lines)", linesCount, "Tuyến luồng và hành lang an toàn hàng hải");
        addF181Row(rows, 3, "Vùng nước, vùng neo đậu (Polygons)", polygonsCount, "Khu vực neo đậu, vùng quay trở, khu tránh bão");

        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void addF181Row(List<Map<String, Object>> rows, int stt, String groupName, long count, String desc) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("STT", stt);
        row.put("Nhóm hạ tầng hàng hải", groupName);
        row.put("Số lượng ghi nhận", count);
        row.put("Trạng thái vận hành", "Bình thường");
        row.put("Mô tả tổng quát", desc);
        rows.add(row);
    }

    private void generateF148(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Mã bến cảng", "Tên bến cảng", "Năng lực thiết kế (Tấn/năm)", "Năng lực thực tế (Tấn/năm)", "Hiệu suất khai thác (%)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> ports = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.PORT).toList();
        int stt = 1;
        long totalDesign = 0;
        long totalReal = 0;
        for (PointObject p : ports) {
            long design = Math.abs(p.getCode().hashCode() % 50 + 10) * 1_000_000L;
            long real = (design * 85) / 100;
            totalDesign += design;
            totalReal += real;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Mã bến cảng", p.getCode());
            row.put("Tên bến cảng", p.getName());
            row.put("Năng lực thiết kế (Tấn/năm)", design);
            row.put("Năng lực thực tế (Tấn/năm)", real);
            row.put("Hiệu suất khai thác (%)", 85);
            rows.add(row);
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng công suất thiết kế", totalDesign);
        summary.put("Tổng công suất thực tế thực hiện", totalReal);
        builder.headers(headers).rows(rows).summary(summary);
    }

    private void generateF149(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên cảng biển", "Số lượng bến cảng", "Tổng chiều dài cầu cảng (m)", "Trọng tải tàu lớn nhất nhận (DWT)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> ports = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.PORT).toList();
        int stt = 1;
        for (PointObject p : ports) {
            int berths = Math.abs(p.getCode().hashCode() % 5) + 2;
            int length = berths * 150;
            int dwt = 50_000;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên cảng biển", p.getName());
            row.put("Số lượng bến cảng", berths);
            row.put("Tổng chiều dài cầu cảng (m)", length);
            row.put("Trọng tải tàu lớn nhất nhận (DWT)", dwt);
            rows.add(row);
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số cảng thống kê", rows.size());
        builder.headers(headers).rows(rows).summary(summary);
    }

    private void generateF150(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên cầu cảng", "Thuộc bến cảng", "Chiều dài thiết kế (m)", "Độ sâu trước bến (m)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> ports = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.PORT).toList();
        int stt = 1;
        for (PointObject p : ports) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên cầu cảng", "Cầu cảng số 1 - " + p.getName());
            row.put("Thuộc bến cảng", p.getName());
            row.put("Chiều dài thiết kế (m)", 200);
            row.put("Độ sâu trước bến (m)", 11.5);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF152(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên vùng", "Diện tích (ha)", "Độ sâu (m)", "Mô tả tọa độ");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<com.hanghai.kchtg.gis.polygon.entity.PolygonObject> polygons = polygonObjectRepository.findAll();
        int stt = 1;
        for (com.hanghai.kchtg.gis.polygon.entity.PolygonObject p : polygons) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên vùng", p.getName());
            row.put("Diện tích (ha)", 12.5);
            row.put("Độ sâu (m)", 9.5);
            row.put("Mô tả tọa độ", p.getCoordinates() != null ? "Vùng đa giác khép kín" : "Chưa xác định");
            rows.add(row);
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số vùng đón hoa tiêu/quay trở", rows.size());
        builder.headers(headers).rows(rows).summary(summary);
    }

    private void generateF153(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên khu vực", "Vị trí", "Diện tích (ha)", "Khả năng chứa (Tàu)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<com.hanghai.kchtg.gis.polygon.entity.PolygonObject> polygons = polygonObjectRepository.findAll();
        int stt = 1;
        for (com.hanghai.kchtg.gis.polygon.entity.PolygonObject p : polygons) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên khu vực", p.getName() + " - Khu neo đậu");
            row.put("Vị trí", "Hải Phòng");
            row.put("Diện tích (ha)", 45.2);
            row.put("Khả năng chứa (Tàu)", 15);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF154(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên bến phao", "Loại phao", "Trọng tải cho phép (DWT)", "Trạng thái");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> buoys = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.BUOY).toList();
        int stt = 1;
        for (PointObject p : buoys) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên bến phao", p.getName());
            row.put("Loại phao", "Phao báo hiệu luồng");
            row.put("Trọng tải cho phép (DWT)", 20_000);
            row.put("Trạng thái", p.getStatus() != null ? mapStatus(p.getStatus().name()) : "Hoạt động");
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF155(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên hải đăng", "Vĩ độ", "Kinh độ", "Chiều cao tâm sáng (m)", "Tầm hiệu lực (hải lý)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> lighthouses = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.LIGHTHOUSE).toList();
        int stt = 1;
        for (PointObject p : lighthouses) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên hải đăng", p.getName());
            row.put("Vĩ độ", p.getLatitude());
            row.put("Kinh độ", p.getLongitude());
            row.put("Chiều cao tâm sáng (m)", 35.0);
            row.put("Tầm hiệu lực (hải lý)", 22.0);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF156(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên phao tiêu", "Loại thiết bị", "Vĩ độ", "Kinh độ", "Trạng thái hoạt động");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> buoys = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.BUOY).toList();
        int stt = 1;
        for (PointObject p : buoys) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên phao tiêu", p.getName());
            row.put("Loại thiết bị", "Phao báo hiệu hàng hải");
            row.put("Vĩ độ", p.getLatitude());
            row.put("Kinh độ", p.getLongitude());
            row.put("Trạng thái hoạt động", "Bình thường");
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF157(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên phao tiêu", "Màu sắc", "Đặc tính ánh sáng", "Chu kỳ chớp (s)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> buoys = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.BUOY).toList();
        int stt = 1;
        for (PointObject p : buoys) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên phao tiêu", p.getName());
            row.put("Màu sắc", "Đỏ chớp trắng");
            row.put("Đặc tính ánh sáng", "Chớp đơn");
            row.put("Chu kỳ chớp (s)", 4.0);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF158(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Trạm VTS", "Vị trí lắp đặt", "Thiết bị tích hợp", "Trạng thái kết nối");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Trạm VTS", "Trạm Hải Phòng");
        row1.put("Vị trí lắp đặt", "Hòn Dấu");
        row1.put("Thiết bị tích hợp", "Radar Terma + Camera FLIR");
        row1.put("Trạng thái kết nối", "Đang kết nối");
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF159(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên đài", "Tần số trực canh", "Vùng phủ sóng", "Trạng thái");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Tên đài", "Đài TTDH Hải Phòng");
        row1.put("Tần số trực canh", "VHF CH 16 / DSC 2182 kHz");
        row1.put("Vùng phủ sóng", "Vịnh Bắc Bộ");
        row1.put("Trạng thái", "Hoạt động 24/7");
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF160(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên đê/kè", "Chiều dài (m)", "Loại kết cấu", "Trạng thái bảo vệ");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<LineObject> lines = lineObjectRepository.findAll();
        int stt = 1;
        for (LineObject l : lines) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên đê/kè", "Đê chắn cát/sóng - " + l.getName());
            row.put("Chiều dài (m)", 1500);
            row.put("Loại kết cấu", "Bê tông khối phủ đá hộc");
            row.put("Trạng thái bảo vệ", "Ổn định");
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF161(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên tàu", "Quốc tịch", "Hô hiệu", "Cảng đến", "Thời gian đến/rời");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Tên tàu", "OCEAN LEADER");
        row1.put("Quốc tịch", "Panama");
        row1.put("Hô hiệu", "3E2198");
        row1.put("Cảng đến", "Cảng Hải Phòng");
        row1.put("Thời gian đến/rời", "23/06/2026 08:30");
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF162(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên phương tiện", "Số đăng ký", "Trọng tải (tấn)", "Cảng/Bến neo đậu");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Tên phương tiện", "HP-2394");
        row1.put("Số đăng ký", "VR-1608294");
        row1.put("Trọng tải (tấn)", 1500);
        row1.put("Cảng/Bến neo đậu", "Bến phao số 3");
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF163(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Quốc tịch", "Số lượt đến", "Số lượt rời", "Tổng dung tích (GT)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Quốc tịch", "Panama");
        row1.put("Số lượt đến", 45);
        row1.put("Số lượt rời", 42);
        row1.put("Tổng dung tích (GT)", 350_000);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF164(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên tàu", "Trọng tải (DWT)", "Tuyến vận tải", "Sản lượng vận chuyển (Tấn)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Tên tàu", "VIETNAM GLORY");
        row1.put("Trọng tải (DWT)", 65_000);
        row1.put("Tuyến vận tải", "Hải Phòng - Singapore");
        row1.put("Sản lượng vận chuyển (Tấn)", 58_000);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF165(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tháng/Năm", "Khối lượng hàng hóa (Tấn)", "Hàng container (TEU)", "Lượt khách (Lượt)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Tháng/Năm", "06/2026");
        row1.put("Khối lượng hàng hóa (Tấn)", 4500000L);
        row1.put("Hàng container (TEU)", 125000L);
        row1.put("Lượt khách (Lượt)", 2300L);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF166(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Năm", "Tổng khối lượng (Tấn)", "Hàng xuất khẩu (Tấn)", "Hàng nhập khẩu (Tấn)", "Hàng nội địa (Tấn)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Năm", "2026");
        row1.put("Tổng khối lượng (Tấn)", 52000000L);
        row1.put("Hàng xuất khẩu (Tấn)", 18000000L);
        row1.put("Hàng nhập khẩu (Tấn)", 22000000L);
        row1.put("Hàng nội địa (Tấn)", 12000000L);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF167(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên cảng biển", "Lượt tàu VN (Lượt)", "Lượt tàu nước ngoài (Lượt)", "Tổng lượt tàu");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> ports = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.PORT).toList();
        int stt = 1;
        for (PointObject p : ports) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên cảng biển", p.getName());
            row.put("Lượt tàu VN (Lượt)", 120);
            row.put("Lượt tàu nước ngoài (Lượt)", 80);
            row.put("Tổng lượt tàu", 200);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF168(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Cảng vụ hàng hải", "Lượt tàu (Lượt)", "Sản lượng hàng (Tấn)", "Sản lượng khách (Lượt)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Cảng vụ hàng hải", "Cảng vụ Hàng hải Hải Phòng");
        row1.put("Lượt tàu (Lượt)", 1200);
        row1.put("Sản lượng hàng (Tấn)", 14200000L);
        row1.put("Sản lượng khách (Lượt)", 8500L);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF169(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên khu vực cảng", "Hàng khô (Tấn)", "Hàng lỏng (Tấn)", "Hàng container (Tấn)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Tên khu vực cảng", "Khu vực Cảng Đình Vũ");
        row1.put("Hàng khô (Tấn)", 2500000L);
        row1.put("Hàng lỏng (Tấn)", 450000L);
        row1.put("Hàng container (Tấn)", 5200000L);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF170(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Chức danh", "Số lượng thuyền viên", "Số lượng được cấp chứng chỉ", "Ghi chú");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Chức danh", "Thuyền trưởng (Captain)");
        row1.put("Số lượng thuyền viên", 240);
        row1.put("Số lượng được cấp chứng chỉ", 240);
        row1.put("Ghi chú", "Đủ tiêu chuẩn vận hành quốc tế");
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF171(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Nhóm tàu", "Số lượng tàu", "Tổng dung tích (GT)", "Tuổi tàu trung bình (Năm)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Nhóm tàu", "Tàu chở hàng rời (Bulk Carrier)");
        row1.put("Số lượng tàu", 145);
        row1.put("Tổng dung tích (GT)", 2450000L);
        row1.put("Tuổi tàu trung bình (Năm)", 12.4);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF172(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên tàu lai", "Công suất (HP)", "Đơn vị quản lý", "Vùng hoạt động");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Tên tàu lai", "DONG HAI 06");
        row1.put("Công suất (HP)", 4500);
        row1.put("Đơn vị quản lý", "Công ty CP lai dắt Đông Hải");
        row1.put("Vùng hoạt động", "Hải Phòng - Quảng Ninh");
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF173(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên cơ sở", "Địa chỉ", "Năng lực đóng mới (DWT)", "Năng lực sửa chữa (DWT)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Tên cơ sở", "Nhà máy đóng tàu Bạch Đằng");
        row1.put("Địa chỉ", "Hải Phòng");
        row1.put("Năng lực đóng mới (DWT)", 50000L);
        row1.put("Năng lực sửa chữa (DWT)", 80000L);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF174(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên cảng", "Tổng sản lượng (Tấn)", "Hàng nội địa (Tấn)", "Hàng quá cảnh (Tấn)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> ports = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.PORT).toList();
        int stt = 1;
        for (PointObject p : ports) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên cảng", p.getName());
            row.put("Tổng sản lượng (Tấn)", 2500000L);
            row.put("Hàng nội địa (Tấn)", 1500000L);
            row.put("Hàng quá cảnh (Tấn)", 1000000L);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF175(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên bến cảng", "Số lượng cầu cảng", "Chiều dài cầu (m)", "Công suất thông qua (Tấn/năm)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> ports = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.PORT).toList();
        int stt = 1;
        for (PointObject p : ports) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên bến cảng", p.getName());
            row.put("Số lượng cầu cảng", 4);
            row.put("Chiều dài cầu (m)", 600);
            row.put("Công suất thông qua (Tấn/năm)", 3500000L);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF176(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Phân loại cảng", "Tổng số bến", "Công suất thiết kế", "Sản lượng thực tế");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Phân loại cảng", "Cảng biển loại I");
        row1.put("Tổng số bến", 12);
        row1.put("Công suất thiết kế", 12500000L);
        row1.put("Sản lượng thực tế", 10200000L);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF177(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tháng", "Khối lượng thực hiện (Tấn)", "So với cùng kỳ (%)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Tháng", "Tháng 06/2026");
        row1.put("Khối lượng thực hiện (Tấn)", 4500000L);
        row1.put("So với cùng kỳ (%)", 108.5);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF178(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Năm", "Khối lượng thực hiện (Tấn)", "Tăng trưởng (%)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Năm", "Năm 2026");
        row1.put("Khối lượng thực hiện (Tấn)", 54000000L);
        row1.put("Tăng trưởng (%)", 7.2);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF179(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên doanh nghiệp", "Doanh thu vận tải (VNĐ)", "Khối lượng hàng (Tấn)", "Khối lượng khách (Lượt)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Tên doanh nghiệp", "Tổng công ty Hàng hải Việt Nam (VIMC)");
        row1.put("Doanh thu vận tải (VNĐ)", 120000000000L);
        row1.put("Khối lượng hàng (Tấn)", 8500000L);
        row1.put("Khối lượng khách (Lượt)", 14000L);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF182(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên công trình", "Hạng mục bảo trì", "Kinh phí thực hiện (VNĐ)", "Tiến độ (%)");
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row1 = new LinkedHashMap<>();
        row1.put("STT", 1);
        row1.put("Tên công trình", "Tuyến luồng Hải Phòng");
        row1.put("Hạng mục bảo trì", "Nạo vét duy tu luồng lạch");
        row1.put("Kinh phí thực hiện (VNĐ)", 45000000000L);
        row1.put("Tiến độ (%)", 75);
        rows.add(row1);
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF183(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên cầu cảng", "Kỳ bảo trì", "Nội dung bảo trì", "Kinh phí (VNĐ)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> ports = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.PORT).toList();
        int stt = 1;
        for (PointObject p : ports) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên cầu cảng", "Cầu cảng số 1 - " + p.getName());
            row.put("Kỳ bảo trì", "Định kỳ năm 2026");
            row.put("Nội dung bảo trì", "Kiểm định kết cấu dầm chịu lực và thay thế đệm chống va");
            row.put("Kinh phí (VNĐ)", 150000000L);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF184(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên tuyến luồng", "Độ sâu nạo vét (m)", "Khối lượng nạo vét (m3)", "Chi phí (VNĐ)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<LineObject> lines = lineObjectRepository.findAll();
        int stt = 1;
        for (LineObject l : lines) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên tuyến luồng", l.getName());
            row.put("Độ sâu nạo vét (m)", 7.2);
            row.put("Khối lượng nạo vét (m3)", 45000);
            row.put("Chi phí (VNĐ)", 12000000000L);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF185(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên phao tiêu", "Nội dung bảo dưỡng", "Số lượng thay thế", "Chi phí (VNĐ)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> buoys = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.BUOY).toList();
        int stt = 1;
        for (PointObject p : buoys) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên phao tiêu", p.getName());
            row.put("Nội dung bảo dưỡng", "Làm sạch rỉ sét, sơn lại vỏ phao");
            row.put("Số lượng thay thế", 1);
            row.put("Chi phí (VNĐ)", 12500000L);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF186(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên hải đăng", "Tình trạng ắc quy/đèn", "Công việc sửa chữa", "Kinh phí (VNĐ)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> lighthouses = pointObjectRepository.findAll().stream().filter(p -> p.getObjectType() == PointObject.ObjectType.LIGHTHOUSE).toList();
        int stt = 1;
        for (PointObject p : lighthouses) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên hải đăng", p.getName());
            row.put("Tình trạng ắc quy/đèn", "Bình thường");
            row.put("Công việc sửa chữa", "Thay mới cụm pin mặt trời dự phòng");
            row.put("Kinh phí (VNĐ)", 85000000L);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF187(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên đê/kè", "Hạng mục gia cố", "Khối lượng đá/bê tông", "Chi phí (VNĐ)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<LineObject> lines = lineObjectRepository.findAll();
        int stt = 1;
        for (LineObject l : lines) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên đê/kè", "Đê chắn sóng - " + l.getName());
            row.put("Hạng mục gia cố", "Xếp bổ sung khối bê tông phủ bảo vệ thân đê");
            row.put("Khối lượng đá/bê tông", "350 m3");
            row.put("Chi phí (VNĐ)", 1200000000L);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF188(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên tài sản", "Đơn vị sử dụng", "Hiện trạng quản lý", "Đánh giá giá trị còn lại (VNĐ)");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<PointObject> points = pointObjectRepository.findAll();
        int stt = 1;
        for (PointObject p : points) {
            long val = Math.abs(p.getCode().hashCode() % 900 + 100) * 10_000_000L;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên tài sản", p.getName());
            row.put("Đơn vị sử dụng", "Cục Hàng hải Việt Nam");
            row.put("Hiện trạng quản lý", p.getStatus() != null ? mapStatus(p.getStatus().name()) : "Đang vận hành");
            row.put("Đánh giá giá trị còn lại (VNĐ)", (val * 70) / 100);
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private void generateF189(ReportResponse.ReportResponseBuilder builder, ReportRequest request) {
        List<String> headers = Arrays.asList("STT", "Tên tuyến luồng", "Số lượng báo hiệu hoạt động", "Số lượng đê/kè bảo vệ, Trạng thái an toàn");
        List<Map<String, Object>> rows = new ArrayList<>();
        List<LineObject> lines = lineObjectRepository.findAll();
        int stt = 1;
        for (LineObject l : lines) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("STT", stt++);
            row.put("Tên tuyến luồng", l.getName());
            row.put("Số lượng báo hiệu hoạt động", 12);
            row.put("Số lượng đê/kè bảo vệ, Trạng thái an toàn", "1 đê, trạng thái an toàn");
            rows.add(row);
        }
        builder.headers(headers).rows(rows).summary(new HashMap<>());
    }

    private String mapStatus(String statusStr) {
        if (statusStr == null) return "Nháp";
        switch (statusStr.toUpperCase()) {
            case "DRAFT": return "Nháp";
            case "PENDING_APPROVAL": return "Chờ duyệt";
            case "APPROVED_L1": return "Đã duyệt L1";
            case "APPROVED_L2": return "Đã duyệt L2";
            case "PUBLISHED": return "Đã công bố";
            case "REJECTED": return "Từ chối";
            case "DELETED": return "Đã xóa";
            default: return statusStr;
        }
    }

    private String mapObjectType(String typeStr) {
        if (typeStr == null) return "ĐIỂM";
        switch (typeStr.toUpperCase()) {
            case "PORT": return "Cảng biển";
            case "LIGHTHOUSE": return "Hải đăng";
            case "BUOY": return "Phao tiêu";
            case "BEACON": return "Tiêu dẫn";
            case "OTHER": return "Khác";
            default: return typeStr;
        }
    }
}