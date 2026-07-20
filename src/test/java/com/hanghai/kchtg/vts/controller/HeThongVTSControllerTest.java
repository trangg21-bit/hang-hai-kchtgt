package com.hanghai.kchtg.vts.controller;

import com.hanghai.kchtg.vts.dto.*;
import com.hanghai.kchtg.vts.service.HeThongVTSDataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class HeThongVTSControllerTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private HeThongVTSDataService service;

    @InjectMocks
    private HeThongVTSController controller;

    private HeThongVTSCreateRequest createRequest;
    private HeThongVTSResponse response;

    @BeforeEach
    void setUp() {
        createRequest = HeThongVTSCreateRequest.builder()
                .tenHeThong("VTS ABC")
                .viTri("Hà Nội")
                .build();

        response = HeThongVTSResponse.builder()
                .id(TEST_ID)
                .tenHeThong("VTS ABC")
                .viTri("Hà Nội")
                .trangThai(com.hanghai.kchtg.vts.entity.HeThongVTSApprovalStatus.APPROVED)
                .build();
    }

    @Test
    void testCreate() {
        when(service.create(any(), anyString())).thenReturn(response);
        ResponseEntity<?> result = controller.create(createRequest, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testGetById() {
        when(service.getById(TEST_ID)).thenReturn(response);
        ResponseEntity<?> result = controller.getById(TEST_ID, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        HeThongVTSResponse body = ((ApiResponse<HeThongVTSResponse>) result.getBody()).getData();
        assertEquals(TEST_ID, body.getId());
    }

    @Test
    void testFindAll() {
        when(service.findAllWithSearch(null, null, null, null, 0, 20)).thenReturn(org.springframework.data.domain.Page.empty());
        ResponseEntity<?> result = controller.findAll(null, null, null, null, 0, 20);
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testUpdate() {
        HeThongVTSUpdateRequest updateReq = HeThongVTSUpdateRequest.builder()
                .tenHeThong("VTS XYZ").build();
        when(service.update(eq(TEST_ID), any(), anyString())).thenReturn(response);
        ResponseEntity<?> result = controller.update(TEST_ID, updateReq, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testDelete() {
        doNothing().when(service).delete(eq(TEST_ID), anyString());
        ResponseEntity<?> result = controller.delete(TEST_ID, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testApproveC1() {
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();
        when(service.approveC1(eq(TEST_ID), any(), anyString())).thenReturn(response);
        ResponseEntity<?> result = controller.approveC1(TEST_ID, req, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testApproveC2() {
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();
        when(service.approveC2(eq(TEST_ID), any(), anyString())).thenReturn(response);
        ResponseEntity<?> result = controller.approveC2(TEST_ID, req, mockAuth());
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
        when(service.create(any(), anyString())).thenThrow(new RuntimeException("Test error"));
        ResponseEntity<?> result = controller.create(createRequest, mockAuth());
        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
    }

    private Authentication mockAuth() {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("testuser");
        return auth;
    }
}
