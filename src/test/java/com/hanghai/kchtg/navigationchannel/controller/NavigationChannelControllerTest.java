package com.hanghai.kchtg.navigationchannel.controller;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.navigationchannel.dto.ApprovalRequest;
import com.hanghai.kchtg.navigationchannel.dto.ApprovalResponse;
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelCreateRequest;
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelResponse;
import com.hanghai.kchtg.navigationchannel.service.NavigationChannelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử controller Luồng hàng hải.
 *
 * <p>Đã cập nhật theo API bản F-039..F-043: {@code delete} → {@code softDelete},
 * {@code approveLevel1/2} → {@code approveC1/C2} nhận {@link ApprovalRequest},
 * và trường {@code status} (int) được thay bằng {@code conditionStatus} (enum).</p>
 */
class NavigationChannelControllerTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private NavigationChannelController controller;
    private NavigationChannelService service;
    private Authentication authentication;

    private NavigationChannelResponse testResp;
    private NavigationChannelCreateRequest createReq;
    private ApprovalResponse approvalResp;

    @BeforeEach
    void setUp() {
        service = mock(NavigationChannelService.class);
        controller = new NavigationChannelController(service);
        authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("testuser");

        testResp = NavigationChannelResponse.builder()
                .id(TEST_ID)
                .channelName("Luong Hon Gai - Cai Lan")
                .channelCode("NC-000001")
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .build();

        createReq = NavigationChannelCreateRequest.builder()
                .channelName("Luong Hon Gai - Cai Lan")
                .build();

        approvalResp = ApprovalResponse.builder().navigationChannelId(TEST_ID).build();
    }

    @Test
    void create_shouldReturnSuccessResponse() {
        when(service.create(any(), nullable(UUID.class))).thenReturn(testResp);
        var resp = controller.create(createReq, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().isSuccess()).isTrue();
        assertThat(resp.getBody().getMessage()).isEqualTo("Tạo luồng hàng hải thành công");
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
    void softDelete_shouldReturnOk() {
        doNothing().when(service).softDelete(eq(TEST_ID), nullable(UUID.class));
        var resp = controller.softDelete(TEST_ID, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody().isSuccess()).isTrue();
        assertThat(resp.getBody().getMessage()).isEqualTo("Xóa mềm luồng hàng hải thành công");
        verify(service, times(1)).softDelete(eq(TEST_ID), nullable(UUID.class));
    }

    @Test
    void submitApproval_shouldReturnSuccess() {
        when(service.submit(eq(TEST_ID), nullable(UUID.class))).thenReturn(testResp);
        var resp = controller.submitApproval(TEST_ID, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).submit(eq(TEST_ID), nullable(UUID.class));
    }

    @Test
    void approveC1_shouldReturnSuccess() {
        ApprovalRequest req = ApprovalRequest.builder().status("APPROVED").reason("Duyệt C1").build();
        when(service.approveC1(eq(TEST_ID), any(), nullable(UUID.class))).thenReturn(approvalResp);
        var resp = controller.approveC1(TEST_ID, req, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).approveC1(eq(TEST_ID), eq(req), nullable(UUID.class));
    }

    @Test
    void approveC2_shouldReturnSuccess() {
        ApprovalRequest req = ApprovalRequest.builder().status("APPROVED").reason("Duyệt C2").build();
        when(service.approveC2(eq(TEST_ID), any(), nullable(UUID.class))).thenReturn(approvalResp);
        var resp = controller.approveC2(TEST_ID, req, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).approveC2(eq(TEST_ID), eq(req), nullable(UUID.class));
    }

    @Test
    void rejectLevel1_shouldReturnSuccess() {
        ApprovalRequest req = ApprovalRequest.builder().status("REJECTED").reason("Từ chối C1").build();
        when(service.rejectLevel1(eq(TEST_ID), any(), nullable(UUID.class))).thenReturn(approvalResp);
        var resp = controller.rejectLevel1(TEST_ID, req, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).rejectLevel1(eq(TEST_ID), eq(req), nullable(UUID.class));
    }

    @Test
    void rejectLevel2_shouldReturnSuccess() {
        ApprovalRequest req = ApprovalRequest.builder().status("REJECTED").reason("Từ chối C2").build();
        when(service.rejectLevel2(eq(TEST_ID), any(), nullable(UUID.class))).thenReturn(approvalResp);
        var resp = controller.rejectLevel2(TEST_ID, req, authentication);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        verify(service, times(1)).rejectLevel2(eq(TEST_ID), eq(req), nullable(UUID.class));
    }
}
