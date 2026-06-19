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
        }

        return builder.build();
    }

    public byte[] exportReport(ReportRequest request) {
        ReportResponse preview = generateReportPreview(request);
        boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());
        
        StringBuilder sb = new StringBuilder();
        
        // Write UTF-8 BOM to support Vietnamese characters in Excel natively
        sb.append("\uFEFF");

        sb.append(preview.getReportName().toUpperCase()).append("\n");
        sb.append("Mã báo cáo: ").append(preview.getReportCode()).append("\n");
        sb.append("Thời gian xuất: ").append(java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))).append("\n\n");

        // Write headers
        for (int i = 0; i < preview.getHeaders().size(); i++) {
            sb.append(preview.getHeaders().get(i));
            if (i < preview.getHeaders().size() - 1) {
                sb.append(isExcel ? "," : "\t");
            }
        }
        sb.append("\n");

        // Write rows
        for (Map<String, Object> row : preview.getRows()) {
            for (int i = 0; i < preview.getHeaders().size(); i++) {
                String header = preview.getHeaders().get(i);
                Object val = row.get(header);
                String valStr = val != null ? val.toString() : "";
                
                // Escape commas for CSV/Excel
                if (isExcel && valStr.contains(",")) {
                    valStr = "\"" + valStr + "\"";
                }
                
                sb.append(valStr);
                if (i < preview.getHeaders().size() - 1) {
                    sb.append(isExcel ? "," : "\t");
                }
            }
            sb.append("\n");
        }

        // Write summary
        if (preview.getSummary() != null && !preview.getSummary().isEmpty()) {
            sb.append("\n");
            sb.append("TỔNG HỢP / TỔNG CỘNG:\n");
            for (Map.Entry<String, Object> entry : preview.getSummary().entrySet()) {
                sb.append(entry.getKey()).append(isExcel ? "," : ": ").append(entry.getValue()).append("\n");
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
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
            row.put("Loại đối tượng", p.getObjectType() != null ? p.getObjectType().toString() : "ĐIỂM");
            row.put("Kinh độ", p.getLongitude());
            row.put("Vĩ độ", p.getLatitude());
            row.put("Trạng thái", p.getStatus() != null ? p.getStatus().toString() : "DRAFT");
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
            
            row.put("Trạng thái", l.getStatus() != null ? l.getStatus().toString() : "DRAFT");
            row.put("Ngày cập nhật", l.getUpdatedAt() != null ? l.getUpdatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");
            rows.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("Tổng số tuyến luồng thống kê", rows.size());

        builder.headers(headers).rows(rows).summary(summary);
    }
}
