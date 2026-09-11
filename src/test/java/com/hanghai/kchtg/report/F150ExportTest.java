package com.hanghai.kchtg.report;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.FileOutputStream;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
public class F150ExportTest {

    @Autowired
    private ReportService reportService;

    @Test
    void testExportF150Pdf() throws Exception {
        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .reportCode("F-150")
                .format("PDF")
                .startDate(java.time.LocalDate.of(2026, 1, 1))
                .endDate(java.time.LocalDate.of(2026, 12, 31))
                .build();

        byte[] pdfBytes = reportService.exportReport(req);
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);

        try (FileOutputStream fos = new FileOutputStream("target/test_f150.pdf")) {
            fos.write(pdfBytes);
        }
        System.out.println("Exported PDF bytes length: " + pdfBytes.length);

        // Also test EXCEL
        req.setFormat("EXCEL");
        byte[] excelBytes = reportService.exportReport(req);
        assertNotNull(excelBytes);
        try (FileOutputStream fos = new FileOutputStream("target/test_f150.xlsx")) {
            fos.write(excelBytes);
        }
        System.out.println("Exported Excel bytes length: " + excelBytes.length);
    }
}
