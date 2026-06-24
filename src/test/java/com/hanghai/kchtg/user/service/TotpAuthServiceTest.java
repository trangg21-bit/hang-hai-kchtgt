package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.TotpValidator;
import com.hanghai.kchtg.user.dto.MfaChallengeResponse;
import com.hanghai.kchtg.user.dto.TotpLoginRequest;
import com.hanghai.kchtg.user.dto.TwoFactorLoginResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests cho {@link TotpAuthService} - 2-phase login orchestrator.
 */
@ExtendWith(MockitoExtension.class)
class TotpAuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenService tokenService;

    @Mock
    private HttpServletRequest httpRequest;

    @Spy
    private TotpValidator totpValidator;

    @Mock
    private LoginAuditLogService auditLogService;

    @InjectMocks
    private TotpAuthService service;

    private UUID testUserId;
    private User testUser;
    private TotpValidator realValidator;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        testUser = new User();
        testUser.setId(testUserId);
        testUser.setUsername("testuser");
        testUser.setPassword("$2a$10$dummyHashForTesting");
        testUser.setEmail("test@example.com");
        testUser.setFullName("Test User");
        testUser.setRole("ROLE_USER");
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setTotpEnabled(false);
        testUser.setFailedLoginCount(0);
        testUser.setFailedTotpCount(0);
        testUser.setAccountLockedUntil(null);

        realValidator = new TotpValidator();
    }

    @Test
    @DisplayName("Phase 1: User khong TOTP - tra ve skipChallenge va JWT")
    void shouldSkipMfaWhenTotpNotEnabled() {
        when(userRepository.findByUsernameOrEmail(anyString()))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        MfaChallengeResponse response = service.authenticateCredentials(
                "testuser", "password", httpRequest);

        assertFalse(response.isTotpRequired());
        assertEquals(testUserId, response.getUserId());
        assertFalse(response.isRequiresMfa());
    }

    @Test
    @DisplayName("Phase 1: User khong ton tai - throw IllegalArgumentException")
    void shouldThrowWhenUserNotFound() {
        when(userRepository.findByUsernameOrEmail(anyString()))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.authenticateCredentials("unknown", "password", httpRequest));
        assertEquals("Invalid username or password", ex.getMessage());

        // Confirm anti-enumeration: passwordEncoder.matches duoc goi voi dummy hash
        verify(passwordEncoder).matches(anyString(), eq("$2a$dummy$never"));
    }

    @Test
    @DisplayName("Phase 1: Sai password - tang failedLoginCount, throw")
    void shouldIncrementFailedLoginCountOnWrongPassword() {
        when(userRepository.findByUsernameOrEmail(anyString()))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.authenticateCredentials("testuser", "wrong", httpRequest));
        assertEquals("Invalid username or password", ex.getMessage());

        verify(userRepository).save(argThat(u -> u.getFailedLoginCount() == 1));
    }

    @Test
    @DisplayName("Phase 2: TOTP dung - tra ve dual JWT")
    void shouldReturnDualJwtOnValidTotp() {
        testUser.setTotpEnabled(true);
        String secret = realValidator.generateSecret();
        testUser.setTotpSecret(secret);

        // Generate a valid TOTP code for the secret using GoogleAuthenticator
        com.warrenstrange.googleauth.GoogleAuthenticator gat = new com.warrenstrange.googleauth.GoogleAuthenticator();
        int validCodeInt = gat.getTotpPassword(secret);
        String validCode = String.format("%06d", validCodeInt);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        when(tokenService.createAccessToken(any(User.class))).thenReturn("access-token");
        when(tokenService.createRefreshToken(any(User.class))).thenReturn("refresh-token");
        when(tokenService.getAccessTokenExpiration()).thenReturn(900000L);
        when(tokenService.getRefreshTokenExpiration()).thenReturn(604800000L);

        TotpLoginRequest request = new TotpLoginRequest(testUserId, validCode);
        TwoFactorLoginResponse response = service.verifyTotp(request, httpRequest);

        assertNotNull(response);
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        assertEquals("Bearer", response.getTokenType());
        assertNotNull(response.getUser());
        assertEquals("testuser", response.getUser().getUsername());
    }

    @Test
    @DisplayName("Phase 2: TOTP sai - tang failedTotpCount, throw")
    void shouldRejectInvalidTotpCode() {
        testUser.setTotpEnabled(true);
        testUser.setTotpSecret(realValidator.generateSecret());

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        TotpLoginRequest request = new TotpLoginRequest(testUserId, "000000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.verifyTotp(request, httpRequest));
        assertEquals("Invalid TOTP code", ex.getMessage());

        verify(userRepository).save(argThat(u -> u.getFailedTotpCount() == 1));
    }

    @Test
    @DisplayName("Phase 2: User chua enable TOTP - throw")
    void shouldRejectWhenTotpNotEnabled() {
        testUser.setTotpEnabled(false);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        TotpLoginRequest request = new TotpLoginRequest(testUserId, "123456");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.verifyTotp(request, httpRequest));
        assertEquals("TOTP is not enabled for this account", ex.getMessage());
    }

    @Test
    @DisplayName("Phase 2: User bi khoa - throw")
    void shouldRejectWhenAccountLocked() {
        testUser.setTotpEnabled(true);
        testUser.setStatus(UserStatus.LOCKED);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        TotpLoginRequest request = new TotpLoginRequest(testUserId, "123456");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.verifyTotp(request, httpRequest));
        assertEquals("Account is locked", ex.getMessage());
    }

    @Test
    @DisplayName("Phase 2: Account lock sau 5 that bai - set accountLockedUntil")
    void shouldLockAccountAfterMaxTotpAttempts() {
        testUser.setTotpEnabled(true);
        testUser.setTotpSecret(realValidator.generateSecret());
        testUser.setFailedTotpCount(4); // 1 more fail = lock

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        TotpLoginRequest request = new TotpLoginRequest(testUserId, "000000");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.verifyTotp(request, httpRequest));

        verify(userRepository).save(argThat(u ->
                u.getFailedTotpCount() == 5
                        && u.getAccountLockedUntil() != null
                        && u.getAccountLockedUntil().isAfter(LocalDateTime.now())));
    }

    @Test
    @DisplayName("Refresh token: tra ve new access token")
    void shouldRefreshTokenSuccessfully() {
        io.jsonwebtoken.Claims mockClaims = createMockClaims(testUserId.toString());
        when(tokenService.validateToken("refresh-token-string")).thenReturn(mockClaims);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(tokenService.createAccessToken(testUser)).thenReturn("new-access-token");

        String newToken = service.refreshToken("refresh-token-string", httpRequest);
        assertEquals("new-access-token", newToken);
    }

    // Mock Claims helper
    private io.jsonwebtoken.Claims createMockClaims(String userId) {
        io.jsonwebtoken.Claims claims = mock(io.jsonwebtoken.Claims.class);
        when(claims.getSubject()).thenReturn("testuser");
        when(claims.get("type", String.class)).thenReturn("refresh");
        when(claims.get("user_id", String.class)).thenReturn(userId);
        return claims;
    }
}