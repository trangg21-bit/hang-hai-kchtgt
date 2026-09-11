package com.hanghai.kchtg.report;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.service.ReportService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
public class F156ExportTest {

    @Autowired
    private ReportService reportService;

    @Test
    void testDebugResolveFormulaCell() throws Exception {
        Workbook wb = new XSSFWorkbook();
        Sheet sheet = wb.createSheet("Test");
        Row r13 = sheet.createRow(12); // Excel Row 13
        Cell cH = r13.createCell(7); cH.setCellValue(5.0);
        Cell cI = r13.createCell(8); cI.setCellValue(3.0);
        Cell cJ = r13.createCell(9); cJ.setCellValue(2.0);
        Cell cK = r13.createCell(10); cK.setCellValue(1.0);
        Cell cL = r13.createCell(11);
        cL.setCellFormula("H13+I13+J13+K13");

        java.lang.reflect.Method m = ReportService.class.getDeclaredMethod("resolveFormulaCell", Cell.class);
        m.setAccessible(true);
        m.invoke(reportService, cL);

        assertEquals(CellType.NUMERIC, cL.getCellType());
        assertEquals(11.0, cL.getNumericCellValue(), 0.001);

        // Also test SUM(VALUE(C13),VALUE(D13))
        Cell cC = r13.createCell(2); cC.setCellValue(4.0);
        Cell cD = r13.createCell(3); cD.setCellValue(6.0);
        Cell cG = r13.createCell(6);
        cG.setCellFormula("SUM(VALUE(C13),VALUE(D13))");
        m.invoke(reportService, cG);

        assertEquals(CellType.NUMERIC, cG.getCellType());
        assertEquals(10.0, cG.getNumericCellValue(), 0.001);
    }

    @Test
    void testExportReport_F156_ExcelAndPdf() throws Exception {
        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .reportCode("F-156")
                .format("EXCEL")
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .build();

        byte[] excelBytes = reportService.exportReport(req);
        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        try (InputStream is = new ByteArrayInputStream(excelBytes);
             Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            boolean dataFound = false;
            for (int r = 10; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                Cell cellA = row.getCell(0);
                if (cellA != null && cellA.getCellType() == CellType.STRING && "A".equals(cellA.getStringCellValue().trim())) {
                    dataFound = true;
                    continue;
                }
                if (!dataFound) continue;

                // Stop at signature/footer
                if (cellA != null && cellA.getCellType() == CellType.STRING && cellA.getStringCellValue().contains("Người lập")) {
                    break;
                }

                Cell cellG = row.getCell(6); // Tổng số
                Cell cellL = row.getCell(11); // Tổng cộng

                if (cellG != null) {
                    assertNotEquals(CellType.FORMULA, cellG.getCellType(), "Col G must not be FORMULA in row " + (r + 1));
                    assertEquals(CellType.NUMERIC, cellG.getCellType(), "Col G must be NUMERIC in row " + (r + 1));
                }
                if (cellL != null) {
                    assertNotEquals(CellType.FORMULA, cellL.getCellType(), "Col L must not be FORMULA in row " + (r + 1));
                    assertEquals(CellType.NUMERIC, cellL.getCellType(), "Col L must be NUMERIC in row " + (r + 1));
                }
            }

            // Verify "Ngày nhận báo cáo" in header (Row 3, Cell A3) is properly evaluated
            Row row3 = sheet.getRow(2); // 0-indexed row 2 is Excel Row 3
            assertNotNull(row3);
            Cell cellA3 = row3.getCell(0);
            assertNotNull(cellA3);
            assertEquals("Ngày 15 tháng 6 hàng năm", cellA3.getStringCellValue().trim());

            // Verify no cell in the workbook contains unparsed objInput
            for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                for (int c = 0; c < row.getLastCellNum(); c++) {
                    Cell cell = row.getCell(c);
                    if (cell != null && cell.getCellType() == CellType.STRING) {
                        String str = cell.getStringCellValue();
                        assertNotNull(str);
                        assertFalse(str.contains("objInput"), "Cell at row " + (r + 1) + " col " + (c + 1) + " contains unparsed objInput: " + str);
                    }
                }
            }
        }

        // Test PDF export
        ReportPreviewRequest pdfReq = ReportPreviewRequest.builder()
                .reportCode("F-156")
                .format("PDF")
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .build();

        byte[] pdfBytes = reportService.exportReport(pdfReq);
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
    }
}
