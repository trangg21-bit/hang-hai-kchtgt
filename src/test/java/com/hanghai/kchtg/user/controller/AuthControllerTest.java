package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.captcha.service.CaptchaService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.user.dto.LoginRequest;
import com.hanghai.kchtg.user.dto.MfaChallengeResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.TotpAuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AuthControllerTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private TokenService tokenService;
    private TotpAuthService totpAuthService;
    private CaptchaService captchaService;
    private HttpServletRequest httpRequest;

    private AuthController authController;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        tokenService = mock(TokenService.class);
        totpAuthService = mock(TotpAuthService.class);
        captchaService = mock(CaptchaService.class);
        httpRequest = mock(HttpServletRequest.class);

        authController = new AuthController(
                userRepository,
                passwordEncoder,
                tokenService,
                totpAuthService,
                captchaService
        );
    }

    @Test
    void testLogin_invalidCaptcha_returnsBadRequest() {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("admin");
        request.setPassword("Admin@123");
        request.setCaptchaId("invalid-id");
        request.setCaptchaCode("WRONG");

        when(captchaService.validateCaptcha("invalid-id", "WRONG")).thenReturn(false);

        ResponseEntity<ApiResponse<?>> response = authController.login(request, httpRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("Mã bảo vệ (Captcha) không chính xác"));

        // Không tiến hành xác thực mật khẩu khi captcha sai
        verify(totpAuthService, never()).authenticateCredentials(any(), any(), any());
    }

    @Test
    void testLogin_validCaptcha_proceedsToAuthentication() {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("admin");
        request.setPassword("Admin@123");
        request.setCaptchaId("valid-id");
        request.setCaptchaCode("12345");

        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setUsername("admin");
        user.setStatus(UserStatus.ACTIVE);

        when(captchaService.validateCaptcha("valid-id", "12345")).thenReturn(true);
        MfaChallengeResponse challenge = MfaChallengeResponse.skipChallenge(userId);
        when(totpAuthService.authenticateCredentials(eq("admin"), eq("Admin@123"), any())).thenReturn(challenge);
        when(userRepository.findByIdWithRelations(userId)).thenReturn(Optional.of(user));
        when(tokenService.createAccessToken(user)).thenReturn("mock-access-token");

        ResponseEntity<ApiResponse<?>> response = authController.login(request, httpRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        verify(totpAuthService, times(1)).authenticateCredentials(eq("admin"), eq("Admin@123"), any());
    }
}
