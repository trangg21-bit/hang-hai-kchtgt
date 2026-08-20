package com.hanghai.kchtg.fieldvisibility;

import com.hanghai.kchtg.fieldvisibility.entity.FieldEffect;

import java.util.Map;

/**
 * ThreadLocal holder for the resolved per-field effect map of the current request.
 * <p>
 * Populated by {@code FieldVisibilityInterceptor.preHandle} and consumed by the
 * global Jackson filter at write time. Must be cleared unconditionally in
 * {@code afterCompletion} to avoid leaks across pooled threads.
 * </p>
 */
public final class FieldVisibilityContext {

    private static final ThreadLocal<Map<String, FieldEffect>> CURRENT = new ThreadLocal<>();

    private FieldVisibilityContext() {
        // static holder
    }

    public static void set(Map<String, FieldEffect> map) {
        CURRENT.set(map);
    }

    /**
     * Returns the current map, or an empty map when absent — never {@code null},
     * so the serializer path cannot NPE.
     */
    public static Map<String, FieldEffect> get() {
        Map<String, FieldEffect> map = CURRENT.get();
        return map == null ? Map.of() : map;
    }

    /**
     * Whether {@code fieldName} is hidden: {@code (map[fieldName] ?? map['*']) == HIDE}.
     */
    public static boolean isHidden(String fieldName) {
        Map<String, FieldEffect> map = CURRENT.get();
        if (map == null || map.isEmpty()) {
            return false;
        }
        FieldEffect effect = map.get(fieldName);
        if (effect == null) {
            effect = map.get("*");
        }
        return effect == FieldEffect.HIDE;
    }

    /**
     * Whether {@code fieldName} is read-only: {@code (map[fieldName] ?? map['*']) == READONLY}.
     */
    public static boolean isReadOnly(String fieldName) {
        Map<String, FieldEffect> map = CURRENT.get();
        if (map == null || map.isEmpty()) {
            return false;
        }
        FieldEffect effect = map.get(fieldName);
        if (effect == null) {
            effect = map.get("*");
        }
        return effect == FieldEffect.READONLY;
    }

    /**
     * Whether {@code fieldName} is writable by the current request.
     * Write access is DENIED if the field is either HIDE or READONLY.
     */
    public static boolean isWritable(String fieldName) {
        Map<String, FieldEffect> map = CURRENT.get();
        if (map == null || map.isEmpty()) {
            return true;
        }
        FieldEffect effect = map.get(fieldName);
        if (effect == null) {
            effect = map.get("*");
        }
        return effect != FieldEffect.HIDE && effect != FieldEffect.READONLY;
    }

    /**
     * Assert that {@code fieldName} is writable.
     * Throws {@link org.springframework.security.access.AccessDeniedException} (HTTP 403)
     * if the field is either HIDE or READONLY.
     */
    public static void assertWritable(String fieldName) {
        if (!isWritable(fieldName)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bạn không có quyền cập nhật trường: " + fieldName);
        }
    }

    public static void clear() {
        CURRENT.remove();
    }
}
