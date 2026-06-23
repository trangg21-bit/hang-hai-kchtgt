package com.hanghai.kchtg.integration.controller;

import com.hanghai.kchtg.common.exception.UnauthorizedIntegrationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestHeader;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Centralized token validator for IntegrationShareController endpoints.
 * Intercepts requests and checks if the X-Integration-Token header matches the expected token
 * using timing-attack resistant comparison.
 */
@ControllerAdvice(assignableTypes = {IntegrationShareController.class, PortCargoShareController.class})
public class IntegrationTokenAdvice {

    private final String expectedToken;

    public IntegrationTokenAdvice(@Value("${integration.share.token:integration-secret-token-2026}") String expectedToken) {
        this.expectedToken = expectedToken;
    }

    @ModelAttribute
    public void validateToken(@RequestHeader(value = "X-Integration-Token", required = false) String token) {
        if (token == null || token.isBlank()) {
            throw new UnauthorizedIntegrationException("Unauthorized: Missing integration token.");
        }
        byte[] tokenBytes = token.trim().getBytes(StandardCharsets.UTF_8);
        byte[] expectedBytes = expectedToken.getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(tokenBytes, expectedBytes)) {
            throw new UnauthorizedIntegrationException("Unauthorized: Invalid integration token.");
        }
    }
}
