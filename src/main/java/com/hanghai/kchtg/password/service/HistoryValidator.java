package com.hanghai.kchtg.password.service;

import com.hanghai.kchtg.password.repository.PasswordHistoryRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Checks if a candidate password hash matches any of the last N stored hashes.
 * Uses BCryptPasswordEncoder.matches() for constant-time comparison.
 */
@Component
public class HistoryValidator {

    private final PasswordHistoryRepository historyRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public HistoryValidator(PasswordHistoryRepository historyRepository,
                            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.historyRepository = historyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Checks if the given password hash matches any of the last N stored hashes for the user.
     *
     * @param userId     the user ID
     * @param candidateHash the new password hash to check
     * @param depth      maximum number of history entries to check
     * @return true if the password was found in history (i.e., reuse detected)
     */
    public boolean isPasswordInHistory(UUID userId, String candidateHash, int depth) {
        List<com.hanghai.kchtg.password.entity.PasswordHistory> history =
            historyRepository.findTopNByUserIdOrderByCreatedAtDesc(userId, depth);

        for (com.hanghai.kchtg.password.entity.PasswordHistory entry : history) {
            if (passwordEncoder.matches(candidateHash, entry.getPasswordHash())) {
                return true;
            }
        }
        return false;
    }
}