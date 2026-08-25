package com.hanghai.kchtg.dikerevetment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.dikerevetment.controller.DikeRevetmentController;
import com.hanghai.kchtg.dikerevetment.dto.ApprovalRequest;
import com.hanghai.kchtg.dikerevetment.dto.ApprovalResponse;
import com.hanghai.kchtg.dikerevetment.dto.DikeRevetmentCreateRequest;
import com.hanghai.kchtg.dikerevetment.dto.DikeRevetmentResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.dikerevetment.service.DikeRevetmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DikeRevetmentControllerTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private DikeRevetmentController controller;
    private DikeRevetmentService service;
    private ObjectMapper objectMapper;
    private Authentication authentication;

    private DikeRevetmentResponse testResp;
    private DikeRevetmentCreateRequest createReq;

    @BeforeEach void setUp() {
        service = mock(DikeRevetmentService.class);
        controller = new DikeRevetmentController(service);
        objectMapper = new ObjectMapper();
        authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("testuser");

        testResp = DikeRevetmentResponse.builder()
                .id(TEST_ID)
                .dikeRevetmentType(DikeRevetmentType.RIVER_DIKE)
                .location("Bac Giang")
                .length(150.5)
                .crestElevation(10.0)
                .height(5.0)
                .surfaceMaterial("Betong")
                .status("Tot")
                .approvalStatus(ApprovalStatus.PROPOSED)
                .isApprovedLevel1(false)
                .isApprovedLevel2(false)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        createReq = DikeRevetmentCreateRequest.builder()
                .dikeRevetmentType(DikeRevetmentType.SAND_DIKE)
                .location("Ha Noi")
                .length(200.0)
                .crestElevation(20.0)
                .height(8.0)
                .surfaceMaterial("Thep")
                .status("Tot")
                .build();
    }

    @Test void create_shouldReturnSuccessResponse() {
        when(service.create(any(), nullable(java.util.UUID.class))).thenReturn(testResp);
        var resp = controller.create(createReq, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().isSuccess()).isTrue();
        assertThat(resp.getBody().getMessage()).isEqualTo("Tạo đê kè thành công");
        verify(service, times(1)).create(any(), nullable(java.util.UUID.class));
    }

    @Test void getById_shouldReturnResponse() {
        when(service.getById(TEST_ID)).thenReturn(testResp);
        var resp = controller.getById(TEST_ID);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).getById(TEST_ID);
    }

    @Test void softDelete_shouldReturnOk() {
        doNothing().when(service).softDelete(TEST_ID);
        var resp = controller.softDelete(TEST_ID);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().isSuccess()).isTrue();
        assertThat(resp.getBody().getMessage()).isEqualTo("Xóa mềm đê kè thành công");
        verify(service, times(1)).softDelete(TEST_ID);
    }

    @Test void approveC1_shouldReturnPendingApproval() {
        ApprovalResponse resp = ApprovalResponse.builder()
                .id(TEST_ID.toString())
                .dikeRevetmentId(TEST_ID)
                .approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1)
                .status(ApprovalStatus.PENDING_APPROVAL.name())
                .approver("Truong Phong")
                .build();
        when(service.approveC1(eq(TEST_ID), any(), nullable(java.util.UUID.class))).thenReturn(resp);
        var ctrlResp = controller.approveC1(TEST_ID, ApprovalRequest.builder()
                .decision(ApprovalStatus.APPROVED.name()).reason("Phe cap 1").build(), null);
        assertThat(ctrlResp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(ctrlResp.getBody().getData().getStatus()).isEqualTo(ApprovalStatus.PENDING_APPROVAL.name());
    }

    @Test void approveC2_shouldReturnApproved() {
        ApprovalResponse resp = ApprovalResponse.builder()
                .id(TEST_ID.toString())
                .dikeRevetmentId(TEST_ID)
                .approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_2)
                .status(ApprovalStatus.APPROVED.name())
                .approver("Giam Doc")
                .build();
        when(service.approveC2(eq(TEST_ID), any(), nullable(java.util.UUID.class))).thenReturn(resp);
        var ctrlResp = controller.approveC2(TEST_ID, ApprovalRequest.builder()
                .decision(ApprovalStatus.APPROVED.name()).reason("Phe cap 2").build(), null);
        assertThat(ctrlResp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(ctrlResp.getBody().getData().getStatus()).isEqualTo(ApprovalStatus.APPROVED.name());
    }
}

