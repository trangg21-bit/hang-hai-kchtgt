package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.dto.transferarea.ApproveRequest;
import com.hanghai.kchtg.port.dto.transferarea.CreateTransferAreaRequest;
import com.hanghai.kchtg.port.dto.transferarea.RejectRequest;
import com.hanghai.kchtg.port.dto.transferarea.TransferAreaResponse;
import com.hanghai.kchtg.port.dto.transferarea.UpdateTransferAreaRequest;
import com.hanghai.kchtg.port.repository.TransferAreaMooringWaterAreaRepository;
import com.hanghai.kchtg.port.service.TransferAreaApprovalService;
import com.hanghai.kchtg.port.service.TransferAreaService;
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
class TransferAreaControllerTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID PORT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private TransferAreaService transferAreaService;

    @Mock
    private TransferAreaApprovalService transferAreaApprovalService;

    @Mock
    private TransferAreaMooringWaterAreaRepository transferAreaMooringWaterAreaRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private TransferAreaController controller;

    private TransferAreaResponse response;

    @BeforeEach
    void setUp() {
        response = TransferAreaResponse.builder()
                .id(TEST_ID)
                .transferAreaCode("KCT-001")
                .transferAreaName("Khu chuyển tải Hòn Gai")
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    @Test
    void testCreate() {
        CreateTransferAreaRequest request = new CreateTransferAreaRequest();
        request.setTransferAreaName("Khu chuyển tải Hòn Gai");
        when(transferAreaService.create(any(CreateTransferAreaRequest.class))).thenReturn(response);

        ResponseEntity<ApiResponse<TransferAreaResponse>> result = controller.create(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("KCT-001", result.getBody().getData().getTransferAreaCode());
        verify(transferAreaService, times(1)).create(request);
    }

    @Test
    void testGenerateCode() {
        when(transferAreaService.generateTransferAreaCode(PORT_ID)).thenReturn("KCT-001");

        ResponseEntity<ApiResponse<Map<String, String>>> result = controller.generateCode(PORT_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("KCT-001", result.getBody().getData().get("transferAreaCode"));
    }

    @Test
    void testGetById() {
        when(transferAreaService.getById(TEST_ID)).thenReturn(response);

        ResponseEntity<ApiResponse<TransferAreaResponse>> result = controller.getById(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(TEST_ID, result.getBody().getData().getId());
    }

    @Test
    void testFindAll() {
        Page<TransferAreaResponse> page = new PageImpl<>(List.of(response));
        when(transferAreaService.findAll(anyInt(), anyInt(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(page);

        ResponseEntity<ApiResponse<Page<TransferAreaResponse>>> result = controller.findAll(
                0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(1, result.getBody().getData().getTotalElements());
    }

    @Test
    void testUpdate() {
        UpdateTransferAreaRequest request = new UpdateTransferAreaRequest();
        request.setId(TEST_ID);
        when(transferAreaService.update(any(UpdateTransferAreaRequest.class))).thenReturn(response);

        ResponseEntity<ApiResponse<TransferAreaResponse>> result = controller.update(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testSoftDelete() {
        doNothing().when(transferAreaService).softDelete(TEST_ID);

        ResponseEntity<ApiResponse<Void>> result = controller.softDelete(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(transferAreaService, times(1)).softDelete(TEST_ID);
    }

    @Test
    void testSubmit() {
        when(authentication.getName()).thenReturn("testuser");
        doNothing().when(transferAreaApprovalService).submit(eq(TEST_ID), any(), any());

        ResponseEntity<ApiResponse<Void>> result = controller.submit(TEST_ID, "Gửi phê duyệt", authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(transferAreaApprovalService, times(1)).submit(eq(TEST_ID), eq("Gửi phê duyệt"), any());
    }

    @Test
    void testApproveC1() {
        when(authentication.getName()).thenReturn("cangvu_user");
        doNothing().when(transferAreaApprovalService).approve(TEST_ID, "cangvu_user", "CANG_VU", "Duyệt C1");

        ResponseEntity<ApiResponse<Void>> result = controller.approveC1(TEST_ID, "Duyệt C1", authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(transferAreaApprovalService, times(1)).approve(TEST_ID, "cangvu_user", "CANG_VU", "Duyệt C1");
    }

    @Test
    void testApproveC2() {
        when(authentication.getName()).thenReturn("cuc_user");
        doNothing().when(transferAreaApprovalService).approve(TEST_ID, "cuc_user", "CUC", "Duyệt C2");

        ResponseEntity<ApiResponse<Void>> result = controller.approveC2(TEST_ID, "Duyệt C2", authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(transferAreaApprovalService, times(1)).approve(TEST_ID, "cuc_user", "CUC", "Duyệt C2");
    }

    @Test
    void testRejectC1() {
        when(authentication.getName()).thenReturn("cangvu_user");
        doNothing().when(transferAreaApprovalService).reject(TEST_ID, "cangvu_user", "CANG_VU", "Từ chối C1");

        ResponseEntity<ApiResponse<Void>> result = controller.rejectC1(TEST_ID, "Từ chối C1", authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(transferAreaApprovalService, times(1)).reject(TEST_ID, "cangvu_user", "CANG_VU", "Từ chối C1");
    }

    @Test
    void testRejectC2() {
        when(authentication.getName()).thenReturn("cuc_user");
        doNothing().when(transferAreaApprovalService).reject(TEST_ID, "cuc_user", "CUC", "Từ chối C2");

        ResponseEntity<ApiResponse<Void>> result = controller.rejectC2(TEST_ID, "Từ chối C2", authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(transferAreaApprovalService, times(1)).reject(TEST_ID, "cuc_user", "CUC", "Từ chối C2");
    }

    @Test
    void testApproveGeneric() {
        when(authentication.getName()).thenReturn("testuser");
        doNothing().when(transferAreaApprovalService).approve(TEST_ID, "testuser", "CANG_VU", "Duyệt generic");

        ApproveRequest req = new ApproveRequest();
        req.setCap("CANG_VU");
        req.setContent("Duyệt generic");
        ResponseEntity<ApiResponse<Void>> result = controller.approve(TEST_ID, req, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(transferAreaApprovalService, times(1)).approve(TEST_ID, "testuser", "CANG_VU", "Duyệt generic");
    }

    @Test
    void testRejectGeneric() {
        when(authentication.getName()).thenReturn("testuser");
        doNothing().when(transferAreaApprovalService).reject(TEST_ID, "testuser", "CANG_VU", "Từ chối generic");

        RejectRequest req = new RejectRequest();
        req.setCap("CANG_VU");
        req.setLyDo("Từ chối generic");
        ResponseEntity<ApiResponse<Void>> result = controller.reject(TEST_ID, req, null, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(transferAreaApprovalService, times(1)).reject(TEST_ID, "testuser", "CANG_VU", "Từ chối generic");
    }

    @Test
    void testGetHistory() {
        when(transferAreaApprovalService.getHistory(TEST_ID)).thenReturn(Collections.emptyMap());

        ResponseEntity<ApiResponse<Object>> result = controller.getHistory(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(transferAreaApprovalService, times(1)).getHistory(TEST_ID);
    }

    @Test
    void testGetAllHistory() {
        when(transferAreaApprovalService.getAllHistory()).thenReturn(Collections.emptyMap());

        ResponseEntity<ApiResponse<Object>> result = controller.getAllHistory();

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(transferAreaApprovalService, times(1)).getAllHistory();
    }

    @Test
    void testGetChildren() {
        when(transferAreaMooringWaterAreaRepository.countByTransferAreaIdAndDeletedAtIsNull(TEST_ID)).thenReturn(3L);

        ResponseEntity<ApiResponse<Map<String, Long>>> result = controller.getChildren(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(3L, result.getBody().getData().get("mooringWaterAreaCount"));
        verify(transferAreaMooringWaterAreaRepository, times(1)).countByTransferAreaIdAndDeletedAtIsNull(TEST_ID);
    }
}
