package com.hanghai.kchtg.common.util;

import java.util.ArrayList;
import java.util.List;

/**
 * Utility for normalizing and checking phone numbers (Vietnam & E.164 formats).
 */
public class PhoneUtils {

    private PhoneUtils() {
    }

    /**
     * Chuẩn hóa số điện thoại Việt Nam về định dạng 10 chữ số (0xxxxxxxxx).
     */
    public static String normalize(String phone) {
        if (phone == null || phone.isBlank()) {
            return phone;
        }
        String cleaned = phone.replaceAll("[^0-9+]", "").trim();
        if (cleaned.startsWith("+84") && cleaned.length() >= 11) {
            return "0" + cleaned.substring(3);
        }
        if (cleaned.startsWith("84") && cleaned.length() >= 11) {
            return "0" + cleaned.substring(2);
        }
        return cleaned;
    }

    /**
     * Lấy tất cả biến thể tương đương của số điện thoại (0..., +84..., 84...)
     * để kiểm tra trùng khớp tuyệt đối trong CSDL.
     */
    public static List<String> getVariants(String phone) {
        if (phone == null || phone.isBlank()) {
            return List.of();
        }
        String norm = normalize(phone);
        List<String> list = new ArrayList<>();
        list.add(phone.trim());
        if (!list.contains(norm)) {
            list.add(norm);
        }
        if (norm.startsWith("0") && norm.length() >= 10) {
            String e164 = "+84" + norm.substring(1);
            String country = "84" + norm.substring(1);
            if (!list.contains(e164)) {
                list.add(e164);
            }
            if (!list.contains(country)) {
                list.add(country);
            }
        }
        return list;
    }
}
