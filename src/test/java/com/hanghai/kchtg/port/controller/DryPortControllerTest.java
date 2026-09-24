package com.hanghai.kchtg.port.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.dto.dryport.CreateDryPortRequest;
import com.hanghai.kchtg.port.dto.dryport.DryPortResponse;
import com.hanghai.kchtg.port.dto.dryport.UpdateDryPortRequest;
import com.hanghai.kchtg.port.service.DryPortApprovalService;
import com.hanghai.kchtg.port.service.DryPortService;
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
class DryPortControllerTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private DryPortService dryPortService;

    @Mock
    private DryPortApprovalService dryPortApprovalService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private DryPortController controller;

    private DryPortResponse response;

    @BeforeEach
    void setUp() {
        response = DryPortResponse.builder()
                .id(TEST_ID)
                .dryPortCode("ICD-001")
                .dryPortName("Cảng cạn Hà Nội")
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    @Test
    void testCreate() {
        CreateDryPortRequest request = new CreateDryPortRequest();
        request.setDryPortName("Cảng cạn Hà Nội");
        when(dryPortService.create(any(CreateDryPortRequest.class))).thenReturn(response);

        ResponseEntity<ApiResponse<DryPortResponse>> result = controller.create(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("ICD-001", result.getBody().getData().getDryPortCode());
        verify(dryPortService, times(1)).create(request);
    }

    @Test
    void testGenerateCode() {
        when(dryPortService.generateCode()).thenReturn("ICD-001");

        ResponseEntity<ApiResponse<Map<String, String>>> result = controller.generateCode();

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("ICD-001", result.getBody().getData().get("code"));
    }

    @Test
    void testGetById() {
        when(dryPortService.getById(TEST_ID)).thenReturn(response);

        ResponseEntity<ApiResponse<DryPortResponse>> result = controller.getById(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(TEST_ID, result.getBody().getData().getId());
    }

    @Test
    void testFindAll() {
        Page<DryPortResponse> page = new PageImpl<>(List.of(response));
        when(dryPortService.findAll(anyInt(), anyInt(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(page);

        ResponseEntity<ApiResponse<Page<DryPortResponse>>> result = controller.findAll(
                0, 20, null, null, null, null, null, null, null, null, null, null, null, null, null, null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals(1, result.getBody().getData().getTotalElements());
    }

    @Test
    void testUpdate() {
        UpdateDryPortRequest request = new UpdateDryPortRequest();
        request.setId(TEST_ID);
        when(dryPortService.update(any(UpdateDryPortRequest.class))).thenReturn(response);

        ResponseEntity<ApiResponse<DryPortResponse>> result = controller.update(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testSoftDelete() {
        doNothing().when(dryPortService).softDelete(TEST_ID);

        ResponseEntity<ApiResponse<Void>> result = controller.softDelete(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(dryPortService, times(1)).softDelete(TEST_ID);
    }

    @Test
    void testSubmit() {
        when(dryPortService.submit(TEST_ID)).thenReturn(response);

        ResponseEntity<ApiResponse<DryPortResponse>> result = controller.submit(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(dryPortService, times(1)).submit(TEST_ID);
    }

    @Test
    void testApproveC1() {
        doNothing().when(dryPortApprovalService).approveC1(eq(TEST_ID), any(), any());

        ResponseEntity<ApiResponse<Void>> result = controller.approveC1(TEST_ID, "Duyệt C1");

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(dryPortApprovalService, times(1)).approveC1(eq(TEST_ID), eq("Duyệt C1"), any());
    }

    @Test
    void testApproveC2() {
        doNothing().when(dryPortApprovalService).approveC2(eq(TEST_ID), any(), any());

        ResponseEntity<ApiResponse<Void>> result = controller.approveC2(TEST_ID, "Duyệt C2");

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(dryPortApprovalService, times(1)).approveC2(eq(TEST_ID), eq("Duyệt C2"), any());
    }

    @Test
    @SuppressWarnings("deprecation")
    void testApproveGeneric() {
        // SecurityUtils.getCurrentUserId() returns null in unit tests → fallback to authentication.getName()
        when(authentication.getName()).thenReturn("testuser");
        doNothing().when(dryPortApprovalService).approve(eq(TEST_ID), any(), any());

        ResponseEntity<ApiResponse<Void>> result = controller.approve(TEST_ID, authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(dryPortApprovalService, times(1)).approve(eq(TEST_ID), any(), any());
    }

    @Test
    void testReject() {
        doNothing().when(dryPortApprovalService).reject(eq(TEST_ID), any(), isNull());


        ResponseEntity<ApiResponse<Void>> result = controller.reject(TEST_ID, "Lý do từ chối test", authentication);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(dryPortApprovalService, times(1)).reject(eq(TEST_ID), eq("Lý do từ chối test"), any());
    }

    @Test
    void testGetHistory() {
        when(dryPortApprovalService.getHistory(TEST_ID)).thenReturn(Collections.emptyMap());

        ResponseEntity<ApiResponse<Object>> result = controller.getHistory(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(dryPortApprovalService, times(1)).getHistory(TEST_ID);
    }

    @Test
    void testGetAllHistory() {
        when(dryPortApprovalService.getAllHistory()).thenReturn(Collections.emptyMap());

        ResponseEntity<ApiResponse<Object>> result = controller.getAllHistory();

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(dryPortApprovalService, times(1)).getAllHistory();
    }
}
