package com.hanghai.kchtg.captcha.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về cho client gồm ID định danh và ảnh CAPTCHA dạng Base64.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaptchaResponse {

    /**
     * Mã định danh phiên CAPTCHA (UUID).
     */
    private String captchaId;

    /**
     * Chuỗi ảnh định dạng Data URL (data:image/png;base64,...).
     */
    private String imageBase64;
}
