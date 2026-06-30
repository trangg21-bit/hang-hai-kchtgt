package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.AuditLog;
import com.hanghai.kchtg.common.entity.AuditLogRepository;
import com.hanghai.kchtg.security.totp.dto.TotpEnrollSession;
import com.hanghai.kchtg.security.totp.service.QRGenerationService;
import com.hanghai.kchtg.security.totp.service.RedisSessionService;
import com.hanghai.kchtg.security.totp.service.TotpRateLimiter;
import com.hanghai.kchtg.security.totp.service.TotpService;
import com.hanghai.kchtg.user.dto.TotpSetupRequestDTO;
import com.hanghai.kchtg.user.dto.TotpSetupResponseDTO;
import com.hanghai.kchtg.user.dto.TotpVerifyRequestDTO;
import com.hanghai.kchtg.user.dto.TotpVerifyResponseDTO;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * TOTP enrollment and verification controller.
 * <p>
 * Endpoints are deliberately accessible without JWT authentication so that
 * first-time users can complete the MFA setup flow.
 * </p>
 */
@RestController
@RequestMapping("/api/auth/totp")
public class TotpSetupController {

    private static final Logger log = LoggerFactory.getLogger(TotpSetupController.class);

    private static final String OTP_ISSUER = "HangHai-KCHTGT";

    private final TotpService totpService;
    private final QRGenerationService qrGenerationService;
    private final RedisSessionService sessionService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogRepository auditLogRepository;
    private final TotpRateLimiter rateLimiter;

    public TotpSetupController(TotpService totpService,
                               QRGenerationService qrGenerationService,
                               RedisSessionService sessionService,
                               UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               AuditLogRepository auditLogRepository,
                               TotpRateLimiter rateLimiter) {
        this.totpService = totpService;
        this.qrGenerationService = qrGenerationService;
        this.sessionService = sessionService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogRepository = auditLogRepository;
        this.rateLimiter = rateLimiter;
    }

