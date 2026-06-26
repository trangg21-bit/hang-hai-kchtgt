package com.hanghai.kchtg.security.totp.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Session record for TOTP enrollment stored in Redis.
 * <p>
 * Serialises to/from JSON for Redis storage.
 * </p>
 */
public class TotpEnrollSession {

    private String sessionId;
    private String userId;
    private String rawSecret;
    private String hashedSecret;
    private String otpAuthUrl;
    private long createdAt;

    public TotpEnrollSession() {
        this.createdAt = System.currentTimeMillis();
    }

    @JsonCreator
    public TotpEnrollSession(
            @JsonProperty("sessionId") String sessionId,
            @JsonProperty("userId") String userId,
            @JsonProperty("rawSecret") String rawSecret,
            @JsonProperty("hashedSecret") String hashedSecret,
            @JsonProperty("otpAuthUrl") String otpAuthUrl,
            @JsonProperty("createdAt") long createdAt) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.rawSecret = rawSecret;
        this.hashedSecret = hashedSecret;
        this.otpAuthUrl = otpAuthUrl;
        this.createdAt = createdAt;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRawSecret() {
        return rawSecret;
    }

    public void setRawSecret(String rawSecret) {
        this.rawSecret = rawSecret;
    }

    public String getHashedSecret() {
        return hashedSecret;
    }

    public void setHashedSecret(String hashedSecret) {
        this.hashedSecret = hashedSecret;
    }

    public String getOtpAuthUrl() {
        return otpAuthUrl;
    }

    public void setOtpAuthUrl(String otpAuthUrl) {
        this.otpAuthUrl = otpAuthUrl;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    /**
     * Serialises this session to a JSON string using Jackson.
     */
    public String toJson() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(this);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialise TOTP enrollment session", e);
        }
    }

    /**
     * Deserialises a JSON string into a {@link TotpEnrollSession}.
     */
    public static TotpEnrollSession fromJson(String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(json, TotpEnrollSession.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialise TOTP enrollment session", e);
        }
    }
}
