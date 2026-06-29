package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.entity.LoginAttemptResult;
import com.hanghai.kchtg.user.entity.LoginAttemptType;
import com.hanghai.kchtg.user.repository.LoginAuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests cho {@link LoginAuditLogService}.
 */
@ExtendWith(MockitoExtension.class)
class LoginAuditLogServiceTest {

    @Mock
    private LoginAuditLogRepository repository;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private LoginAuditLogService service;

    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Log attempt thanh cong - save va log")
    void shouldLogSuccessfulAttempt() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("X-Real-IP")).thenReturn(null);
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(httpRequest.getHeader("User-Agent")).thenReturn("Mozilla/5.0");

        service.logAttempt(testUserId, "testuser",
                LoginAttemptType.CREDENTIALS,
                LoginAttemptResult.SUCCESS,
                null,
                httpRequest);

        // Verify save was called
        verify(repository, times(1)).save(any());
    }

    @Test
    @DisplayName("Log attempt that bai - save voi failure reason")
    void shouldLogFailedAttempt() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("X-Real-IP")).thenReturn(null);
        when(httpRequest.getRemoteAddr()).thenReturn("192.168.1.100");
        when(httpRequest.getHeader("User-Agent")).thenReturn("Chrome/120");

        service.logAttempt(testUserId, "testuser",
                LoginAttemptType.TOTP,
                LoginAttemptResult.FAIL,
                "Invalid code",
                httpRequest);

        // Verify save was called with correct data
        ArgumentCaptor<com.hanghai.kchtg.user.entity.LoginAuditLog> captor =
                ArgumentCaptor.forClass(com.hanghai.kchtg.user.entity.LoginAuditLog.class);
        verify(repository).save(captor.capture());

        com.hanghai.kchtg.user.entity.LoginAuditLog entry = captor.getValue();
        assertEquals(testUserId, entry.getUserId());
        assertEquals("testuser", entry.getUsername());
        assertEquals(LoginAttemptType.TOTP, entry.getAttemptType());
        assertEquals(LoginAttemptResult.FAIL, entry.getResult());
        assertEquals("Invalid code", entry.getFailureReason());
        assertEquals("192.168.1.100", entry.getIpAddress());
        assertEquals("Chrome/120", entry.getUserAgent());
        assertNotNull(entry.getAttemptedAt());
    }

    @Test
    @DisplayName("IP extraction: null X-Forwarded-For → getRemoteAddr")
    void shouldExtractIpWhenNoForwardedFor() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getRemoteAddr()).thenReturn("10.0.0.1");

        String ip = service.extractIpAddress(httpRequest);
        assertEquals("10.0.0.1", ip);
    }

    @Test
    @DisplayName("IP extraction: X-Forwarded-For co nhieu IP → lay client IP dau")
    void shouldExtractFirstIpFromForwardedFor() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn("192.168.1.1, 10.0.0.2, 10.0.0.3");

        String ip = service.extractIpAddress(httpRequest);
        assertEquals("192.168.1.1", ip);
    }

    @Test
    @DisplayName("IP extraction: X-Real-IP → duoc su dung khi X-Forwarded-For = unknown")
    void shouldUseXRealIpAsFallback() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn("unknown");
        when(httpRequest.getHeader("X-Real-IP")).thenReturn("203.0.113.50");

        String ip = service.extractIpAddress(httpRequest);
        assertEquals("203.0.113.50", ip);
    }

    @Test
    @DisplayName("User-Agent: lay tu header User-Agent")
    void shouldExtractUserAgent() {
        String ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
        when(httpRequest.getHeader("User-Agent")).thenReturn(ua);

        String extracted = service.extractUserAgent(httpRequest);
        assertEquals(ua, extracted);
    }

    @Test
    @DisplayName("Log attempt voi userId = null (user chua ton tai)")
    void shouldLogAttemptWithNullUserId() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("X-Real-IP")).thenReturn(null);
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(httpRequest.getHeader("User-Agent")).thenReturn("TestAgent/1.0");

        service.logAttempt(null, "unknown_user",
                LoginAttemptType.CREDENTIALS,
                LoginAttemptResult.FAIL,
                "User not found",
                httpRequest);

        ArgumentCaptor<com.hanghai.kchtg.user.entity.LoginAuditLog> captor =
                ArgumentCaptor.forClass(com.hanghai.kchtg.user.entity.LoginAuditLog.class);
        verify(repository).save(captor.capture());

        com.hanghai.kchtg.user.entity.LoginAuditLog entry = captor.getValue();
        assertNull(entry.getUserId());
        assertEquals("unknown_user", entry.getUsername());
        assertEquals("User not found", entry.getFailureReason());
    }
}
