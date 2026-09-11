package com.hanghai.kchtg.report;

import com.hanghai.kchtg.report.service.BccReportDataset;
import com.hanghai.kchtg.report.service.BccTemplateRenderer;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class BccTemplateRendererTest {
    private final BccTemplateRenderer renderer = new BccTemplateRenderer();

    @ParameterizedTest
    @ValueSource(ints = {141, 142, 143, 144, 145, 146, 147})
    void rendersAllSevenTemplatesWithoutExpressionsOrFormulaErrors(int code) throws Exception {
        var data = fixture(code, false);
        try (var workbook = renderer.render(data)) {
            assertEquals(1, workbook.getNumberOfSheets());
            var sheet = workbook.getSheetAt(0);
            try (var input = getClass().getClassLoader().getResourceAsStream(
                    "public/template_export/vmd-bcc/BCC_" + (code + 15) + ".xlsx");
                    var original = WorkbookFactory.create(input)) {
                assertEquals(original.getSheetAt(0).getPrintSetup().getPaperSize(), sheet.getPrintSetup().getPaperSize());
                assertEquals(original.getSheetAt(0).getPrintSetup().getLandscape(), sheet.getPrintSetup().getLandscape());
            }
            assertTrue(sheet.getNumMergedRegions() > 0);
            for (var row : sheet) for (var cell : row) {
                assertNull(cell.getCellComment());
                assertNotEquals(CellType.ERROR, cell.getCellType());
                assertNotEquals(CellType.FORMULA, cell.getCellType());
                if (cell.getCellType() == CellType.STRING) assertFalse(cell.getStringCellValue().contains("${"));
            }
            // Reopening the serialized workbook detects invalid OOXML/merged regions.
            var output = new java.io.ByteArrayOutputStream();
            workbook.write(output);
            try (var reopened = WorkbookFactory.create(new java.io.ByteArrayInputStream(output.toByteArray()))) {
                assertEquals(sheet.getLastRowNum(), reopened.getSheetAt(0).getLastRowNum());
            }
        }
    }

    @ParameterizedTest
    @ValueSource(ints = {141, 142, 143, 144, 145, 146, 147})
    void emptyReportsKeepHeaderAndFooterWithoutInventingDetailRows(int code) throws Exception {
        try (var workbook = renderer.render(fixture(code, true))) {
            var sheet = workbook.getSheetAt(0);
            for (var row : sheet) for (var cell : row) if (cell.getCellType() == CellType.STRING) {
                assertFalse(cell.getStringCellValue().contains("${"));
            }
            assertTrue(sheet.getLastRowNum() > 5);
        }
    }

    @Test
    void groupedTotalsSumDetailsExactlyOnceAndRemainNumeric() throws Exception {
        try (var workbook = renderer.render(fixture(143, false))) {
            var sheet = workbook.getSheetAt(0);
            assertEquals(6.375, sheet.getRow(9).getCell(8).getNumericCellValue(), 0.000001);
            assertEquals(4.25, sheet.getRow(10).getCell(8).getNumericCellValue(), 0.000001);
            assertEquals(2.125, sheet.getRow(11).getCell(8).getNumericCellValue(), 0.000001);
            assertEquals(2.125, sheet.getRow(13).getCell(8).getNumericCellValue(), 0.000001);
        }
    }

    @Test
    void longExportsExtendPrintAreaWithoutDroppingFooter() throws Exception {
        var original = fixture(143, false);
        List<BccReportDataset.Line> many = new ArrayList<>();
        for (int i = 0; i < 200; i++) many.add(original.lines().get(0));
        var data = new BccReportDataset(original.code(), original.headers(), many, original.metadata());
        try (var workbook = renderer.render(data)) {
            assertTrue(workbook.getSheetAt(0).getLastRowNum() > 200);
            assertTrue(workbook.getPrintArea(0).endsWith("$" + (workbook.getSheetAt(0).getLastRowNum() + 1)));
        }
    }

    static BccReportDataset fixture(int code, boolean empty) {
        int width = switch (code) { case 141 -> 14; case 142 -> 5; case 145 -> 16; case 146 -> 15; case 147 -> 11; default -> 12; };
        var headers = java.util.stream.IntStream.range(0, width).mapToObj(i -> "Column " + i).toList();
        List<BccReportDataset.Line> lines = new ArrayList<>();
        if (!empty) for (int i = 0; i < (code == 142 ? 10 : 3); i++) {
            List<Object> values = new ArrayList<>();
            for (int col = 0; col < width; col++) values.add(col == 1 ? "Tài sản " + i : new BigDecimal("2.125"));
            lines.add(new BccReportDataset.Line(code <= 142 ? "" : (i < 2 ? "Phao tiêu" : "Đèn biển"),
                    code == 146 ? "2" : "", values));
        }
        return new BccReportDataset("F-" + code, headers, lines, Map.of("fkDonViBcText", "Cảng vụ thử nghiệm",
                "fkDonViBcCapTrenText", "Cục", "bcThoiGian", "2026", "bcMaText", "2026", "dateReportText", "10/09/2026", "reportContent", "Kê khai lần đầu"));
    }
}
