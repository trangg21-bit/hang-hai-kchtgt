package com.hanghai.kchtg.radarstation.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.radarstation.dto.RadarStationCreateRequest;
import com.hanghai.kchtg.radarstation.dto.RadarStationResponse;
import com.hanghai.kchtg.radarstation.dto.RadarStationUpdateRequest;
import com.hanghai.kchtg.radarstation.service.RadarStationService;
import com.hanghai.kchtg.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RadarStationControllerTest {

    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private RadarStationService service;

    @InjectMocks
    private RadarStationController controller;

    private RadarStationCreateRequest createRequest;
    private RadarStationResponse response;

    @BeforeEach
    void setUp() {
        createRequest = RadarStationCreateRequest.builder()
                .stationName("Tram ABC")
                .location("Hà Nội")
                .build();

        response = RadarStationResponse.builder()
                .id(TEST_ID)
                .stationName("Tram ABC")
                .location("Hà Nội")
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    @Test
    void testCreate() {
        when(service.create(any(), any(UUID.class))).thenReturn(response);
        ResponseEntity<?> result = controller.create(createRequest, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testGetById() {
        when(service.getById(TEST_ID)).thenReturn(response);
        ResponseEntity<?> result = controller.getById(TEST_ID);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        ApiResponse<RadarStationResponse> apiResp = (ApiResponse<RadarStationResponse>) result.getBody();
        assertNotNull(apiResp);
        assertEquals(TEST_ID, apiResp.getData().getId());
    }

    @Test
    void testFindAll() {
        when(service.findAll(0, 20)).thenReturn(Collections.emptyList());
        ResponseEntity<?> result = controller.findAll(0, 20);
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testUpdate() {
        RadarStationUpdateRequest updateReq = RadarStationUpdateRequest.builder()
                .stationName("Tram XYZ").build();
        when(service.update(eq(TEST_ID), any(), any(UUID.class))).thenReturn(response);
        ResponseEntity<?> result = controller.update(TEST_ID, updateReq, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testDelete() {
        doNothing().when(service).delete(eq(TEST_ID), any(UUID.class));
        ResponseEntity<?> result = controller.delete(TEST_ID, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testSubmitForApproval() {
        when(service.submitForApproval(eq(TEST_ID), any(UUID.class))).thenReturn(response);
        ResponseEntity<?> result = controller.submitForApproval(TEST_ID, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testApproveLevel1() {
        when(service.approveLevel1(eq(TEST_ID), any(UUID.class), any())).thenReturn(response);
        ResponseEntity<?> result = controller.approveLevel1(TEST_ID, "OK", mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testRejectLevel1() {
        when(service.rejectLevel1(eq(TEST_ID), any(UUID.class), eq("Lý do từ chối hợp lệ"))).thenReturn(response);
        ResponseEntity<?> result = controller.rejectLevel1(TEST_ID, "Lý do từ chối hợp lệ", null, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testGetHistory() {
        when(service.getHistory(TEST_ID)).thenReturn(Collections.emptyList());
        ResponseEntity<?> result = controller.getHistory(TEST_ID);
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testSearch() {
        when(service.search(null, null, null, null)).thenReturn(Collections.emptyList());
        ResponseEntity<?> result = controller.search(null, null, null, null);
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testCreate_WithException() {
        when(service.create(any(), any(UUID.class))).thenThrow(new RuntimeException("Lỗi thử nghiệm"));
        ResponseEntity<?> result = controller.create(createRequest, mockAuth());
        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
    }

    private Authentication mockAuth() {
        User principal = new User();
        principal.setId(TEST_USER_ID);

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(principal);
        return auth;
    }
}
