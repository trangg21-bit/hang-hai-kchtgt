package com.hanghai.kchtg.report;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.handler.*;
import com.hanghai.kchtg.report.service.ReportService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class BcdlReportHandlerTest {

    @Autowired
    private F161ReportHandler f161Handler;
    @Autowired
    private F162ReportHandler f162Handler;
    @Autowired
    private F163ReportHandler f163Handler;
    @Autowired
    private F164ReportHandler f164Handler;
    @Autowired
    private F165ReportHandler f165Handler;
    @Autowired
    private F166ReportHandler f166Handler;
    @Autowired
    private F167ReportHandler f167Handler;
    @Autowired
    private F168ReportHandler f168Handler;
    @Autowired
    private F169ReportHandler f169Handler;

    @Autowired
    private ReportService reportService;

    @Test
    void testSupportsCodes() {
        assertTrue(f161Handler.supports("F-161"));
        assertTrue(f161Handler.supports("BCDL_176"));

        assertTrue(f162Handler.supports("F-162"));
        assertTrue(f162Handler.supports("BCDL_177"));

        assertTrue(f163Handler.supports("F-163"));
        assertTrue(f163Handler.supports("BCDL_178"));

        assertTrue(f164Handler.supports("F-164"));
        assertTrue(f164Handler.supports("BCDL_179"));

        assertTrue(f165Handler.supports("F-165"));
        assertTrue(f165Handler.supports("BCDL_180"));

        assertTrue(f166Handler.supports("F-166"));
        assertTrue(f166Handler.supports("BCDL_181"));

        assertTrue(f167Handler.supports("F-167"));
        assertTrue(f167Handler.supports("BCDL_182"));

        assertTrue(f168Handler.supports("F-168"));
        assertTrue(f168Handler.supports("BCDL_183"));

        assertTrue(f169Handler.supports("F-169"));
        assertTrue(f169Handler.supports("BCDL_184"));
    }

    @Test
    void testPreviewAll9Reports() {
        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .build();

        ReportHandler[] handlers = {
                f161Handler, f162Handler, f163Handler, f164Handler,
                f165Handler, f166Handler, f167Handler, f168Handler, f169Handler
        };

        for (ReportHandler h : handlers) {
            ReportResponse resp = h.getPreview(req);
            assertNotNull(resp);
            assertNotNull(resp.getHeaders());
            assertFalse(resp.getHeaders().isEmpty());
            assertNotNull(resp.getRows());
        }
    }

    @Test
    void testExportDataAll9Reports() {
        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .build();

        ReportHandler[] handlers = {
                f161Handler, f162Handler, f163Handler, f164Handler,
                f165Handler, f166Handler, f167Handler, f168Handler, f169Handler
        };

        for (ReportHandler h : handlers) {
            List<Map<String, Object>> exportData = h.getExportData(req, 2026);
            assertNotNull(exportData);
        }
    }

    @Test
    void testExportExcelAll9Reports() throws Exception {
        String[] codes = {"F-161", "F-162", "F-163", "F-164", "F-165", "F-166", "F-167", "F-168", "F-169"};

        for (String code : codes) {
            ReportPreviewRequest req = ReportPreviewRequest.builder()
                    .reportCode(code)
                    .format("EXCEL")
                    .startDate(LocalDate.of(2026, 8, 1))
                    .endDate(LocalDate.of(2026, 8, 31))
                    .build();

            byte[] excelBytes = reportService.exportReport(req);
            assertNotNull(excelBytes, "Excel export failed for code: " + code);
            assertTrue(excelBytes.length > 1000, "Excel output too small for code: " + code);

            if (List.of("F-165", "F-166", "F-167", "F-168").contains(code)) {
                assertNoTemplateSourceText(excelBytes, code);
            }
        }
    }

    private void assertNoTemplateSourceText(byte[] excelBytes, String code) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
            Sheet sheet = workbook.getSheetAt(0);
            for (Row row : sheet) {
                for (Cell cell : row) {
                    if (cell.getCellType() != CellType.STRING) {
                        continue;
                    }
                    String value = cell.getStringCellValue().trim();
                    assertFalse(value.contains("${"), code + " contains unresolved placeholder at " + cell.getAddress());
                    assertFalse(value.matches("(?i)^(?:IFERROR|ROUND|SUMPRODUCT|SUM|VALUE)\\s*\\(.*"),
                            code + " contains formula source text at " + cell.getAddress());
                }
            }
        }
    }

    @Test
    void testExportPdfAll9Reports() throws Exception {
        String[] codes = {"F-161", "F-162", "F-163", "F-164", "F-165", "F-166", "F-167", "F-168", "F-169"};

        for (String code : codes) {
            ReportPreviewRequest req = ReportPreviewRequest.builder()
                    .reportCode(code)
                    .format("PDF")
                    .startDate(LocalDate.of(2026, 8, 1))
                    .endDate(LocalDate.of(2026, 8, 31))
                    .build();

            byte[] pdfBytes = reportService.exportReport(req);
            assertNotNull(pdfBytes, "PDF export failed for code: " + code);
            assertTrue(pdfBytes.length > 500, "PDF output too small for code: " + code);

            if (List.of("F-165", "F-166", "F-167", "F-168").contains(code)) {
                try (PDDocument pdf = PDDocument.load(pdfBytes)) {
                    String text = new PDFTextStripper().getText(pdf);
                    assertFalse(text.contains("${"), code + " PDF contains an unresolved placeholder");
                    assertFalse(text.matches("(?s).*(?:IFERROR|ROUND|SUMPRODUCT|VALUE)\\s*\\(.*"),
                            code + " PDF contains formula source text");
                }
            }
        }
    }

    @Test
    void testInfrastructureExportsDoNotLeakTemplateExpressions() throws Exception {
        for (String code : List.of("F-152", "F-153")) {
            ReportPreviewRequest req = ReportPreviewRequest.builder()
                    .reportCode(code)
                    .format("EXCEL")
                    .startDate(LocalDate.of(2026, 1, 1))
                    .endDate(LocalDate.of(2026, 12, 31))
                    .build();

            byte[] excelBytes = reportService.exportReport(req);
            assertNotNull(excelBytes, "Excel export failed for code: " + code);
            assertNoTemplateSourceText(excelBytes, code);
        }
    }

    @Test
    void testReportedLegacyFormsKeepFixedLayoutAndDoNotLeakExpressions() throws Exception {
        List<String> codes = List.of(
                "F-169", "F-170", "F-171", "F-174",
                "F-176", "F-177", "F-178", "F-179");

        for (String code : codes) {
            ReportPreviewRequest req = ReportPreviewRequest.builder()
                    .reportCode(code)
                    .format("EXCEL")
                    .startDate(LocalDate.of(2026, 8, 1))
                    .endDate(LocalDate.of(2026, 8, 31))
                    .build();

            byte[] excelBytes = reportService.exportReport(req);
            assertNotNull(excelBytes, "Excel export failed for code: " + code);
            assertTrue(excelBytes.length > 1000, "Excel output too small for code: " + code);
            assertNoTemplateSourceText(excelBytes, code);

            try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
                Sheet sheet = workbook.getSheetAt(0);
                assertEquals(1, countText(sheet, expectedTitle(code)),
                        code + " duplicated the statutory report title");
            }
        }
    }

    private long countText(Sheet sheet, String expected) {
        long count = 0;
        for (Row row : sheet) {
            for (Cell cell : row) {
                if (cell.getCellType() == CellType.STRING
                        && cell.getStringCellValue().trim().equalsIgnoreCase(expected)) {
                    count++;
                }
            }
        }
        return count;
    }

    private String expectedTitle(String code) {
        return switch (code) {
            case "F-169" -> "KHỐI LƯỢNG HÀNG HÓA, LƯỢT TÀU THÔNG QUA CẢNG BIỂN, CẢNG, BẾN TRONG KHU VỰC QUẢN LÝ";
            case "F-170" -> "THỐNG KÊ THUYỀN VIÊN, HOA TIÊU HÀNG HẢI";
            case "F-171" -> "THỐNG KÊ TÀU BIỂN TREO CỜ QUỐC TỊCH VIỆT NAM";
            case "F-174" -> "TỔNG HỢP KHỐI LƯỢNG HÀNG HÓA THÔNG QUA CẢNG BIỂN";
            case "F-176" -> "NĂNG LỰC THÔNG QUA CẢNG BIỂN, CẢNG BIỂN THỦY NỘI ĐỊA";
            case "F-177", "F-178" -> "KHỐI LƯỢNG HÀNG HÓA THÔNG QUA CẢNG";
            case "F-179" -> "SẢN LƯỢNG DỊCH VỤ VẬN TẢI, DOANH NGHIỆP VÀ CÁC HOẠT ĐỘNG HỖ TRỢ VẬN TẢI ĐƯỜNG SẮT, ĐƯỜNG BỘ, ĐƯỜNG THỦY NỘI ĐỊA, ĐƯỜNG BIỂN";
            default -> throw new IllegalArgumentException(code);
        };
    }

    @Test
    void testReportedLegacyPdfFormsDoNotShowTemplateCode() throws Exception {
        for (String code : List.of("F-169", "F-170", "F-171", "F-176", "F-177", "F-179")) {
            ReportPreviewRequest req = ReportPreviewRequest.builder()
                    .reportCode(code)
                    .format("PDF")
                    .startDate(LocalDate.of(2026, 8, 1))
                    .endDate(LocalDate.of(2026, 8, 31))
                    .build();

            byte[] pdfBytes = reportService.exportReport(req);
            assertNotNull(pdfBytes, "PDF export failed for code: " + code);
            assertTrue(pdfBytes.length > 500, "PDF output too small for code: " + code);
            try (PDDocument pdf = PDDocument.load(pdfBytes)) {
                String text = new PDFTextStripper().getText(pdf);
                assertFalse(text.contains("${"), code + " PDF contains an unresolved placeholder");
                assertFalse(text.matches("(?s).*(?:IFERROR|ROUND|SUMPRODUCT|VALUE)\\s*\\(.*"),
                        code + " PDF contains formula source text");
                assertEquals(1, countOccurrences(text, expectedPdfTitle(code)),
                        code + " PDF duplicated the statutory report title");
            }
        }
    }

    private long countOccurrences(String text, String expected) {
        long count = 0;
        int offset = 0;
        while ((offset = text.indexOf(expected, offset)) >= 0) {
            count++;
            offset += expected.length();
        }
        return count;
    }

    private String expectedPdfTitle(String code) {
        return "F-179".equals(code) ? "SẢN LƯỢNG DỊCH VỤ VẬN TẢI" : expectedTitle(code);
    }
}
