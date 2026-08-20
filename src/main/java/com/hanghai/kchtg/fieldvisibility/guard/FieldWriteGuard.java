package com.hanghai.kchtg.fieldvisibility.guard;

import com.hanghai.kchtg.fieldvisibility.FieldVisibilityContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.Map;
import java.util.Objects;

/**
 * Universal Write Guard utility for field-level authorization across all modules.
 * <p>
 * Enforces fail-closed write protection:
 * - If a field is configured as READONLY or HIDE for the current user, any attempt
 *   to supply a non-null value in create/update payloads will be rejected with HTTP 403.
 * - If an update attempts to mutate a field (including passing null to clear existing data),
 *   {@link #validateUpdate(Object, Object)} detects the value change and asserts writability.
 * </p>
 */
public final class FieldWriteGuard {

    private static final Logger log = LoggerFactory.getLogger(FieldWriteGuard.class);

    private FieldWriteGuard() {
        // utility class
    }

    /**
     * Check if a field value can be written. If value is non-null, asserts writability.
     *
     * @param fieldName the property or column name (e.g., "systemName", "email")
     * @param value     the incoming value to write
     * @throws AccessDeniedException if the field is not writable (READONLY or HIDE)
     */
    public static void check(String fieldName, Object value) {
        if (value != null) {
            FieldVisibilityContext.assertWritable(fieldName);
        }
    }

    /**
     * Asserts that a field can be mutated from its existing value to a new value.
     * Throws 403 AccessDeniedException if the values differ and the field is READONLY or HIDE.
     *
     * @param fieldName the property name
     * @param newValue  the incoming new value
     * @param oldValue  the existing value on the persisted entity
     */
    public static void validateFieldChange(String fieldName, Object newValue, Object oldValue) {
        if (!Objects.equals(newValue, oldValue)) {
            FieldVisibilityContext.assertWritable(fieldName);
        }
    }

    /**
     * Validate a map of field names to values.
     *
     * @param fieldValues map of field name -> value
     * @throws AccessDeniedException if any non-null field is not writable
     */
    public static void validateMap(Map<String, Object> fieldValues) {
        if (fieldValues == null || fieldValues.isEmpty()) {
            return;
        }
        for (Map.Entry<String, Object> entry : fieldValues.entrySet()) {
            if (entry.getValue() != null) {
                FieldVisibilityContext.assertWritable(entry.getKey());
            }
        }
    }

    /**
     * Universal reflection-based validation for any DTO (Create/Update requests).
     * Inspects all declared non-static fields on the object class hierarchy.
     *
     * @param dto the request object
     * @throws AccessDeniedException if any populated field is restricted
     */
    public static void validateObject(Object dto) {
        if (dto == null || isJdkOrPrimitive(dto.getClass())) {
            return;
        }
        Class<?> clazz = dto.getClass();
        while (clazz != null && clazz != Object.class && !isJdkOrPrimitive(clazz)) {
            for (Field field : clazz.getDeclaredFields()) {
                if (Modifier.isStatic(field.getModifiers())) {
                    continue;
                }
                try {
                    field.setAccessible(true);
                    Object val = field.get(dto);
                    if (val != null) {
                        FieldVisibilityContext.assertWritable(field.getName());
                    }
                } catch (AccessDeniedException e) {
                    throw e;
                } catch (Throwable e) {
                    log.debug("FieldWriteGuard: could not inspect field {}: {}", field.getName(), e.getMessage());
                }
            }
            clazz = clazz.getSuperclass();
        }
    }

    /**
     * Comprehensive validation for update operations against an existing entity.
     * <p>
     * 1. Checks all non-null values in {@code dto}.
     * 2. Detects delta mutations (including attempts to clear existing non-null fields with null).
     * </p>
     *
     * @param dto            the incoming update request
     * @param existingEntity the current entity in the database
     * @throws AccessDeniedException if any mutated or restricted field is READONLY or HIDE
     */
    public static void validateUpdate(Object dto, Object existingEntity) {
        if (dto == null || isJdkOrPrimitive(dto.getClass())) {
            return;
        }
        // First check standard non-null fields
        validateObject(dto);

        if (existingEntity == null || isJdkOrPrimitive(existingEntity.getClass())) {
            return;
        }

        Class<?> dtoClass = dto.getClass();
        Class<?> entityClass = existingEntity.getClass();

        while (dtoClass != null && dtoClass != Object.class && !isJdkOrPrimitive(dtoClass)) {
            for (Field dtoField : dtoClass.getDeclaredFields()) {
                if (Modifier.isStatic(dtoField.getModifiers())) {
                    continue;
                }
                String name = dtoField.getName();
                try {
                    dtoField.setAccessible(true);
                    Object newVal = dtoField.get(dto);
                    Field entityField = findField(entityClass, name);
                    if (entityField != null) {
                        entityField.setAccessible(true);
                        Object oldVal = entityField.get(existingEntity);
                        // If values differ (e.g. attempting to nullify or alter an existing value)
                        if (!Objects.equals(newVal, oldVal)) {
                            FieldVisibilityContext.assertWritable(name);
                        }
                    }
                } catch (AccessDeniedException e) {
                    throw e;
                } catch (Throwable e) {
                    log.debug("FieldWriteGuard: could not inspect field {}: {}", name, e.getMessage());
                }
            }
            dtoClass = dtoClass.getSuperclass();
        }
    }

    private static boolean isJdkOrPrimitive(Class<?> clazz) {
        if (clazz == null || clazz.isPrimitive()) {
            return true;
        }
        String pkg = clazz.getPackageName();
        return pkg.startsWith("java.") || pkg.startsWith("javax.") || pkg.startsWith("jakarta.")
                || pkg.startsWith("jdk.") || pkg.startsWith("sun.");
    }

    private static Field findField(Class<?> clazz, String fieldName) {
        Class<?> current = clazz;
        while (current != null && current != Object.class && !isJdkOrPrimitive(current)) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            }
        }
        return null;
    }
}
