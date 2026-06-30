package com.hanghai.kchtg.security;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Component
public class TotpValidator {

    private static final Logger log = LoggerFactory.getLogger(TotpValidator.class);

    private static final int TIME_STEP = 30; // seconds per TOTP period
    private static final int TOLERANCE = 1;  // allow +/-1 step (= +/-30 s window)

    private final GoogleAuthenticator gat;

    public TotpValidator() {
        this.gat = new GoogleAuthenticator();
    }

    /**
     * Validates a TOTP code against a secret, with +/-1 time-step tolerance.
     * @param secret the base-32 encoded TOTP secret
     * @param code   the 6-digit code entered by the user
     * @return true if the code is valid within the tolerance window
     */
    public boolean isValid(String secret, String code) {
        if (secret == null || code == null) {
            return false;
        }
        try {
            int codeInt = Integer.parseInt(code);
            // Check with offset 0 (default)
            if (gat.authorize(secret, codeInt)) return true;
            // Check with offset +1
            try { if (gat.authorize(secret, codeInt, 1)) return true; } catch (IllegalArgumentException ignored) {}
            // Check with offset -1
            try { if (gat.authorize(secret, codeInt, -1)) return true; } catch (IllegalArgumentException ignored) {}
        } catch (NumberFormatException e) {
            log.debug("Định dạng mã TOTP không hợp lệ: {}", code);
            return false;
        }
        return false;
    }

    /**
     * Generates a new random base-32 TOTP secret (20 bytes = 160 bits).
     * @return base-32 encoded secret string
     */
    public String generateSecret() {
        return gat.createCredentials().getKey();
    }

    /**
     * Generates a QR-code URI for provisioning the TOTP secret.
     * @param secret     the base-32 encoded secret
     * @param accountName the account / user identifier
     * @param issuer     the application / issuer name
     * @return the OTPAuth URI string
     */
    public String getTotpUri(String secret, String accountName, String issuer) {
        GoogleAuthenticatorKey key = new GoogleAuthenticatorKey.Builder(secret).build();
        return GoogleAuthenticatorQRGenerator.getOtpAuthURL(accountName, issuer, key);
    }

    /**
     * Encodes the QR-code as a base64-encoded PNG image.
     * @param secret     the base-32 encoded secret
     * @param accountName the account / user identifier
     * @param issuer     the application / issuer name
     * @return base64-encoded PNG data (data:image/png;base64,...)
     */
    public String getTotpQrCodeAsBase64(String secret, String accountName, String issuer) {
        String url = getTotpUri(secret, accountName, issuer);
        QRCodeWriter writer = new QRCodeWriter();
        Map<EncodeHintType, Object> hints = Map.of(EncodeHintType.MARGIN, 2);
        try {
            BitMatrix matrix = writer.encode(url, BarcodeFormat.QR_CODE, 280, 280, hints);
            BufferedImage image = toBufferedImage(matrix);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            String base64 = Base64.getEncoder().encodeToString(baos.toByteArray());
            return "data:image/png;base64," + base64;
        } catch (Exception e) {
            log.error("Failed to generate TOTP QR code", e);
            return null;
        }
    }

    private BufferedImage toBufferedImage(BitMatrix matrix) {
        int width = matrix.getWidth();
        int height = matrix.getHeight();
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                image.setRGB(x, y, matrix.get(x, y) ? 0x000000 : 0xFFFFFF);
            }
        }
        return image;
    }

    /**
     * Computes SHA-256 hash of a secret (for storage comparison).
     * @param secret the plain-text secret to hash
     * @return hex-encoded SHA-256 hash
     */
    public String hashSecret(String secret) {
        java.security.MessageDigest digest;
        try {
            digest = java.security.MessageDigest.getInstance("SHA-256");
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
        byte[] hashBytes = digest.digest(secret.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /**
     * Constant-time string comparison to prevent timing attacks.
     */
    public boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return a == b;
        }
        byte[] aBytes = a.getBytes(StandardCharsets.UTF_8);
        byte[] bBytes = b.getBytes(StandardCharsets.UTF_8);
        if (aBytes.length != bBytes.length) {
            int len = Math.max(aBytes.length, bBytes.length);
            byte[] result = new byte[len];
            for (int i = 0; i < aBytes.length; i++) result[i] = aBytes[i];
            for (int i = 0; i < bBytes.length; i++) result[i] = (byte) (result[i] ^ bBytes[i]);
            for (int i = aBytes.length; i < len; i++) result[i] = bBytes[i];
            for (byte r : result) {
                if (r != 0) return false;
            }
            return true;
        }
        byte[] result = new byte[aBytes.length];
        for (int i = 0; i < aBytes.length; i++) {
            result[i] = (byte) (aBytes[i] ^ bBytes[i]);
        }
        for (byte r : result) {
            if (r != 0) return false;
        }
        return true;
    }
}
