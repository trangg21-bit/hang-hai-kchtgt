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
public class ReportRecordHandlerTest {

    @Autowired
    private F170ReportHandler f170Handler;
    @Autowired
    private F171ReportHandler f171Handler;
    @Autowired
    private F172ReportHandler f172Handler;
    @Autowired
    private F173ReportHandler f173Handler;
    @Autowired
    private F174ReportHandler f174Handler;
    @Autowired
    private F175ReportHandler f175Handler;
    @Autowired
    private F176ReportHandler f176Handler;
    @Autowired
    private F177ReportHandler f177Handler;
    @Autowired
    private F178ReportHandler f178Handler;
    @Autowired
    private F179ReportHandler f179Handler;

    @Autowired
    private ReportService reportService;

    @Test
    void testSupportsCodes() {
        assertTrue(f170Handler.supports("F-170"));
        assertTrue(f170Handler.supports("BCPTTV_185"));

        assertTrue(f171Handler.supports("F-171"));
        assertTrue(f171Handler.supports("BCPTTV_186"));

        assertTrue(f172Handler.supports("F-172"));
        assertTrue(f172Handler.supports("BCPTTV_187"));

        assertTrue(f173Handler.supports("F-173"));
        assertTrue(f173Handler.supports("BCDN_188"));

        assertTrue(f174Handler.supports("F-174"));
        assertTrue(f174Handler.supports("BCDN_189"));

        assertTrue(f175Handler.supports("F-175"));
        assertTrue(f175Handler.supports("BCTT48_190"));

        assertTrue(f176Handler.supports("F-176"));
        assertTrue(f176Handler.supports("BCTT48_191"));

        assertTrue(f177Handler.supports("F-177"));
        assertTrue(f177Handler.supports("BCTT48_192"));

        assertTrue(f178Handler.supports("F-178"));
        assertTrue(f178Handler.supports("BCTT48_193"));

        assertTrue(f179Handler.supports("F-179"));
        assertTrue(f179Handler.supports("BCTT48_194"));
    }

    @Test
    void testPreviewHandlers() {
        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .reportPeriod("ANNUAL")
                .build();

        for (int i = 170; i <= 179; i++) {
            String code = "F-" + i;
            req.setReportCode(code);
            ReportResponse resp = reportService.getPreview(req);
            assertNotNull(resp, "Response for " + code + " must not be null");
            assertNotNull(resp.getHeaders(), "Headers for " + code + " must not be null");
            assertFalse(resp.getHeaders().isEmpty(), "Headers for " + code + " must not be empty");
            assertNotNull(resp.getRows(), "Rows for " + code + " must not be null");
        }
    }

    @Test
    void testExportData() {
        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .reportPeriod("ANNUAL")
                .build();

        List<Map<String, Object>> data170 = f170Handler.getExportData(req, 2026);
        assertNotNull(data170);
        assertFalse(data170.isEmpty());

        List<Map<String, Object>> data171 = f171Handler.getExportData(req, 2026);
        assertNotNull(data171);
        assertFalse(data171.isEmpty());

        List<Map<String, Object>> data177 = f177Handler.getExportData(req, 2026);
        assertNotNull(data177);
        assertFalse(data177.isEmpty());
    }
}
