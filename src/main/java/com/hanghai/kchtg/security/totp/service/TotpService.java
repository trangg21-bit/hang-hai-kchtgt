package com.hanghai.kchtg.security.totp.service;

import com.hanghai.kchtg.security.totp.util.TotpSecretHasher;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class TotpService {

    private static final Logger log = LoggerFactory.getLogger(TotpService.class);
    private static final int CODE_TOLERANCE = 1;

    private final SecureRandom secureRandom;
    private final TotpSecretHasher secretHasher;
    private final GoogleAuthenticator gat;

    public TotpService() {
        this(new SecureRandom(), new TotpSecretHasher(), new GoogleAuthenticator());
    }

    TotpService(SecureRandom secureRandom, TotpSecretHasher secretHasher, GoogleAuthenticator gat) {
        this.secureRandom = secureRandom;
        this.secretHasher = secretHasher;
        this.gat = gat;
    }

    public String generateSecret() {
        byte[] bytes = new byte[20];
        secureRandom.nextBytes(bytes);
        return encodeBase32(bytes);
    }

    private static String encodeBase32(byte[] input) {
        StringBuilder sb = new StringBuilder();
        int currentBits = 0;
        int lastByte = 0;
        for (byte b : input) {
            lastByte = (b & 0xFF);
            currentBits += 8;
            while (currentBits >= 5) {
                currentBits -= 5;
                int index = (lastByte >>> currentBits) & 0x1F;
                sb.append(toBase32Char(index));
            }
            lastByte &= (1 << currentBits) - 1;
        }
        if (currentBits > 0) {
            sb.append(toBase32Char((lastByte << (5 - currentBits)) & 0x1F));
        }
        return sb.toString();
    }

    private static char toBase32Char(int value) {
        if (value < 26) return (char) ('A' + value);
        if (value < 36) return (char) ('2' + (value - 26));
        return '?';
    }

    public boolean verifyCode(String rawSecret, String code) {
        if (rawSecret == null || rawSecret.isBlank() || code == null || code.isBlank()) {
            return false;
        }
        try {
            int codeInt = Integer.parseInt(code);
            for (int i = -CODE_TOLERANCE; i <= CODE_TOLERANCE; i++) {
                try {
                    if (gat.authorize(rawSecret, codeInt, i)) {
                        log.debug("TOTP code verified with offset {}", i);
                        return true;
                    }
                } catch (IllegalArgumentException ignored) {}
            }
        } catch (NumberFormatException e) {
            log.warn("Invalid TOTP code format: {}", code);
        }
        return false;
    }

    public String hashSecret(String rawSecret) {
        return secretHasher.hash(rawSecret);
    }
}