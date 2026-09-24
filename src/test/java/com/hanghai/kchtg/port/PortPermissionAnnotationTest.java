package com.hanghai.kchtg.port;

import com.hanghai.kchtg.port.controller.PortController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("PortController permission annotations")
class PortPermissionAnnotationTest {

    @Test
    @DisplayName("quyền lịch sử được OR riêng cho danh sách và chi tiết, không làm mất quyền đọc")
    void readEndpoints_keepReadAccessAndAllowHistoryAccess() {
        assertSeparatedHistoryPermission("findAll");
        assertSeparatedHistoryPermission("getById");
    }

    private static void assertSeparatedHistoryPermission(String methodName) {
        Method method = Arrays.stream(PortController.class.getDeclaredMethods())
                .filter(candidate -> candidate.getName().equals(methodName))
                .findFirst()
                .orElseThrow();
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertNotNull(annotation);
        String expression = annotation.value();
        String readBranch = expression.split(" or ", 2)[0];
        assertFalse(readBranch.contains("port:history"));
        assertTrue(expression.contains("or @auth.check(authentication, 'port:history')"));
    }
}
