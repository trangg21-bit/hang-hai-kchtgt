package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.security.ClientEncryptionService;
import com.hanghai.kchtg.user.dto.RegisterAccountRequest;
import com.hanghai.kchtg.user.dto.RegisterResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.exception.DuplicateResourceException;
import com.hanghai.kchtg.user.exception.RegistrationException;
import com.hanghai.kchtg.user.exception.ValidationException;
import com.hanghai.kchtg.user.exception.RateLimitExceededException;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.doNothing;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RegistrationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PasswordPolicyValidator passwordPolicyValidator;

    @Mock
    private ClientEncryptionService clientEncryptionService;

    @Mock
    private VerificationTokenService verificationTokenService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AccountRegistrationAuditService auditService;

    @Mock
    private RateLimiterService rateLimiterService;

    @InjectMocks
    private RegistrationService registrationService;

    private UUID testUserId;
    private RegisterAccountRequest validRequest;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        validRequest = new RegisterAccountRequest();
        validRequest.setUsername("testuser");
        validRequest.setPassword("StrongPass!123");
        validRequest.setEmail("test@example.com");
        validRequest.setFullName("Test User");
        validRequest.setPhone("0901234567");
        validRequest.setRole("ROLE_USER");
    }

    @Test
    void register_shouldCreateUserSuccessfully() {
        // Given
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("0901234567")).thenReturn(false);
        when(passwordEncoder.encode("StrongPass!123")).thenReturn("encodedPassword");
        when(verificationTokenService.generateToken(any(UUID.class), any(String.class), any(String.class)))
                .thenReturn("mockToken");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(testUserId);
            saved.setCreatedAt(LocalDateTime.now());
            saved.setUpdatedAt(LocalDateTime.now());
            return saved;
        });

        // When
        RegisterResponse response = registrationService.register(validRequest, "127.0.0.1", "TestAgent");

        // Then
        assertNotNull(response);
        assertEquals("testuser", response.getUsername());
        assertEquals("test@example.com", response.getEmail());
        assertEquals("PENDING_VERIFICATION", response.getStatus());
        assertTrue(response.getMessage().contains("thành công"));

        // Verify user was saved with correct fields
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("testuser", savedUser.getUsername());
        assertEquals("encodedPassword", savedUser.getPassword());
        assertEquals("test@example.com", savedUser.getEmail());
        assertEquals("Test User", savedUser.getFullName());
        assertEquals("0901234567", savedUser.getPhone());
        assertEquals(UserStatus.PENDING_VERIFICATION, savedUser.getStatus());

        // Verify all steps called
        verify(passwordPolicyValidator).validate("StrongPass!123");
        verify(verificationTokenService).generateToken(any(), any(), any());
        verify(notificationService).sendVerificationEmail(eq("test@example.com"), eq("mockToken"), eq("Test User"));
        verify(auditService).logSuccess(eq(testUserId), eq("test@example.com"), eq("REGISTER_SUCCESS"), anyLong(), eq("127.0.0.1"), eq("TestAgent"));
        verify(rateLimiterService).reset("test@example.com");
    }

    @Test
    void register_shouldRejectDuplicateUsername() {
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        RegistrationException ex = assertThrows(RegistrationException.class, () ->
                registrationService.register(validRequest, "127.0.0.1", "TestAgent"));

        assertEquals("DUPLICATE_RESOURCE", ex.getErrorCode());
        verify(auditService).logFailure(any(), anyString(), eq("REGISTER_FAILURE"), anyString(), eq("127.0.0.1"), eq("TestAgent"));
    }

    @Test
    void register_shouldRejectDuplicateEmail() {
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        RegistrationException ex = assertThrows(RegistrationException.class, () ->
                registrationService.register(validRequest, "127.0.0.1", "TestAgent"));

        assertEquals("DUPLICATE_RESOURCE", ex.getErrorCode());
    }

    @Test
    void register_shouldRejectDuplicatePhone() {
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("0901234567")).thenReturn(true);

        RegistrationException ex = assertThrows(RegistrationException.class, () ->
                registrationService.register(validRequest, "127.0.0.1", "TestAgent"));

        assertEquals("DUPLICATE_RESOURCE", ex.getErrorCode());
    }

    @Test
    void register_shouldRejectWeakPassword() {
        lenient().when(userRepository.existsByUsername(anyString())).thenReturn(false);
        lenient().when(userRepository.existsByEmail(anyString())).thenReturn(false);
        lenient().when(userRepository.existsByPhone(anyString())).thenReturn(false);
        lenient().doThrow(new ValidationException("VALIDATION_ERROR", "Password does not meet complexity requirements"))
                .when(passwordPolicyValidator).validate(anyString());

        RegisterAccountRequest weakRequest = new RegisterAccountRequest();
        weakRequest.setUsername("testuser");
        weakRequest.setPassword("weak"); // Too short
        weakRequest.setEmail("test@example.com");

        ValidationException ex = assertThrows(ValidationException.class, () ->
                registrationService.register(weakRequest, "127.0.0.1", "TestAgent"));

        assertEquals("VALIDATION_ERROR", ex.getErrorCode());
    }

    @Test
    void register_shouldRejectRateLimitExceeded() {
        doThrow(new RateLimitExceededException("Too many requests", 300))
                .when(rateLimiterService).checkLimit("test@example.com");

        RateLimitExceededException ex = assertThrows(RateLimitExceededException.class, () ->
                registrationService.register(validRequest, "127.0.0.1", "TestAgent"));

        assertEquals(300, ex.getRetryAfterSeconds());
    }

    @Test
    void register_shouldDecryptRsaPassword() {
        validRequest.setPassword("U3Ryb25nUGFzcyExMjM");
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("0901234567")).thenReturn(false);
        doNothing().when(rateLimiterService).checkLimit("test@example.com");
        when(clientEncryptionService.isEnabled()).thenReturn(true);
        when(clientEncryptionService.decrypt("encryptedPassword"))
                .thenReturn("StrongPass!123");
        when(passwordEncoder.encode("StrongPass!123")).thenReturn("encodedPassword");
        when(verificationTokenService.generateToken(any(UUID.class), any(String.class), any(String.class)))
                .thenReturn("mockToken");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(testUserId);
            saved.setCreatedAt(LocalDateTime.now());
            saved.setUpdatedAt(LocalDateTime.now());
            return saved;
        });

        RegisterResponse response = registrationService.register(validRequest, "127.0.0.1", "TestAgent");

        assertNotNull(response);
        verify(clientEncryptionService).decrypt("U3Ryb25nUGFzcyExMjM");
    }
}