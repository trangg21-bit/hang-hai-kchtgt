package com.hanghai.kchtg.security.annotation;

import java.lang.annotation.*;

/**
 * Annotation dùng để đánh dấu các method (Controller hoặc Service)
 * cần tự động phân quyền phạm vi dữ liệu theo Đơn vị (OrgUnit Data Scope).
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DataScope {
    /**
     * Tên tham số đại diện cho OrgUnit ID trong method (mặc định "orgUnitId").
     */
    String orgUnitParam() default "orgUnitId";
}
