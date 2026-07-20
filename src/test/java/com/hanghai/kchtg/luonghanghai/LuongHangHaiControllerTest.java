package com.hanghai.kchtg.luonghanghai;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.luonghanghai.controller.LuongHangHaiController;
import com.hanghai.kchtg.luonghanghai.dto.*;
import com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus;
import com.hanghai.kchtg.luonghanghai.service.LuongHangHaiService;
import com.hanghai.kchtg.security.PermissionAuthorizationManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(username = "admin", roles = "SYSTEM_ADMIN")
class LuongHangHaiControllerTest {

        private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
        private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

        @Autowired
        MockMvc mockMvc;
        @Autowired
        ObjectMapper objectMapper;
        @MockBean
        LuongHangHaiService service;
        @MockBean
        PermissionAuthorizationManager auth;

        private LuongHangHaiResponse testResp;
        private LuongHangHaiCreateRequest createReq;

        @BeforeEach
        void setUp() {
                when(auth.check(any(), anyString())).thenReturn(true);

                testResp = LuongHangHaiResponse.builder()
                                .id(TEST_ID)
                                .ten("Hai Phong")
                                .soLuong(100)
                                .ngayGhiNhan(LocalDate.of(2026, 1, 1))
                                .gioDien("12:00")
                                .taiTrong("1000")
                                .dienTichDangBo("200")
                                .ghiChu("Test ghi chu")
                                .approvalStatus(LuongHangHaiApprovalStatus.PROPOSED)
                                .pheDuyetC1(false)
                                .pheDuyetC2(false)
                                .createdBy("Admin")
                                .build();

                createReq = LuongHangHaiCreateRequest.builder()
                                .ten("Luong moi")
                                .soLuong(50)
                                .ngayGhiNhan(LocalDate.of(2026, 6, 15))
                                .gioDien("14:00")
                                .taiTrong("800")
                                .dienTichDangBo("150")
                                .ghiChu("Create test")
                                .build();
        }

