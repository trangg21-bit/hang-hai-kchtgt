package com.hanghai.kchtg.password.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.password.dto.ChangePasswordRequest;
import com.hanghai.kchtg.password.dto.ChangePasswordResponse;
import com.hanghai.kchtg.password.dto.PasswordPolicyResponse;
import com.hanghai.kchtg.password.entity.PasswordPolicy;
import com.hanghai.kchtg.password.entity.PasswordHistory;
import com.hanghai.kchtg.password.entity.PasswordExpirationLog;
import com.hanghai.kchtg.password.service.ComplexityValidator;
import com.hanghai.kchtg.password.service.PasswordHashService;
import com.hanghai.kchtg.password.service.PasswordPolicyService;
import com.hanghai.kchtg.password.repository.PasswordHistoryRepository;
import com.hanghai.kchtg.password.repository.PasswordExpirationLogRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Auth password controller - change-password and password-policy endpoints (F-276).
 * <p>
 * GET  /api/auth/password-policy   - view policy (public, no auth required)
 * POST /api/auth/change-password   - change password (authenticated)
 * </p>
 */
@RestController
@RequestMapping("/api/auth")
public class AuthPasswordController {

    private static final Logger log = LoggerFactory.getLogger(AuthPasswordController.class);

    private final PasswordPolicyService policyService;
    private final ComplexityValidator complexityValidator;
    private final PasswordHashService hashService;
    private final PasswordHistoryRepository historyRepo;
    private final PasswordExpirationLogRepository expirationLogRepo;
    private final UserRepository userRepo;

    public AuthPasswordController(PasswordPolicyService policyService,
                                  ComplexityValidator complexityValidator,
                                  PasswordHashService hashService,
                                  PasswordHistoryRepository historyRepo,
                                  PasswordExpirationLogRepository expirationLogRepo,
                                  UserRepository userRepo) {
        this.policyService = policyService;
        this.complexityValidator = complexityValidator;
        this.hashService = hashService;
        this.historyRepo = historyRepo;
        this.expirationLogRepo = expirationLogRepo;
        this.userRepo = userRepo;
    }

    /**
     * GET /api/auth/password-policy - return current policy (public access).
     */
    @GetMapping("/password-policy")
    public ResponseEntity<ApiResponse<PasswordPolicyResponse>> getPasswordPolicy() {
        PasswordPolicy policy = policyService.getPolicy();
        PasswordPolicyResponse response = policyService.toResponse(policy);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/auth/change-password - change current user's password (authenticated).
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<ChangePasswordResponse>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : null;
            if (username == null) {
                return ResponseEntity.status(401)
                        .body(ApiResponse.error("Authentication required"));
            }

            User user = userRepo.findByUsername(username)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // Step 1: Verify current password
            if (!hashService.verify(request.getCurrentPassword(), user.getPassword())) {
                log.warn("Current password verification failed for user: {}", username);
                // BR-276-09: generic error, do not reveal "wrong current password"
                ChangePasswordResponse resp = new ChangePasswordResponse(false, "Đổi mật khẩu không thành công");
                return ResponseEntity.ok(ApiResponse.success(resp));
            }

            // Step 2: Load policy
            PasswordPolicy policy = policyService.getPolicy();

            // Step 3: Validate complexity
            List<String> violations = complexityValidator.validate(request.getNewPassword(), policy);
            if (!violations.isEmpty()) {
                String detail = String.join("; ", violations);
                log.warn("Complexity violation for user {}: {}", username, detail);
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Mật khẩu mới không đạt yêu cầu: " + detail));
            }

            // Step 4: Check if new password equals current (duplicate)
            if (hashService.verify(request.getNewPassword(), user.getPassword())) {
                log.warn("New password equals current password for user: {}", username);
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Mật khẩu mới không được trùng mật khẩu hiện tại"));
            }
            String newHash = hashService.hash(request.getNewPassword());

            // Step 5: Check history (prevent reuse)
            List<PasswordHistory> recentHistory = historyRepo.findTopNByUserIdOrderByCreatedAtDesc(
                    user.getId(), policy.getHistoryDepth());
            for (PasswordHistory ph : recentHistory) {
                if (hashService.verify(request.getNewPassword(), ph.getPasswordHash())) {
                    log.warn("Password reuse detected for user: {}", username);
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Mật khẩu đã được sử dụng gần đây"));
                }
            }

            // Step 6: Apply change (transactional)
            String oldHash = user.getPassword();
            LocalDateTime now = LocalDateTime.now();
            user.setPassword(newHash);
            user.setLastChangedAt(now);
            user.setExpiresAt(now.plusDays(policy.getMaxAgeDays()));
            int currentVersion = user.getPasswordHashVersion() != null ? user.getPasswordHashVersion() : 0;
            user.setPasswordHashVersion(currentVersion + 1);
            userRepo.save(user);

            // Step 7: Store old hash in history
            PasswordHistory historyEntry = new PasswordHistory();
            historyEntry.setUserId(user.getId());
            historyEntry.setPasswordHash(oldHash);
            historyRepo.save(historyEntry);

            // Step 8: Trim history if exceeds depth
            long historyCount = historyRepo.countByUserId(user.getId());
            if (historyCount > policy.getHistoryDepth()) {
                List<PasswordHistory> allHistory = historyRepo.findTopNByUserIdOrderByCreatedAtDesc(
                        user.getId(), Long.valueOf(policy.getHistoryDepth() + 10).intValue());
                if (allHistory.size() > policy.getHistoryDepth()) {
                    List<UUID> keepIds = allHistory.subList(0, policy.getHistoryDepth())
                            .stream().map(PasswordHistory::getId).toList();
                    historyRepo.deleteByUserIdAndIdNotIn(user.getId(), keepIds);
                }
            }

            // Step 9: Log the change
            PasswordExpirationLog logEntry = new PasswordExpirationLog();
            logEntry.setUserId(user.getId());
            logEntry.setExpiredAt(now);
            logEntry.setStatus("changed");
            logEntry.setNotifiedVia("none");
            expirationLogRepo.save(logEntry);

            log.info("Password changed successfully for user: {}", username);

            // Invalidate all JWT tokens for this user by updating pw hashVersion
            // (F-274 integration: old JWTs will be rejected due to version mismatch)

            ChangePasswordResponse resp = new ChangePasswordResponse(true, "Đổi mật khẩu thành công");
            return ResponseEntity.ok(ApiResponse.success(resp));

        } catch (Exception e) {
            log.error("Error changing password", e);
            ChangePasswordResponse resp = new ChangePasswordResponse(false, "Đổi mật khẩu không thành công");
            return ResponseEntity.ok(ApiResponse.success(resp));
        }
    }
}
