package com.hanghai.kchtg.accesslog.interceptor;

import com.hanghai.kchtg.accesslog.annotation.AuditLog;
import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.method.HandlerMethod;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccessLogInterceptor Unit Tests")
class AccessLogInterceptorTest {

    @Mock
    private AccessLogRepository accessLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private HandlerMethod handlerMethod;

    @Mock
    private AuditLog auditLog;

    @InjectMocks
    private AccessLogInterceptor interceptor;

    private User sampleUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setUsername("authuser");

        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should do nothing if handler is not HandlerMethod")
    void shouldDoNothing_IfHandlerNotHandlerMethod() throws Exception {
        Object simpleHandler = new Object();
        interceptor.afterCompletion(request, response, simpleHandler, null);
        verifyNoInteractions(accessLogRepository, userRepository);
    }

    @Test
    @DisplayName("Should do nothing if method is not annotated with AuditLog")
    void shouldDoNothing_IfNoAuditLogAnnotation() throws Exception {
        when(handlerMethod.getMethodAnnotation(AuditLog.class)).thenReturn(null);

        interceptor.afterCompletion(request, response, handlerMethod, null);

        verifyNoInteractions(accessLogRepository, userRepository);
    }

    @Test
    @DisplayName("Should save SUCCESS log with authenticated user, IP, and User-Agent")
    void shouldSaveSuccessLog_WithAuthenticatedUser() throws Exception {
        // Mock annotation
        when(handlerMethod.getMethodAnnotation(AuditLog.class)).thenReturn(auditLog);
        when(auditLog.action()).thenReturn("UPDATE_USER");
        when(auditLog.module()).thenReturn("USER");

        // Mock request info
        when(request.getHeader("X-Forwarded-For")).thenReturn("192.168.1.100, 10.0.0.1");
        when(request.getHeader("User-Agent")).thenReturn("Chrome");

        // Mock Security Context
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("authuser");

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        // Mock user lookup
        when(userRepository.findByUsername("authuser")).thenReturn(Optional.of(sampleUser));

        // Mock response status
        when(response.getStatus()).thenReturn(200);

        interceptor.afterCompletion(request, response, handlerMethod, null);

        // Verify and capture saved log
        ArgumentCaptor<AccessLog> captor = ArgumentCaptor.forClass(AccessLog.class);
        verify(accessLogRepository).save(captor.capture());

        AccessLog savedLog = captor.getValue();
        assertNotNull(savedLog);
        assertEquals("UPDATE_USER", savedLog.getAction());
        assertEquals("USER", savedLog.getModule());
        assertEquals("192.168.1.100", savedLog.getIpAddress());
        assertEquals("Chrome", savedLog.getUserAgent());
        assertEquals("authuser", savedLog.getUsername());
        assertEquals(userId, savedLog.getUserId());
        assertEquals(AccessLogStatus.SUCCESS, savedLog.getStatus());
        assertEquals("HTTP 200", savedLog.getDetail());
    }

    @Test
    @DisplayName("Should save FAILED log when exception is present or response status is >= 400")
    void shouldSaveFailedLog_WhenExceptionOrErrorStatus() throws Exception {
        when(handlerMethod.getMethodAnnotation(AuditLog.class)).thenReturn(auditLog);
        when(auditLog.action()).thenReturn("DELETE_USER");
        when(auditLog.module()).thenReturn("USER");

        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(response.getStatus()).thenReturn(500);

        Exception ex = new RuntimeException("DB Connection timeout");

        interceptor.afterCompletion(request, response, handlerMethod, ex);

        ArgumentCaptor<AccessLog> captor = ArgumentCaptor.forClass(AccessLog.class);
        verify(accessLogRepository).save(captor.capture());

        AccessLog savedLog = captor.getValue();
        assertNotNull(savedLog);
        assertEquals(AccessLogStatus.FAILED, savedLog.getStatus());
        assertEquals("DB Connection timeout", savedLog.getDetail());
    }

    @Test
    @DisplayName("Should fallback to request parameter username for login requests")
    void shouldFallbackToRequestParameterUsername() throws Exception {
        when(handlerMethod.getMethodAnnotation(AuditLog.class)).thenReturn(auditLog);
        when(auditLog.action()).thenReturn("LOGIN");
        when(auditLog.module()).thenReturn("AUTH");

        // No security context, but username parameter exists
        when(request.getParameter("username")).thenReturn("unauthenticated_user");
        when(userRepository.findByUsername("unauthenticated_user")).thenReturn(Optional.of(sampleUser));
        when(response.getStatus()).thenReturn(200);

        interceptor.afterCompletion(request, response, handlerMethod, null);

        ArgumentCaptor<AccessLog> captor = ArgumentCaptor.forClass(AccessLog.class);
        verify(accessLogRepository).save(captor.capture());

        AccessLog savedLog = captor.getValue();
        assertEquals("unauthenticated_user", savedLog.getUsername());
        assertEquals(userId, savedLog.getUserId());
    }
}
