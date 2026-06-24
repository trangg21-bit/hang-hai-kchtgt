package com.hanghai.kchtg.lockout.service;

import com.hanghai.kchtg.lockout.dto.LockoutPolicyResponse;
import com.hanghai.kchtg.lockout.dto.enums.LockoutStatus;
import com.hanghai.kchtg.lockout.entity.LockoutPolicy;
import com.hanghai.kchtg.lockout.repository.LockoutPolicyRepository;
import com.hanghai.kchtg.user.entity.LoginAuditLog;
import com.hanghai.kchtg.user.entity.LoginAttemptResult;
import com.hanghai.kchtg.user.entity.LoginAttemptType;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.LoginAuditLogRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Core lockout service - business logic for account lockout (F-277).
 *
 * State machine: OK → WARNING → LOCKED → UNRESTRICTED (auto-unlock after duration)
 */
@Service
public class LockoutService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LockoutService.class);
    private static final Long POLICY_ID = 1L;

    private final LockoutPolicyRepository policyRepo;
    private final UserRepository userRepo;
    private final LoginAuditLogRepository loginAuditLogRepo;

    public LockoutService(LockoutPolicyRepository policyRepo,
                          UserRepository userRepo,
                          LoginAuditLogRepository loginAuditLogRepo) {
        this.policyRepo = policyRepo;
        this.userRepo = userRepo;
        this.loginAuditLogRepo = loginAuditLogRepo;
    }

    /**
     * Get the current lockout policy (caller should use LockoutPolicyService for cached version).
     */
    public LockoutPolicy getPolicy() {
        return policyRepo.findById(POLICY_ID)
                .orElseGet(this::createDefault);
    }

    /**
     * Check if a user is currently locked out.
     */
    public LockoutStatus checkLockout(User user) {
        LockoutPolicy policy = getPolicy();
        if (!policy.isEnabled()) {
            return LockoutStatus.UNRESTRICTED;
        }

        if (user.getAccountLockedUntil() != null && user.getAccountLockedUntil().isAfter(LocalDateTime.now())) {
            return LockoutStatus.LOCKED;
        }

        if (user.getAccountLockedUntil() != null && user.getAccountLockedUntil().isBefore(LocalDateTime.now())) {
            user.setAccountLockedUntil(null);
            user.setFailedLoginCount(0);
            userRepo.save(user);
            return LockoutStatus.UNRESTRICTED;
        }

        return LockoutStatus.OK;
    }

    /**
     * Record a failed login attempt. Increments counter and locks if threshold reached.
     */
    @Transactional
    public LockoutStatus recordFailure(User user, String reason, HttpServletRequest httpRequest) {
        LockoutPolicy policy = getPolicy();
        user.setFailedLoginCount(user.getFailedLoginCount() + 1);

        if (user.getFailedLoginCount() >= policy.getMaxFailedAttempts()) {
            LocalDateTime lockedUntil = LocalDateTime.now().plusMinutes(policy.getLockoutDurationMinutes());
            user.setAccountLockedUntil(lockedUntil);
            userRepo.save(user);

            log.warn("Account locked due to failed attempts: user={}, count={}",
                    user.getUsername(), user.getFailedLoginCount());

            saveAuditLog(user, LoginAttemptResult.FAIL,
                    "Account locked after " + user.getFailedLoginCount() + " failures",
                    httpRequest);

            return LockoutStatus.LOCKED;
        }

        String failureReason = user.getAccountLockedUntil() != null
                ? "Account is locked"
                : (reason != null ? reason : "Invalid credentials");
        saveAuditLog(user, LoginAttemptResult.FAIL, failureReason, httpRequest);

        if (user.getFailedLoginCount() >= policy.getMaxFailedAttempts() - 2) {
            log.info("Lockout warning for user {}: {} of {} attempts remaining",
                    user.getUsername(), policy.getMaxFailedAttempts() - user.getFailedLoginCount(),
                    policy.getMaxFailedAttempts());
        }

        return LockoutStatus.WARNING;
    }

    /**
     * Record a successful login attempt. Resets failed count.
     */
    @Transactional
    public void recordSuccess(User user, HttpServletRequest httpRequest) {
        user.setFailedLoginCount(0);
        user.setAccountLockedUntil(null);
        userRepo.save(user);
        saveAuditLog(user, LoginAttemptResult.SUCCESS, null, httpRequest);
    }

    /**
     * Unlock an account manually (admin action).
     */
    @Transactional
    public void unlockAccount(UUID userId, String adminUser) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setFailedLoginCount(0);
        user.setAccountLockedUntil(null);
        userRepo.save(user);

        log.info("Account unlocked by admin {}: user={}", adminUser, user.getUsername());

        LoginAuditLog auditLog = buildAuditLog(user, LoginAttemptResult.SUCCESS,
                "Account unlocked by admin: " + adminUser, null);
        loginAuditLogRepo.save(auditLog);
    }

    private void saveAuditLog(User user, LoginAttemptResult result,
                              String failureReason, HttpServletRequest httpRequest) {
        LoginAuditLog entry = buildAuditLog(user, result, failureReason, httpRequest);
        loginAuditLogRepo.save(entry);
    }

    private LoginAuditLog buildAuditLog(User user, LoginAttemptResult result,
                                         String failureReason, HttpServletRequest httpRequest) {
        LoginAuditLog entry = new LoginAuditLog();
        entry.setUserId(user.getId());
        entry.setUsername(user.getUsername());
        entry.setAttemptType(LoginAttemptType.CREDENTIALS);
        entry.setResult(result);
        entry.setFailureReason(failureReason);
        entry.setAttemptedAt(LocalDateTime.now());
        if (httpRequest != null) {
            entry.setIpAddress(httpRequest.getRemoteAddr());
            entry.setUserAgent(httpRequest.getHeader("User-Agent"));
        }
        return entry;
    }

    private LockoutPolicy createDefault() {
        LockoutPolicy p = new LockoutPolicy();
        p.setId(POLICY_ID);
        return p;
    }

    @Override
    public void run(String... args) throws Exception {
        if (!policyRepo.existsById(POLICY_ID)) {
            LockoutPolicy p = createDefault();
            policyRepo.save(p);
            log.info("Default lockout policy seeded");
        }
    }
}