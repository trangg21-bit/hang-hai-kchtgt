package com.hanghai.kchtg.fieldvisibility;

import com.hanghai.kchtg.fieldvisibility.entity.FieldEffect;
import com.hanghai.kchtg.fieldvisibility.guard.FieldVisibilityWriteAdvice;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FieldVisibilityWriteAdviceTest {

    private final FieldVisibilityWriteAdvice advice = new FieldVisibilityWriteAdvice();

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
        FieldVisibilityContext.clear();
    }

    @Test
    void rejectsRestrictedFieldOnJsonWriteRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/users");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        FieldVisibilityContext.set(Map.of("email", FieldEffect.READONLY));

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> advice.afterBodyRead(new UserRequest("a@example.com"), null,
                        requestBodyParameter(), UserRequest.class, MappingJackson2HttpMessageConverter.class));
    }

    @Test
    void doesNotApplyGuardToReadRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/users");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        FieldVisibilityContext.set(Map.of("email", FieldEffect.READONLY));

        assertDoesNotThrow(() -> advice.afterBodyRead(new UserRequest("a@example.com"), null,
                requestBodyParameter(), UserRequest.class, MappingJackson2HttpMessageConverter.class));
    }

    private MethodParameter requestBodyParameter() throws NoSuchMethodException {
        Method method = FieldVisibilityWriteAdviceTest.class.getDeclaredMethod("body", UserRequest.class);
        return new MethodParameter(method, 0);
    }

    @SuppressWarnings("unused")
    private void body(@RequestBody UserRequest request) {
    }

    private record UserRequest(String email) {
    }
}
