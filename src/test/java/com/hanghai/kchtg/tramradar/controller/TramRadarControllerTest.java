package com.hanghai.kchtg.tramradar.controller;

import com.hanghai.kchtg.tramradar.dto.*;
import com.hanghai.kchtg.tramradar.service.TramRadarService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TramRadarControllerTest {

    @Mock
    private TramRadarService service;

    @InjectMocks
    private TramRadarController controller;

    private TramRadarCreateRequest createRequest;
    private TramRadarResponse response;

    @BeforeEach
    void setUp() {
        createRequest = TramRadarCreateRequest.builder()
                .tenTram("Tram ABC")
                .viTri("Hà Nội")
                .build();

        response = TramRadarResponse.builder()
                .id(1L)
                .tenTram("Tram ABC")
                .viTri("Hà Nội")
                .trangThai("APPROVED")
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
        when(service.getById(1L)).thenReturn(response);
        ResponseEntity<?> result = controller.getById(1L);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(1L, ((TramRadarResponse) result.getBody()).getId());
    }

    @Test
    void testFindAll() {
        when(service.findAll(0, 20)).thenReturn(Collections.emptyList());
        ResponseEntity<?> result = controller.findAll(0, 20);
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testUpdate() {
        TramRadarUpdateRequest updateReq = TramRadarUpdateRequest.builder()
                .tenTram("Tram XYZ").build();
        when(service.update(eq(1L), any(), anyString())).thenReturn(response);
        ResponseEntity<?> result = controller.update(1L, updateReq, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testDelete() {
        doNothing().when(service).delete(eq(1L), anyString());
        ResponseEntity<?> result = controller.delete(1L, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testApproveC1() {
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();
        when(service.approveC1(eq(1L), any(), anyString())).thenReturn(response);
        ResponseEntity<?> result = controller.approveC1(1L, req, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testApproveC2() {
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();
        when(service.approveC2(eq(1L), any(), anyString())).thenReturn(response);
        ResponseEntity<?> result = controller.approveC2(1L, req, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testGetHistory() {
        when(service.getHistory(1L)).thenReturn(Collections.emptyList());
        ResponseEntity<?> result = controller.getHistory(1L);
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testSearch() {
        when(service.search(null, null, null)).thenReturn(Collections.emptyList());
        ResponseEntity<?> result = controller.search(null, null, null);
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
