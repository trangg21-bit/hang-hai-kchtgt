package com.hanghai.kchtg.datasharing;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.datasharing.controller.ShareController;
import com.hanghai.kchtg.datasharing.dto.ShareFilter;
import com.hanghai.kchtg.datasharing.dto.ShareSummary;
import com.hanghai.kchtg.datasharing.dto.SharedDataRequest;
import com.hanghai.kchtg.datasharing.dto.SharedDataResponse;
import com.hanghai.kchtg.datasharing.service.ShareService;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ShareController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ShareController Web MVC Tests — M-018 Wave 4")
class ShareControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ShareService shareService;

    // Global interceptor / security dependencies mock
    @MockBean
    private AccessLogRepository accessLogRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private TokenService tokenService;

    @MockBean
    private JwtSessionService jwtSessionService;

    @MockBean
    private TokenValidationService tokenValidationService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    // ------------------------------------------------------------------
    // POST /shares
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-C-01: share_returns200 — POST /api/v1/datasharing/shares")
    void share_returns200() throws Exception {
        SharedDataRequest request = SharedDataRequest.builder()
                .dataType("PORT")
                .sharedWith("KCHTGT-CN")
                .fileUrl("https://storage.example.com/data.csv")
                .fileFormat("CSV")
                .recordCount(100)
                .build();

        SharedDataResponse response = SharedDataResponse.builder()
                .id(1L)
                .code("SD-2026-0001")
                .name("Ben Caang 1")
                .dataType("PORT")
                .shareStatus("DRAFT")
                .sharedWith("KCHTGT-CN")
                .build();

        when(shareService.share(any(SharedDataRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/datasharing/shares")
                        .contentType("application/json")
                        .content("""
                                {
                                  "dataType": "PORT",
                                  "sharedWith": "KCHTGT-CN",
                                  "fileUrl": "https://storage.example.com/data.csv",
                                  "fileFormat": "CSV",
                                  "recordCount": 100
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("SD-2026-0001"))
                .andExpect(jsonPath("$.data.shareStatus").value("DRAFT"));

        verify(shareService).share(any(SharedDataRequest.class));
    }

    // ------------------------------------------------------------------
    // GET /shares/{id}
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-C-02: findById_returns200 — GET /api/v1/datasharing/shares/1")
    void findById_returns200() throws Exception {
        SharedDataResponse response = SharedDataResponse.builder()
                .id(1L)
                .code("SD-001")
                .name("Ben Caang 1")
                .dataType("PORT")
                .shareStatus("SHARED")
                .sharedWith("KCHTGT-CN")
                .build();

        when(shareService.findById(1L)).thenReturn(Optional.of(response));

        mockMvc.perform(get("/api/v1/datasharing/shares/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.code").value("SD-001"));

        verify(shareService).findById(1L);
    }

    @Test
    @DisplayName("F-018-C-03: findById_notFound_returns404 — GET /api/v1/datasharing/shares/999")
    void findById_notFound_returns404() throws Exception {
        when(shareService.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/datasharing/shares/999"))
                .andExpect(status().isNotFound());

        verify(shareService).findById(999L);
    }

    // ------------------------------------------------------------------
    // GET /shares/code/{code}
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-C-04: findByCode_returns200 — GET /api/v1/datasharing/shares/code/SD-001")
    void findByCode_returns200() throws Exception {
        SharedDataResponse response = SharedDataResponse.builder()
                .id(3L)
                .code("SD-001")
                .name("He thong VTS")
                .dataType("VTS_SYSTEM")
                .shareStatus("SHARED")
                .sharedWith("VTS-DNAI")
                .build();

        when(shareService.findByCode("SD-001")).thenReturn(Optional.of(response));

        mockMvc.perform(get("/api/v1/datasharing/shares/code/SD-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value("SD-001"))
                .andExpect(jsonPath("$.data.dataType").value("VTS_SYSTEM"));

        verify(shareService).findByCode("SD-001");
    }

    // ------------------------------------------------------------------
    // GET /shares (paginated)
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-C-05: findAll_returns200 — GET /api/v1/datasharing/shares")
    void findAll_returns200() throws Exception {
        SharedDataResponse r1 = SharedDataResponse.builder().id(1L).code("SD-001").build();
        SharedDataResponse r2 = SharedDataResponse.builder().id(2L).code("SD-002").build();
        Page<SharedDataResponse> page = new PageImpl<>(List.of(r1, r2), PageRequest.of(0, 20), 2L);

        when(shareService.findAll(any(ShareFilter.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/datasharing/shares")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.content[0].code").value("SD-001"))
                .andExpect(jsonPath("$.data.totalElements").value(2));

        verify(shareService).findAll(any(ShareFilter.class));
    }

    // ------------------------------------------------------------------
    // GET /shares/type/{dataType}
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-C-06: findByDataType_returns200 — GET /api/v1/datasharing/shares/type/PORT")
    void findByDataType_returns200() throws Exception {
        SharedDataResponse r = SharedDataResponse.builder()
                .id(1L).code("SD-001").dataType("PORT").sharedWith("KCHTGT-CN").build();

        when(shareService.findByDataType("PORT")).thenReturn(List.of(r));

        mockMvc.perform(get("/api/v1/datasharing/shares/type/PORT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].dataType").value("PORT"));

        verify(shareService).findByDataType("PORT");
    }

    // ------------------------------------------------------------------
    // PUT /shares/{id}/revoke
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-C-07: revoke_returns200 — PUT /api/v1/datasharing/shares/1/revoke")
    void revoke_returns200() throws Exception {
        doNothing().when(shareService).revoke(1L);

        mockMvc.perform(put("/api/v1/datasharing/shares/1/revoke"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(shareService).revoke(1L);
    }

    // ------------------------------------------------------------------
    // GET /shares/count-by-status/{status}
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-C-08: countByStatus_returns200 — GET /api/v1/datasharing/shares/count-by-status/SHARED")
    void countByStatus_returns200() throws Exception {
        when(shareService.countByStatus("SHARED")).thenReturn(42L);

        mockMvc.perform(get("/api/v1/datasharing/shares/count-by-status/SHARED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(42));

        verify(shareService).countByStatus("SHARED");
    }

    // ------------------------------------------------------------------
    // GET /shares/summary
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-C-09: getSummary_returns200 — GET /api/v1/datasharing/shares/summary")
    void getSummary_returns200() throws Exception {
        ShareSummary summary = ShareSummary.builder()
                .totalShared(10L)
                .activeShares(7L)
                .revokedShares(2L)
                .expiredShares(1L)
                .build();

        when(shareService.getSummary()).thenReturn(summary);

        mockMvc.perform(get("/api/v1/datasharing/shares/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalShared").value(10))
                .andExpect(jsonPath("$.data.activeShares").value(7))
                .andExpect(jsonPath("$.data.revokedShares").value(2))
                .andExpect(jsonPath("$.data.expiredShares").value(1));

        verify(shareService).getSummary();
    }
}
