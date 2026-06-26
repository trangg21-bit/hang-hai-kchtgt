package com.hanghai.kchtg.siem.service;

import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.lockout.repository.UserLockoutRepository;
import com.hanghai.kchtg.siem.dto.SiemMetricsResponse;
import com.hanghai.kchtg.user.entity.LoginAttemptResult;
import com.hanghai.kchtg.user.repository.LoginAuditLogRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xssf.usermodel.*;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SiemService {

    private final AccessLogRepository accessLogRepository;
    private final LoginAuditLogRepository loginAuditLogRepository;
    private final UserLockoutRepository userLockoutRepository;

    /**
     * Aggregates real-time SIEM metrics.
     */
    public SiemMetricsResponse getMetrics() {
        LocalDateTime now = LocalDateTime.now();
        long accessLogsCount = accessLogRepository.count();
        long loginAttemptsCount = loginAuditLogRepository.count();
        long totalEventsCount = accessLogsCount + loginAttemptsCount;

        // Calculate EPS in the last 1 minute
        LocalDateTime oneMinuteAgo = now.minusMinutes(1);
        long recentAccessLogs = accessLogRepository.countByCreatedAtAfter(oneMinuteAgo);
        long recentLoginAttempts = loginAuditLogRepository.countByAttemptedAtAfter(oneMinuteAgo);
        double eventsPerSecond = (recentAccessLogs + recentLoginAttempts) / 60.0;

        // Calculate failure rate
        long failedAccess = accessLogRepository.countByStatus(AccessLogStatus.FAILED)
                + accessLogRepository.countByStatus(AccessLogStatus.FAILURE);
        long failedLogin = loginAuditLogRepository.countByResult(LoginAttemptResult.FAIL);
        long totalFailed = failedAccess + failedLogin;
        double failureRate = totalEventsCount > 0 ? ((double) totalFailed / totalEventsCount) * 100.0 : 0.0;

        // Calculate active lockout alerts
        int activeAlertsCount = (int) userLockoutRepository.countActiveLockouts(now);

        // Security alerts: failed login attempts in last 24 hours
        long securityAlertsCount = loginAuditLogRepository.countByResultAndAttemptedAtAfter(LoginAttemptResult.FAIL, now.minusDays(1));

        return new SiemMetricsResponse(
                totalEventsCount,
                eventsPerSecond,
                failureRate,
                activeAlertsCount,
                accessLogsCount,
                loginAttemptsCount,
                securityAlertsCount
        );
    }

    /**
     * Export WORD report
     */
    public byte[] exportWordReport() throws IOException {
        SiemMetricsResponse metrics = getMetrics();
        List<AccessLog> recentLogs = accessLogRepository.findAll(PageRequest.of(0, 20, Sort.by("createdAt").descending())).getContent();

        try (XWPFDocument doc = new XWPFDocument()) {
            XWPFParagraph title = doc.createParagraph();
            title.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = title.createRun();
            titleRun.setText("BÁO CÁO GIÁM SÁT AN NINH SIEM");
            titleRun.setBold(true);
            titleRun.setFontSize(18);

            XWPFParagraph meta = doc.createParagraph();
            meta.createRun().setText("Thời gian xuất báo cáo: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));

            XWPFParagraph section1 = doc.createParagraph();
            XWPFRun sec1Run = section1.createRun();
            sec1Run.setText("1. Chỉ số giám sát hệ thống");
            sec1Run.setBold(true);
            sec1Run.setFontSize(14);

            doc.createParagraph().createRun().setText("Tổng số sự kiện an ninh: " + metrics.getTotalEventsCount());
            doc.createParagraph().createRun().setText("Tốc độ sự kiện trung bình (EPS): " + String.format("%.2f", metrics.getEventsPerSecond()));
            doc.createParagraph().createRun().setText("Tỷ lệ truy cập lỗi: " + String.format("%.2f%%", metrics.getFailureRate()));
            doc.createParagraph().createRun().setText("Tài khoản đang bị khóa (Active Lockouts): " + metrics.getActiveAlertsCount());
            doc.createParagraph().createRun().setText("Cảnh báo an ninh 24h qua: " + metrics.getSecurityAlertsCount());

            XWPFParagraph section2 = doc.createParagraph();
            XWPFRun sec2Run = section2.createRun();
            sec2Run.setText("2. Nhật ký truy cập gần đây nhất");
            sec2Run.setBold(true);
            sec2Run.setFontSize(14);

            XWPFTable table = doc.createTable(recentLogs.size() + 1, 6);
            String[] headers = {"Thời gian", "Tài khoản", "Hành động", "Phân hệ", "IP Address", "Trạng thái"};
            XWPFTableRow headerRow = table.getRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.getCell(i).setText(headers[i]);
            }

            for (int r = 0; r < recentLogs.size(); r++) {
                AccessLog log = recentLogs.get(r);
                XWPFTableRow row = table.getRow(r + 1);
                row.getCell(0).setText(log.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
                row.getCell(1).setText(log.getUsername());
                row.getCell(2).setText(log.getAction());
                row.getCell(3).setText(log.getModule());
                row.getCell(4).setText(log.getIpAddress());
                row.getCell(5).setText(log.getStatus().name());
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Export EXCEL report
     */
    public byte[] exportExcelReport() throws IOException {
        SiemMetricsResponse metrics = getMetrics();
        List<AccessLog> recentLogs = accessLogRepository.findAll(PageRequest.of(0, 50, Sort.by("createdAt").descending())).getContent();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            XSSFSheet sheet = workbook.createSheet("SIEM Report");

            // Row 0: Title
            XSSFRow row0 = sheet.createRow(0);
            XSSFCell titleCell = row0.createCell(0);
            titleCell.setCellValue("BÁO CÁO GIÁM SÁT AN NINH SIEM");
            XSSFFont titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            XSSFCellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            // Metrics Summary
            String[] labels = {
                    "Tổng số sự kiện", "Tốc độ sự kiện (EPS)", "Tỷ lệ lỗi (%)",
                    "Số tài khoản đang khóa", "Số cảnh báo an ninh (24h)"
            };
            Object[] values = {
                    metrics.getTotalEventsCount(), metrics.getEventsPerSecond(), metrics.getFailureRate(),
                    metrics.getActiveAlertsCount(), metrics.getSecurityAlertsCount()
            };

            for (int i = 0; i < labels.length; i++) {
                XSSFRow row = sheet.createRow(i + 2);
                row.createCell(0).setCellValue(labels[i]);
                if (values[i] instanceof Long || values[i] instanceof Integer) {
                    row.createCell(1).setCellValue(((Number) values[i]).doubleValue());
                } else if (values[i] instanceof Double) {
                    row.createCell(1).setCellValue((Double) values[i]);
                }
            }

            // Table Header for Recent Logs
            int startRow = labels.length + 4;
            XSSFRow headerRow = sheet.createRow(startRow);
            String[] headers = {"Thời gian", "Tài khoản", "Hành động", "Phân hệ", "IP Address", "Trạng thái", "Chi tiết"};
            for (int i = 0; i < headers.length; i++) {
                XSSFCell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                XSSFFont boldFont = workbook.createFont();
                boldFont.setBold(true);
                XSSFCellStyle style = workbook.createCellStyle();
                style.setFont(boldFont);
                cell.setCellStyle(style);
            }

            // Table Data
            for (int i = 0; i < recentLogs.size(); i++) {
                AccessLog log = recentLogs.get(i);
                XSSFRow row = sheet.createRow(startRow + 1 + i);
                row.createCell(0).setCellValue(log.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
                row.createCell(1).setCellValue(log.getUsername());
                row.createCell(2).setCellValue(log.getAction());
                row.createCell(3).setCellValue(log.getModule());
                row.createCell(4).setCellValue(log.getIpAddress());
                row.createCell(5).setCellValue(log.getStatus().name());
                row.createCell(6).setCellValue(log.getDetail() != null ? log.getDetail() : "");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Export PDF report
     */
    public byte[] exportPdfReport() throws IOException {
        SiemMetricsResponse metrics = getMetrics();
        List<AccessLog> recentLogs = accessLogRepository.findAll(PageRequest.of(0, 20, Sort.by("createdAt").descending())).getContent();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("BÁO CÁO AN NINH HỆ THỐNG SIEM")
                    .setBold().setFontSize(18));
            document.add(new Paragraph("Thời gian báo cáo: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))));
            document.add(new Paragraph("\n"));

            document.add(new Paragraph("1. Tóm tắt chỉ số an ninh").setBold().setFontSize(14));
            document.add(new Paragraph("Tổng số sự kiện an ninh: " + metrics.getTotalEventsCount()));
            document.add(new Paragraph("Tốc độ sự kiện trung bình (EPS): " + String.format("%.2f", metrics.getEventsPerSecond())));
            document.add(new Paragraph("Tỷ lệ lỗi truy cập: " + String.format("%.2f%%", metrics.getFailureRate())));
            document.add(new Paragraph("Tài khoản đang bị khóa: " + metrics.getActiveAlertsCount()));
            document.add(new Paragraph("Số cảnh báo an ninh trong 24 giờ qua: " + metrics.getSecurityAlertsCount()));
            document.add(new Paragraph("\n"));

            document.add(new Paragraph("2. Sự kiện truy cập gần đây").setBold().setFontSize(14));

            Table table = new Table(6);
            table.addHeaderCell(new Cell().add(new Paragraph("Thời gian").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("Tài khoản").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("Hành động").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("Phân hệ").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("IP Address").setBold()));
            table.addHeaderCell(new Cell().add(new Paragraph("Trạng thái").setBold()));

            for (AccessLog log : recentLogs) {
                table.addCell(log.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
                table.addCell(log.getUsername());
                table.addCell(log.getAction());
                table.addCell(log.getModule());
                table.addCell(log.getIpAddress());
                table.addCell(log.getStatus().name());
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        }
    }

    /**
     * Export HTML report
     */
    public byte[] exportHtmlReport() {
        SiemMetricsResponse metrics = getMetrics();
        List<AccessLog> recentLogs = accessLogRepository.findAll(PageRequest.of(0, 20, Sort.by("createdAt").descending())).getContent();

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\">");
        html.append("<title>SIEM Security Report</title>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f7fa; color: #333; }");
        html.append("h1 { color: #1e3a8a; }");
        html.append(".summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }");
        html.append(".card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }");
        html.append(".card-title { font-size: 14px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }");
        html.append(".card-value { font-size: 24px; font-weight: bold; color: #1e3a8a; }");
        html.append("table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden; }");
        html.append("th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e5e7eb; }");
        html.append("th { background-color: #1e3a8a; color: white; }");
        html.append("tr:hover { background-color: #f1f5f9; }");
        html.append("</style></head><body>");

        html.append("<h1>BÁO CÁO GIÁM SÁT AN NINH HỆ THỐNG (SIEM)</h1>");
        html.append("<p>Thời gian báo cáo: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))).append("</p>");

        // Metrics Summary Cards
        html.append("<div class=\"summary-grid\">");
        html.append("<div class=\"card\"><div class=\"card-title\">Tổng sự kiện</div><div class=\"card-value\">").append(metrics.getTotalEventsCount()).append("</div></div>");
        html.append("<div class=\"card\"><div class=\"card-title\">Event Rate (EPS)</div><div class=\"card-value\">").append(String.format("%.2f", metrics.getEventsPerSecond())).append("</div></div>");
        html.append("<div class=\"card\"><div class=\"card-title\">Tỷ lệ lỗi</div><div class=\"card-value\">").append(String.format("%.2f%%", metrics.getFailureRate())).append("</div></div>");
        html.append("<div class=\"card\"><div class=\"card-title\">Active Lockouts</div><div class=\"card-value\">").append(metrics.getActiveAlertsCount()).append("</div></div>");
        html.append("<div class=\"card\"><div class=\"card-title\">Cảnh báo 24h</div><div class=\"card-value\">").append(metrics.getSecurityAlertsCount()).append("</div></div>");
        html.append("</div>");

        // Table
        html.append("<h2>Sự kiện truy cập gần đây nhất</h2>");
        html.append("<table><thead><tr><th>Thời gian</th><th>Tài khoản</th><th>Hành động</th><th>Phân hệ</th><th>IP Address</th><th>Trạng thái</th></tr></thead><tbody>");
        for (AccessLog log : recentLogs) {
            html.append("<tr>");
            html.append("<td>").append(log.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))).append("</td>");
            html.append("<td>").append(log.getUsername()).append("</td>");
            html.append("<td>").append(log.getAction()).append("</td>");
            html.append("<td>").append(log.getModule()).append("</td>");
            html.append("<td>").append(log.getIpAddress()).append("</td>");
            html.append("<td>").append(log.getStatus().name()).append("</td>");
            html.append("</tr>");
        }
        html.append("</tbody></table></body></html>");

        return html.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Export XML report
     */
    public byte[] exportXmlReport() {
        SiemMetricsResponse metrics = getMetrics();
        List<AccessLog> recentLogs = accessLogRepository.findAll(PageRequest.of(0, 20, Sort.by("createdAt").descending())).getContent();

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<SiemReport>\n");
        xml.append("  <GeneratedAt>").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))).append("</GeneratedAt>\n");

        // Metrics
        xml.append("  <Metrics>\n");
        xml.append("    <TotalEvents>").append(metrics.getTotalEventsCount()).append("</TotalEvents>\n");
        xml.append("    <EventsPerSecond>").append(metrics.getEventsPerSecond()).append("</EventsPerSecond>\n");
        xml.append("    <FailureRate>").append(metrics.getFailureRate()).append("</FailureRate>\n");
        xml.append("    <ActiveLockouts>").append(metrics.getActiveAlertsCount()).append("</ActiveLockouts>\n");
        xml.append("    <SecurityAlerts24h>").append(metrics.getSecurityAlertsCount()).append("</SecurityAlerts24h>\n");
        xml.append("  </Metrics>\n");

        // Events
        xml.append("  <RecentEvents>\n");
        for (AccessLog log : recentLogs) {
            xml.append("    <Event>\n");
            xml.append("      <Id>").append(log.getId()).append("</Id>\n");
            xml.append("      <CreatedAt>").append(log.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))).append("</CreatedAt>\n");
            xml.append("      <Username>").append(escapeXml(log.getUsername())).append("</Username>\n");
            xml.append("      <Action>").append(escapeXml(log.getAction())).append("      </Action>\n");
            xml.append("      <Module>").append(escapeXml(log.getModule())).append("</Module>\n");
            xml.append("      <IpAddress>").append(escapeXml(log.getIpAddress())).append("</IpAddress>\n");
            xml.append("      <Status>").append(log.getStatus().name()).append("      </Status>\n");
            xml.append("    </Event>\n");
        }
        xml.append("  </RecentEvents>\n");
        xml.append("</SiemReport>\n");

        return xml.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeXml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
