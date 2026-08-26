package com.hanghai.kchtg.dikerevetment;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.dikerevetment.controller.DikeRevetmentController;
import com.hanghai.kchtg.dikerevetment.dto.DikeRevetmentCreateRequest;
import com.hanghai.kchtg.dikerevetment.dto.DikeRevetmentResponse;
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
    private Authentication authentication;

    private DikeRevetmentResponse testResp;
    private DikeRevetmentCreateRequest createReq;

    @BeforeEach
    void setUp() {
        service = mock(DikeRevetmentService.class);
        controller = new DikeRevetmentController(service);
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
                .status("1")
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        createReq = DikeRevetmentCreateRequest.builder()
                .dikeRevetmentType(DikeRevetmentType.SAND_DIKE)
                .location("Ha Noi")
                .length(200.0)
                .crestElevation(20.0)
                .height(8.0)
                .surfaceMaterial("Thep")
                .status("1")
                .build();
    }

    @Test
    void create_shouldReturnSuccessResponse() {
        when(service.create(any(), nullable(UUID.class))).thenReturn(testResp);
        var resp = controller.create(createReq, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().isSuccess()).isTrue();
        assertThat(resp.getBody().getMessage()).isEqualTo("Tạo đê kè thành công");
        verify(service, times(1)).create(any(), nullable(UUID.class));
    }

    @Test
    void getById_shouldReturnResponse() {
        when(service.getById(TEST_ID)).thenReturn(testResp);
        var resp = controller.getById(TEST_ID);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).getById(TEST_ID);
    }

    @Test
    void delete_shouldReturnOk() {
        doNothing().when(service).delete(eq(TEST_ID), any());
        var resp = controller.delete(TEST_ID, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().isSuccess()).isTrue();
        assertThat(resp.getBody().getMessage()).isEqualTo("Xóa đê kè thành công");
        verify(service, times(1)).delete(eq(TEST_ID), any());
    }

    @Test
    void approveC1_shouldReturnSuccess() {
        when(service.approveLevel1(eq(TEST_ID), nullable(UUID.class), any())).thenReturn(testResp);
        var resp = controller.approveC1(TEST_ID, "Duyệt C1", null, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).approveLevel1(eq(TEST_ID), nullable(UUID.class), eq("Duyệt C1"));
    }

    @Test
    void approveC2_shouldReturnSuccess() {
        when(service.approveLevel2(eq(TEST_ID), nullable(UUID.class), any())).thenReturn(testResp);
        var resp = controller.approveC2(TEST_ID, "Duyệt C2", null, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).approveLevel2(eq(TEST_ID), nullable(UUID.class), eq("Duyệt C2"));
    }

    @Test
    void rejectC1_shouldReturnSuccess() {
        when(service.rejectLevel1(eq(TEST_ID), nullable(UUID.class), any())).thenReturn(testResp);
        var resp = controller.rejectC1(TEST_ID, "Từ chối C1", null, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).rejectLevel1(eq(TEST_ID), nullable(UUID.class), eq("Từ chối C1"));
    }

    @Test
    void rejectC2_shouldReturnSuccess() {
        when(service.rejectLevel2(eq(TEST_ID), nullable(UUID.class), any())).thenReturn(testResp);
        var resp = controller.rejectC2(TEST_ID, "Từ chối C2", null, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).rejectLevel2(eq(TEST_ID), nullable(UUID.class), eq("Từ chối C2"));
    }
}
