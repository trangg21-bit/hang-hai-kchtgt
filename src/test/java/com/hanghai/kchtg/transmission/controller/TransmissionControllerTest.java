package com.hanghai.kchtg.transmission.controller;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.transmission.dto.ApprovalRequest;
import com.hanghai.kchtg.transmission.dto.TransmissionResponse;
import com.hanghai.kchtg.transmission.service.TransmissionApprovalService;
import com.hanghai.kchtg.transmission.service.TransmissionService;
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

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TransmissionControllerTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private TransmissionService transmissionService;
    @Mock
    private TransmissionApprovalService transmissionApprovalService;

    @InjectMocks
    private TransmissionController controller;

    private TransmissionResponse response;

    @BeforeEach
    void setUp() {
        response = TransmissionResponse.builder()
                .id(TEST_ID)
                .deviceCode("TRD-000001")
                .approvalStatus(ApprovalStatus.APPROVED_LEVEL1)
                .build();
    }

    @Test
    void testSubmit() {
        when(transmissionApprovalService.submit(eq(TEST_ID), any(), any())).thenReturn(response);
        ResponseEntity<?> result = controller.submit(TEST_ID, null);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(transmissionApprovalService).submit(eq(TEST_ID), any(), any());
    }

    @Test
    void testApproveC1() {
        ApprovalRequest request = ApprovalRequest.builder()
                .decision("APPROVED")
                .reason("Đồng ý")
                .build();
        when(transmissionApprovalService.approveC1(eq(TEST_ID), any(), any())).thenReturn(response);

        ResponseEntity<?> result = controller.approveC1(TEST_ID, request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(transmissionApprovalService).approveC1(eq(TEST_ID), eq(request), any());
    }

    @Test
    void testApproveC2() {
        ApprovalRequest request = ApprovalRequest.builder()
                .decision("REJECTED")
                .reason("Thiếu hồ sơ kỹ thuật")
                .build();
        when(transmissionApprovalService.approveC2(eq(TEST_ID), any(), any())).thenReturn(response);

        ResponseEntity<?> result = controller.approveC2(TEST_ID, request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(transmissionApprovalService).approveC2(eq(TEST_ID), eq(request), any());
    }

    @Test
    void testGetHistory() {
        when(transmissionApprovalService.getHistory(eq(TEST_ID), any(), any(), any(), any(String.class), any(String.class)))
                .thenReturn(List.of());
        ResponseEntity<?> result = controller.getHistory(TEST_ID, 0, 10, "keyword", "2026-06-01", "2026-06-30");
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(transmissionApprovalService).getHistory(eq(TEST_ID), eq(0), eq(10), eq("keyword"), eq("2026-06-01"), eq("2026-06-30"));
    }
}
