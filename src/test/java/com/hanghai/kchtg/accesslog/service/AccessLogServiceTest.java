package com.hanghai.kchtg.accesslog.service;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.dto.AccessLogResponse;
import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import jakarta.persistence.EntityNotFoundException;
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
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccessLogService Unit Tests")
class AccessLogServiceTest {

    @Mock
    private AccessLogRepository repository;

    @InjectMocks
    private AccessLogService service;

    private AccessLog sampleLog;
    private Long logId;
    private Long userId;

    @BeforeEach
    void setUp() {
        logId = 1L;
        userId = 42L;

        sampleLog = new AccessLog();
        sampleLog.setId(logId);
        sampleLog.setUserId(userId);
        sampleLog.setUsername("testuser");
        sampleLog.setAction("CREATE_USER");
        sampleLog.setModule("USER");
        sampleLog.setIpAddress("127.0.0.1");
        sampleLog.setUserAgent("Mozilla/5.0");
        sampleLog.setStatus(AccessLogStatus.SUCCESS);
        sampleLog.setDetail("HTTP 201");
        sampleLog.setCreatedAt(LocalDateTime.now());
        sampleLog.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("findById should return access log when found")
    void findById_ShouldReturnLog_WhenFound() {
        when(repository.findById(logId)).thenReturn(Optional.of(sampleLog));

        AccessLogResponse response = service.findById(logId);

        assertNotNull(response);
        assertEquals(logId, response.getId());
        assertEquals(userId, response.getUserId());
        assertEquals("testuser", response.getUsername());
        assertEquals("CREATE_USER", response.getAction());
        assertEquals("USER", response.getModule());
        assertEquals("127.0.0.1", response.getIpAddress());
        assertEquals("Mozilla/5.0", response.getUserAgent());
        assertEquals(AccessLogStatus.SUCCESS, response.getStatus());
        assertEquals("HTTP 201", response.getDetail());
    }

    @Test
    @DisplayName("findById should throw EntityNotFoundException when not found")
    void findById_ShouldThrowException_WhenNotFound() {
        when(repository.findById(logId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.findById(logId));
    }

    @Test
    @DisplayName("findAll should return paginated list and apply specifications")
    void findAll_ShouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<AccessLog> page = new PageImpl<>(Collections.singletonList(sampleLog), pageable, 1);
        
        when(repository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        AccessLogFilterRequest filter = new AccessLogFilterRequest();
        filter.setUserId(userId);
        filter.setModule("USER");
        filter.setFrom(LocalDateTime.now().minusDays(1));
        filter.setTo(LocalDateTime.now());

        Page<AccessLogResponse> result = service.findAll(filter, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("testuser", result.getContent().get(0).getUsername());
        
        verify(repository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    @DisplayName("findAll with null filter should pass null specification")
    void findAll_WithNullFilter_ShouldPassNullSpecification() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<AccessLog> page = new PageImpl<>(Collections.singletonList(sampleLog), pageable, 1);
        
        when(repository.findAll((Specification<AccessLog>) null, pageable)).thenReturn(page);

        Page<AccessLogResponse> result = service.findAll(null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        
        verify(repository).findAll((Specification<AccessLog>) null, pageable);
    }
}
