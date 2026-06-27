package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.security.ClientEncryptionService;
import com.hanghai.kchtg.user.dto.RegisterAccountRequest;
import com.hanghai.kchtg.user.dto.RegisterResponse;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.exception.DuplicateResourceException;
import com.hanghai.kchtg.user.exception.ValidationException;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Core service for account registration.
 * <p>
 * Orchestrates: validation ->’ dedup ->’ encryption ->’ password hashing ->’ entity creation
 * ->’ token generation ->’ notification ->’ audit.
 * </p>
 */
@Service
public class RegistrationService {

    private static final Logger log = LoggerFactory.getLogger(RegistrationService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final ClientEncryptionService clientEncryptionService;
    private final VerificationTokenService verificationTokenService;
    private final NotificationService notificationService;
    private final AccountRegistrationAuditService auditService;
    private final RateLimiterService rateLimiterService;

    public RegistrationService(UserRepository userRepository,
                               RoleRepository roleRepository,
                               PasswordEncoder passwordEncoder,
                               PasswordPolicyValidator passwordPolicyValidator,
                               ClientEncryptionService clientEncryptionService,
                               VerificationTokenService verificationTokenService,
                               NotificationService notificationService,
                               AccountRegistrationAuditService auditService,
                               RateLimiterService rateLimiterService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.clientEncryptionService = clientEncryptionService;
        this.verificationTokenService = verificationTokenService;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.rateLimiterService = rateLimiterService;
    }

    /**
     * Registers a new account.
     *
     * @param request registration request (password may be RSA-encrypted)
     * @param ipAddress client IP address
     * @param userAgent client user-agent
     * @return registration response with user info and status
     */
    @Transactional
    public RegisterResponse register(RegisterAccountRequest request,
                                     String ipAddress,
                                     String userAgent) {
        long startTime = System.currentTimeMillis();
        String identifier = resolveIdentifier(request);

        // 1. Rate limit check
        rateLimiterService.checkLimit(identifier);

        try {
            // 2. Validate input
            validateRequest(request);

            // 3. Dedup check
            checkDuplicate(request);

            // 4. Decrypt password if RSA-encrypted
            String plainPassword = decryptPasswordIfNeeded(request.getPassword());

            // 5. Password policy validation
            passwordPolicyValidator.validate(plainPassword);

            // 6. Create user entity
            User user = createUser(request, plainPassword);

            // 7. Persist user
            user = userRepository.save(user);

            // 8. Generate verification token
            String plainToken = verificationTokenService.generateToken(user.getId(), user.getEmail(), user.getFullName());

            // 9. Send verification email
            notificationService.sendVerificationEmail(user.getEmail(), plainToken, user.getFullName());

            // 10. Audit log
            long duration = System.currentTimeMillis() - startTime;
            auditService.logSuccess(user.getId(), identifier, "REGISTER_SUCCESS", duration, ipAddress, userAgent);

            // 11. Reset rate limit on success
            rateLimiterService.reset(identifier);

            return buildResponse(user);

        } catch (com.hanghai.kchtg.user.exception.RateLimitExceededException e) {
            // Audit rate-limit event
            long duration = System.currentTimeMillis() - startTime;
            auditService.logFailure(null, identifier, "RATE_LIMITED", e.getMessage(), ipAddress, userAgent);
            throw e;

        } catch (com.hanghai.kchtg.user.exception.RegistrationException e) {
            long duration = System.currentTimeMillis() - startTime;
            auditService.logFailure(null, identifier, "REGISTER_FAILURE", e.getMessage(), ipAddress, userAgent);
            throw e;

        } catch (Exception e) {
            log.error("Unexpected error during registration for identifier={}", identifier, e);
            long duration = System.currentTimeMillis() - startTime;
            auditService.logFailure(null, identifier, "REGISTER_FAILURE",
                    "Internal server error: " + e.getMessage(), ipAddress, userAgent);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi đăng ký tài khoản");
        }
    }

    private String resolveIdentifier(RegisterAccountRequest request) {
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            return request.getEmail();
        }
        return request.getPhone() != null ? request.getPhone() : "unknown";
    }

    private void validateRequest(RegisterAccountRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new ValidationException("Tên đăng nhập không được để trống");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ValidationException("Mật khẩu không được để trống");
        }
    }

    private void checkDuplicate(RegisterAccountRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("tên đăng nhập", request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("email", request.getEmail());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()
                && userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicateResourceException("số điện thoại", request.getPhone());
        }
    }

    private String decryptPasswordIfNeeded(String encryptedPassword) {
        if (clientEncryptionService.isEnabled() && isBase64Url(encryptedPassword)) {
            try {
                String decrypted = clientEncryptionService.decrypt(encryptedPassword);
                if (decrypted != null && !decrypted.isBlank()) {
                    return decrypted;
                }
            } catch (Exception e) {
                log.debug("Password was not RSA-encrypted, using as-is");
            }
        }
        return encryptedPassword;
    }

    private boolean isBase64Url(String s) {
        if (s == null || s.length() < 16) return false;
        try {
            java.util.Base64.getUrlDecoder().decode(s);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private User createUser(RegisterAccountRequest request, String plainPassword) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(plainPassword));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        String roleCode = request.getRole() != null ? request.getRole() : "ROLE_USER";
        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new ValidationException("Vai trò không tồn tại: " + roleCode));
        user.getRoles().add(role);
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        return user;
    }

    private RegisterResponse buildResponse(User user) {
        RegisterResponse response = new RegisterResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setPhone(user.getPhone());
        response.setRole(user.getPrimaryRoleCode());
        response.setStatus(user.getStatus().name());
        response.setMessage("Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.");
        return response;
    }
}
