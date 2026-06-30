package com.hanghai.kchtg.accesslog.controller;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.dto.AccessLogResponse;
import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.service.AccessLogService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccessLogController Unit Tests")
class AccessLogControllerTest {

    @Mock
    private AccessLogService service;

    @InjectMocks
    private AccessLogController controller;

    private AccessLogResponse sampleResponse;
    private Long logId;

    @BeforeEach
    void setUp() {
        logId = 1L;

        AccessLog logEntity = new AccessLog();
        logEntity.setId(logId);
        logEntity.setUserId(42L);
        logEntity.setUsername("testuser");
        logEntity.setAction("CREATE_USER");
        logEntity.setModule("USER");
        logEntity.setIpAddress("127.0.0.1");
        logEntity.setUserAgent("Mozilla");
        logEntity.setStatus(AccessLogStatus.SUCCESS);
        logEntity.setDetail("HTTP 201");
        logEntity.setCreatedAt(LocalDateTime.now());
        logEntity.setUpdatedAt(LocalDateTime.now());

        sampleResponse = new AccessLogResponse(logEntity);
    }

    @Test
    @DisplayName("list should return 200 OK with paginated list of access logs")
    void list_ShouldReturnOk() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<AccessLogResponse> page = new PageImpl<>(Collections.singletonList(sampleResponse), pageable, 1);

        AccessLogFilterRequest filter = new AccessLogFilterRequest();
        when(service.findAll(any(AccessLogFilterRequest.class), eq(pageable))).thenReturn(page);

        ResponseEntity<ApiResponse<Page<AccessLogResponse>>> response = controller.list(filter, pageable);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getTotalElements());
        assertEquals("testuser", response.getBody().getData().getContent().get(0).getUsername());

        verify(service).findAll(any(AccessLogFilterRequest.class), eq(pageable));
    }

    @Test
    @DisplayName("getById should return 200 OK with access log details")
    void getById_ShouldReturnOk() {
        when(service.findById(logId)).thenReturn(sampleResponse);

        ResponseEntity<ApiResponse<AccessLogResponse>> response = controller.getById(logId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(logId, response.getBody().getData().getId());
        assertEquals("testuser", response.getBody().getData().getUsername());

        verify(service).findById(logId);
    }
}
