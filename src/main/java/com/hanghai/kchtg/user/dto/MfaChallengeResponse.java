package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * DTO tra ve o phase 1 - cho biet client co can giai ma TOTP hay khong.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MfaChallengeResponse {

    /** Luon la true neu account co enable TOTP */
    private boolean requiresMfa;

    /** UUID cua nguoi dung (de client GUI gui lai o phase 2) */
    private UUID userId;

    /**
     * Mat ma tranh de cuoi (anti-replay).
     * De client GUI luu va gui lai khi giai ma TOTP.
     */
    private UUID challengeId;

    /**
     * Neu account da enable TOTP thi set false;
     * Neu chua enable thi set true (client se skip TOTP step).
     */
    private boolean totpRequired;

    public static MfaChallengeResponse skipChallenge(UUID userId) {
        MfaChallengeResponse r = new MfaChallengeResponse();
        r.setRequiresMfa(false);
        r.setTotpRequired(false);
        r.setUserId(userId);
        r.setChallengeId(null);
        return r;
    }

    public static MfaChallengeResponse requireChallenge(UUID userId) {
        MfaChallengeResponse r = new MfaChallengeResponse();
        r.setRequiresMfa(true);
        r.setTotpRequired(true);
        r.setUserId(userId);
        r.setChallengeId(UUID.randomUUID());
        return r;
    }
}