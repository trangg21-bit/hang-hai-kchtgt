package com.hanghai.kchtg.cosuachua.controller;

import com.hanghai.kchtg.cosuachua.dto.*;
import com.hanghai.kchtg.cosuachua.service.CoSuaChuaDongTauService;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CoSuaChuaDongTauControllerTest {

    @Mock
    private CoSuaChuaDongTauService service;

    @InjectMocks
    private CoSuaChuaDongTauController controller;

    private CoSuaChuaDongTauCreateRequest createRequest;
    private CoSuaChuaDongTauResponse response;

    @BeforeEach
    void setUp() {
        createRequest = CoSuaChuaDongTauCreateRequest.builder()
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .build();

        response = CoSuaChuaDongTauResponse.builder()
                .id(1L)
                .tenCoSo("Cơ sở ABC")
                .diaChi("Hà Nội")
                .tinhThanh("Hà Nội")
                .loaiCoSo("Sửa chữa")
                .trangThai("APPROVED")
                .pheDuyetC1(true)
                .pheDuyetC2(true)
                .isDeleted(false)
                .nguoiTao("user1")
                .ngayTao(LocalDateTime.now())
                .build();
    }

    @Test
    void testCreate() {
        when(service.create(any(CoSuaChuaDongTauCreateRequest.class), anyString())).thenReturn(response);

        ResponseEntity<?> result = controller.create(createRequest, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(service, times(1)).create(any(CoSuaChuaDongTauCreateRequest.class), anyString());
    }

    @Test
    void testCreate_WithNullAuth() {
        when(service.create(any(CoSuaChuaDongTauCreateRequest.class), eq("system"))).thenReturn(response);

        ResponseEntity<?> result = controller.create(createRequest, null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testCreate_WithException() {
        when(service.create(any(), anyString())).thenThrow(new RuntimeException("Test error"));

        ResponseEntity<?> result = controller.create(createRequest, mockAuth());

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertTrue(result.getBody().toString().contains("Lỗi khi tạo"));
    }

    @Test
    void testGetById() {
        when(service.getById(1L)).thenReturn(response);

        ResponseEntity<?> result = controller.getById(1L);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        CoSuaChuaDongTauResponse body = (CoSuaChuaDongTauResponse) result.getBody();
        assertNotNull(body);
        assertEquals(1L, body.getId());
    }

    @Test
    void testGetById_NotFound() {
        when(service.getById(999L)).thenThrow(new RuntimeException("CoSuaChuaDongTau not found: 999"));

        ResponseEntity<?> result = controller.getById(999L);

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertTrue(result.getBody().toString().contains("Không tìm thấy"));
    }

    @Test
    void testFindAll() {
        when(service.findAll(0, 20)).thenReturn(Arrays.asList(response));

        ResponseEntity<?> result = controller.findAll(0, 20);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        List<CoSuaChuaDongTauResponse> bodies = (List<CoSuaChuaDongTauResponse>) result.getBody();
        assertEquals(1, bodies.size());
    }

    @Test
    void testFindAll_Empty() {
        when(service.findAll(0, 20)).thenReturn(Collections.emptyList());

        ResponseEntity<?> result = controller.findAll(0, 20);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        List<CoSuaChuaDongTauResponse> bodies = (List<CoSuaChuaDongTauResponse>) result.getBody();
        assertTrue(bodies.isEmpty());
    }

    @Test
    void testUpdate() {
        CoSuaChuaDongTauUpdateRequest updateReq = CoSuaChuaDongTauUpdateRequest.builder()
                .tenCoSo("Cơ sở XYZ").build();
        when(service.update(eq(1L), any(CoSuaChuaDongTauUpdateRequest.class), anyString())).thenReturn(response);

        ResponseEntity<?> result = controller.update(1L, updateReq, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(service, times(1)).update(eq(1L), any(CoSuaChuaDongTauUpdateRequest.class), anyString());
    }

    @Test
    void testDelete() {
        doNothing().when(service).delete(eq(1L), anyString());

        ResponseEntity<?> result = controller.delete(1L, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertTrue(result.getBody().toString().contains("Đã xóa"));
        verify(service, times(1)).delete(eq(1L), anyString());
    }

    @Test
    void testDelete_Throws() {
        doThrow(new RuntimeException("Can only delete APPROVED records")).when(service).delete(eq(1L), anyString());

        ResponseEntity<?> result = controller.delete(1L, mockAuth());

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertTrue(result.getBody().toString().contains("Lỗi khi xóa"));
    }

    @Test
    void testApproveC1_Approve() {
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();
        when(service.approveC1(eq(1L), eq(req), anyString())).thenReturn(response);

        ResponseEntity<?> result = controller.approveC1(1L, req, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(service, times(1)).approveC1(eq(1L), eq(req), anyString());
    }

    @Test
    void testApproveC1_Reject() {
        PheDuyetRequest req = PheDuyetRequest.builder()
                .quyetDinh("REJECTED")
                .lyDo("Không đủ điều kiện")
                .build();
        CoSuaChuaDongTauResponse rejectedResponse = CoSuaChuaDongTauResponse.builder()
                .id(1L).trangThai("REJECTED").lyDoTuChoi("Không đủ điều kiện").build();
        when(service.approveC1(eq(1L), eq(req), anyString())).thenReturn(rejectedResponse);

        ResponseEntity<?> result = controller.approveC1(1L, req, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testApproveC2_Approve() {
        PheDuyetRequest req = PheDuyetRequest.builder().quyetDinh("APPROVED").build();
        when(service.approveC2(eq(1L), eq(req), anyString())).thenReturn(response);

        ResponseEntity<?> result = controller.approveC2(1L, req, mockAuth());

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(service, times(1)).approveC2(eq(1L), eq(req), anyString());
    }

    @Test
    void testGetHistory() {
        HistoryEntry entry = HistoryEntry.builder()
                .id(1L).capPheDuyet(1).trangThai("APPROVED").nguoiPheDuyet("admin").build();
        when(service.getHistory(1L)).thenReturn(Arrays.asList(entry));

        ResponseEntity<?> result = controller.getHistory(1L);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        List<HistoryEntry> bodies = (List<HistoryEntry>) result.getBody();
        assertEquals(1, bodies.size());
    }

    @Test
    void testGetHistory_Empty() {
        when(service.getHistory(1L)).thenReturn(Collections.emptyList());

        ResponseEntity<?> result = controller.getHistory(1L);

        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testSearch_WithKeyword() {
        when(service.search("ABC", null, null)).thenReturn(Arrays.asList(response));

        ResponseEntity<?> result = controller.search("ABC", null, null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(service, times(1)).search("ABC", null, null);
    }

    @Test
    void testSearch_WithAllParams() {
        when(service.search("ABC", "Hà Nội", "APPROVED")).thenReturn(Collections.emptyList());

        ResponseEntity<?> result = controller.search("ABC", "Hà Nội", "APPROVED");

        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(service, times(1)).search("ABC", "Hà Nội", "APPROVED");
    }

    @Test
    void testSearch_Empty() {
        when(service.search(null, null, null)).thenReturn(Collections.emptyList());

        ResponseEntity<?> result = controller.search(null, null, null);

        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    private Authentication mockAuth() {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("testuser");
        return auth;
    }
}
