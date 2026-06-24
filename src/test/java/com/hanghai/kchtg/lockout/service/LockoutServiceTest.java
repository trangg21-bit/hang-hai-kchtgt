package com.hanghai.kchtg.lockout.service;

import com.hanghai.kchtg.lockout.dto.enums.LockoutStatus;
import com.hanghai.kchtg.lockout.entity.LockoutPolicy;
import com.hanghai.kchtg.lockout.repository.LockoutPolicyRepository;
import com.hanghai.kchtg.user.entity.LoginAttemptResult;
import com.hanghai.kchtg.user.entity.LoginAuditLog;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.LoginAuditLogRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LockoutServiceTest {

    @Mock
    private LockoutPolicyRepository policyRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private LoginAuditLogRepository loginAuditLogRepo;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private LockoutService lockoutService;

    private UUID testUserId;
    private User testUser;
    private LockoutPolicy defaultPolicy;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setUsername("testuser");
        testUser.setFailedLoginCount(0);
        testUser.setAccountLockedUntil(null);

        defaultPolicy = new LockoutPolicy();
        defaultPolicy.setId(1L);
        defaultPolicy.setMaxFailedAttempts(5);
        defaultPolicy.setLockoutDurationMinutes(30);
        defaultPolicy.setWindowMinutes(15);
        defaultPolicy.setEnabled(true);

        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(httpRequest.getHeader("User-Agent")).thenReturn("TestAgent/1.0");

        when(policyRepo.findById(1L)).thenReturn(Optional.of(defaultPolicy));
    }

    @Test
    void checkLockout_whenPolicyDisabled_shouldReturnUnrestricted() {
        LockoutPolicy disabledPolicy = new LockoutPolicy();
        disabledPolicy.setId(1L);
        disabledPolicy.setEnabled(false);
        when(policyRepo.findById(1L)).thenReturn(Optional.of(disabledPolicy));

        LockoutStatus status = lockoutService.checkLockout(testUser);

        assertEquals(LockoutStatus.UNRESTRICTED, status);
    }

    @Test
    void checkLockout_whenUserLockedAndNotExpired_shouldReturnLocked() {
        LocalDateTime futureLock = LocalDateTime.now().plusMinutes(10);
        testUser.setAccountLockedUntil(futureLock);
        testUser.setFailedLoginCount(5);

        LockoutStatus status = lockoutService.checkLockout(testUser);

        assertEquals(LockoutStatus.LOCKED, status);
    }

    @Test
    void checkLockout_whenUserLockedAndExpired_shouldAutoUnlockAndReturnUnrestricted() {
        LocalDateTime pastLock = LocalDateTime.now().minusMinutes(10);
        testUser.setAccountLockedUntil(pastLock);
        testUser.setFailedLoginCount(5);

        LockoutStatus status = lockoutService.checkLockout(testUser);

        assertEquals(LockoutStatus.UNRESTRICTED, status);
        ArgumentCaptor<User> savedUserCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepo).save(savedUserCaptor.capture());
        User savedUser = savedUserCaptor.getValue();
        assertNull(savedUser.getAccountLockedUntil());
        assertEquals(0, savedUser.getFailedLoginCount());
    }

    @Test
    void checkLockout_whenNoLockAndPolicyEnabled_shouldReturnOk() {
        testUser.setAccountLockedUntil(null);
        testUser.setFailedLoginCount(2);

        LockoutStatus status = lockoutService.checkLockout(testUser);

        assertEquals(LockoutStatus.OK, status);
    }

    @Test
    void recordFailure_belowThreshold_shouldIncrementAndReturnWarning() {
        testUser.setFailedLoginCount(3);

        LockoutStatus status = lockoutService.recordFailure(testUser, "Invalid credentials", httpRequest);

        assertEquals(LockoutStatus.WARNING, status);
        assertEquals(4, testUser.getFailedLoginCount());
        ArgumentCaptor<LoginAuditLog> logCaptor = ArgumentCaptor.forClass(LoginAuditLog.class);
        verify(loginAuditLogRepo).save(logCaptor.capture());
        LoginAuditLog auditLog = logCaptor.getValue();
        assertEquals(LoginAttemptResult.FAIL, auditLog.getResult());
        assertEquals("Invalid credentials", auditLog.getFailureReason());
        assertEquals("127.0.0.1", auditLog.getIpAddress());
        assertEquals("TestAgent/1.0", auditLog.getUserAgent());
    }

    @Test
    void recordFailure_atThreshold_shouldLockAccountAndReturnLocked() {
        testUser.setFailedLoginCount(5);

        LockoutStatus status = lockoutService.recordFailure(testUser, "Invalid credentials", httpRequest);

        assertEquals(LockoutStatus.LOCKED, status);
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepo).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertNotNull(savedUser.getAccountLockedUntil());
        assertTrue(savedUser.getAccountLockedUntil().isAfter(LocalDateTime.now()));
        ArgumentCaptor<LoginAuditLog> logCaptor = ArgumentCaptor.forClass(LoginAuditLog.class);
        verify(loginAuditLogRepo).save(logCaptor.capture());
        LoginAuditLog auditLog = logCaptor.getValue();
        assertEquals(LoginAttemptResult.FAIL, auditLog.getResult());
        assertTrue(auditLog.getFailureReason().contains("locked"));
    }

    @Test
    void recordFailure_alreadyLocked_shouldStillLockAccount() {
        LocalDateTime futureLock = LocalDateTime.now().plusMinutes(20);
        testUser.setAccountLockedUntil(futureLock);
        testUser.setFailedLoginCount(5);

        LockoutStatus status = lockoutService.recordFailure(testUser, "Invalid credentials", httpRequest);

        assertEquals(LockoutStatus.LOCKED, status);
        ArgumentCaptor<LoginAuditLog> logCaptor = ArgumentCaptor.forClass(LoginAuditLog.class);
        verify(loginAuditLogRepo).save(logCaptor.capture());
        LoginAuditLog auditLog = logCaptor.getValue();
        assertTrue(auditLog.getFailureReason().contains("locked"));
    }

    @Test
    void recordFailure_oneBeforeThreshold_shouldTriggerWarningLog() {
        testUser.setFailedLoginCount(3);

        LockoutStatus status = lockoutService.recordFailure(testUser, "Bad password", httpRequest);

        assertEquals(LockoutStatus.WARNING, status);
        assertEquals(4, testUser.getFailedLoginCount());
    }

    @Test
    void recordFailure_noReason_shouldDefaultToInvalidCredentials() {
        testUser.setFailedLoginCount(0);

        lockoutService.recordFailure(testUser, null, httpRequest);

        ArgumentCaptor<LoginAuditLog> logCaptor = ArgumentCaptor.forClass(LoginAuditLog.class);
        verify(loginAuditLogRepo).save(logCaptor.capture());
        assertEquals("Invalid credentials", logCaptor.getValue().getFailureReason());
    }

    @Test
    void recordFailure_neverFoundPolicy_shouldCreateDefault() {
        when(policyRepo.findById(1L)).thenReturn(Optional.empty());

        testUser.setFailedLoginCount(0);
        LockoutStatus status = lockoutService.recordFailure(testUser, "Test", httpRequest);

        assertEquals(LockoutStatus.WARNING, status);
    }

    @Test
    void recordSuccess_shouldResetFailedCountAndClearLock() {
        testUser.setFailedLoginCount(4);
        testUser.setAccountLockedUntil(LocalDateTime.now().plusMinutes(10));

        lockoutService.recordSuccess(testUser, httpRequest);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepo).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals(0, savedUser.getFailedLoginCount());
        assertNull(savedUser.getAccountLockedUntil());
        ArgumentCaptor<LoginAuditLog> logCaptor = ArgumentCaptor.forClass(LoginAuditLog.class);
        verify(loginAuditLogRepo).save(logCaptor.capture());
        assertEquals(LoginAttemptResult.SUCCESS, logCaptor.getValue().getResult());
        assertNull(logCaptor.getValue().getFailureReason());
    }

    @Test
    void recordSuccess_noLockToClear_shouldStillResetCount() {
        testUser.setFailedLoginCount(2);
        testUser.setAccountLockedUntil(null);

        lockoutService.recordSuccess(testUser, httpRequest);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepo).save(userCaptor.capture());
        assertEquals(0, userCaptor.getValue().getFailedLoginCount());
    }

    @Test
    void unlockAccount_shouldResetCountAndLockAndSaveAuditLog() {
        User lockedUser = new User();
        lockedUser.setId(UUID.randomUUID());
        lockedUser.setUsername("lockeduser");
        lockedUser.setFailedLoginCount(5);
        lockedUser.setAccountLockedUntil(LocalDateTime.now().plusMinutes(10));
        when(userRepo.findById(lockedUser.getId())).thenReturn(Optional.of(lockedUser));

        lockoutService.unlockAccount(lockedUser.getId(), "admin1");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepo).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals(0, savedUser.getFailedLoginCount());
        assertNull(savedUser.getAccountLockedUntil());
        ArgumentCaptor<LoginAuditLog> logCaptor = ArgumentCaptor.forClass(LoginAuditLog.class);
        verify(loginAuditLogRepo).save(logCaptor.capture());
        LoginAuditLog auditLog = logCaptor.getValue();
        assertEquals(LoginAttemptResult.SUCCESS, auditLog.getResult());
        assertTrue(auditLog.getFailureReason().contains("admin1"));
    }

    @Test
    void unlockAccount_userNotFound_shouldThrowIllegalArgumentException() {
        when(userRepo.findById(any(UUID.class))).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                lockoutService.unlockAccount(UUID.randomUUID(), "admin1"));
    }

    @Test
    void recordSuccess_nullHttpRequest_shouldNotNpe() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("user_no_request");
        user.setFailedLoginCount(3);
        when(userRepo.findById(user.getId())).thenReturn(Optional.of(user));

        lockoutService.recordSuccess(user, null);

        ArgumentCaptor<LoginAuditLog> logCaptor = ArgumentCaptor.forClass(LoginAuditLog.class);
        verify(loginAuditLogRepo).save(logCaptor.capture());
        assertNull(logCaptor.getValue().getIpAddress());
        assertNull(logCaptor.getValue().getUserAgent());
    }
}