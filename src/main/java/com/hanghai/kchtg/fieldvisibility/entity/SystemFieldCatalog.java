package com.hanghai.kchtg.fieldvisibility.entity;

import lombok.Getter;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Standard catalog of sensitive system fields governed by field-level authorization.
 * Replaces arbitrary free-form target_key strings with strongly-typed metadata.
 */
@Getter
public enum SystemFieldCatalog {

    USER_EMAIL("user", "email", "Email người dùng", true, true, false),
    USER_PHONE("user", "phone", "Số điện thoại", true, true, true),
    USER_ADDRESS("user", "address", "Địa chỉ chi tiết", false, true, true),
    USER_FULL_NAME("user", "fullName", "Họ và tên", false, true, true),
    VTS_UPDATED_DATE("vts", "updatedDate", "Thời gian cập nhật VTS", true, false, false),
    VTS_UPDATED_BY("vts", "updatedBy", "Người cập nhật VTS", true, false, false),
    VTS_UPDATED_BY_NAME("vts", "updatedByName", "Tên cán bộ cập nhật VTS", true, false, false),
    PORT_FINANCIAL_INFO("port", "financialInfo", "Thông tin tài chính cảng", true, false, false);

    private final String resource;
    private final String jsonProperty;
    private final String label;
    private final boolean sensitive;
    private final boolean exportable;
    private final boolean writableByDefault;

    SystemFieldCatalog(String resource, String jsonProperty, String label,
                       boolean sensitive, boolean exportable, boolean writableByDefault) {
        this.resource = resource;
        this.jsonProperty = jsonProperty;
        this.label = label;
        this.sensitive = sensitive;
        this.exportable = exportable;
        this.writableByDefault = writableByDefault;
    }

    /**
     * Find field catalog entry by resource and jsonProperty name.
     */
    public static Optional<SystemFieldCatalog> find(String resource, String jsonProperty) {
        if (resource == null || jsonProperty == null) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(c -> c.resource.equalsIgnoreCase(resource.trim())
                        && c.jsonProperty.equalsIgnoreCase(jsonProperty.trim()))
                .findFirst();
    }

    /**
     * Get all sensitive fields belonging to a given resource (for fail-closed defaults).
     */
    public static List<SystemFieldCatalog> getSensitiveFields(String resource) {
        if (resource == null) {
            return List.of();
        }
        return Arrays.stream(values())
                .filter(c -> c.resource.equalsIgnoreCase(resource.trim()) && c.sensitive)
                .toList();
    }
}
