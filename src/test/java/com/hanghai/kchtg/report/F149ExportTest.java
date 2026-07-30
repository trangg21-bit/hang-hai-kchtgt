package com.hanghai.kchtg.report;

import org.apache.poi.ss.usermodel.*;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class F149ExportTest {

    @Test
    public void testF149TemplateRows() throws Exception {
        String pathTemplate = "public/template_export/BCKCHT_164.xlsx";
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(pathTemplate)) {
            if (is == null) {
                System.out.println("Template not found in classpath!");
                return;
            }
            Workbook workbook = WorkbookFactory.create(is);
            Sheet sheet = workbook.getSheetAt(0);
            System.out.println("TEMPLATE LAST ROW NUM: " + sheet.getLastRowNum());
            for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) {
                    System.out.println("Row " + r + " is null");
                    continue;
                }
                List<String> vals = new ArrayList<>();
                for (int c = 0; c < row.getLastCellNum(); c++) {
                    Cell cell = row.getCell(c);
                    vals.add(cell != null ? cell.toString() : "null");
                }
                System.out.println("Row " + r + ": " + vals);
            }
            workbook.close();
        }
    }
}