        @Test
        void list_shouldReturnPaginated() throws Exception {
                when(service.findAll(0, 20)).thenReturn(new PageImpl<>(List.of(testResp)));
                mockMvc.perform(get("/api/v1/luong-hang-hai").param("page", "0").param("size", "20"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data[0].ten").value("Hai Phong"));
        }

        @Test
        void create_shouldReturnCreated() throws Exception {
                when(service.create(any(), anyString())).thenReturn(testResp);
                mockMvc.perform(post("/api/v1/luong-hang-hai")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Tạo luồng hàng hải thành công"))
                                .andExpect(jsonPath("$.data.ten").value("Hai Phong"));
        }

        @Test
        void create_shouldRejectNull() throws Exception {
                LuongHangHaiCreateRequest bad = LuongHangHaiCreateRequest.builder().ten(null).build();
                mockMvc.perform(post("/api/v1/luong-hang-hai")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(bad)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void get_shouldReturnOne() throws Exception {
                when(service.getById(TEST_ID)).thenReturn(testResp);
                mockMvc.perform(get("/api/v1/luong-hang-hai/" + TEST_ID))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.ten").value("Hai Phong"));
        }

        @Test
        void update_shouldReturnUpdated() throws Exception {
                LuongHangHaiResponse up = LuongHangHaiResponse.builder().id(TEST_ID).ten("Da cap nhat").build();
                when(service.update(eq(TEST_ID), any(), anyString())).thenReturn(up);
                mockMvc.perform(put("/api/v1/luong-hang-hai/" + TEST_ID)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.ten").value("Da cap nhat"));
        }

        @Test
        void softDelete_shouldReturnOk() throws Exception {
                doNothing().when(service).softDelete(TEST_ID);
                mockMvc.perform(delete("/api/v1/luong-hang-hai/" + TEST_ID))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        void approveC1_shouldReturnUnderReview() throws Exception {
                PheDuyetResponse resp = PheDuyetResponse.builder()
                                .id(TEST_ID.toString())
                                .luongHangHaiId(TEST_ID)
                                .capPheDuyet(1)
                                .trangThai("UNDER_REVIEW")
                                .nguoiPheDuyet("Truong Phong")
                                .build();
                when(service.approveC1(eq(TEST_ID), any(), anyString())).thenReturn(resp);
                PheDuyetRequest req = PheDuyetRequest.builder()
                                .trangThai("APPROVED")
                                .lyDo("Phe cap 1")
                                .build();
                mockMvc.perform(post("/api/v1/luong-hang-hai/" + TEST_ID + "/approve/c1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.trangThai").value("UNDER_REVIEW"));
        }

        @Test
        void approveC2_shouldReturnApproved() throws Exception {
                PheDuyetResponse resp = PheDuyetResponse.builder()
                                .id(TEST_ID.toString())
                                .luongHangHaiId(TEST_ID)
                                .capPheDuyet(2)
                                .trangThai("APPROVED")
                                .nguoiPheDuyet("Giam Doc")
                                .build();
                when(service.approveC2(eq(TEST_ID), any(), anyString())).thenReturn(resp);
                PheDuyetRequest req = PheDuyetRequest.builder()
                                .trangThai("APPROVED")
                                .lyDo("Phe cap 2")
                                .build();
                mockMvc.perform(post("/api/v1/luong-hang-hai/" + TEST_ID + "/approve/c2")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.trangThai").value("APPROVED"));
        }

        // B1 regression: approver identity must come from the authenticated principal,
        // NOT from the request body. Posts a spoofed 'nguoiPheDuyet' and asserts the
        // service still receives the authenticated username ("admin" per
        // @WithMockUser).
        @Test
        void approveC1_bindsApproverFromAuthentication_ignoresClientSuppliedName() throws Exception {
                when(service.approveC1(eq(TEST_ID), any(), anyString()))
                                .thenReturn(PheDuyetResponse.builder().luongHangHaiId(TEST_ID).capPheDuyet(1)
                                                 .trangThai("UNDER_REVIEW").build());
                // Raw body includes a spoofed approver name that no longer exists on
                // PheDuyetRequest.
                String spoofedBody = "{\"trangThai\":\"APPROVED\",\"nguoiPheDuyet\":\"HACKER\",\"lyDo\":\"x\"}";
                var principal = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                "admin", null);
                mockMvc.perform(post("/api/v1/luong-hang-hai/" + TEST_ID + "/approve/c1")
                                .principal(principal)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(spoofedBody))
                                .andExpect(status().isOk());
                verify(service).approveC1(eq(TEST_ID), any(), eq("admin"));
                verify(service, never()).approveC1(eq(TEST_ID), any(), eq("HACKER"));
        }

        @Test
        void history_shouldReturnEntries() throws Exception {
                when(service.getApprovalHistory(TEST_ID)).thenReturn(List.of(
                                HistoryEntry.builder().luongHangHaiId(TEST_ID).trangThai("PROPOSED").lyDo("Tao moi")
                                                .build()));
                mockMvc.perform(get("/api/v1/luong-hang-hai/" + TEST_ID + "/history"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data[0].trangThai").value("PROPOSED"));
        }

        @Test
        void filterByApprovalStatus_shouldReturnResults() throws Exception {
                LuongHangHaiResponse approvedResp = LuongHangHaiResponse.builder()
                                .id(TEST_ID)
                                .ten("Luong da duyet")
                                .approvalStatus(LuongHangHaiApprovalStatus.APPROVED)
                                .build();
                when(service.findByApprovalStatus(LuongHangHaiApprovalStatus.APPROVED))
                                .thenReturn(List.of(approvedResp));
                mockMvc.perform(get("/api/v1/luong-hang-hai/status-phe-duyet/APPROVED"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data").isArray())
                                .andExpect(jsonPath("$.data[0].approvalStatus").value("APPROVED"));
        }

        @Test
        void search_shouldReturnResults() throws Exception {
                KetQuaTimKiemResponse sr = KetQuaTimKiemResponse.builder()
                                .results(List.of(testResp))
                                .totalElements(1L)
                                .totalPages(1)
                                .currentPage(0)
                                .pageSize(20)
                                .build();
                when(service.searchDocuments(eq(null), eq("Hai"), eq(null), eq(null), eq(null), eq(0), eq(20)))
                                .thenReturn(sr);
                mockMvc.perform(get("/api/v1/luong-hang-hai/search")
                                .param("keyword", "Hai")
                                .param("page", "0")
                                .param("size", "20"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.totalElements").value(1))
                                .andExpect(jsonPath("$.data.results[0].ten").value("Hai Phong"));
        }

        @Test
        void filterByInvalidStatus_shouldThrow400() throws Exception {
                mockMvc.perform(get("/api/v1/luong-hang-hai/status-phe-duyet/INVALID"))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void approveC1_shouldThrowWhenNotFound() throws Exception {
                when(service.approveC1(eq(TEST_ID_2), any(), anyString()))
                                .thenThrow(new IllegalArgumentException("Khong tim thay"));
                PheDuyetRequest req = PheDuyetRequest.builder().trangThai("APPROVED").build();
                mockMvc.perform(post("/api/v1/luong-hang-hai/" + TEST_ID_2 + "/approve/c1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void list_defaultPage_shouldWork() throws Exception {
                when(service.findAll(0, 20)).thenReturn(new PageImpl<>(List.of()));
                mockMvc.perform(get("/api/v1/luong-hang-hai"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data").isArray())
                                .andExpect(jsonPath("$.data").isEmpty());
        }
}
