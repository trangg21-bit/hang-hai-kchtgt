package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO returned in phase 1 - indicates whether client needs to solve TOTP challenge.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MfaChallengeResponse {

    /** True if account requires MFA challenge */
    private boolean requiresMfa;

    /** User UUID (for client to send back in phase 2) */
    private UUID userId;

    /** Anti-replay challenge ID */
    private UUID challengeId;

    /**
     * If true, the client should SKIP the TOTP step (user does NOT have TOTP enabled).
     * If false, the client MUST enter TOTP (user HAS TOTP enabled).
     */
    private boolean skipTotp;

    public static MfaChallengeResponse skipChallenge(UUID userId) {
        MfaChallengeResponse r = new MfaChallengeResponse();
        r.setRequiresMfa(false);
        r.setSkipTotp(true);
        r.setUserId(userId);
        r.setChallengeId(null);
        return r;
    }

    public static MfaChallengeResponse requireChallenge(UUID userId) {
        MfaChallengeResponse r = new MfaChallengeResponse();
        r.setRequiresMfa(true);
        r.setSkipTotp(false);
        r.setUserId(userId);
        r.setChallengeId(UUID.randomUUID());
        return r;
    }
}
