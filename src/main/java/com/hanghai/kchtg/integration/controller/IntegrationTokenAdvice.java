package com.hanghai.kchtg.integration.controller;

import com.hanghai.kchtg.common.exception.UnauthorizedIntegrationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestHeader;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.List;

/**
 * Centralized token validator for IntegrationShareController endpoints.
 * Intercepts requests and checks if the X-Integration-Token header matches any active expected token
 * (supporting rotation via comma-separated tokens) using timing-attack resistant comparison.
 */
@ControllerAdvice(assignableTypes = {IntegrationShareController.class, PortCargoShareController.class})
public class IntegrationTokenAdvice {

    private final List<String> expectedTokens;

    public IntegrationTokenAdvice(@Value("${integration.share.token:integration-secret-token-2026}") String expectedTokenConfig) {
        if (expectedTokenConfig == null || expectedTokenConfig.isBlank()) {
            this.expectedTokens = List.of();
        } else {
            this.expectedTokens = Arrays.stream(expectedTokenConfig.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
    }

    @ModelAttribute
    public void validateToken(@RequestHeader(value = "X-Integration-Token", required = false) String token) {
        if (token == null || token.isBlank()) {
            throw new UnauthorizedIntegrationException("Unauthorized: Missing integration token.");
        }
        if (expectedTokens.isEmpty()) {
            throw new UnauthorizedIntegrationException("Unauthorized: No integration tokens configured.");
        }
        byte[] tokenBytes = token.trim().getBytes(StandardCharsets.UTF_8);
        boolean matched = false;
        for (String expectedToken : expectedTokens) {
            byte[] expectedBytes = expectedToken.getBytes(StandardCharsets.UTF_8);
            if (MessageDigest.isEqual(tokenBytes, expectedBytes)) {
                matched = true;
                break;
            }
        }
        if (!matched) {
            throw new UnauthorizedIntegrationException("Unauthorized: Invalid integration token.");
        }
    }
}