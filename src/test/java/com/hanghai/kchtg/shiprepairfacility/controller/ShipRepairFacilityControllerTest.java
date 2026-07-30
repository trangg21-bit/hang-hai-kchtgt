package com.hanghai.kchtg.shiprepairfacility.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.shiprepairfacility.dto.*;
import com.hanghai.kchtg.shiprepairfacility.entity.FacilityType;
import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairApprovalStatus;
import com.hanghai.kchtg.shiprepairfacility.service.ShipRepairFacilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShipRepairFacilityControllerTest {

    private static final java.util.UUID TEST_USER_ID = java.util.UUID.fromString("00000000-0000-0000-0000-000000000001");

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TEST_ID_2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private ShipRepairFacilityService service;

    @InjectMocks
    private ShipRepairFacilityController controller;

    private ShipRepairFacilityCreateRequest createRequest;
    private ShipRepairFacilityResponse response;

    @BeforeEach
    void setUp() {
        createRequest = ShipRepairFacilityCreateRequest.builder()
                .facilityName("Cơ sở ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .build();

        response = ShipRepairFacilityResponse.builder()
                .id(TEST_ID)
                .facilityName("Cơ sở ABC")
                .address("Hà Nội")
                .provinceId(1)
                .facilityType(FacilityType.REPAIR)
                .approvalStatus(ShipRepairApprovalStatus.APPROVED)
                .approvedLevel1(true)
                .approvedLevel2(true)
                .isDeleted(false)
                .createdBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .createdDate(LocalDateTime.now())
                .build();
    }

    @Test
    void testCreate() {
        when(service.create(any(ShipRepairFacilityCreateRequest.class), any(java.util.UUID.class))).thenReturn(response);

        ResponseEntity<?> result = controller.create(createRequest, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(service, times(1)).create(any(ShipRepairFacilityCreateRequest.class), any(java.util.UUID.class));
    }

    @Test
    void testCreate_WithNullAuth() {
        // No authentication means the controller cannot resolve an actor id.
        when(service.create(any(ShipRepairFacilityCreateRequest.class), isNull())).thenReturn(response);

        ResponseEntity<?> result = controller.create(createRequest, null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testCreate_WithException() {
        when(service.create(any(), any(java.util.UUID.class))).thenThrow(new RuntimeException("Lỗi thử nghiệm"));

        ResponseEntity<?> result = controller.create(createRequest, mockAuth());

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testGetById() {
        when(service.getById(TEST_ID)).thenReturn(response);

        ResponseEntity<?> result = controller.getById(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        ApiResponse<ShipRepairFacilityResponse> apiResp = (ApiResponse<ShipRepairFacilityResponse>) result.getBody();
        assertNotNull(apiResp);
        ShipRepairFacilityResponse body = apiResp.getData();
        assertNotNull(body);
        assertEquals(TEST_ID, body.getId());
    }

    @Test
    void testGetById_NotFound() {
        when(service.getById(TEST_ID_2)).thenThrow(new RuntimeException("Không tìm thấy cơ sở sửa chữa, đóng tàu"));

        ResponseEntity<?> result = controller.getById(TEST_ID_2);

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testFindAll() {
        when(service.findAll(0, 20)).thenReturn(Arrays.asList(response));

        ResponseEntity<?> result = controller.findAll(0, 20);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        ApiResponse<List<ShipRepairFacilityResponse>> apiResp = (ApiResponse<List<ShipRepairFacilityResponse>>) result.getBody();
        assertNotNull(apiResp);
        List<ShipRepairFacilityResponse> bodies = apiResp.getData();
        assertEquals(1, bodies.size());
    }

    @Test
    void testFindAll_Empty() {
        when(service.findAll(0, 20)).thenReturn(Collections.emptyList());

        ResponseEntity<?> result = controller.findAll(0, 20);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        ApiResponse<List<ShipRepairFacilityResponse>> apiRespEmpty = (ApiResponse<List<ShipRepairFacilityResponse>>) result.getBody();
        assertNotNull(apiRespEmpty);
        List<ShipRepairFacilityResponse> bodies = apiRespEmpty.getData();
        assertTrue(bodies.isEmpty());
    }

    @Test
    void testUpdate() {
        ShipRepairFacilityUpdateRequest updateReq = ShipRepairFacilityUpdateRequest.builder()
                .facilityName("Cơ sở XYZ").build();
        when(service.update(eq(TEST_ID), any(ShipRepairFacilityUpdateRequest.class), any(java.util.UUID.class))).thenReturn(response);

        ResponseEntity<?> result = controller.update(TEST_ID, updateReq, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(service, times(1)).update(eq(TEST_ID), any(ShipRepairFacilityUpdateRequest.class), any(java.util.UUID.class));
    }

    @Test
    void testDelete() {
        doNothing().when(service).delete(eq(TEST_ID), any(java.util.UUID.class));

        ResponseEntity<?> result = controller.delete(TEST_ID, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        ApiResponse<Void> delResp = (ApiResponse<Void>) result.getBody();
        assertNotNull(delResp);
        assertTrue(delResp.isSuccess());
        verify(service, times(1)).delete(eq(TEST_ID), any(java.util.UUID.class));
    }

    @Test
    void testDelete_Throws() {
        doThrow(new RuntimeException("Chỉ có thể xóa các bản ghi đã được phê duyệt")).when(service).delete(eq(TEST_ID), any(java.util.UUID.class));

        ResponseEntity<?> result = controller.delete(TEST_ID, mockAuth());

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testApproveC1_Approve() {
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();
        when(service.approveC1(eq(TEST_ID), eq(req), any(java.util.UUID.class))).thenReturn(response);

        ResponseEntity<?> result = controller.approveC1(TEST_ID, req, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(service, times(1)).approveC1(eq(TEST_ID), eq(req), any(java.util.UUID.class));
    }

    @Test
    void testApproveC1_Reject() {
        ApprovalRequest req = ApprovalRequest.builder()
                .quyetDinh("REJECTED")
                .reason("Không đủ điều kiện")
                .build();
        ShipRepairFacilityResponse rejectedResponse = ShipRepairFacilityResponse.builder()
                .id(TEST_ID).approvalStatus(ShipRepairApprovalStatus.REJECTED).rejectionReason("Không đủ điều kiện").build();
        when(service.approveC1(eq(TEST_ID), eq(req), any(java.util.UUID.class))).thenReturn(rejectedResponse);

        ResponseEntity<?> result = controller.approveC1(TEST_ID, req, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testApproveC2_Approve() {
        ApprovalRequest req = ApprovalRequest.builder().quyetDinh("APPROVED").build();
        when(service.approveC2(eq(TEST_ID), eq(req), any(java.util.UUID.class))).thenReturn(response);

        ResponseEntity<?> result = controller.approveC2(TEST_ID, req, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(service, times(1)).approveC2(eq(TEST_ID), eq(req), any(java.util.UUID.class));
    }

    @Test
    void testGetHistory() {
        HistoryEntry entry = HistoryEntry.builder()
                .id(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1).status("APPROVED").approvedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001")).build();
        when(service.getHistory(TEST_ID)).thenReturn(Arrays.asList(entry));

        ResponseEntity<?> result = controller.getHistory(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        ApiResponse<List<HistoryEntry>> apiResp = (ApiResponse<List<HistoryEntry>>) result.getBody();
        assertNotNull(apiResp);
        List<HistoryEntry> bodies = apiResp.getData();
        assertEquals(1, bodies.size());
    }

    @Test
    void testGetHistory_Empty() {
        when(service.getHistory(TEST_ID)).thenReturn(Collections.emptyList());

        ResponseEntity<?> result = controller.getHistory(TEST_ID);

        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testSearch_WithKeyword() {
        when(service.search(null, "ABC", null, null, null)).thenReturn(Arrays.asList(response));

        ResponseEntity<?> result = controller.search(null, "ABC", null, null, null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(service, times(1)).search(null, "ABC", null, null, null);
    }

    @Test
    void testSearch_WithAllParams() {
        when(service.search(null, "ABC", 1, "APPROVED", null)).thenReturn(Collections.emptyList());

        ResponseEntity<?> result = controller.search(null, "ABC", 1, "APPROVED", null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(service, times(1)).search(null, "ABC", 1, "APPROVED", null);
    }

    @Test
    void testSearch_Empty() {
        when(service.search(null, null, null, null, null)).thenReturn(Collections.emptyList());

        ResponseEntity<?> result = controller.search(null, null, null, null, null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    private Authentication mockAuth() {
        // The controller resolves the actor from the principal, so it has to be a
        // real User carrying the id the service stubs expect.
        com.hanghai.kchtg.user.entity.User principal = new com.hanghai.kchtg.user.entity.User();
        principal.setId(TEST_USER_ID);

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(principal);
        return auth;
    }
}
