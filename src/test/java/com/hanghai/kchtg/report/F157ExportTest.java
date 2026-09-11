package com.hanghai.kchtg.report;

import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.service.ReportService;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class F157ExportTest {

    @Autowired
    private ReportService reportService;

    @Autowired
    private NavigationChannelRepository navigationChannelRepository;

    @Autowired
    private BuoyRepository buoyRepository;

    @Test
    void testExportReport_F157_WithData() throws Exception {
        NavigationChannel nc = NavigationChannel.builder()
                .channelName("Luồng hàng hải Quy Nhơn")
                .createdAt(LocalDateTime.of(2025, 1, 1, 0, 0))
                .build();
        nc = navigationChannelRepository.save(nc);

        Buoy b1 = Buoy.builder()
                .code("PHAO-01")
                .name("Phao 0-Đ2,4-003-23")
                .locationDetail("Luồng hàng hải Quy Nhơn")
                .shape("Hình tháp")
                .structure("Thép")
                .area(90.06)
                .range(5.0)
                .lightModel("Cammanah")
                .powerSupply("Pin 3.6V - 4500mAh")
                .lastRepairDate(LocalDate.of(2024, 6, 1))
                .build();
        b1.setCreatedAt(LocalDateTime.of(2025, 1, 1, 0, 0));
        buoyRepository.save(b1);

        Buoy b2 = Buoy.builder()
                .code("PHAO-02")
                .name("Phao 2-Đ2,0-087-18")
                .locationDetail("Luồng hàng hải Quy Nhơn")
                .shape("Hình tháp")
                .structure("Thép")
                .area(73.56)
                .range(5.0)
                .lightModel("Sealite")
                .powerSupply("Pin 3.6V - 4500mAh")
                .lastRepairDate(LocalDate.of(2024, 6, 1))
                .build();
        b2.setCreatedAt(LocalDateTime.of(2025, 1, 1, 0, 0));
        buoyRepository.save(b2);

        ReportPreviewRequest req = ReportPreviewRequest.builder()
                .reportCode("F-157")
                .format("EXCEL")
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .build();

        byte[] excelBytes = reportService.exportReport(req);
        assertNotNull(excelBytes);

        try (InputStream is = new ByteArrayInputStream(excelBytes);
             Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            System.out.println("=== EXPORTED SHEET F-157 WITH DATA ===");
            DataFormatter df = new DataFormatter();
            boolean foundStt1 = false;
            boolean foundStt2 = false;
            boolean hasTemplateResidue = false;

            for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                StringBuilder sb = new StringBuilder("Row " + (r + 1) + ": ");
                for (int c = 0; c < row.getLastCellNum(); c++) {
                    Cell cell = row.getCell(c);
                    if (cell != null) {
                        String val = df.formatCellValue(cell);
                        sb.append("[").append(c).append("]='").append(val).append("' | ");
                        if (val.contains("entry.key") || val.contains("charAt(idx)")) {
                            hasTemplateResidue = true;
                        }
                    } else {
                        sb.append("[").append(c).append("]=null | ");
                    }
                }
                System.out.println(sb.toString());

                Cell c0 = row.getCell(0);
                Cell c1 = row.getCell(1);
                String val0 = c0 != null ? df.formatCellValue(c0).trim() : "";
                String val1 = c1 != null ? df.formatCellValue(c1).trim() : "";

                if ("1".equals(val0) && val1.contains("Phao 0-Đ2,4-003-23")) {
                    foundStt1 = true;
                    // Cột 13 (col N) phải bị xóa
                    Cell c13 = row.getCell(13);
                    assertTrue(c13 == null || df.formatCellValue(c13).trim().isEmpty(), "Column 13 must be null or empty");
                }
                if ("2".equals(val0) && val1.contains("Phao 2-Đ2,0-087-18")) {
                    foundStt2 = true;
                    Cell c13 = row.getCell(13);
                    assertTrue(c13 == null || df.formatCellValue(c13).trim().isEmpty(), "Column 13 must be null or empty");
                }
            }

            assertTrue(foundStt1, "Row with STT 1 for Phao 0 must be present");
            assertTrue(foundStt2, "Row with STT 2 for Phao 2 must be present");
            assertFalse(hasTemplateResidue, "There should be no unresolved template residue (${entry.key}) in sheet");
        }
    }
}
