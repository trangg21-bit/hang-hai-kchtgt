package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.lockout.dto.enums.LockoutStatus;
import com.hanghai.kchtg.lockout.service.LockoutService;
import com.hanghai.kchtg.password.service.PasswordHashService;
import com.hanghai.kchtg.security.TotpValidator;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AuthStatusTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private PasswordHashService passwordHashService;
    private TotpValidator totpValidator;
    private TokenService tokenService;
    private LoginAuditLogService auditLogService;
    private LockoutService lockoutService;
    private TotpAuthService totpAuthService;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        passwordHashService = mock(PasswordHashService.class);
        totpValidator = mock(TotpValidator.class);
        tokenService = mock(TokenService.class);
        auditLogService = mock(LoginAuditLogService.class);
        lockoutService = mock(LockoutService.class);
        request = mock(HttpServletRequest.class);

        totpAuthService = new TotpAuthService(
                userRepository, passwordEncoder, passwordHashService,
                totpValidator, tokenService, auditLogService, lockoutService
        );

        when(lockoutService.checkLockout(any())).thenReturn(LockoutStatus.OK);
    }

    @Test
    void testLoginPendingApprovalRejected() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("testuser");
        user.setStatus(UserStatus.PENDING_APPROVAL);

        when(userRepository.findByUsernameOrEmail("testuser")).thenReturn(Optional.of(user));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                totpAuthService.authenticateCredentials("testuser", "Password@123", request)
        );

        assertTrue(ex.getMessage().contains("chờ Quản trị viên phê duyệt"));
    }

    @Test
    void testLoginPendingVerificationRejected() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("testuser");
        user.setStatus(UserStatus.PENDING_VERIFICATION);

        when(userRepository.findByUsernameOrEmail("testuser")).thenReturn(Optional.of(user));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                totpAuthService.authenticateCredentials("testuser", "Password@123", request)
        );

        assertTrue(ex.getMessage().contains("chưa được xác minh email"));
    }

    @Test
    void testLoginInactiveRejected() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("testuser");
        user.setStatus(UserStatus.INACTIVE);

        when(userRepository.findByUsernameOrEmail("testuser")).thenReturn(Optional.of(user));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                totpAuthService.authenticateCredentials("testuser", "Password@123", request)
        );

        assertTrue(ex.getMessage().contains("chưa được kích hoạt hoặc đã bị vô hiệu hóa"));
    }
}
