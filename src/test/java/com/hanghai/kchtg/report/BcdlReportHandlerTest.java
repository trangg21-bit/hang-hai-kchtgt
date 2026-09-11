package com.hanghai.kchtg.report;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.handler.*;
import com.hanghai.kchtg.report.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

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
    void testExportExcelAll9Reports() {
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
        }
    }

    @Test
    void testExportPdfAll9Reports() {
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
        }
    }
}
