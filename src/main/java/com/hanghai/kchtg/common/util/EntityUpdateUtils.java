package com.hanghai.kchtg.common.util;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.*;
import java.util.function.Consumer;
import java.util.function.Supplier;

/**
 * Tiện ích tự động cập nhật thuộc tính Entity và ghi nhận Lịch sử thay đổi (Change Log) dùng chung toàn dự án.
 */
public final class EntityUpdateUtils {

    private EntityUpdateUtils() {
        // Prevent instantiation
    }

    /**
     * Tự động quét tất cả các thuộc tính non-null từ DTO và copy sang Entity.
     * Đồng thời tự động phát hiện thay đổi và ghi nhận giá trị cũ vào previousValues map cho workflow phê duyệt / audit log.
     *
     * @param request        DTO chứa thông tin cập nhật
     * @param entity         Entity đích cần cập nhật
     * @param previousValues Map lưu lại giá trị cũ (cho phê duyệt)
     * @param ignoreFields   Danh sách các trường cần bỏ qua (VD: "zones", "coordinates", "geometryType")
     */
    public static <R, E> void copyPropertiesIfPresent(
            R request,
            E entity,
            Map<String, String> previousValues,
            String... ignoreFields) {
        if (request == null || entity == null) {
            return;
        }

        Set<String> ignores = ignoreFields != null && ignoreFields.length > 0
                ? new HashSet<>(Arrays.asList(ignoreFields))
                : Collections.emptySet();

        Class<?> reqClass = request.getClass();
        Class<?> entityClass = entity.getClass();

        for (Field reqField : reqClass.getDeclaredFields()) {
            String name = reqField.getName();
            if (ignores.contains(name) || Modifier.isStatic(reqField.getModifiers())) {
                continue;
            }

            reqField.setAccessible(true);
            try {
                Object newValue = reqField.get(request);
                if (newValue == null) {
                    continue;
                }

                Field entityField = findField(entityClass, name);
                if (entityField != null) {
                    entityField.setAccessible(true);
                    Object oldValue = entityField.get(entity);

                    if (!Objects.equals(newValue, oldValue)) {
                        if (previousValues != null) {
                            previousValues.put(name, oldValue != null ? String.valueOf(oldValue) : "Chưa có");
                        }
                        entityField.set(entity, newValue);
                    }
                }
            } catch (Exception ignored) {
            }
        }
    }

    private static Field findField(Class<?> clazz, String fieldName) {
        Class<?> current = clazz;
        while (current != null && current != Object.class) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            }
        }
        return null;
    }

    /**
     * Cập nhật từng thuộc tính thủ công nếu cần custom logic.
     */
    public static <T> void updateIfPresent(
            T newValue,
            Supplier<T> getter,
            Consumer<T> setter,
            String fieldName,
            Map<String, String> previousValues) {
        if (newValue == null) {
            return;
        }
        T oldValue = getter.get();
        if (!Objects.equals(newValue, oldValue)) {
            if (previousValues != null && fieldName != null) {
                previousValues.put(fieldName, oldValue != null ? String.valueOf(oldValue) : "Chưa có");
            }
            setter.accept(newValue);
        }
    }

    public static <T> void updateIfPresent(T newValue, Supplier<T> getter, Consumer<T> setter) {
        updateIfPresent(newValue, getter, setter, null, null);
    }
}
