package com.hanghai.kchtg.vanban;

import com.hanghai.kchtg.vanban.controller.DieuChinhQuyHoachController;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.*;
import com.hanghai.kchtg.vanban.service.DieuChinhQuyHoachService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.security.test.context.support.WithMockUser;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser
class DieuChinhQuyHoachControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DieuChinhQuyHoachService dieuChinhQuyHoachService;

    private DieuChinhQuyHoachResponse testResponse;
    private DieuChinhQuyHoachCreateRequest createRequest;
    private PheDuyetDieuChinhRequest approvalRequest;

    @BeforeEach
    void setUp() {
        testResponse = DieuChinhQuyHoachResponse.builder()
                .id(1L)
                .quyHoachId(1L)
                .loaiDieuChinh("Điều chỉnh phạm vi")
                .lyDo("Thay đổi quy hoạch tổng thể khu vực")
                .moTaChiTiet("Mở rộng khu vực tiếp nhận tàu từ 50m lên 80m")
                .phamViAnhHuong("Khu vực Bắc Bến Cảng A")
                .tinhTrang(TinhTrangDieuChinh.DA_DUOC_PHE_DUYET)
                .nguoiDangKy("Kỹ sư D")
                .ngayDangKy(LocalDate.of(2026, 6, 20).atStartOfDay())
                .build();

        createRequest = DieuChinhQuyHoachCreateRequest.builder()
                .quyHoachId(1L)
                .loaiDieuChinh("Điều chỉnh tiến độ")
                .lyDo("Thay đổi tiến độ thi công")
                .moTaChiTiet("Gia hạn thời gian thi công thêm 3 tháng")
                .phamViAnhHuong("Toàn bộ Bến Cảng A")
                .nguoiDangKy("Kỹ sư E")
                .build();

        approvalRequest = PheDuyetDieuChinhRequest.builder()
                .capPheDuyet("CAP_1")
                .trangThai("DA_DUOC_PHE_DUYET")
                .nguoiPheDuyet("Giám đốc Sở")
                .ngayPheDuyet(LocalDate.of(2026, 7, 1))
                .ghiChu("Được phê duyệt vì phù hợp quy hoạch tổng thể")
                .build();
    }

    @Test
    void listAdjustments_shouldReturnAll() throws Exception {
        when(dieuChinhQuyHoachService.findAll())
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/dieu-chinh-quy-hoach"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].loaiDieuChinh").value("Điều chỉnh phạm vi"));
    }

    @Test
    void createAdjustment_shouldReturnCreated() throws Exception {
        when(dieuChinhQuyHoachService.create(any(DieuChinhQuyHoachCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/dieu-chinh-quy-hoach")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loaiDieuChinh").value("Điều chỉnh phạm vi"));
    }

    @Test
    void getAdjustment_shouldReturnOne() throws Exception {
        when(dieuChinhQuyHoachService.getById(1L)).thenReturn(testResponse);

        mockMvc.perform(get("/api/v1/dieu-chinh-quy-hoach/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loaiDieuChinh").value("Điều chỉnh phạm vi"));
    }

    @Test
    void updateAdjustment_shouldReturnUpdated() throws Exception {
        DieuChinhQuyHoachResponse updated = DieuChinhQuyHoachResponse.builder()
                .id(1L)
                .loaiDieuChinh("Điều chỉnh phạm vi - Đã sửa đổi")
                .build();
        when(dieuChinhQuyHoachService.update(eq(1L), any(DieuChinhQuyHoachCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/dieu-chinh-quy-hoach/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loaiDieuChinh").value("Điều chỉnh phạm vi - Đã sửa đổi"));
    }

    @Test
    void deleteAdjustment_shouldReturnOk() throws Exception {
        doNothing().when(dieuChinhQuyHoachService).delete(1L);

        mockMvc.perform(delete("/api/v1/dieu-chinh-quy-hoach/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getByQuyHoachId_shouldReturnMatchingAdjustments() throws Exception {
        when(dieuChinhQuyHoachService.findByQuyHoachId(1L))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/dieu-chinh-quy-hoach/quy-hoach/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].quyHoachId").value(1));
    }

    @Test
    void filterByStatus_shouldReturnMatchingAdjustments() throws Exception {
        when(dieuChinhQuyHoachService.findByTinhTrang(any(TinhTrangDieuChinh.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/dieu-chinh-quy-hoach/status/DA_DUOC_PHE_DUYET"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void addApproval_shouldReturnCreated() throws Exception {
        PheDuyetDieuChinhResponse approvalResponse = PheDuyetDieuChinhResponse.builder()
                .id(1L)
                .dieuChinhId(1L)
                .capPheDuyet("CAP_1")
                .trangThai("DA_DUOC_PHE_DUYET")
                .nguoiPheDuyet("Giám đốc Sở")
                .ghiChu("Được phê duyệt vì phù hợp quy hoạch tổng thể")
                .build();

        when(dieuChinhQuyHoachService.addApproval(eq(1L), any(PheDuyetDieuChinhRequest.class)))
                .thenReturn(approvalResponse);

        mockMvc.perform(post("/api/v1/dieu-chinh-quy-hoach/1/approval")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approvalRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.trangThai").value("DA_DUOC_PHE_DUYET"));
    }
}
