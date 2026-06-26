package com.hanghai.kchtg.user.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.security.ClientEncryptionService;
import com.hanghai.kchtg.user.dto.RegisterConfigResponse;
import com.hanghai.kchtg.user.service.PasswordPolicyValidator;
import com.hanghai.kchtg.user.service.RateLimiterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Config controller - returns registration settings (password policy, RSA public key, rate limits).
 */
@RestController
@RequestMapping("/api/register")
public class RegisterConfigController {

    private static final Logger log = LoggerFactory.getLogger(RegisterConfigController.class);

    private final PasswordPolicyValidator passwordPolicyValidator;
    private final RateLimiterService rateLimiterService;
    private final ClientEncryptionService clientEncryptionService;

    public RegisterConfigController(PasswordPolicyValidator passwordPolicyValidator,
                                     RateLimiterService rateLimiterService,
                                     ClientEncryptionService clientEncryptionService) {
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.rateLimiterService = rateLimiterService;
        this.clientEncryptionService = clientEncryptionService;
    }

    /**
     * GET /api/register/config - returns registration configuration to the client.
     */
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<RegisterConfigResponse>> getConfig() {
        RegisterConfigResponse config = new RegisterConfigResponse();

        // Password policy
        RegisterConfigResponse.PasswordPolicy policy = new RegisterConfigResponse.PasswordPolicy();
        policy.setMinLength(passwordPolicyValidator.getMinLength());
        policy.setMaxLength(passwordPolicyValidator.getMaxLength());
        policy.setRequireUppercase(true);
        policy.setRequireLowercase(true);
        policy.setRequireDigit(true);
        policy.setRequireSpecialChar(true);
        config.setPasswordPolicy(policy);

        // RSA encryption
        config.setRsaEncryptionEnabled(clientEncryptionService.isEnabled());
        config.setRsaPublicKey(clientEncryptionService.getPublicKeyBase64());

        // Rate limit config (exposed to client for UX)
        RegisterConfigResponse.RateLimitConfig rateLimit = new RegisterConfigResponse.RateLimitConfig();
        // We use defaults; RateLimiterService doesn't expose getters for config, but we can use known defaults
        rateLimit.setMaxRequests(5);
        rateLimit.setWindowMinutes(5);
        config.setRateLimit(rateLimit);

        log.debug("Registration config requested");
        return ResponseEntity.ok(ApiResponse.success("Registration configuration", config));
    }
}
