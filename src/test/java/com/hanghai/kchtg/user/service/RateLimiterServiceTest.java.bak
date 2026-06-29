package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.user.exception.RateLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class RateLimiterServiceTest {

    private RateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        // 3 max requests per 1 minute window
        rateLimiterService = new RateLimiterService(3, 1);
    }

    @Test
    void checkLimit_shouldPassForFirstThreeRequests() {
        String identifier = "test@example.com";

        assertDoesNotThrow(() -> rateLimiterService.checkLimit(identifier));
        assertDoesNotThrow(() -> rateLimiterService.checkLimit(identifier));
        assertDoesNotThrow(() -> rateLimiterService.checkLimit(identifier));
    }

    @Test
    void checkLimit_shouldThrowOnFourthRequest() {
        String identifier = "test@example.com";

        rateLimiterService.checkLimit(identifier);
        rateLimiterService.checkLimit(identifier);
        rateLimiterService.checkLimit(identifier);

        RateLimitExceededException ex = assertThrows(RateLimitExceededException.class, () ->
                rateLimiterService.checkLimit(identifier));

        assertEquals("RATE_LIMIT_EXCEEDED", ex.getErrorCode());
        assertTrue(ex.getRetryAfterSeconds() > 0);
    }

    @Test
    void checkLimit_shouldAllowDifferentIdentifiersIndependently() {
        // First identifier uses up its quota
        rateLimiterService.checkLimit("user1@example.com");
        rateLimiterService.checkLimit("user1@example.com");
        rateLimiterService.checkLimit("user1@example.com");

        // Second identifier should still be allowed
        assertDoesNotThrow(() -> rateLimiterService.checkLimit("user2@example.com"));
    }

    @Test
    void reset_shouldClearRateLimit() {
        String identifier = "test@example.com";

        rateLimiterService.checkLimit(identifier);
        rateLimiterService.checkLimit(identifier);
        rateLimiterService.checkLimit(identifier);

        assertThrows(RateLimitExceededException.class, () ->
                rateLimiterService.checkLimit(identifier));

        rateLimiterService.reset(identifier);

        assertDoesNotThrow(() -> rateLimiterService.checkLimit(identifier));
    }

    @Test
    void getRemainingRequests_shouldReturnCorrectCount() {
        String identifier = "test@example.com";

        assertEquals(3, rateLimiterService.getRemainingRequests(identifier));

        rateLimiterService.checkLimit(identifier);
        assertEquals(2, rateLimiterService.getRemainingRequests(identifier));

        rateLimiterService.checkLimit(identifier);
        assertEquals(1, rateLimiterService.getRemainingRequests(identifier));

        rateLimiterService.checkLimit(identifier);
        assertEquals(0, rateLimiterService.getRemainingRequests(identifier));
    }

    @Test
    void getRetryAfterSeconds_shouldReturnZeroForUnlimitedIdentifier() {
        assertEquals(0, rateLimiterService.getRetryAfterSeconds("unused@example.com"));
    }
}