package com.hanghai.kchtg.common.util;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import java.math.BigDecimal;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.*;
import java.util.function.Consumer;
import java.util.function.Supplier;

/**
 * Tiện ích tự động cập nhật thuộc tính Entity và ghi nhận Lịch sử thay đổi
 * (Change Log) dùng chung toàn dự án.
 */
public final class EntityUpdateUtils {

    private EntityUpdateUtils() {
        // Prevent instantiation
    }

    /**
     * Tự động quét tất cả các thuộc tính non-null từ DTO và copy sang Entity.
     * Đồng thời tự động phát hiện thay đổi và ghi nhận giá trị cũ vào
     * previousValues map cho workflow phê duyệt / audit log.
     *
     * @param request        DTO chứa thông tin cập nhật
     * @param entity         Entity đích cần cập nhật
     * @param previousValues Map lưu lại giá trị cũ (cho phê duyệt)
     * @param ignoreFields   Danh sách các trường cần bỏ qua (VD: "zones",
     *                       "coordinates", "geometryType")
     */
    /**
     * Tự động quét tất cả các thuộc tính từ DTO và copy sang Entity (kể cả khi giá trị là null).
     * Đồng thời tự động phát hiện thay đổi và ghi nhận giá trị cũ vào previousValues map.
     */
    public static <R, E> void copyProperties(
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

                Field entityField = findField(entityClass, name);
                if (entityField != null) {
                    entityField.setAccessible(true);
                    Object oldValue = entityField.get(entity);

                    if (!areEqual(oldValue, newValue)) {
                        com.hanghai.kchtg.fieldvisibility.FieldVisibilityContext.assertWritable(name);
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
                boolean isPresent = newValue != null;
                if (!isPresent && request instanceof FieldPresenceTrackedRequest tracked) {
                    isPresent = tracked.isFieldPresent(name);
                }
                if (!isPresent) {
                    continue;
                }

                Field entityField = findField(entityClass, name);
                if (entityField != null) {
                    entityField.setAccessible(true);
                    Object oldValue = entityField.get(entity);

                    if (!areEqual(oldValue, newValue)) {
                        com.hanghai.kchtg.fieldvisibility.FieldVisibilityContext.assertWritable(name);
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
        if (!areEqual(oldValue, newValue)) {
            if (previousValues != null && fieldName != null) {
                previousValues.put(fieldName, oldValue != null ? String.valueOf(oldValue) : "Chưa có");
            }
            setter.accept(newValue);
        }
    }

    public static <T> void updateIfPresent(T newValue, Supplier<T> getter, Consumer<T> setter) {
        updateIfPresent(newValue, getter, setter, null, null);
    }

    /**
     * So sánh đẳng trị an toàn giữa 2 giá trị:
     * - Bỏ qua khác biệt scale của BigDecimal (ví dụ 5555.0000 == 5555).
     * - Xử lý Number tổng quát.
     * - Bỏ qua khoảng trắng đầu/cuối của String và coi null tương đương chuỗi rỗng.
     */
    public static boolean areEqual(Object o1, Object o2) {
        if (o1 == null && o2 == null) return true;
        if (o1 == null || o2 == null) {
            if (o1 instanceof String s) return s.trim().isEmpty();
            if (o2 instanceof String s) return s.trim().isEmpty();
            return false;
        }
        if (Objects.equals(o1, o2)) return true;
        if (o1 instanceof BigDecimal b1 && o2 instanceof BigDecimal b2) {
            return b1.compareTo(b2) == 0;
        }
        if (o1 instanceof Number n1 && o2 instanceof Number n2) {
            try {
                return new BigDecimal(n1.toString()).compareTo(new BigDecimal(n2.toString())) == 0;
            } catch (Exception ignored) {
                return Double.compare(n1.doubleValue(), n2.doubleValue()) == 0;
            }
        }
        if (o1 instanceof String s1 && o2 instanceof String s2) {
            String t1 = s1.trim();
            String t2 = s2.trim();
            if (t1.equals(t2)) return true;
            try {
                String c1 = t1.replace(",", "");
                String c2 = t2.replace(",", "");
                if (c1.matches("^-?\\d+(\\.\\d+)?$") && c2.matches("^-?\\d+(\\.\\d+)?$")) {
                    return new BigDecimal(c1).compareTo(new BigDecimal(c2)) == 0;
                }
            } catch (Exception ignored) {
            }
            return false;
        }
        if (o1 instanceof Number n && o2 instanceof String s) {
            try {
                String cs = s.trim().replace(",", "");
                if (cs.matches("^-?\\d+(\\.\\d+)?$")) {
                    return new BigDecimal(n.toString()).compareTo(new BigDecimal(cs)) == 0;
                }
            } catch (Exception ignored) {
            }
        }
        if (o1 instanceof String s && o2 instanceof Number n) {
            try {
                String cs = s.trim().replace(",", "");
                if (cs.matches("^-?\\d+(\\.\\d+)?$")) {
                    return new BigDecimal(cs).compareTo(new BigDecimal(n.toString())) == 0;
                }
            } catch (Exception ignored) {
            }
        }
        return false;
    }
}