    /**
     * GET /api/auth/totp/setup - generates a new TOTP secret and returns QR code (first-time setup flow).
     * Accepts userId as a request parameter. Returns 400 if userId is missing.
     */
    @GetMapping("/setup")
    public ResponseEntity<ApiResponse<TotpSetupResponseDTO>> setupGet(
            @RequestParam(value = "userId", required = false) String userId) {
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("userId is required"));
        }

        // Delegate to the same setup logic as POST
        TotpSetupRequestDTO request = new TotpSetupRequestDTO();
        request.setUserId(userId);
        return setup(request);
    }

    /**
     * POST /api/auth/totp/setup - generates a new TOTP secret and returns QR code.
     */
    @PostMapping("/setup")
    public ResponseEntity<ApiResponse<TotpSetupResponseDTO>> setup(@Valid @RequestBody TotpSetupRequestDTO request) {
        String userId = request.getUserId();
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("userId is required"));
        }

        Optional<User> userOpt = userRepository.findByIdWithRelations(java.util.UUID.fromString(userId));
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Không tìm thấy người dùng"));
        }

        User user = userOpt.get();

        // If user already has TOTP enabled, reject
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("TOTP already enabled for this user"));
        }

        // Generate secret and hash
        String rawSecret = totpService.generateSecret();
        String hashedSecret = totpService.hashSecret(rawSecret);

        // Store enrollment session in Redis
        String otpLabel = user.getUsername() != null ? user.getUsername() : user.getId().toString();
        String otpAuthUrl = buildOtpAuthUrl(OTP_ISSUER, otpLabel, rawSecret);
        TotpEnrollSession session = new TotpEnrollSession();
        session.setUserId(userId);
        session.setRawSecret(rawSecret);
        session.setHashedSecret(hashedSecret);
        session.setOtpAuthUrl(otpAuthUrl);
        sessionService.createSession(userId, session);

        // Generate QR codes
        String svgQr = qrGenerationService.generateSvg(otpAuthUrl);
        String pngQr = qrGenerationService.generatePng(otpAuthUrl);

        TotpSetupResponseDTO response = new TotpSetupResponseDTO(
                svgQr, pngQr, rawSecret, otpAuthUrl, true, "TOTP setup initiated. Scan the QR code with your authenticator app."
        );

        // Audit log
        logAudit(userId, "TOTP_SETUP_INITIATED", null, "Setup initiated");

        return ResponseEntity.ok(ApiResponse.success("TOTP setup initiated", response));
    }

    /**
     * POST /api/auth/totp/verify - verifies the TOTP code and enables TOTP on the user.
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<TotpVerifyResponseDTO>> verify(@Valid @RequestBody TotpVerifyRequestDTO request) {
        String userId = request.getUserId();
        String code = request.getCode();

        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("userId is required"));
        }
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("code is required"));
        }

        // Check rate limiter
        if (rateLimiter.isLockedOut(userId)) {
            logAudit(userId, "TOTP_VERIFY_LOCKED", code, "Tài khoản bị khóa due to too many attempts");
            throw new TotpVerifyLockedException("Tài khoản bị khóa due to too many failed attempts. Try again in 15 minutes.");
        }

        // Get session
        TotpEnrollSession session = sessionService.getSession(userId);
        if (session == null) {
            logAudit(userId, "SESSION_EXPIRED", code, "Enrollment session expired");
            throw new SessionExpiredException("Enrollment session expired. Please request a new setup.");
        }

        String hashedSecret = session.getHashedSecret();
        boolean verified = totpService.verifyCode(session.getRawSecret(), code);

        if (!verified) {
            rateLimiter.recordAttempt(userId);
            logAudit(userId, "TOTP_VERIFY_FAILED", code, "Mã xác thực hai lớp (TOTP) không hợp lệ");
            throw new TotpCodeInvalidException("Mã xác thực hai lớp (TOTP) không hợp lệ. Remaining attempts: " + calculateRemainingAttempts(userId));
        }

        // Mark user with TOTP enabled
        User user = userRepository.findByIdWithRelations(java.util.UUID.fromString(userId)).orElseThrow();
        user.setTotpSecretHash(hashedSecret);
        user.setTotpEnabled(true);
        user.setLastTotpCode(code);
        user.setTotpVerifiedAt(LocalDateTime.now());
        userRepository.save(user);

        // Clean up session
        sessionService.deleteSession(userId);
        rateLimiter.resetAttempts(userId);

        logAudit(userId, "TOTP_SETUP_COMPLETED", code, "TOTP enabled successfully");

        TotpVerifyResponseDTO response = new TotpVerifyResponseDTO(
                true, "TOTP setup completed successfully. You will be required to enter a TOTP code on future logins.",
                null, null, null, null, null
        );

        return ResponseEntity.ok(ApiResponse.success("TOTP setup completed", response));
    }

    /**
     * POST /api/auth/totp/regenerate - regenerates a new TOTP secret (user resends QR code).
     */
    @PostMapping("/regenerate")
    public ResponseEntity<ApiResponse<TotpSetupResponseDTO>> regenerate(@Valid @RequestBody TotpSetupRequestDTO request) {
        String userId = request.getUserId();
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("userId is required"));
        }

        // Delete old session so user gets a fresh secret
        sessionService.deleteSession(userId);

        logAudit(userId, "TOTP_SETUP_REGENERATED", null, "Regenerating TOTP secret");

        // Delegate to /setup which will create a new session
        return setup(request);
    }

    // =========================================================================

    private String buildOtpAuthUrl(String issuer, String label, String secret) {
        return String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
                issuer, label, secret, issuer);
    }

    private void logAudit(String userId, String action, String code, String detail) {
        try {
            AuditLog log = new AuditLog();
            log.setUserId(userId);
            log.setAction(action);
            log.setDetail(detail);
            // createdAt is auto-populated by JPA auditing
            if (code != null) {
                log.setMetadata("{\"code\": \"" + code + "\"}");
            }
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Audit log failure must never block the TOTP flow
            log.warn("Failed to write audit log: {}", e.getMessage());
        }
    }

    private int calculateRemainingAttempts(String userId) {
        return rateLimiter.isLockedOut(userId) ? 0 : 5;
    }

    // =========================================================================

    public static class TotpCodeInvalidException extends RuntimeException {
        public TotpCodeInvalidException(String message) { super(message); }
    }

    public static class TotpVerifyLockedException extends RuntimeException {
        public TotpVerifyLockedException(String message) { super(message); }
    }

    public static class SessionExpiredException extends RuntimeException {
        public SessionExpiredException(String message) { super(message); }
    }
}
