package com.hanghai.kchtg.captcha.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.hanghai.kchtg.captcha.dto.CaptchaResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CaptchaServiceTest {

    private CaptchaService captchaService;
    private Environment environment;

    @BeforeEach
    void setUp() {
        environment = mock(Environment.class);
        when(environment.getActiveProfiles()).thenReturn(new String[]{"test"});
        captchaService = new CaptchaService(true, 120, 5, 130, 40, environment);
    }

    @Test
    void testGenerateCaptcha_returnsValidResponse() {
        CaptchaResponse response = captchaService.generateCaptcha();

        assertNotNull(response);
        assertNotNull(response.getCaptchaId());
        assertFalse(response.getCaptchaId().isBlank());
        assertNotNull(response.getImageBase64());
        assertTrue(response.getImageBase64().startsWith("data:image/png;base64,"));
        assertTrue(response.getImageBase64().length() > 50);
    }

    @Test
    void testValidateCaptcha_successAndCaseInsensitive() {
        CaptchaResponse response = captchaService.generateCaptcha();
        String captchaId = response.getCaptchaId();

        @SuppressWarnings("unchecked")
        Cache<String, String> cache = (Cache<String, String>) ReflectionTestUtils.getField(captchaService, "captchaCache");
        assertNotNull(cache);
        String code = cache.getIfPresent(captchaId);
        assertNotNull(code);

        // Kiểm tra mã sinh ra 100% chỉ gồm các chữ số (0-9)
        assertTrue(code.matches("\\d{5}"), "Mã captcha phải là 5 chữ số: " + code);

        boolean valid = captchaService.validateCaptcha(captchaId, code);
        assertTrue(valid);
    }

    @Test
    void testValidateCaptcha_oneTimeUse_preventsReplay() {
        CaptchaResponse response = captchaService.generateCaptcha();
        String captchaId = response.getCaptchaId();

        @SuppressWarnings("unchecked")
        Cache<String, String> cache = (Cache<String, String>) ReflectionTestUtils.getField(captchaService, "captchaCache");
        assertNotNull(cache);
        String code = cache.getIfPresent(captchaId);
        assertNotNull(code);

        // Lần đầu xác thực thành công
        assertTrue(captchaService.validateCaptcha(captchaId, code));

        // Lần hai với cùng captchaId phải thất bại ngay lập tức (One-Time-Use)
        assertFalse(captchaService.validateCaptcha(captchaId, code));
    }

    @Test
    void testValidateCaptcha_wrongCode_returnsFalse() {
        CaptchaResponse response = captchaService.generateCaptcha();
        String captchaId = response.getCaptchaId();

        boolean valid = captchaService.validateCaptcha(captchaId, "WRONG");
        assertFalse(valid);
    }

    @Test
    void testValidateCaptcha_nullOrEmpty_returnsFalse() {
        assertFalse(captchaService.validateCaptcha(null, "12345"));
        assertFalse(captchaService.validateCaptcha("", "12345"));
        assertFalse(captchaService.validateCaptcha("some-id", null));
        assertFalse(captchaService.validateCaptcha("some-id", "   "));
    }

    @Test
    void testValidateCaptcha_devBypassCode_succeedsInTestEnv() {
        // Trong môi trường test, mã "00000" được chấp nhận để phục vụ CI/automated testing
        assertTrue(captchaService.validateCaptcha("any-dummy-id", "00000"));
    }

    @Test
    void testValidateCaptcha_whenDisabled_alwaysReturnsTrue() {
        CaptchaService disabledService = new CaptchaService(false, 120, 5, 130, 40, environment);
        assertTrue(disabledService.validateCaptcha("any-id", "any-code"));
        assertTrue(disabledService.validateCaptcha(null, null));
    }
}
