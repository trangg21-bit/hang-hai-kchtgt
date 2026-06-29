package com.hanghai.kchtg.password.service;

import com.hanghai.kchtg.password.entity.PasswordHistory;
import com.hanghai.kchtg.password.repository.PasswordHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

/**
 * Unit tests for HistoryValidator -
 checks if a candidate password was in history.
 *
 * Tests:
 *  - isPasswordInHistory returns true when hash matches a stored entry
 *  - isPasswordInHistory returns false when no match
 *  - isPasswordInHistory returns false when history is empty
 *  - depth parameter limits the number of entries checked
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class HistoryValidatorTest {

    @Mock
    private PasswordHistoryRepository historyRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private HistoryValidator validator;

    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
    }

    @Test
    void isPasswordInHistory_matchFound_returnsTrue() {
        PasswordHistory entry = new PasswordHistory();
        entry.setUserId(testUserId);
        entry.setPasswordHash("$2a$10$storedHash123456789012345678901234567890abcdef");

        when(historyRepository.findTopNByUserIdOrderByCreatedAtDesc(testUserId, 5))
                .thenReturn(List.of(entry));
        when(passwordEncoder.matches(anyString(), eq("$2a$10$storedHash123456789012345678901234567890abcdef")))
                .thenReturn(true);

        boolean result = validator.isPasswordInHistory(testUserId, "candidateHash123", 5);

        assertTrue(result);
        verify(passwordEncoder).matches("candidateHash123", "$2a$10$storedHash123456789012345678901234567890abcdef");
    }

    @Test
    void isPasswordInHistory_noMatch_returnsFalse() {
        PasswordHistory entry = new PasswordHistory();
        entry.setUserId(testUserId);
        entry.setPasswordHash("$2a$10$storedHash123456789012345678901234567890abcdef");

        when(historyRepository.findTopNByUserIdOrderByCreatedAtDesc(testUserId, 5))
                .thenReturn(List.of(entry));
        when(passwordEncoder.matches(anyString(), anyString()))
                .thenReturn(false);

        boolean result = validator.isPasswordInHistory(testUserId, "newPasswordHash", 5);

        assertFalse(result);
    }

    @Test
    void isPasswordInHistory_emptyHistory_returnsFalse() {
        when(historyRepository.findTopNByUserIdOrderByCreatedAtDesc(testUserId, 5))
                .thenReturn(List.of());

        boolean result = validator.isPasswordInHistory(testUserId, "anyHash", 5);

        assertFalse(result);
    }

    @Test
    void isPasswordInHistory_depthLimit_appliesLimit() {
        PasswordHistory entry = new PasswordHistory();
        entry.setUserId(testUserId);
        entry.setPasswordHash("$2a$10$oldHash");

        // depth=1 means only 1 entry is fetched
        when(historyRepository.findTopNByUserIdOrderByCreatedAtDesc(testUserId, 1))
                .thenReturn(List.of(entry));
        when(passwordEncoder.matches("newHash", "$2a$10$oldHash")).thenReturn(true);

        boolean result = validator.isPasswordInHistory(testUserId, "newHash", 1);

        assertTrue(result);
        verify(passwordEncoder).matches("newHash", "$2a$10$oldHash");
    }

    @Test
    void isPasswordInHistory_multipleEntries_firstMatch_returnsTrueEarly() {
        PasswordHistory h1 = new PasswordHistory();
        h1.setUserId(testUserId);
        h1.setPasswordHash("$2a$10$hash1");

        PasswordHistory h2 = new PasswordHistory();
        h2.setUserId(testUserId);
        h2.setPasswordHash("$2a$10$hash2");

        when(historyRepository.findTopNByUserIdOrderByCreatedAtDesc(testUserId, 2))
                .thenReturn(List.of(h1, h2));
        // first entry doesn't match, second matches
        when(passwordEncoder.matches("newHash", "$2a$10$hash1")).thenReturn(false);
        when(passwordEncoder.matches("newHash", "$2a$10$hash2")).thenReturn(true);

        boolean result = validator.isPasswordInHistory(testUserId, "newHash", 2);

        assertTrue(result);
    }

    @Test
    void isPasswordInHistory_multipleEntries_noMatch_returnsFalse() {
        PasswordHistory h1 = new PasswordHistory();
        h1.setUserId(testUserId);
        h1.setPasswordHash("$2a$10$hash1");

        PasswordHistory h2 = new PasswordHistory();
        h2.setUserId(testUserId);
        h2.setPasswordHash("$2a$10$hash2");

        when(historyRepository.findTopNByUserIdOrderByCreatedAtDesc(testUserId, 2))
                .thenReturn(List.of(h1, h2));
        when(passwordEncoder.matches("newHash", "$2a$10$hash1")).thenReturn(false);
        when(passwordEncoder.matches("newHash", "$2a$10$hash2")).thenReturn(false);

        boolean result = validator.isPasswordInHistory(testUserId, "newHash", 2);

        assertFalse(result);
    }

    @Test
    void isPasswordInHistory_depthOfOne_singleEntry() {
        PasswordHistory entry = new PasswordHistory();
        entry.setUserId(testUserId);
        entry.setPasswordHash("$2a$10$singleHash");

        when(historyRepository.findTopNByUserIdOrderByCreatedAtDesc(testUserId, 1))
                .thenReturn(List.of(entry));
        when(passwordEncoder.matches("candidateHash", "$2a$10$singleHash")).thenReturn(false);

        boolean result = validator.isPasswordInHistory(testUserId, "candidateHash", 1);

        assertFalse(result);
    }

    @Test
    void isPasswordInHistory_largeDepth_fetchesMany() {
        // historyDepth could be large (e.g. 50)
        PasswordHistory entry = new PasswordHistory();
        entry.setUserId(testUserId);
        entry.setPasswordHash("$2a$10$bigHash");

        when(historyRepository.findTopNByUserIdOrderByCreatedAtDesc(testUserId, 50))
                .thenReturn(List.of(entry));
        when(passwordEncoder.matches("candidateHash", "$2a$10$bigHash")).thenReturn(true);

        boolean result = validator.isPasswordInHistory(testUserId, "candidateHash", 50);

        assertTrue(result);
    }
}
