package com.hanghai.kchtg.common.util;

/**
 * Utility helper xử lý chuỗi: kiểm tra null, rỗng (blank), cắt khoảng trắng (trim) và giá trị mặc định.
 */
public final class StringUtils {

    private StringUtils() {
        // Utility class
    }

    /**
     * Kiểm tra chuỗi có ký tự thực tế (không null, không rỗng, không toàn khoảng trắng).
     *
     * @param str Chuỗi cần kiểm tra
     * @return true nếu chuỗi có nội dung thực tế
     */
    public static boolean hasText(String str) {
        return str != null && !str.isBlank();
    }

    /**
     * Kiểm tra chuỗi không rỗng (isNotBlank - tương đương hasText).
     */
    public static boolean isNotBlank(String str) {
        return hasText(str);
    }

    /**
     * Kiểm tra chuỗi null hoặc rỗng (hoặc chỉ chứa khoảng trắng).
     */
    public static boolean isBlank(String str) {
        return str == null || str.isBlank();
    }

    /**
     * Cắt tỉa khoảng trắng 2 đầu nếu chuỗi không null.
     */
    public static String trim(String str) {
        return str == null ? null : str.trim();
    }

    /**
     * Cắt tỉa khoảng trắng và trả về null nếu chuỗi sau trim là rỗng.
     */
    public static String trimToNull(String str) {
        if (str == null || str.isBlank()) {
            return null;
        }
        return str.trim();
    }

    /**
     * Trả về chuỗi đã trim nếu có nội dung, ngược lại trả về defaultStr.
     *
     * @param str        Chuỗi cần kiểm tra
     * @param defaultStr Giá trị mặc định nếu chuỗi null hoặc blank
     * @return Chuỗi hợp lệ hoặc defaultStr
     */
    public static String defaultIfBlank(String str, String defaultStr) {
        if (hasText(str)) {
            return str.trim();
        }
        return defaultStr;
    }

    /**
     * Trả về chuỗi nếu không null, ngược lại trả về defaultStr.
     */
    public static String defaultIfNull(String str, String defaultStr) {
        return str != null ? str : defaultStr;
    }
}
