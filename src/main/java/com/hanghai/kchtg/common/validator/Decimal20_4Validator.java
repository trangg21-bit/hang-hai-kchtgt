package com.hanghai.kchtg.common.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.math.BigDecimal;
import java.math.BigInteger;

/**
 * Validator cho @Decimal20_4:
 * - Đếm số chữ số (không tính dấu âm/dương ở đầu).
 * - Nếu không có dấu ".": phần nguyên tối đa 20 chữ số.
 * - Nếu có dấu ".": các chữ số trước dấu "." tối đa 16 chữ số, các chữ số sau dấu "." tối đa 4 chữ số.
 */
public class Decimal20_4Validator implements ConstraintValidator<Decimal20_4, Object> {

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        String raw;
        if (value instanceof BigDecimal) {
            raw = ((BigDecimal) value).toPlainString();
        } else if (value instanceof BigInteger || value instanceof Long || value instanceof Integer || value instanceof Short || value instanceof Byte) {
            raw = value.toString();
        } else if (value instanceof Number) {
            raw = BigDecimal.valueOf(((Number) value).doubleValue()).toPlainString();
        } else if (value instanceof String) {
            raw = ((String) value).trim();
            if (raw.isEmpty()) {
                return true;
            }
        } else {
            return false;
        }

        // Bỏ qua dấu âm/dương ở đầu (chỉ tính số chữ số)
        if (raw.startsWith("-") || raw.startsWith("+")) {
            raw = raw.substring(1);
        }

        int dotIdx = raw.indexOf('.');
        if (dotIdx != -1) {
            // Không cho phép nhiều hơn 1 dấu '.'
            if (raw.indexOf('.', dotIdx + 1) != -1) {
                return false;
            }
            String intPart = raw.substring(0, dotIdx);
            String fracPart = raw.substring(dotIdx + 1);

            // Cả 2 phần phải chứa toàn chữ số
            if (!intPart.chars().allMatch(Character::isDigit) || !fracPart.chars().allMatch(Character::isDigit)) {
                return false;
            }

            int intDigits = intPart.length();
            int fracDigits = fracPart.length();

            // Nếu có dấu ".": trước dấu "." tối đa 16 chữ số, sau dấu "." tối đa 4 chữ số
            return intDigits >= 1 && intDigits <= 16 && fracDigits >= 1 && fracDigits <= 4;
        } else {
            // Không có dấu ".": toàn bộ phải là chữ số và tối đa 20 chữ số
            if (raw.isEmpty() || !raw.chars().allMatch(Character::isDigit)) {
                return false;
            }
            int digits = raw.length();
            return digits >= 1 && digits <= 20;
        }
    }
}
