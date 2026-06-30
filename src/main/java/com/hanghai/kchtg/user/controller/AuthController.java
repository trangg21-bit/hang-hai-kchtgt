package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.accesslog.annotation.AuditLog;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.user.dto.*;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.TotpAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * Authentication controller - handles login via JWT with 2-phase MFA (TOTP).
 * <p>
 * <b>POST /api/auth/login</b> - Phase 1: authenticate credentials, get MFA challenge.<br>
 * <b>POST /api/auth/login/totp</b> - Phase 2: verify TOTP, get dual JWT.
 * </p>
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final TotpAuthService totpAuthService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          TokenService tokenService,
                          TotpAuthService totpAuthService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.totpAuthService = totpAuthService;
    }

    /**
     * Phase 1 - Authenticate credentials.
     * <p>
     * If user has TOTP enabled, returns {@code MfaChallengeResponse} (client must
     * proceed to phase 2).  If TOTP is not enabled, returns {@code LoginResponse}
     * with JWT directly.
     * </p>
     *
     * @param request login credentials
     * @param httpRequest for IP / User-Agent logging
     * @return MfaChallengeResponse or LoginResponse depending on TOTP status
     */
    @PostMapping("/login")
    @AuditLog(module = "AUTH", action = "LOGIN")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody LoginRequest request,
                                                HttpServletRequest httpRequest) {
        try {
            // Resolve identifier: prefer 'identifier' field, fall back to 'username'
            String identifier = (request.getIdentifier() != null && !request.getIdentifier().isBlank())
                    ? request.getIdentifier()
                    : request.getUsername();

            MfaChallengeResponse challenge = totpAuthService.authenticateCredentials(
                    identifier, request.getPassword(), httpRequest);

            if (!challenge.isTotpRequired()) {
                // User does NOT have TOTP enabled - proceed with single-phase login
                User user = userRepository.findById(challenge.getUserId())
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

                // Update last login
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);

                httpRequest.setAttribute("authenticatedUser", user);

                String role = user.getPrimaryRoleCode() != null ? user.getPrimaryRoleCode() : "ROLE_USER";
                httpRequest.setAttribute("authenticatedUserRole", role);
                
                String token = tokenService.createAccessToken(user);

                LoginResponse response = LoginResponse.of(token, user.getUsername(),
                        user.getFullName(), role);
                log.info("User logged in (no TOTP): {}", user.getUsername());
                return ResponseEntity.ok(ApiResponse.success("Login successful", response));
            }

            // =========================================================================
            log.info("MFA challenge issued for user: {}", identifier);
            return ResponseEntity.ok(ApiResponse.success("MFA required", challenge));

        } catch (IllegalArgumentException e) {
            log.warn("Login failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Phase 2 - Verify TOTP code and return dual JWT tokens.
     *
     * @param request userId + totpCode
     * @param httpRequest for IP / User-Agent logging
     * @return TwoFactorLoginResponse with access_token + refresh_token
     */
    @PostMapping("/login/totp")
    @AuditLog(module = "AUTH", action = "LOGIN_TOTP")
    public ResponseEntity<ApiResponse<TwoFactorLoginResponse>> loginTotp(
            @Valid @RequestBody TotpLoginRequest request,
            HttpServletRequest httpRequest) {
        try {
            TwoFactorLoginResponse response = totpAuthService.verifyTotp(request, httpRequest);
            User user = userRepository.findById(response.getUser().getId()).orElse(null);
            if (user != null) {
                httpRequest.setAttribute("authenticatedUser", user);
                httpRequest.setAttribute("authenticatedUserRole", response.getUser().getRole());
            }
            log.info("2FA login successful for user ID: {}", request.getUserId());
            return ResponseEntity.ok(ApiResponse.success("2FA login successful", response));

        } catch (IllegalArgumentException e) {
            log.warn("2FA login failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
