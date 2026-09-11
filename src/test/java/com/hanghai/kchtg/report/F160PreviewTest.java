package com.hanghai.kchtg.report;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("local")
public class F160PreviewTest {

    @Autowired
    private ReportService reportService;

    @Autowired
    private OrgUnitRepository orgUnitRepository;

    @Autowired
    private com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository dikeRevetmentRepository;

    @Test
    void testGetPreview_F160() {
        System.out.println("=== DIAGNOSING DIKE_REVETMENT DATA ===");
        List<com.hanghai.kchtg.dikerevetment.entity.DikeRevetment> all = dikeRevetmentRepository.findAll();
        System.out.println("Total DikeRevetment in DB: " + all.size());
        for (var dr : all) {
            System.out.println(String.format("DR: id=%s, name=%s, type=%s, status=%s, approvalStatus=%s, orgUnitId=%s, updated=%s, commDate=%s",
                    dr.getId(), dr.getDikeRevetmentName(), dr.getDikeRevetmentType(), dr.getStatus(), dr.getApprovalStatus(),
                    dr.getOrgUnitId(), dr.getUpdatedAt(), dr.getCommissioningDate()));
        }

        List<OrgUnit> orgUnits = orgUnitRepository.findAll();
        for (OrgUnit u : orgUnits) {
            if (u.getParentId() == null) {
                System.out.println("Root OrgUnit: id=" + u.getId() + ", name=" + u.getName());
                ReportPreviewRequest request = ReportPreviewRequest.builder()
                        .reportCode("F-160")
                        .orgUnitId(u.getId().toString())
                        .startDate(LocalDate.of(2026, 1, 1))
                        .endDate(LocalDate.of(2026, 12, 31))
                        .build();

                ReportResponse response = reportService.getPreview(request);
                assertNotNull(response);
                assertEquals("F-160", response.getCode());
                assertNotNull(response.getHeaders());
                assertTrue(response.getHeaders().contains("Tên công trình"));
                assertTrue(response.getHeaders().contains("Loại công trình"));
                assertTrue(response.getHeaders().contains("Hiện trạng của công trình"));
                assertNotNull(response.getRows());
                System.out.println("F-160 preview OK for root org, rows=" + response.getRows().size());
                assertFalse(response.getRows().isEmpty(), "Rows should not be empty for root org in 2026");

                // Test export
                request.setFormat("EXCEL");
                byte[] excelBytes = reportService.exportReport(request);
                assertNotNull(excelBytes);
                assertTrue(excelBytes.length > 0, "Exported excel bytes should not be empty");
                System.out.println("F-160 export EXCEL OK, bytes=" + excelBytes.length);
            }
        }
    }
}
