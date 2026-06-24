package com.hanghai.kchtg.user.exception;

/**
 * Ném khi vượt quá giới hạn rate limiting (tối đa request trong khoảng thời gian).
 */
public class RateLimitExceededException extends RegistrationException {

    private final long retryAfterSeconds;

    public RateLimitExceededException(String message, long retryAfterSeconds) {
        super(message, "RATE_LIMIT_EXCEEDED");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}