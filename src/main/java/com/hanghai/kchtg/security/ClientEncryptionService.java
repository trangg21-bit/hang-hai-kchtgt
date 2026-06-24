package com.hanghai.kchtg.security;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import javax.crypto.Cipher;

/**
 * RSA-2048 encryption/decryption service for client-side sensitive data (e.g. password).
 * <p>
 * Public key is provided to the client for encryption; private key stays on the server.
 * Keys are loaded from {@code application.yml} under {@code registration.rsa.*}.
 * </p>
 */
@Component
public class ClientEncryptionService {

    private static final Logger log = LoggerFactory.getLogger(ClientEncryptionService.class);
    private static final String ALGORITHM = "RSA";
    private static final String TRANSFORMATION = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";

    private PublicKey publicKey;
    private PrivateKey privateKey;

    public ClientEncryptionService(
            @Value("${registration.rsa.public-key:}") String publicKeyB64,
            @Value("${registration.rsa.private-key:}") String privateKeyB64) {
        if (publicKeyB64 != null && !publicKeyB64.isBlank()) {
            this.publicKey = decodePublicKey(publicKeyB64);
        }
        if (privateKeyB64 != null && !privateKeyB64.isBlank()) {
            this.privateKey = decodePrivateKey(privateKeyB64);
        }
    }

    @PostConstruct
    public void validateKeys() {
        if (publicKey != null && privateKey != null) {
            log.info("RSA-2048 encryption service initialised (public + private key loaded).");
        } else if (publicKey != null) {
            log.info("RSA-2048 encryption service initialised with PUBLIC KEY only (encrypt-only mode).");
        } else {
            log.warn("RSA-2048 encryption service is NOT configured - encryption will be disabled.");
        }
    }

    /**
     * Encrypt plaintext with the public key.
     *
     * @param plainText text to encrypt
     * @return Base64-encoded ciphertext
     * @throws IllegalStateException if public key is not configured
     */
    public String encrypt(String plainText) {
        if (publicKey == null) {
            throw new IllegalStateException("RSA public key not configured - cannot encrypt");
        }
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, publicKey);
            byte[] encrypted = cipher.doFinal(plainText.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt data with RSA-2048", e);
        }
    }

    /**
     * Decrypt ciphertext with the private key.
     *
     * @param encryptedText Base64-encoded ciphertext
     * @return decrypted plaintext
     * @throws IllegalStateException if private key is not configured
     */
    public String decrypt(String encryptedText) {
        if (privateKey == null) {
            throw new IllegalStateException("RSA private key not configured - cannot decrypt");
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedText);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, privateKey);
            byte[] decrypted = cipher.doFinal(decoded);
            return new String(decrypted, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt data with RSA-2048", e);
        }
    }

    /**
     * Returns the Base64-encoded public key string to be sent to the client.
     */
    public String getPublicKeyBase64() {
        if (publicKey == null) {
            return null;
        }
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }

    /**
     * Whether RSA encryption is available.
     */
    public boolean isEnabled() {
        return publicKey != null;
    }

    private PublicKey decodePublicKey(String base64Key) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(base64Key);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
            KeyFactory kf = KeyFactory.getInstance(ALGORITHM);
            return kf.generatePublic(spec);
        } catch (Exception e) {
            log.warn("Failed to decode RSA public key - encryption will be disabled: {}", e.getMessage());
            return null;
        }
    }

    private PrivateKey decodePrivateKey(String base64Key) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(base64Key);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
            KeyFactory kf = KeyFactory.getInstance(ALGORITHM);
            return kf.generatePrivate(spec);
        } catch (Exception e) {
            log.warn("Failed to decode RSA private key - decryption will be disabled: {}", e.getMessage());
            return null;
        }
    }
}