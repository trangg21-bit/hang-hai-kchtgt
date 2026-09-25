package com.hanghai.kchtg.captcha.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.hanghai.kchtg.captcha.dto.CaptchaResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Service quản lý sinh ảnh và kiểm tra mã xác thực CAPTCHA.
 * <p>
 * Lưu trữ mã CAPTCHA trong bộ nhớ đệm Caffeine với thời gian sống (TTL) cấu hình được.
 * Đảm bảo cơ chế sử dụng một lần (One-Time-Use) để chống tấn công phát lại (Replay Attack).
 * Bộ ký tự: 100% chữ số (0-9), kết hợp thuật toán biến dạng sóng đa chiều (2D Wave Shear)
 * và đường cắt nhiễu dày chống OCR bot nhận dạng tự động.
 * </p>
 */
@Service
public class CaptchaService {

    private static final Logger log = LoggerFactory.getLogger(CaptchaService.class);

    /** Tập ký tự 100% chữ số theo yêu cầu */
    private static final String CAPTCHA_CHARS = "0123456789";

    private static final String DEV_BYPASS_CODE = "00000";

    private final boolean enabled;
    private final int codeLength;
    private final int width;
    private final int height;
    private final boolean isDevOrTest;

    private final Cache<String, String> captchaCache;
    private final SecureRandom random = new SecureRandom();

    public CaptchaService(
            @Value("${captcha.enabled:true}") boolean enabled,
            @Value("${captcha.ttl-seconds:120}") int ttlSeconds,
            @Value("${captcha.code-length:5}") int codeLength,
            @Value("${captcha.width:130}") int width,
            @Value("${captcha.height:40}") int height,
            Environment environment) {
        this.enabled = enabled;
        this.codeLength = codeLength;
        this.width = width;
        this.height = height;

        this.isDevOrTest = checkDevOrTestEnvironment(environment);

        this.captchaCache = Caffeine.newBuilder()
                .expireAfterWrite(ttlSeconds, TimeUnit.SECONDS)
                .maximumSize(10_000)
                .build();
    }

    /**
     * Sinh mã CAPTCHA mới và trả về ảnh Base64 kèm captchaId.
     *
     * @return CaptchaResponse chứa captchaId và imageBase64
     */
    public CaptchaResponse generateCaptcha() {
        String code = generateRandomCode(codeLength);
        String captchaId = UUID.randomUUID().toString();

        captchaCache.put(captchaId, code);

        String base64Image = renderImageBase64(code);

        return CaptchaResponse.builder()
                .captchaId(captchaId)
                .imageBase64(base64Image)
                .build();
    }

    /**
     * Kiểm tra tính hợp lệ của mã CAPTCHA đã nhập.
     * <p>
     * Mã sẽ bị xóa ngay khỏi cache sau khi kiểm tra để chống Replay Attack.
     * </p>
     *
     * @param captchaId   mã định danh phiên CAPTCHA
     * @param enteredCode mã người dùng nhập vào
     * @return true nếu hợp lệ hoặc nếu captcha bị tắt; false nếu không khớp hoặc hết hạn
     */
    public boolean validateCaptcha(String captchaId, String enteredCode) {
        if (!enabled) {
            return true;
        }

        if (enteredCode == null || enteredCode.trim().isEmpty()) {
            return false;
        }

        String trimmedCode = enteredCode.trim();

        // Cho phép mã bypass trong môi trường dev/test để phục vụ kiểm thử tự động
        if (isDevOrTest && DEV_BYPASS_CODE.equals(trimmedCode)) {
            log.debug("Captcha bypass code used in dev/test environment");
            return true;
        }

        if (captchaId == null || captchaId.trim().isEmpty()) {
            return false;
        }

        String storedCode = captchaCache.getIfPresent(captchaId.trim());

        // Xóa ngay lập tức để mỗi mã chỉ dùng được đúng 1 lần
        captchaCache.invalidate(captchaId.trim());

        if (storedCode == null) {
            log.warn("Captcha code expired or not found for ID: {}", captchaId);
            return false;
        }

        return storedCode.equals(trimmedCode);
    }

