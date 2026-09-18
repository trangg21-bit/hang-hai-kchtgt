package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.dto.anchorage.AnchorageResponse;
import com.hanghai.kchtg.port.dto.anchorage.ApproveRequest;
import com.hanghai.kchtg.port.dto.anchorage.CreateAnchorageRequest;
import com.hanghai.kchtg.port.dto.anchorage.RejectRequest;
import com.hanghai.kchtg.port.dto.anchorage.UpdateAnchorageRequest;
import com.hanghai.kchtg.port.repository.MooringWaterAreaRepository;
import com.hanghai.kchtg.port.service.AnchorageApprovalService;
import com.hanghai.kchtg.port.service.AnchorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnchorageControllerTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID PORT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private AnchorageService anchorageService;

    @Mock
    private AnchorageApprovalService anchorageApprovalService;

    @Mock
    private MooringWaterAreaRepository mooringWaterAreaRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AnchorageController controller;

    private AnchorageResponse response;

    @BeforeEach
    void setUp() {
        response = AnchorageResponse.builder()
                .id(TEST_ID)
                .anchorageCode("KND-001")
                .anchorageName("Khu neo đậu Hải Phòng")
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    @Test
    void testCreate() {
        CreateAnchorageRequest request = new CreateAnchorageRequest();
        request.setAnchorageName("Khu neo đậu Hải Phòng");
        when(anchorageService.create(any(CreateAnchorageRequest.class))).thenReturn(response);

        ResponseEntity<ApiResponse<AnchorageResponse>> result = controller.create(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("KND-001", result.getBody().getData().getAnchorageCode());
        verify(anchorageService, times(1)).create(request);
    }

    @Test
    void testGenerateCode() {
        when(anchorageService.generateAnchorageCode(PORT_ID)).thenReturn("KND-001");

        ResponseEntity<ApiResponse<Map<String, String>>> result = controller.generateCode(PORT_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("KND-001", result.getBody().getData().get("anchorageCode"));
    }

    @Test
    void testGetById() {
        when(anchorageService.getById(TEST_ID)).thenReturn(response);

        ResponseEntity<ApiResponse<AnchorageResponse>> result = controller.getById(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(TEST_ID, result.getBody().getData().getId());
    }

    @Test
    void testFindAll() {
        Page<AnchorageResponse> page = new PageImpl<>(List.of(response));
        when(anchorageService.findAll(anyInt(), anyInt(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(page);

        ResponseEntity<ApiResponse<Page<AnchorageResponse>>> result = controller.findAll(
                0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(1, result.getBody().getData().getTotalElements());
    }

    @Test
    void testUpdate() {
        UpdateAnchorageRequest request = new UpdateAnchorageRequest();
        request.setId(TEST_ID);
        when(anchorageService.update(any(UpdateAnchorageRequest.class))).thenReturn(response);

        ResponseEntity<ApiResponse<AnchorageResponse>> result = controller.update(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testSoftDelete() {
        doNothing().when(anchorageService).softDelete(TEST_ID);

        ResponseEntity<ApiResponse<Void>> result = controller.softDelete(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(anchorageService, times(1)).softDelete(TEST_ID);
    }

    @Test
    void testSubmit() {
        when(authentication.getName()).thenReturn("testuser");
        doNothing().when(anchorageApprovalService).submit(eq(TEST_ID), any(), any());

        ResponseEntity<ApiResponse<Void>> result = controller.submit(TEST_ID, Map.of("content", "Gửi phê duyệt"), authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(anchorageApprovalService, times(1)).submit(eq(TEST_ID), eq("Gửi phê duyệt"), any());
    }

    @Test
    void testApproveC1() {
        when(authentication.getName()).thenReturn("cangvu_user");
        doNothing().when(anchorageApprovalService).approve(TEST_ID, "cangvu_user", "CANG_VU", "Duyệt C1");

        ApproveRequest req = new ApproveRequest();
        req.setContent("Duyệt C1");
        ResponseEntity<ApiResponse<Void>> result = controller.approveC1(TEST_ID, req, null, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(anchorageApprovalService, times(1)).approve(TEST_ID, "cangvu_user", "CANG_VU", "Duyệt C1");
    }

    @Test
    void testApproveC2() {
        when(authentication.getName()).thenReturn("cuc_user");
        doNothing().when(anchorageApprovalService).approve(TEST_ID, "cuc_user", "CUC", "Duyệt C2");

        ApproveRequest req = new ApproveRequest();
        req.setContent("Duyệt C2");
        ResponseEntity<ApiResponse<Void>> result = controller.approveC2(TEST_ID, req, null, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(anchorageApprovalService, times(1)).approve(TEST_ID, "cuc_user", "CUC", "Duyệt C2");
    }

    @Test
    void testRejectC1() {
        when(authentication.getName()).thenReturn("cangvu_user");
        doNothing().when(anchorageApprovalService).reject(TEST_ID, "cangvu_user", "CANG_VU", "Từ chối C1");

        RejectRequest req = new RejectRequest();
        req.setLyDo("Từ chối C1");
        ResponseEntity<ApiResponse<Void>> result = controller.rejectC1(TEST_ID, req, null, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(anchorageApprovalService, times(1)).reject(TEST_ID, "cangvu_user", "CANG_VU", "Từ chối C1");
    }

    @Test
    void testRejectC2() {
        when(authentication.getName()).thenReturn("cuc_user");
        doNothing().when(anchorageApprovalService).reject(TEST_ID, "cuc_user", "CUC", "Từ chối C2");

        RejectRequest req = new RejectRequest();
        req.setLyDo("Từ chối C2");
        ResponseEntity<ApiResponse<Void>> result = controller.rejectC2(TEST_ID, req, null, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(anchorageApprovalService, times(1)).reject(TEST_ID, "cuc_user", "CUC", "Từ chối C2");
    }

    @Test
    void testApproveGeneric() {
        when(authentication.getName()).thenReturn("testuser");
        doNothing().when(anchorageApprovalService).approve(TEST_ID, "testuser", "CANG_VU", "Duyệt generic");

        ApproveRequest req = new ApproveRequest();
        req.setCap("CANG_VU");
        req.setContent("Duyệt generic");
        ResponseEntity<ApiResponse<Void>> result = controller.approve(TEST_ID, req, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(anchorageApprovalService, times(1)).approve(TEST_ID, "testuser", "CANG_VU", "Duyệt generic");
    }

    @Test
    void testRejectGeneric() {
        when(authentication.getName()).thenReturn("testuser");
        doNothing().when(anchorageApprovalService).reject(TEST_ID, "testuser", "CANG_VU", "Từ chối generic");

        RejectRequest req = new RejectRequest();
        req.setCap("CANG_VU");
        req.setLyDo("Từ chối generic");
        ResponseEntity<ApiResponse<Void>> result = controller.reject(TEST_ID, req, null, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(anchorageApprovalService, times(1)).reject(TEST_ID, "testuser", "CANG_VU", "Từ chối generic");
    }

    @Test
    void testGetHistory() {
        when(anchorageApprovalService.getHistory(TEST_ID)).thenReturn(Collections.emptyMap());

        ResponseEntity<ApiResponse<Object>> result = controller.getHistory(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(anchorageApprovalService, times(1)).getHistory(TEST_ID);
    }

    @Test
    void testGetAllHistory() {
        when(anchorageApprovalService.getAllHistory()).thenReturn(Collections.emptyMap());

        ResponseEntity<ApiResponse<Object>> result = controller.getAllHistory();

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(anchorageApprovalService, times(1)).getAllHistory();
    }

    @Test
    void testGetChildren() {
        when(mooringWaterAreaRepository.countByAnchorageIdAndDeletedAtIsNull(TEST_ID)).thenReturn(5L);

        ResponseEntity<ApiResponse<Map<String, Long>>> result = controller.getChildren(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(5L, result.getBody().getData().get("mooringWaterAreaCount"));
        verify(mooringWaterAreaRepository, times(1)).countByAnchorageIdAndDeletedAtIsNull(TEST_ID);
    }
}
