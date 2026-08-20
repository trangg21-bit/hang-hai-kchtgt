package com.hanghai.kchtg.integration.controller;

import com.hanghai.kchtg.common.exception.UnauthorizedIntegrationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class IntegrationTokenAdviceTest {

    @Test
    @DisplayName("Valid token matching single configured token passes validation")
    void validToken_singleTokenConfigured_passes() {
        IntegrationTokenAdvice advice = new IntegrationTokenAdvice("secret-token-123");
        assertDoesNotThrow(() -> advice.validateToken("secret-token-123"));
    }

    @Test
    @DisplayName("Valid token matching any rotated token in comma-separated list passes validation")
    void validToken_multiTokenConfigured_passes() {
        IntegrationTokenAdvice advice = new IntegrationTokenAdvice("old-token-1, new-token-2, backup-token-3");
        assertDoesNotThrow(() -> advice.validateToken("old-token-1"));
        assertDoesNotThrow(() -> advice.validateToken("new-token-2"));
        assertDoesNotThrow(() -> advice.validateToken("backup-token-3"));
    }

    @Test
    @DisplayName("Invalid token throws UnauthorizedIntegrationException")
    void invalidToken_throwsUnauthorizedException() {
        IntegrationTokenAdvice advice = new IntegrationTokenAdvice("token-A, token-B");
        UnauthorizedIntegrationException ex = assertThrows(UnauthorizedIntegrationException.class,
                () -> advice.validateToken("wrong-token"));
        assertTrue(ex.getMessage().contains("Invalid integration token"));
    }

    @Test
    @DisplayName("Missing or null token throws UnauthorizedIntegrationException")
    void missingToken_throwsUnauthorizedException() {
        IntegrationTokenAdvice advice = new IntegrationTokenAdvice("secret-token");
        assertThrows(UnauthorizedIntegrationException.class, () -> advice.validateToken(null));
        assertThrows(UnauthorizedIntegrationException.class, () -> advice.validateToken(""));
        assertThrows(UnauthorizedIntegrationException.class, () -> advice.validateToken("   "));
    }

    @Test
    @DisplayName("Empty config throws UnauthorizedIntegrationException")
    void emptyConfig_throwsUnauthorizedException() {
        IntegrationTokenAdvice advice = new IntegrationTokenAdvice("");
        assertThrows(UnauthorizedIntegrationException.class, () -> advice.validateToken("any-token"));
    }
}
