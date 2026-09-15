package com.hanghai.kchtg.report;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.service.ReportService;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
public class F148ExportTest {

    @Autowired
    private ReportService reportService;

    @Autowired
    private OrgUnitRepository orgUnitRepository;

    @Autowired
    private PortRepository portRepository;

    @Autowired
    private BerthRepository berthRepository;

    @Autowired
    private PierRepository pierRepository;

    private OrgUnit cucHangHai;
    private OrgUnit cangVuKhuVuc;

    @BeforeEach
    void setUp() {
        pierRepository.deleteAll();
        berthRepository.deleteAll();
        portRepository.deleteAll();

        // Seed root Cuc and child CangVu if not present
        cucHangHai = orgUnitRepository.findAll().stream()
                .filter(u -> "G17.43".equalsIgnoreCase(u.getCode()))
                .findFirst()
                .orElseGet(() -> orgUnitRepository.save(OrgUnit.builder()
                        .code("G17.43")
                        .name("Cục Hàng hải và Đường thủy Việt Nam")
                        .rank(com.hanghai.kchtg.orgunit.entity.OrgUnitRank.DEPARTMENT)
                        .path("/G17.43/")
                        .level(1)
                        .sortOrder(1)
                        .build()));

        cangVuKhuVuc = orgUnitRepository.findAll().stream()
                .filter(u -> "CV_KV3".equalsIgnoreCase(u.getCode()))
                .findFirst()
                .orElseGet(() -> orgUnitRepository.save(OrgUnit.builder()
                        .code("CV_KV3")
                        .name("Cảng vụ Đường thủy nội địa Khu vực III")
                        .parentId(cucHangHai.getId())
                        .rank(com.hanghai.kchtg.orgunit.entity.OrgUnitRank.BRANCH)
                        .path("/G17.43/CV_KV3/")
                        .level(2)
                        .sortOrder(1)
                        .build()));

        // Seed sample hierarchy: Port -> Berth -> Pier
        Port port1 = portRepository.save(Port.builder()
                .portCode("PORT_TG_01")
                .portName("Cảng biển Tiền Giang")
                .province("Tiền Giang")
                .portGroup(1)
                .orgUnitId(cangVuKhuVuc.getId())
                .maxVesselCapacity(new BigDecimal("50000"))
                .approvalStatus(ApprovalStatus.APPROVED)
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .build());

        Berth berth1 = berthRepository.save(Berth.builder()
                .berthCode("BERTH_TG_01")
                .berthName("Bến cảng Mỹ Tho")
                .portId(port1.getId())
                .orgUnitId(cangVuKhuVuc.getId())
                .length(new BigDecimal("350.5"))
                .maxVesselSize(new BigDecimal("30000"))
                .currentThroughput(new BigDecimal("1200000"))
                .operationalFunction("Hàng tổng hợp")
                .approvalStatus(ApprovalStatus.APPROVED)
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .build());

        pierRepository.save(Pier.builder()
                .pierCode("PIER_TG_01_A")
                .pierName("Cầu cảng số 1")
                .berthId(berth1.getId())
                .orgUnitId(cangVuKhuVuc.getId())
                .length(new BigDecimal("180"))
                .designLoad(new BigDecimal("20000"))
                .operationalFunction("Tổng hợp")
                .approvalStatus(ApprovalStatus.APPROVED)
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .build());

        pierRepository.save(Pier.builder()
                .pierCode("PIER_TG_01_B")
                .pierName("Cầu cảng số 2")
                .berthId(berth1.getId())
                .orgUnitId(cangVuKhuVuc.getId())
                .length(new BigDecimal("170.5"))
                .designLoad(new BigDecimal("15000"))
                .operationalFunction("Container")
                .approvalStatus(ApprovalStatus.APPROVED)
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .build());
    }

    @Test
    void testPreviewF148_WithCucRoot() {
        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .reportCode("F-148")
                .orgUnitId(cucHangHai.getId().toString())
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .build();

        ReportResponse res = reportService.getPreview(req);
        assertNotNull(res);
        assertNotNull(res.getRows());
        // Section I + Port + Berth + 2 Piers + Section II = at least 6 rows
        assertTrue(res.getRows().size() >= 6, "Expected at least 6 rows in preview hierarchy, got: " + res.getRows().size());
    }

    @Test
    void testExportF148_ExcelAndPdf() throws Exception {
        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .reportCode("F-148")
                .format("EXCEL")
                .orgUnitId(cucHangHai.getId().toString())
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .build();

        // 1. Export Excel
        byte[] excelBytes = reportService.exportReport(req);
        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);

        try (InputStream is = new ByteArrayInputStream(excelBytes);
             Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            assertNotNull(sheet);

            // Verify Section I (row 10)
            Row row10 = sheet.getRow(10);
            assertNotNull(row10);
            Cell cellA10 = row10.getCell(0);
            assertNotNull(cellA10);
            assertEquals("I", cellA10.getStringCellValue().trim());

            // Verify Port row (row 11)
            Row row11 = sheet.getRow(11);
            assertNotNull(row11);
            Cell cellB11 = row11.getCell(1);
            assertNotNull(cellB11);
            assertEquals("Cảng biển Tiền Giang", cellB11.getStringCellValue().trim());

            // Verify Berth row (row 12)
            Row row12 = sheet.getRow(12);
            assertNotNull(row12);
            Cell cellB12 = row12.getCell(1);
            assertNotNull(cellB12);
            assertEquals("Bến cảng Mỹ Tho", cellB12.getStringCellValue().trim());

            // Verify Pier rows (row 13 and 14)
            Row row13 = sheet.getRow(13);
            assertNotNull(row13);
            Cell cellB13 = row13.getCell(1);
            assertNotNull(cellB13);
            assertEquals("Cầu cảng số 1", cellB13.getStringCellValue().trim());

            Row row14 = sheet.getRow(14);
            assertNotNull(row14);
            Cell cellB14 = row14.getCell(1);
            assertNotNull(cellB14);
            assertEquals("Cầu cảng số 2", cellB14.getStringCellValue().trim());

            // Total data rows must be > 4 (contains Port, Berth, Piers)
            assertTrue(sheet.getLastRowNum() >= 15, "Sheet should contain full hierarchy rows");
        }

        // 2. Export PDF
        ReportPreviewRequest pdfReq = ReportPreviewRequest.builder()
                .reportCode("F-148")
                .format("PDF")
                .orgUnitId(cucHangHai.getId().toString())
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .build();

        byte[] pdfBytes = reportService.exportReport(pdfReq);
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);

        // Verify PDF signature (%PDF-)
        String pdfHeader = new String(pdfBytes, 0, Math.min(pdfBytes.length, 10));
        assertTrue(pdfHeader.startsWith("%PDF-"), "Expected PDF header %PDF-, got: " + pdfHeader);
    }
}
