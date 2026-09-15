package com.hanghai.kchtg.common.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Kiểm tra ràng buộc số thập phân quy chuẩn 20_4:
 * - Nếu không có dấu "." thì phần nguyên tối đa 20 chữ số.
 * - Nếu có dấu "." thì phần nguyên tối đa 16 chữ số và phần thập phân tối đa 4 chữ số.
 */
@Documented
@Constraint(validatedBy = Decimal20_4Validator.class)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface Decimal20_4 {
    String message() default "Giá trị không quá 20 chữ số (tối đa 4 số lẻ)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
