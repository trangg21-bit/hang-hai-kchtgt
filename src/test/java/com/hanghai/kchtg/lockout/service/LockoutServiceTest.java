package com.hanghai.kchtg.lockout.service;

import com.hanghai.kchtg.lockout.dto.enums.LockoutStatus;
import com.hanghai.kchtg.lockout.entity.LockoutPolicy;
import com.hanghai.kchtg.lockout.repository.LockoutPolicyRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.LoginAuditLogRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LockoutServiceTest {

    @Mock
    private LockoutPolicyRepository policyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoginAuditLogRepository loginAuditLogRepository;

    private LockoutService lockoutService;
    private User user;

    @BeforeEach
    void setUp() {
        LockoutPolicy policy = new LockoutPolicy();
        policy.setId(1L);
        policy.setEnabled(true);
        policy.setMaxFailedAttempts(5);
        policy.setLockoutDurationMinutes(30);
        lenient().when(policyRepository.findById(1L)).thenReturn(Optional.of(policy));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lockoutService = new LockoutService(policyRepository, userRepository, loginAuditLogRepository);
        user = new User();
        user.setUsername("test-user");
        user.setStatus(UserStatus.ACTIVE);
        user.setPasswordHashVersion(0);
    }

    @Test
    void recordFailure_shouldLockAccountForThirtyMinutesOnFifthAttempt() {
        LockoutStatus status = LockoutStatus.OK;

        for (int attempt = 1; attempt <= 5; attempt++) {
            status = lockoutService.recordFailure(user, "Sai mật khẩu", null);
        }

        assertEquals(LockoutStatus.LOCKED, status);
        assertEquals(5, user.getFailedLoginCount());
        assertEquals(UserStatus.LOCKED, user.getStatus());
        assertNotNull(user.getAccountLockedUntil());
        assertTrue(user.getAccountLockedUntil().isAfter(LocalDateTime.now().plusMinutes(29)));
        assertTrue(user.getAccountLockedUntil().isBefore(LocalDateTime.now().plusMinutes(31)));
        assertEquals(1, user.getPasswordHashVersion());
    }

    @Test
    void checkLockout_shouldAutomaticallyUnlockAfterExpiry() {
        user.setStatus(UserStatus.LOCKED);
        user.setFailedLoginCount(5);
        user.setAccountLockedUntil(LocalDateTime.now().minusSeconds(1));

        LockoutStatus status = lockoutService.checkLockout(user);

        assertEquals(LockoutStatus.UNRESTRICTED, status);
        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertEquals(0, user.getFailedLoginCount());
        assertNull(user.getAccountLockedUntil());
    }

    @Test
    void recordSuccess_shouldPersistActiveStatusAfterTemporaryLockout() {
        user.setStatus(UserStatus.LOCKED);
        user.setFailedLoginCount(5);
        user.setFailedTotpCount(2);
        user.setAccountLockedUntil(LocalDateTime.now().minusSeconds(1));

        lockoutService.recordSuccess(user, null);

        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertEquals(0, user.getFailedLoginCount());
        assertEquals(0, user.getFailedTotpCount());
        assertNull(user.getAccountLockedUntil());
    }

    @Test
    void recordSuccess_shouldNotReactivateExplicitLockWithoutExpiry() {
        user.setStatus(UserStatus.LOCKED);
        user.setAccountLockedUntil(null);

        lockoutService.recordSuccess(user, null);

        assertEquals(UserStatus.LOCKED, user.getStatus());
    }
}
