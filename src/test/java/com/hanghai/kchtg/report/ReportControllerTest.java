package com.hanghai.kchtg.report;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.report.controller.ReportController;
import com.hanghai.kchtg.report.dto.ReportRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.ReportEntity;
import com.hanghai.kchtg.report.entity.ReportFormat;
import com.hanghai.kchtg.report.entity.ReportStatus;
import com.hanghai.kchtg.report.entity.ReportType;
import com.hanghai.kchtg.report.service.ReportService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.containsString;

@WebMvcTest(ReportController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ReportController Integration Tests")
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportService reportService;

    @MockBean
    private com.hanghai.kchtg.accesslog.repository.AccessLogRepository accessLogRepository;

    @MockBean
    private com.hanghai.kchtg.user.repository.UserRepository userRepository;

    @MockBean
    private com.hanghai.kchtg.security.service.TokenService tokenService;

    @MockBean
    private com.hanghai.kchtg.security.service.JwtSessionService jwtSessionService;

    @MockBean
    private com.hanghai.kchtg.security.service.TokenValidationService tokenValidationService;

    @MockBean
    private com.hanghai.kchtg.security.JwtUtil jwtUtil;

    @MockBean
    private com.hanghai.kchtg.user.service.PermissionRoleService permissionRoleService;

    @MockBean
    private org.springframework.data.jpa.mapping.JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private ReportEntity buildEntity(String code, ReportType type, ReportStatus status) {
        return ReportEntity.builder()
                .id(java.util.UUID.randomUUID())
                .code(code)
                .name("Báo cáo demo")
                .reportType(type)
                .status(status)
                .outputFormat(ReportFormat.PDF)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .parameters("{}")
                .generatedAt(Instant.now())
                .fileUrl("https://storage.example.com/" + code + ".pdf")
                .build();
    }

    @BeforeEach
    void setUp() {
    }

    @Test
    @DisplayName("F-016-50: POST /api/v1/reports/generate — returns 200 with READY status")
    void generateReport_returns200() throws Exception {
        ReportRequest request = ReportRequest.builder()
                .reportType(ReportType.SUMMARY)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .outputFormat(ReportFormat.PDF)
                .build();

        String json = """
                {
                  "reportType": "SUMMARY",
                  "startDate": "2026-01-01",
                  "endDate": "2026-12-31",
                  "outputFormat": "PDF"
                }
                """;

        doNothing().when(reportService).generateReport(any(ReportRequest.class));

        mockMvc.perform(post("/api/v1/reports/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reportType").value("SUMMARY"))
                .andExpect(jsonPath("$.data.status").value("READY"))
                .andExpect(jsonPath("$.data.outputFormat").value("PDF"))
                .andExpect(jsonPath("$.data.startDate").value("2026-01-01"))
                .andExpect(jsonPath("$.data.endDate").value("2026-12-31"));

        verify(reportService).generateReport(any(ReportRequest.class));
    }

    @Test
    @DisplayName("F-016-51: GET /api/v1/reports/{code} — returns 200 with report data")
    void findById_returns200() throws Exception {
        ReportEntity entity = buildEntity("RPT-001", ReportType.FORM_02, ReportStatus.READY);

        when(reportService.findByCode("RPT-001")).thenReturn(entity);

        mockMvc.perform(get("/api/v1/reports/RPT-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("RPT-001"))
                .andExpect(jsonPath("$.data.reportType").value("FORM_02"))
                .andExpect(jsonPath("$.data.status").value("READY"));

        verify(reportService).findByCode("RPT-001");
    }

    @Test
    @DisplayName("F-016-52: GET /api/v1/reports/{code} — returns 404 when not found")
    void findById_notFound_returns404() throws Exception {
        when(reportService.findByCode("NOPE"))
                .thenThrow(new EntityNotFoundException("Report not found: NOPE"));

        mockMvc.perform(get("/api/v1/reports/NOPE"))
                .andExpect(status().isNotFound());

        verify(reportService).findByCode("NOPE");
    }

    @Test
    @DisplayName("F-016-53: GET /api/v1/reports — returns 200 with paginated reports")
    void findAll_returns200() throws Exception {
        ReportEntity e1 = buildEntity("RPT-001", ReportType.SUMMARY, ReportStatus.READY);
        ReportEntity e2 = buildEntity("RPT-002", ReportType.FORM_03, ReportStatus.READY);
        Page<ReportEntity> page = new PageImpl<>(List.of(e1, e2));

        when(reportService.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2));

        verify(reportService).findAll(any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    @DisplayName("F-016-54: PUT /api/v1/reports/{code}/status/{status} — returns 200")
    void updateStatus_returns200() throws Exception {
        doNothing().when(reportService).updateReportStatus(anyString(), any(ReportStatus.class));

        mockMvc.perform(put("/api/v1/reports/RPT-001/status/READY"))
                .andExpect(status().isOk());

        verify(reportService).updateReportStatus("RPT-001", ReportStatus.READY);
    }

    @Test
    @DisplayName("F-016-55: POST /api/v1/reports/{code}/download — returns 200 with file data")
    void download_returns200() throws Exception {
        when(reportService.downloadReport("RPT-001")).thenReturn("https://storage.example.com/RPT-001.pdf");

        mockMvc.perform(post("/api/v1/reports/RPT-001/download"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        containsString("baocao_RPT-001.pdf")))
                .andExpect(header().string("Cache-Control", "no-cache, no-store, must-revalidate"))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));

        verify(reportService).downloadReport("RPT-001");
    }

    @Test
    @DisplayName("F-016-56: POST /api/v1/reports/{code}/download — returns 404 when fileUrl is null")
    void download_notFound_returns404() throws Exception {
        when(reportService.downloadReport("NOPE")).thenReturn(null);

        mockMvc.perform(post("/api/v1/reports/NOPE/download"))
                .andExpect(status().isNotFound());

        verify(reportService).downloadReport("NOPE");
    }

    @Test
    @DisplayName("F-016-57: GET /api/v1/reports/count-by-status/{status} — returns 200 with count")
    void countByStatus_returns200() throws Exception {
        when(reportService.countByStatus(ReportStatus.READY)).thenReturn(42L);

        mockMvc.perform(get("/api/v1/reports/count-by-status/READY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(42));

        verify(reportService).countByStatus(ReportStatus.READY);
    }

    @Test
    @DisplayName("F-016-58: GET /api/v1/reports — with type filter returns matching reports")
    void findAll_withTypeFilter_returns200() throws Exception {
        ReportEntity e = buildEntity("RPT-F02", ReportType.FORM_02, ReportStatus.READY);

        when(reportService.findByReportType(ReportType.FORM_02)).thenReturn(List.of(e));

        mockMvc.perform(get("/api/v1/reports").param("type", "FORM_02"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].reportType").value("FORM_02"));

        verify(reportService).findByReportType(ReportType.FORM_02);
    }
}
