package com.hanghai.kchtg.vtssystem.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vtssystem.dto.ApprovalRequest;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemCreateRequest;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemListResponse;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemResponse;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemUpdateRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.service.VtsSystemService;
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
import org.springframework.security.core.Authentication;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VtsSystemControllerTest {

    private static final UUID TEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private VtsSystemService service;

    @InjectMocks
    private VtsSystemController controller;

    private VtsSystemCreateRequest createRequest;
    private VtsSystemResponse response;

    @BeforeEach
    void setUp() {
        createRequest = VtsSystemCreateRequest.builder()
                .systemName("VTS ABC")
                .code("VTS-ABC")
                .conditionStatus(com.hanghai.kchtg.vtssystem.entity.ConditionStatus.OPERATIONAL)
                .orgUnitId(UUID.fromString("00000000-0000-0000-0000-000000000010"))
                .owningOrgId(UUID.fromString("00000000-0000-0000-0000-000000000011"))
                .operatingOrgId(UUID.fromString("00000000-0000-0000-0000-000000000012"))
                .provinceId(1)
                .build();

        response = VtsSystemResponse.builder()
                .id(TEST_ID)
                .systemName("VTS ABC")
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }

    @Test
    void testCreate() {
        when(service.create(any(), any(java.util.UUID.class))).thenReturn(response);
        ResponseEntity<?> result = controller.create(createRequest, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
    }

    @Test
    void testGetById() {
        when(service.getById(TEST_ID, false, false)).thenReturn(response);
        ResponseEntity<?> result = controller.getById(TEST_ID, false, false, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        VtsSystemResponse body = ((ApiResponse<VtsSystemResponse>) result.getBody()).getData();
        assertEquals(TEST_ID, body.getId());
    }

    @Test
    void testFindAll() {
        when(service.findAllWithSearchAndCounts(null, null, null, null, null, 0, 20, true, null)).thenReturn(VtsSystemListResponse.builder().build());
        ResponseEntity<?> result = controller.findAll(null, null, null, null, null, 0, 20, true, null);
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testFindAll_WithoutIncludeCounts() {
        when(service.findAllWithSearchAndCounts(null, null, null, null, null, 0, 20, false, null)).thenReturn(VtsSystemListResponse.builder().build());
        ResponseEntity<?> result = controller.findAll(null, null, null, null, null, 0, 20, false, null);
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testFindAll_WithYearFilter() {
        when(service.findAllWithSearchAndCounts(null, "keyword", null, null, 2025, 0, 20, true, null))
                .thenReturn(VtsSystemListResponse.builder().build());
        ResponseEntity<?> result = controller.findAll(null, "keyword", null, null, 2025, 0, 20, true, null);
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testFindAll_WithSortParam() {
        when(service.findAllWithSearchAndCounts(null, null, null, null, null, 0, 20, true, "systemName,asc"))
                .thenReturn(VtsSystemListResponse.builder().build());
        ResponseEntity<?> result = controller.findAll(null, null, null, null, null, 0, 20, true, "systemName,asc");
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testUpdate() {
        VtsSystemUpdateRequest updateReq = VtsSystemUpdateRequest.builder()
                .systemName("VTS XYZ").build();
        when(service.update(eq(TEST_ID), any(), any(java.util.UUID.class))).thenReturn(response);
        ResponseEntity<?> result = controller.update(TEST_ID, updateReq, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testDelete() {
        doNothing().when(service).delete(eq(TEST_ID), any(java.util.UUID.class));
        ResponseEntity<?> result = controller.delete(TEST_ID, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testApproveC1() {
        ApprovalRequest req = ApprovalRequest.builder().decision(ApprovalStatus.APPROVED.name()).build();
        when(service.approveC1(eq(TEST_ID), any(), any(java.util.UUID.class))).thenReturn(response);
        ResponseEntity<?> result = controller.approveC1(TEST_ID, req, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testApproveC2() {
        ApprovalRequest req = ApprovalRequest.builder().decision(ApprovalStatus.APPROVED.name()).build();
        when(service.approveC2(eq(TEST_ID), any(), any(java.util.UUID.class))).thenReturn(response);
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
        when(service.search(null, null, null, null, null)).thenReturn(Collections.emptyList());
        ResponseEntity<?> result = controller.search(null, null, null, null, null);
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    /**
     * Controller không còn bắt Exception rồi quy hết về 400: lỗi được đẩy lên
     * GlobalExceptionHandler để ánh xạ đúng mã (400 cho dữ liệu sai, 404 cho
     * không tìm thấy, 500 cho lỗi hệ thống) thay vì che mất lỗi thật.
     */
    @Test
    void testCreate_PropagatesExceptionToGlobalHandler() {
        when(service.create(any(), any())).thenThrow(new IllegalArgumentException("Test error"));
        assertThrows(IllegalArgumentException.class, () -> controller.create(createRequest, mockAuth()));
    }

    @Test
    void testDelete_WithException() {
        doThrow(new RuntimeException("Không thể xóa")).when(service).delete(eq(TEST_ID), any(java.util.UUID.class));
        // @DataScope aspect intercepts before service — exception bypasses controller try-catch
        ResponseEntity<?> result = controller.delete(TEST_ID, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testApproveC1_WithException() {
        ApprovalRequest req = ApprovalRequest.builder().decision(ApprovalStatus.APPROVED.name()).build();
        // @DataScope aspect intercepts before service — exception bypasses controller try-catch
        doThrow(new IllegalStateException("Người phê duyệt C2 không được trùng với C1"))
                .when(service).approveC1(eq(TEST_ID), any(), any(java.util.UUID.class));
        ResponseEntity<?> result = controller.approveC1(TEST_ID, req, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testApproveC2_WithException() {
        ApprovalRequest req = ApprovalRequest.builder().decision(ApprovalStatus.APPROVED.name()).build();
        // @DataScope aspect intercepts before service — exception bypasses controller try-catch
        doThrow(new RuntimeException("Test error"))
                .when(service).approveC2(eq(TEST_ID), any(), any(java.util.UUID.class));
        ResponseEntity<?> result = controller.approveC2(TEST_ID, req, mockAuth());
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testFilterByApprovalStatus() {
        when(service.findByApprovalStatus(ApprovalStatus.APPROVED)).thenReturn(List.of(response));
        ResponseEntity<?> result = controller.filterByApprovalStatus(ApprovalStatus.APPROVED);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        @SuppressWarnings("unchecked")
        List<VtsSystemResponse> body = ((ApiResponse<List<VtsSystemResponse>>) result.getBody()).getData();
        assertEquals(1, body.size());
    }

    @Test
    void testCountByApprovalStatus() {
        java.util.Map<String, Long> counts = new java.util.HashMap<>();
        counts.put("APPROVED", 5L);
        counts.put("PROPOSED", 3L);
        when(service.countByApprovalStatus()).thenReturn(counts);
        ResponseEntity<?> result = controller.countByApprovalStatus();
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    @Test
    void testGetHistory_WithPagination() {
        when(service.getHistory(eq(TEST_ID), eq(0), eq(10), eq("key"), any(), any()))
                .thenReturn(Collections.emptyList());
        ResponseEntity<?> result = controller.getHistory(TEST_ID, 0, 10, "key", null, null);
        assertEquals(HttpStatus.OK, result.getStatusCode());
    }

    private Authentication mockAuth() {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("00000000-0000-0000-0000-000000000001");
        return auth;
    }
}