    private String generateRandomCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = random.nextInt(CAPTCHA_CHARS.length());
            sb.append(CAPTCHA_CHARS.charAt(index));
        }
        return sb.toString();
    }

    private String renderImageBase64(String code) {
        // Bước 1: Vẽ nền và các ký tự số vào ảnh gốc
        BufferedImage baseImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = baseImage.createGraphics();

        try {
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

            // Nền sáng gradient nhẹ nhàng
            Color bgColor1 = new Color(241, 245, 249); // slate-100
            Color bgColor2 = new Color(226, 232, 240); // slate-200
            GradientPaint gradient = new GradientPaint(0, 0, bgColor1, width, height, bgColor2);
            g2d.setPaint(gradient);
            g2d.fillRect(0, 0, width, height);

            // Đường cong nhiễu nền lớp 1 (nằm dưới chữ số)
            for (int i = 0; i < 4; i++) {
                g2d.setColor(getRandomNoiseColor());
                int x1 = random.nextInt(width / 3);
                int y1 = random.nextInt(height);
                int x2 = width - random.nextInt(width / 3);
                int y2 = random.nextInt(height);
                int ctrlX = random.nextInt(width);
                int ctrlY = random.nextInt(height);
                g2d.setStroke(new BasicStroke(1.5f));
                g2d.draw(new java.awt.geom.QuadCurve2D.Float(x1, y1, ctrlX, ctrlY, x2, y2));
            }

            // Chấm nhiễu lớp 1
            for (int i = 0; i < 60; i++) {
                g2d.setColor(getRandomNoiseColor());
                int dotX = random.nextInt(width);
                int dotY = random.nextInt(height);
                g2d.fillOval(dotX, dotY, 2, 2);
            }

            // Vẽ các chữ số: thu hẹp khoảng cách (kerning) để các số hơi chạm nhau nhẹ chống OCR tách ký tự
            int charCount = code.length();
            int charStep = 20; // Khoảng cách hẹp để chữ số hơi chớm nhau
            int startX = (width - (charCount * charStep)) / 2 - 2;
            String[] fontNames = { "Arial", "Verdana", "Georgia", "Tahoma", "Trebuchet MS", "Impact" };

            for (int i = 0; i < charCount; i++) {
                char ch = code.charAt(i);
                int fontSize = 24 + random.nextInt(6); // 24px đến 29px
                String fontName = fontNames[random.nextInt(fontNames.length)];
                int fontStyle = random.nextBoolean() ? Font.BOLD : (Font.BOLD | Font.ITALIC);
                Font font = new Font(fontName, fontStyle, fontSize);
                g2d.setFont(font);
                g2d.setColor(getRandomTextColor());

                // Tọa độ X với jitter nhẹ, tọa độ Y nhấp nhô lượn sóng
                int x = startX + (i * charStep) + (random.nextInt(4) - 2);
                int y = height / 2 + 8 + (random.nextInt(12) - 6);
                double angle = Math.toRadians((random.nextDouble() - 0.5) * 56); // -28 đến +28 độ

                AffineTransform originalTransform = g2d.getTransform();
                g2d.rotate(angle, x, y);
                g2d.drawString(String.valueOf(ch), x, y);
                g2d.setTransform(originalTransform);
            }

            // Đường sóng hình sin cắt ngang thân các con số với nét dày hơn
            g2d.setColor(getRandomTextColor());
            g2d.setStroke(new BasicStroke(1.8f));
            int lastX = 0;
            int lastY = height / 2;
            double freq = 0.05 + random.nextDouble() * 0.03;
            double phase = random.nextDouble() * Math.PI * 2;
            int amplitude = 6 + random.nextInt(5);
            for (int x = 0; x < width; x += 2) {
                int y = (int) (height / 2 + amplitude * Math.sin(x * freq + phase) + (random.nextInt(3) - 1));
                g2d.drawLine(lastX, lastY, x, y);
                lastX = x;
                lastY = y;
            }

            // Thêm 3 đường cong nhiễu dày cắt chéo qua thân chữ số
            for (int i = 0; i < 3; i++) {
                g2d.setColor(getRandomTextColor());
                int x1 = random.nextInt(width / 3);
                int y1 = random.nextInt(height);
                int x2 = width - random.nextInt(width / 3);
                int y2 = random.nextInt(height);
                int ctrlX = random.nextInt(width);
                int ctrlY = random.nextInt(height);
                g2d.setStroke(new BasicStroke(1.6f + (float) (random.nextDouble() * 0.4)));
                g2d.draw(new java.awt.geom.QuadCurve2D.Float(x1, y1, ctrlX, ctrlY, x2, y2));
            }

            // Chấm nhiễu lớp 2 đè lên chữ số
            for (int i = 0; i < 80; i++) {
                g2d.setColor(getRandomNoiseColor());
                int dotX = random.nextInt(width);
                int dotY = random.nextInt(height);
                g2d.fillOval(dotX, dotY, 2, 2);
            }

            // Viền ngoài
            g2d.setColor(new Color(203, 213, 225));
            g2d.drawRect(0, 0, width - 1, height - 1);

        } finally {
            g2d.dispose();
        }

        // Bước 2: Áp dụng hiệu ứng biến dạng sóng đa chiều mạnh hơn (2D Wave Distortion)
        BufferedImage distortedImage = applyWaveDistortion(baseImage);

        // Chuyển đổi thành chuỗi Data URL Base64
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(distortedImage, "png", baos);
            byte[] imageBytes = baos.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
        } catch (IOException e) {
            log.error("Failed to render captcha image to Base64", e);
            throw new IllegalStateException("Lỗi sinh ảnh mã bảo vệ", e);
        }
    }

    /**
     * Tạo hiệu ứng uốn lượn sóng đa chiều (vertical wave & horizontal shear)
     * làm méo nét các con số ở mức độ vừa phải, mắt người đọc được nhưng bot OCR bị sai lệch.
     */
    private BufferedImage applyWaveDistortion(BufferedImage src) {
        BufferedImage dest = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

        // Sóng dọc
        double periodY = 12.0 + random.nextDouble() * 6.0;
        double amplitudeY = 3.8 + random.nextDouble() * 1.2; // 3.8px đến 5.0px
        double phaseY = random.nextDouble() * Math.PI * 2;

        // Sóng ngang
        double periodX = 10.0 + random.nextDouble() * 5.0;
        double amplitudeX = 1.6 + random.nextDouble() * 0.8;
        double phaseX = random.nextDouble() * Math.PI * 2;

        for (int x = 0; x < width; x++) {
            int offsetY = (int) (Math.sin(x / periodY + phaseY) * amplitudeY);
            for (int y = 0; y < height; y++) {
                int offsetX = (int) (Math.sin(y / periodX + phaseX) * amplitudeX);
                int srcX = Math.max(0, Math.min(width - 1, x - offsetX));
                int srcY = Math.max(0, Math.min(height - 1, y - offsetY));
                dest.setRGB(x, y, src.getRGB(srcX, srcY));
            }
        }

        return dest;
    }

    private Color getRandomTextColor() {
        // Tông màu đậm và tương phản tốt
        Color[] textColors = {
                new Color(15, 23, 42),   // slate-900
                new Color(27, 62, 124),  // navy brand
                new Color(30, 58, 138),  // blue-900
                new Color(15, 76, 129),  // classic navy
                new Color(17, 94, 89),   // teal-800
                new Color(88, 28, 135),  // purple-900
                new Color(136, 19, 55)   // rose-900
        };
        return textColors[random.nextInt(textColors.length)];
    }

    private Color getRandomNoiseColor() {
        return new Color(
                110 + random.nextInt(90),
                120 + random.nextInt(90),
                140 + random.nextInt(80),
                170
        );
    }

    private boolean checkDevOrTestEnvironment(Environment environment) {
        if (environment == null) {
            return false;
        }
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles.length == 0) {
            String[] defaultProfiles = environment.getDefaultProfiles();
            for (String profile : defaultProfiles) {
                if ("dev".equalsIgnoreCase(profile) || "local".equalsIgnoreCase(profile)
                        || "test".equalsIgnoreCase(profile)) {
                    return true;
                }
            }
            return false;
        }
        for (String profile : activeProfiles) {
            if ("dev".equalsIgnoreCase(profile) || "local".equalsIgnoreCase(profile)
                    || "test".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        return false;
    }
}
