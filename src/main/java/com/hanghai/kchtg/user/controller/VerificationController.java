package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.dto.ResendVerificationRequest;
import com.hanghai.kchtg.user.dto.VerifyResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.exception.VerificationException;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.NotificationService;
import com.hanghai.kchtg.user.service.RateLimiterService;
import com.hanghai.kchtg.user.service.VerificationTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * Verification controller - handles POST /api/verify and POST /api/register/resend.
 */
@RestController
@RequestMapping("/api")
public class VerificationController {

    private static final Logger log = LoggerFactory.getLogger(VerificationController.class);

    private final UserRepository userRepository;
    private final VerificationTokenService verificationTokenService;
    private final com.hanghai.kchtg.user.repository.VerificationTokenRepository verificationTokenRepository;
    private final NotificationService notificationService;
    private final RateLimiterService rateLimiterService;

    public VerificationController(UserRepository userRepository,
                                   VerificationTokenService verificationTokenService,
                                   com.hanghai.kchtg.user.repository.VerificationTokenRepository verificationTokenRepository,
                                   NotificationService notificationService,
                                   RateLimiterService rateLimiterService) {
        this.userRepository = userRepository;
        this.verificationTokenService = verificationTokenService;
        this.verificationTokenRepository = verificationTokenRepository;
        this.notificationService = notificationService;
        this.rateLimiterService = rateLimiterService;
    }

    /**
     * POST /api/verify - validates a verification token and activates the account.
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<VerifyResponse>> verify(
            @Valid @RequestBody com.hanghai.kchtg.user.dto.VerifyTokenRequest request,
            HttpServletRequest requestInfo) {

        String ipAddress = getClientIp(requestInfo);

        try {
            // Rate limit verification attempts
            rateLimiterService.checkLimit("verify:" + ipAddress);

            // Resolve email from token hash
            String email = resolveEmailFromToken(request.getToken());
            if (email == null) {
                throw new VerificationException("Token không hợp lệ, đã hết hạn hoặc đã được sử dụng");
            }

            // Validate and mark token as used
            verificationTokenService.validateToken(request.getToken());

            // Find user and activate
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new VerificationException("Không tìm thấy người dùng với email này"));

            String previousStatus = user.getStatus().name();
            user.setStatus(UserStatus.ACTIVE);
            userRepository.save(user);

            VerifyResponse response = new VerifyResponse();
            response.setVerified(true);
            response.setMessage("Xác minh tài khoản thành công. Tài khoản của bạn đã được kích hoạt.");
            response.setPreviousStatus(previousStatus);
            response.setNewStatus(UserStatus.ACTIVE.name());

            log.info("Account verified: email={}, userId={}", email, user.getId());

            // Send success notification
            notificationService.sendRegistrationSuccess(user.getEmail(), user.getFullName());
            rateLimiterService.reset("verify:" + ipAddress);

            return ResponseEntity.ok(ApiResponse.success(response));

        } catch (VerificationException e) {
            VerifyResponse response = new VerifyResponse();
            response.setVerified(false);
            response.setMessage(e.getMessage());
            response.setNewStatus(UserStatus.PENDING_VERIFICATION.name());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/register/resend - resend verification email.
     */
    @PostMapping("/register/resend")
    public ResponseEntity<ApiResponse<VerifyResponse>> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request,
            HttpServletRequest requestInfo) {

        String ipAddress = getClientIp(requestInfo);

        // Rate limit
        rateLimiterService.checkLimit("resend:" + ipAddress);

        try {
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new VerificationException("Không tìm thấy tài khoản với email này"));

            if (user.getStatus() == UserStatus.ACTIVE) {
                throw new VerificationException("Tài khoản đã được xác minh");
            }

            // Generate new token
            String plainToken = verificationTokenService.generateToken(user.getId(), user.getEmail(), user.getFullName());

            // Send email
            notificationService.sendVerificationEmail(user.getEmail(), plainToken, user.getFullName());

            VerifyResponse response = new VerifyResponse();
            response.setVerified(false);
            response.setMessage("Email xác minh đã được gửi lại. Vui lòng kiểm tra hộp thư.");
            response.setNewStatus(user.getStatus().name());

            rateLimiterService.reset("resend:" + ipAddress);

            return ResponseEntity.ok(ApiResponse.success(response));

        } catch (VerificationException e) {
            VerifyResponse response = new VerifyResponse();
            response.setVerified(false);
            response.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Resolves the email address associated with a plaintext token by computing its SHA-256 hash
     * and querying the repository.
     */
    private String resolveEmailFromToken(String plainToken) {
        String tokenHash = sha256(plainToken);
        return verificationTokenRepository
                .findEmailByTokenHash(tokenHash, LocalDateTime.now())
                .orElse(null);
    }

    private String sha256(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
