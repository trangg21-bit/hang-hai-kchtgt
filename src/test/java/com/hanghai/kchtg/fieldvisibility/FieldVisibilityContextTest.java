package com.hanghai.kchtg.fieldvisibility;

import com.hanghai.kchtg.fieldvisibility.entity.FieldEffect;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for {@link FieldVisibilityContext}:
 * - Visibility checking (isHidden, isReadOnly)
 * - Write access enforcement (isWritable, assertWritable -> 403 Forbidden)
 * - Wildcard fallback and ALLOW overrides
 */
class FieldVisibilityContextTest {

    @BeforeEach
    @AfterEach
    void cleanUp() {
        FieldVisibilityContext.clear();
    }

    @Test
    void defaultEmptyContextIsWritableAndNotHidden() {
        assertFalse(FieldVisibilityContext.isHidden("email"));
        assertFalse(FieldVisibilityContext.isReadOnly("email"));
        assertTrue(FieldVisibilityContext.isWritable("email"));
        assertDoesNotThrow(() -> FieldVisibilityContext.assertWritable("email"));
    }

    @Test
    void hiddenFieldIsNeitherReadableNorWritable() {
        FieldVisibilityContext.set(Map.of("email", FieldEffect.HIDE));

        assertTrue(FieldVisibilityContext.isHidden("email"));
        assertFalse(FieldVisibilityContext.isReadOnly("email"));
        assertFalse(FieldVisibilityContext.isWritable("email"));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class,
                () -> FieldVisibilityContext.assertWritable("email"));
        assertEquals("Bạn không có quyền cập nhật trường: email", ex.getMessage());
    }

    @Test
    void readonlyFieldIsReadableButNotWritable() {
        FieldVisibilityContext.set(Map.of("email", FieldEffect.READONLY));

        assertFalse(FieldVisibilityContext.isHidden("email"));
        assertTrue(FieldVisibilityContext.isReadOnly("email"));
        assertFalse(FieldVisibilityContext.isWritable("email"));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class,
                () -> FieldVisibilityContext.assertWritable("email"));
        assertEquals("Bạn không có quyền cập nhật trường: email", ex.getMessage());
    }

    @Test
    void allowedFieldIsReadableAndWritable() {
        FieldVisibilityContext.set(Map.of("email", FieldEffect.ALLOW));

        assertFalse(FieldVisibilityContext.isHidden("email"));
        assertFalse(FieldVisibilityContext.isReadOnly("email"));
        assertTrue(FieldVisibilityContext.isWritable("email"));
        assertDoesNotThrow(() -> FieldVisibilityContext.assertWritable("email"));
    }

    @Test
    void explicitAllowOverridesWildcardHide() {
        FieldVisibilityContext.set(Map.of("email", FieldEffect.ALLOW, "*", FieldEffect.HIDE));

        // 'email' has explicit ALLOW -> not hidden, writable
        assertFalse(FieldVisibilityContext.isHidden("email"));
        assertTrue(FieldVisibilityContext.isWritable("email"));
        assertDoesNotThrow(() -> FieldVisibilityContext.assertWritable("email"));

        // 'phone' falls back to wildcard '*' which is HIDE -> hidden, not writable
        assertTrue(FieldVisibilityContext.isHidden("phone"));
        assertFalse(FieldVisibilityContext.isWritable("phone"));
        assertThrows(AccessDeniedException.class, () -> FieldVisibilityContext.assertWritable("phone"));
    }

    @Test
    void clearRemovesAllContext() {
        FieldVisibilityContext.set(Map.of("email", FieldEffect.HIDE));
        FieldVisibilityContext.clear();

        assertEquals(Map.of(), FieldVisibilityContext.get());
        assertFalse(FieldVisibilityContext.isHidden("email"));
        assertTrue(FieldVisibilityContext.isWritable("email"));
    }
}
