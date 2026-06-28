package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.dto.ResetPasswordRequest;
import com.hanghai.kchtg.user.service.PasswordResetService;
import com.hanghai.kchtg.user.service.RateLimiterService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Password reset controller - forgot password + reset password flow.
 * <p>
 * Rate limiting: 3 requests per 15 minutes per email (SA design).
 * </p>
 */
@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetController.class);
    private static final String RESET_RATE_LIMIT_KEY_PREFIX = "password-reset:";
    private static final int MAX_RESET_REQUESTS = 3;
    private static final int RESET_RATE_WINDOW_MINUTES = 15;

    private final PasswordResetService passwordResetService;
    private final RateLimiterService rateLimiterService;

    public PasswordResetController(PasswordResetService passwordResetService,
                                   RateLimiterService rateLimiterService) {
        this.passwordResetService = passwordResetService;
        this.rateLimiterService = rateLimiterService;
    }

    /**
     * POST /api/auth/forgot-password — Request a password reset link.
     * Rate-limited: 3 requests per 15 minutes per email.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email khong duoc de trong"));
        }

        // Rate limiting check: 3 requests per 15 minutes per email
        String rateKey = email.toLowerCase();
        int currentCount = rateLimiterService.countAttempts(rateKey);
        if (currentCount >= MAX_RESET_REQUESTS) {
            long retryAfter = rateLimiterService.getRetryAfterSeconds(rateKey);
            log.warn("Password reset rate limit exceeded for email: {} (retry after {}s)", email, retryAfter);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error("Qua so luot yeu cau dat lai mat khau. Hay thu lai sau " + (retryAfter / 60 + 1) + " phut."));
        }

        try {
            passwordResetService.requestReset(email);
            // Increment rate limit counter
            rateLimiterService.increment(rateKey);
            // Always return success (even if email doesn't exist) to prevent email enumeration attacks
            return ResponseEntity.ok(ApiResponse.success("Yeu cau dat lai mat khau da duoc gui. Kiem tra email cua ban.", null));
        } catch (Exception e) {
            log.error("Password reset request failed for email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Co loi he thong. Hay thu lai sau."));
        }
    }

    /**
     * POST /api/auth/reset-password/{token} — Reset password using the token.
     * Rate-limited: 3 requests per 15 minutes per token.
     */
    @PostMapping("/reset-password/{token}")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable String token,
            @Valid @RequestBody ResetPasswordRequest body) {
        String newPassword = body.getNewPassword();

        // Rate limiting check: 3 requests per 15 minutes per token
        String rateKey = "token:" + token;
        int currentCount = rateLimiterService.countAttempts(rateKey);
        if (currentCount >= MAX_RESET_REQUESTS) {
            long retryAfter = rateLimiterService.getRetryAfterSeconds(rateKey);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error("Qua so luot yeu cau dat lai mat khau. Hay thu lai sau " + (retryAfter / 60 + 1) + " phut."));
        }

        try {
            passwordResetService.resetByToken(token, newPassword);
            // Increment rate limit counter
            rateLimiterService.increment(rateKey);
            return ResponseEntity.ok(ApiResponse.success("Dat lai mat khau thanh cong.", null));
        } catch (com.hanghai.kchtg.user.exception.ValidationException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Password reset failed for token: {}", token, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Co loi he thong. Hay thu lai sau."));
        }
    }
}
