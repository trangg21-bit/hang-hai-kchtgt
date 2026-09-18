package com.hanghai.kchtg.scada.controller;

import com.hanghai.kchtg.scada.dto.ApprovalRequest;
import com.hanghai.kchtg.scada.dto.ScadaResponse;
import com.hanghai.kchtg.scada.service.ScadaApprovalService;
import com.hanghai.kchtg.scada.service.ScadaService;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ScadaControllerTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private ScadaService scadaService;
    @Mock
    private ScadaApprovalService scadaApprovalService;

    @InjectMocks
    private ScadaController controller;

    private ScadaResponse response;

    @BeforeEach
    void setUp() {
        response = ScadaResponse.builder()
                .id(TEST_ID)
                .deviceCode("SCA-000001")
                .approvalStatus(ApprovalStatus.APPROVED_LEVEL1)
                .build();
    }

    @Test
    void testSubmit() {
        when(scadaApprovalService.submit(eq(TEST_ID), any(), any())).thenReturn(response);
        ResponseEntity<?> result = controller.submit(TEST_ID, null);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(scadaApprovalService).submit(eq(TEST_ID), any(), any());
    }

    @Test
    void testApproveC1() {
        ApprovalRequest request = ApprovalRequest.builder()
                .decision("APPROVED")
                .reason("Đồng ý")
                .build();
        when(scadaApprovalService.approveC1(eq(TEST_ID), any(), any())).thenReturn(response);

        ResponseEntity<?> result = controller.approveC1(TEST_ID, request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(scadaApprovalService).approveC1(eq(TEST_ID), eq(request), any());
    }

    @Test
    void testApproveC2() {
        ApprovalRequest request = ApprovalRequest.builder()
                .decision("APPROVED")
                .reason("Phê duyệt cấp Cục")
                .build();
        when(scadaApprovalService.approveC2(eq(TEST_ID), any(), any())).thenReturn(response);

        ResponseEntity<?> result = controller.approveC2(TEST_ID, request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(scadaApprovalService).approveC2(eq(TEST_ID), eq(request), any());
    }

    @Test
    void testRejectC1() {
        ApprovalRequest request = ApprovalRequest.builder()
                .reason("Cần bổ sung tài liệu kỹ thuật")
                .build();
        when(scadaApprovalService.approveC1(eq(TEST_ID), any(), any())).thenReturn(response);

        ResponseEntity<?> result = controller.rejectC1(TEST_ID, request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("REJECTED", request.getDecision());
        verify(scadaApprovalService).approveC1(eq(TEST_ID), eq(request), any());
    }

    @Test
    void testRejectC2() {
        ApprovalRequest request = ApprovalRequest.builder()
                .reason("Chưa đạt chuẩn kiểm định")
                .build();
        when(scadaApprovalService.approveC2(eq(TEST_ID), any(), any())).thenReturn(response);

        ResponseEntity<?> result = controller.rejectC2(TEST_ID, request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("REJECTED", request.getDecision());
        verify(scadaApprovalService).approveC2(eq(TEST_ID), eq(request), any());
    }

    @Test
    void testGetHistory() {
        ResponseEntity<?> result = controller.getHistory(TEST_ID);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testGenerateCode() {
        when(scadaService.generateScadaCode()).thenReturn("SCA-000047");
        ResponseEntity<?> result = controller.generateCode();
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(scadaService).generateScadaCode();
    }
}
