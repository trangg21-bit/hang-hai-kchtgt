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
public class BccndbAndBcthtnReportHandlerTest {

    @Autowired
    private F180ReportHandler f180Handler;
    @Autowired
    private F181ReportHandler f181Handler;
    @Autowired
    private F182ReportHandler f182Handler;
    @Autowired
    private F183ReportHandler f183Handler;
    @Autowired
    private F184ReportHandler f184Handler;
    @Autowired
    private F185ReportHandler f185Handler;
    @Autowired
    private F186ReportHandler f186Handler;
    @Autowired
    private F187ReportHandler f187Handler;
    @Autowired
    private F188ReportHandler f188Handler;
    @Autowired
    private F189ReportHandler f189Handler;

    @Autowired
    private F180NReportHandler f180NHandler;
    @Autowired
    private F182NReportHandler f182NHandler;
    @Autowired
    private F183NReportHandler f183NHandler;
    @Autowired
    private F184NReportHandler f184NHandler;

    @Autowired
    private ReportService reportService;

    @Test
    void testSupportsCodes() {
        assertTrue(f180Handler.supports("F-180"));
        assertTrue(f180Handler.supports("BCCNDB_195"));

        assertTrue(f181Handler.supports("F-181"));
        assertTrue(f181Handler.supports("BCCNDB_196"));

        assertTrue(f182Handler.supports("F-182"));
        assertTrue(f182Handler.supports("BCCNDB_197"));

        assertTrue(f183Handler.supports("F-183"));
        assertTrue(f183Handler.supports("BCCNDB_198"));

        assertTrue(f184Handler.supports("F-184"));
        assertTrue(f184Handler.supports("BCCNDB_199"));

        assertTrue(f185Handler.supports("F-185"));
        assertTrue(f185Handler.supports("BCCNDB_200"));

        assertTrue(f186Handler.supports("F-186"));
        assertTrue(f186Handler.supports("BCCNDB_201"));

        assertTrue(f187Handler.supports("F-187"));
        assertTrue(f187Handler.supports("BCCNDB_202"));

        assertTrue(f188Handler.supports("F-188"));
        assertTrue(f188Handler.supports("BCCNDB_203"));

        assertTrue(f189Handler.supports("F-189"));
        assertTrue(f189Handler.supports("BCCNDB_204"));

        assertTrue(f180NHandler.supports("F-180N"));
        assertTrue(f180NHandler.supports("BCDL_180N"));

        assertTrue(f182NHandler.supports("F-182N"));
        assertTrue(f182NHandler.supports("BCDL_182N"));

        assertTrue(f183NHandler.supports("F-183N"));
        assertTrue(f183NHandler.supports("BCDL_183N"));

        assertTrue(f184NHandler.supports("F-184N"));
        assertTrue(f184NHandler.supports("BCDL_184N"));
    }

    @Test
    void testPreviewBccndbHandlers() {
        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .reportPeriod("ANNUAL")
                .build();

        for (int i = 180; i <= 189; i++) {
            String code = "F-" + i;
            req.setReportCode(code);
            ReportResponse resp = reportService.getPreview(req);
            assertNotNull(resp, "Preview for " + code + " must not be null");
            assertNotNull(resp.getHeaders(), "Headers for " + code + " must not be null");
            assertFalse(resp.getHeaders().isEmpty(), "Headers for " + code + " must not be empty");
            assertNotNull(resp.getRows(), "Rows for " + code + " must not be null");
        }
    }

    @Test
    void testPreviewBcthtnHandlers() {
        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .startDate(LocalDate.of(2026, 9, 1))
                .endDate(LocalDate.of(2026, 9, 14))
                .build();

        List<String> codes = List.of("F-180N", "F-182N", "F-183N", "F-184N");
        for (String code : codes) {
            req.setReportCode(code);
            ReportResponse resp = reportService.getPreview(req);
            assertNotNull(resp, "Preview for " + code + " must not be null");
            assertNotNull(resp.getHeaders(), "Headers for " + code + " must not be null");
            assertFalse(resp.getHeaders().isEmpty(), "Headers for " + code + " must not be empty");
            assertNotNull(resp.getRows(), "Rows for " + code + " must not be null");
        }
    }

    @Test
    void testExportData() {
        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .startDate(LocalDate.of(2026, 9, 1))
                .endDate(LocalDate.of(2026, 9, 14))
                .build();

        List<Map<String, Object>> data180N = f180NHandler.getExportData(req, 2026);
        assertNotNull(data180N);
        assertFalse(data180N.isEmpty());

        List<Map<String, Object>> data180 = f180Handler.getExportData(req, 2026);
        assertNotNull(data180);
        assertFalse(data180.isEmpty());

        List<Map<String, Object>> data188 = f188Handler.getExportData(req, 2026);
        assertNotNull(data188);
        assertFalse(data188.isEmpty());
    }
}
