package com.hanghai.kchtg.captcha.controller;

import com.hanghai.kchtg.captcha.dto.CaptchaResponse;
import com.hanghai.kchtg.captcha.service.CaptchaService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller cung cấp API lấy mã bảo vệ CAPTCHA cho người dùng trước khi đăng nhập.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints phục vụ xác thực người dùng và mã bảo vệ")
public class CaptchaController {

    private final CaptchaService captchaService;

    public CaptchaController(CaptchaService captchaService) {
        this.captchaService = captchaService;
    }

    /**
     * Sinh mã bảo vệ CAPTCHA mới.
     *
     * @return ApiResponse chứa ID phiên và ảnh mã bảo vệ Base64
     */
    @GetMapping("/captcha")
    @Operation(summary = "Lấy mã bảo vệ CAPTCHA", description = "Trả về mã định danh captchaId và chuỗi ảnh Base64 của mã bảo vệ")
    public ResponseEntity<ApiResponse<CaptchaResponse>> getCaptcha() {
        CaptchaResponse response = captchaService.generateCaptcha();
        return ResponseEntity.ok(ApiResponse.success("Lấy mã bảo vệ thành công", response));
    }
}
