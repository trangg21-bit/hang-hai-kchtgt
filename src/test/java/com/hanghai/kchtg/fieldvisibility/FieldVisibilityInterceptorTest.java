package com.hanghai.kchtg.fieldvisibility;

import com.hanghai.kchtg.fieldvisibility.entity.FieldEffect;
import com.hanghai.kchtg.fieldvisibility.interceptor.FieldVisibilityInterceptor;
import com.hanghai.kchtg.fieldvisibility.service.FieldVisibilityService;
import com.hanghai.kchtg.user.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FieldVisibilityInterceptorTest {

    @Mock
    private FieldVisibilityService fieldVisibilityService;

    @Mock
    private ObjectProvider<FieldVisibilityService> fieldVisibilityServiceProvider;

    private FieldVisibilityInterceptor interceptor;
    private User testUser;

    @BeforeEach
    void setUp() {
        lenient().when(fieldVisibilityServiceProvider.getIfAvailable()).thenReturn(fieldVisibilityService);
        interceptor = new FieldVisibilityInterceptor(fieldVisibilityServiceProvider);

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("john");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        FieldVisibilityContext.clear();
    }

    @Test
    void preHandle_resolvesResourceAndPopulatesContext() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, "pass", List.of()));

        when(fieldVisibilityService.resolve(eq(testUser), eq("port")))
                .thenReturn(Map.of("financialInfo", FieldEffect.HIDE));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/ports");
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean proceed = interceptor.preHandle(request, response, new Object());

        assertThat(proceed).isTrue();
        assertThat(FieldVisibilityContext.isHidden("financialInfo")).isTrue();
        assertThat(FieldVisibilityContext.isWritable("financialInfo")).isFalse();
    }

    @Test
    void preHandle_resolvesUsersAndVts() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, "pass", List.of()));

        when(fieldVisibilityService.resolve(eq(testUser), eq("user")))
                .thenReturn(Map.of("phone", FieldEffect.READONLY));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        interceptor.preHandle(request, response, new Object());

        assertThat(FieldVisibilityContext.isReadOnly("phone")).isTrue();
        assertThat(FieldVisibilityContext.isWritable("phone")).isFalse();
    }

    @Test
    void preHandle_resolvesBcc157ToReportResource() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, "pass", List.of()));

        when(fieldVisibilityService.resolve(eq(testUser), eq("report")))
                .thenReturn(Map.of("assetOpeningOriginalCost", FieldEffect.READONLY));

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/bcc157");
        MockHttpServletResponse response = new MockHttpServletResponse();

        interceptor.preHandle(request, response, new Object());

        assertThat(FieldVisibilityContext.isReadOnly("assetOpeningOriginalCost")).isTrue();
        assertThat(FieldVisibilityContext.isWritable("assetOpeningOriginalCost")).isFalse();
    }

    @Test
    void afterCompletion_clearsContext() {
        FieldVisibilityContext.set(Map.of("phone", FieldEffect.READONLY));

        interceptor.afterCompletion(new MockHttpServletRequest(), new MockHttpServletResponse(), new Object(), null);

        assertThat(FieldVisibilityContext.get()).isEmpty();
    }
}
