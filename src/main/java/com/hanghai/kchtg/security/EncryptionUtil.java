package com.hanghai.kchtg.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption/decryption utility for sensitive data at rest.
 * <p>
 * Each encryption operation generates a random 12-byte IV which is
 * prepended to the ciphertext. The output is Base64-encoded for storage.
 * </p>
 */
@Component
public class EncryptionUtil {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // bytes
    private static final int GCM_TAG_LENGTH = 128; // bits

    private final SecretKey secretKey;

    /**
     * Constructs the utility with a Base64-encoded AES-256 key from configuration.
     *
     * @param base64Key Base64-encoded 256-bit key (32 bytes decoded)
     * @throws IllegalArgumentException if the key is not 32 bytes after decoding
     */
    public EncryptionUtil(@Value("${encryption.key}") String base64Key) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        if (keyBytes.length != 32) {
            throw new IllegalArgumentException(
                    "encryption.key must be a Base64-encoded 32-byte (256-bit) key. "
                    + "Got " + keyBytes.length + " bytes after decoding.");
        }
        this.secretKey = new SecretKeySpec(keyBytes, ALGORITHM);
    }

    @PostConstruct
    public void validateKey() {
        if (secretKey == null) {
            throw new IllegalStateException("Encryption key was not initialised - ensure encryption.key (ENCRYPTION_KEY env var) is set.");
        }
    }

    /**
     * Encrypts the given plain text using AES-256-GCM.
     *
     * @param plainText the text to encrypt (must not be null)
     * @return Base64-encoded ciphertext with the IV prepended
     */
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return plainText;
        }
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);
            byte[] cipherText = cipher.doFinal(plainText.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);
            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt data", e);
        }
    }

    /**
     * Decrypts the given Base64-encoded ciphertext (with prepended IV).
     *
     * @param encryptedText Base64-encoded IV + ciphertext
     * @return the original plain text, or the input unchanged if null/empty/not encrypted
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return encryptedText;
        }
        try {
            byte[] cipherMessage = Base64.getDecoder().decode(encryptedText);
            if (cipherMessage.length < GCM_IV_LENGTH) {
                return encryptedText;
            }
            ByteBuffer byteBuffer = ByteBuffer.wrap(cipherMessage);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);
            byte[] cipherBytes = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherBytes);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);
            byte[] plainBytes = cipher.doFinal(cipherBytes);
            return new String(plainBytes, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return encryptedText;
        }
    }
}