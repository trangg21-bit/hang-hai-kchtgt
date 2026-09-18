package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.dto.shiprepairyard.ApproveRequest;
import com.hanghai.kchtg.port.dto.shiprepairyard.CreateShipRepairYardRequest;
import com.hanghai.kchtg.port.dto.shiprepairyard.RejectRequest;
import com.hanghai.kchtg.port.dto.shiprepairyard.ShipRepairYardResponse;
import com.hanghai.kchtg.port.dto.shiprepairyard.UpdateShipRepairYardRequest;
import com.hanghai.kchtg.port.service.ShipRepairYardApprovalService;
import com.hanghai.kchtg.port.service.ShipRepairYardService;
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
class ShipRepairYardControllerTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID PORT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private ShipRepairYardService shipRepairYardService;

    @Mock
    private ShipRepairYardApprovalService shipRepairYardApprovalService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ShipRepairYardController controller;

    private ShipRepairYardResponse response;

    @BeforeEach
    void setUp() {
        response = ShipRepairYardResponse.builder()
                .id(TEST_ID)
                .shipRepairYardCode("SCDT-001")
                .shipRepairYardName("Xưởng sửa chữa tàu Hải Phòng")
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    @Test
    void testCreate() {
        CreateShipRepairYardRequest request = new CreateShipRepairYardRequest();
        request.setShipRepairYardName("Xưởng sửa chữa tàu Hải Phòng");
        when(shipRepairYardService.create(any(CreateShipRepairYardRequest.class))).thenReturn(response);

        ResponseEntity<ApiResponse<ShipRepairYardResponse>> result = controller.create(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("SCDT-001", result.getBody().getData().getShipRepairYardCode());
        verify(shipRepairYardService, times(1)).create(request);
    }

    @Test
    void testGenerateCode() {
        when(shipRepairYardService.generateShipRepairYardCode(PORT_ID)).thenReturn("SCDT-001");

        ResponseEntity<ApiResponse<Map<String, String>>> result = controller.generateCode(PORT_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("SCDT-001", result.getBody().getData().get("shipRepairYardCode"));
    }

    @Test
    void testGetById() {
        when(shipRepairYardService.getById(TEST_ID)).thenReturn(response);

        ResponseEntity<ApiResponse<ShipRepairYardResponse>> result = controller.getById(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(TEST_ID, result.getBody().getData().getId());
    }

    @Test
    void testFindAll() {
        Page<ShipRepairYardResponse> page = new PageImpl<>(List.of(response));
        when(shipRepairYardService.findAll(anyInt(), anyInt(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(page);

        ResponseEntity<ApiResponse<Page<ShipRepairYardResponse>>> result = controller.findAll(
                0, 20, null, null, null, null, null, null, null, null, null, null, null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(1, result.getBody().getData().getTotalElements());
    }

    @Test
    void testUpdate() {
        UpdateShipRepairYardRequest request = new UpdateShipRepairYardRequest();
        request.setId(TEST_ID);
        when(shipRepairYardService.update(any(UpdateShipRepairYardRequest.class))).thenReturn(response);

        ResponseEntity<ApiResponse<ShipRepairYardResponse>> result = controller.update(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testSoftDelete() {
        doNothing().when(shipRepairYardService).softDelete(TEST_ID);

        ResponseEntity<ApiResponse<Void>> result = controller.softDelete(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(shipRepairYardService, times(1)).softDelete(TEST_ID);
    }

    @Test
    void testSubmit() {
        when(authentication.getName()).thenReturn("testuser");
        doNothing().when(shipRepairYardApprovalService).submit(eq(TEST_ID), any(), any());

        ResponseEntity<ApiResponse<Void>> result = controller.submit(TEST_ID, Map.of("content", "Gửi phê duyệt"), authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(shipRepairYardApprovalService, times(1)).submit(eq(TEST_ID), eq("Gửi phê duyệt"), any());
    }

    @Test
    void testApproveC1() {
        when(authentication.getName()).thenReturn("cangvu_user");
        doNothing().when(shipRepairYardApprovalService).approve(TEST_ID, "cangvu_user", "CANG_VU", "Duyệt C1");

        ApproveRequest req = new ApproveRequest();
        req.setContent("Duyệt C1");
        ResponseEntity<ApiResponse<Void>> result = controller.approveC1(TEST_ID, req, null, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(shipRepairYardApprovalService, times(1)).approve(TEST_ID, "cangvu_user", "CANG_VU", "Duyệt C1");
    }

    @Test
    void testApproveC2() {
        when(authentication.getName()).thenReturn("cuc_user");
        doNothing().when(shipRepairYardApprovalService).approve(TEST_ID, "cuc_user", "CUC", "Duyệt C2");

        ApproveRequest req = new ApproveRequest();
        req.setContent("Duyệt C2");
        ResponseEntity<ApiResponse<Void>> result = controller.approveC2(TEST_ID, req, null, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(shipRepairYardApprovalService, times(1)).approve(TEST_ID, "cuc_user", "CUC", "Duyệt C2");
    }

    @Test
    void testRejectC1() {
        when(authentication.getName()).thenReturn("cangvu_user");
        doNothing().when(shipRepairYardApprovalService).reject(TEST_ID, "cangvu_user", "CANG_VU", "Từ chối C1");

        RejectRequest req = new RejectRequest();
        req.setLyDo("Từ chối C1");
        ResponseEntity<ApiResponse<Void>> result = controller.rejectC1(TEST_ID, req, null, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(shipRepairYardApprovalService, times(1)).reject(TEST_ID, "cangvu_user", "CANG_VU", "Từ chối C1");
    }

    @Test
    void testRejectC2() {
        when(authentication.getName()).thenReturn("cuc_user");
        doNothing().when(shipRepairYardApprovalService).reject(TEST_ID, "cuc_user", "CUC", "Từ chối C2");

        RejectRequest req = new RejectRequest();
        req.setLyDo("Từ chối C2");
        ResponseEntity<ApiResponse<Void>> result = controller.rejectC2(TEST_ID, req, null, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(shipRepairYardApprovalService, times(1)).reject(TEST_ID, "cuc_user", "CUC", "Từ chối C2");
    }

    @Test
    void testApproveGeneric() {
        when(authentication.getName()).thenReturn("testuser");
        doNothing().when(shipRepairYardApprovalService).approve(TEST_ID, "testuser", "CANG_VU", "Duyệt generic");

        ApproveRequest req = new ApproveRequest();
        req.setCap("CANG_VU");
        req.setContent("Duyệt generic");
        ResponseEntity<ApiResponse<Void>> result = controller.approve(TEST_ID, req, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(shipRepairYardApprovalService, times(1)).approve(TEST_ID, "testuser", "CANG_VU", "Duyệt generic");
    }

    @Test
    void testRejectGeneric() {
        when(authentication.getName()).thenReturn("testuser");
        doNothing().when(shipRepairYardApprovalService).reject(TEST_ID, "testuser", "CANG_VU", "Từ chối generic");

        RejectRequest req = new RejectRequest();
        req.setCap("CANG_VU");
        req.setLyDo("Từ chối generic");
        ResponseEntity<ApiResponse<Void>> result = controller.reject(TEST_ID, req, null, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(shipRepairYardApprovalService, times(1)).reject(TEST_ID, "testuser", "CANG_VU", "Từ chối generic");
    }

    @Test
    void testGetHistory() {
        when(shipRepairYardApprovalService.getHistory(TEST_ID)).thenReturn(Collections.emptyMap());

        ResponseEntity<ApiResponse<Object>> result = controller.getHistory(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(shipRepairYardApprovalService, times(1)).getHistory(TEST_ID);
    }

    @Test
    void testGetAllHistory() {
        when(shipRepairYardApprovalService.getAllHistory()).thenReturn(Collections.emptyMap());

        ResponseEntity<ApiResponse<Object>> result = controller.getAllHistory();

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(shipRepairYardApprovalService, times(1)).getAllHistory();
    }
}
