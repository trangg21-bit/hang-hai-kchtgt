package com.hanghai.kchtg.common.util;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;

import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utility copy property DTO -> Entity an toan, khong hardcode ten field.
 * Tu dong loai tru moi property khong co trong source DTO class.
 *
 * <pre>
 * // Truoc (hardcode - de loi):
 * BeanUtils.copyProperties(source, target, "submittedBy", "submittedAt", ...);
 *
 * // Sau (tu dong derive tu DTO class):
 * EntityCopyUtils.copyDtoToEntity(source, target, "assetCode", "remainingValue");
 * </pre>
 */
public final class EntityCopyUtils {

    private EntityCopyUtils() {}

    /**
     * Copy property tu source DTO sang target Entity.
     * Chi copy cac property ton tai trong source DTO class,
     * loai tru them cac property trong additionalIgnored.
     *
     * @param source            DTO nguon (request)
     * @param target            Entity dich
     * @param additionalIgnored Ten property bo sung can loai tru
     */
    public static void copyDtoToEntity(Object source, Object target, String... additionalIgnored) {
        // Ten cac field khai bao truc tiep trong DTO class (khong leo len superclass)
        Set<String> sourceFields = getOwnFieldNames(source.getClass());

        // Tat ca property cua target entity
        BeanWrapper targetWrapper = new BeanWrapperImpl(target);

        // Ignore: moi property target KHONG co trong source DTO
        Set<String> ignoreSet = new HashSet<>();
        for (PropertyDescriptor pd : targetWrapper.getPropertyDescriptors()) {
            String name = pd.getName();
            if ("class".equals(name)) continue;
            if (!sourceFields.contains(name)) {
                ignoreSet.add(name);
            }
        }

        // Them cac truong bo sung khong duoc ghi de (assetCode, computed fields...)
        ignoreSet.addAll(Arrays.asList(additionalIgnored));

        BeanUtils.copyProperties(source, target, ignoreSet.toArray(String[]::new));
    }

    /** Ten field khai bao truc tiep trong clazz (khong bao gom superclass). */
    private static Set<String> getOwnFieldNames(Class<?> clazz) {
        return Arrays.stream(clazz.getDeclaredFields())
                .map(Field::getName)
                .collect(Collectors.toSet());
    }
}

